import asyncio
import logging
import re
import shutil
import subprocess
import json
from pathlib import Path
from typing import Literal

from .config import JOBS_DIR, MANIMBOX_RENDER_TIMEOUT_SEC, MANIMBOX_WORKER_ID
from .models import WorkerJob
from .state import set_runtime_status, mark_success, mark_failure
from .api import post_worker_update
from .storage import upload_video_to_storage

logger = logging.getLogger("manimbox")

SCENE_CLASS_RE = re.compile(r"class\s+([A-Za-z_]\w*)\s*\(\s*([A-Za-z_]\w*)?Scene\s*\)")

def extract_scene_name(code: str) -> str:
    match = SCENE_CLASS_RE.search(code)
    if not match:
        raise ValueError("未找到继承 Scene 的类定义，无法执行 Manim 渲染")
    return match.group(1)

def quality_flag(quality: Literal["preview", "1080p"]) -> str:
    return "h" if quality == "1080p" else "l"

def find_output_video(media_dir: Path, scene_name: str) -> Path:
    exact = sorted(media_dir.rglob(f"{scene_name}.mp4"))
    if exact:
        return exact[-1]

    any_mp4 = sorted(media_dir.rglob("*.mp4"))
    if any_mp4:
        return any_mp4[-1]

    raise FileNotFoundError("Manim 执行完成但未找到 mp4 输出")

def probe_video(path: Path) -> tuple[float, str]:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "stream=width,height:format=duration",
        "-of",
        "json",
        str(path),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        return 0.0, "1280x720"

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        return 0.0, "1280x720"

    streams = payload.get("streams") or []
    first = streams[0] if streams else {}
    width = int(first.get("width") or 1280)
    height = int(first.get("height") or 720)

    duration_raw = (payload.get("format") or {}).get("duration")
    try:
        duration = round(float(duration_raw), 2)
    except (TypeError, ValueError):
        duration = 0.0

    return duration, f"{width}x{height}"

async def run_manim_render(job: WorkerJob, job_dir: Path) -> tuple[Path, list[str], float, str]:
    scene_name = extract_scene_name(job.code)
    
    media_dir = job_dir / "media"
    job_dir.mkdir(parents=True, exist_ok=True)
    media_dir.mkdir(parents=True, exist_ok=True)

    script_path = job_dir / "scene.py"
    script_path.write_text(job.code, encoding="utf-8")

    command = [
        "manim",
        f"-q{quality_flag(job.quality)}",
        str(script_path),
        scene_name,
        "--format",
        "mp4",
        "--media_dir",
        str(media_dir),
    ]

    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=MANIMBOX_RENDER_TIMEOUT_SEC)
    except asyncio.TimeoutError as error:
        process.kill()
        await process.communicate()
        raise TimeoutError(f"渲染超时（>{MANIMBOX_RENDER_TIMEOUT_SEC}s）") from error

    output_lines = []
    stdout_text = stdout.decode("utf-8", errors="replace").strip()
    stderr_text = stderr.decode("utf-8", errors="replace").strip()

    if stdout_text:
        output_lines.extend(stdout_text.splitlines())
    if stderr_text:
        output_lines.extend(stderr_text.splitlines())

    output_lines = [line for line in output_lines if line.strip()]

    if process.returncode != 0:
        tail = "\n".join(output_lines[-12:]) if output_lines else "no process output"
        raise RuntimeError(f"Manim 返回非零退出码 {process.returncode}\n{tail}")

    source_video = find_output_video(media_dir, scene_name)
    duration_sec, resolution = await asyncio.to_thread(probe_video, source_video)
    return source_video, output_lines[-80:], duration_sec, resolution

async def process_job(client, job: WorkerJob) -> None:
    await set_runtime_status(status="busy", active_job_id=job.id)
    job_dir = JOBS_DIR / job.id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)
    job_dir.mkdir(parents=True, exist_ok=True)

    logs = [f"Worker {MANIMBOX_WORKER_ID} accepted job {job.id}"]
    try:
        await post_worker_update(client, job_id=job.id, status="running", logs=logs)
    except Exception as error:
        logger.warning(f"[manimbox] failed to set running status: {error}")

    try:
        video_local_path, render_logs, duration_sec, resolution = await run_manim_render(job, job_dir)
        logs.extend(render_logs)

        # Upload to Storage via API
        video_url = await upload_video_to_storage(client, video_local_path, job.id)
        
        output_payload = {
            "durationSec": duration_sec,
            "resolution": resolution,
            "previewText": "ManimBox render succeeded.",
        }
        if video_url:
            output_payload["videoUrl"] = video_url

        await post_worker_update(
            client,
            job_id=job.id,
            status="succeeded",
            logs=logs,
            output=output_payload,
        )
        await mark_success()
        logger.info(f"[worker] Job succeeded: {job.id}")
    except Exception as error:
        message = str(error)
        logs.append(message)
        try:
            await post_worker_update(
                client,
                job_id=job.id,
                status="failed",
                logs=logs,
                error=message,
            )
        except Exception as update_error:
            logger.error(f"[worker] Failed to post failed status for {job.id}: {update_error}")

        await mark_failure(message)
        logger.error(f"[worker] Job failed: {job.id} -> {message}")
    finally:
        await set_runtime_status(status="idle", active_job_id=None)
        # Clean up job folder
        # shutil.rmtree(job_dir, ignore_errors=True)
