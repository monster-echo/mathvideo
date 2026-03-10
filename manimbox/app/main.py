import asyncio
import json
import os
import re
import shutil
import signal
import socket
import subprocess
from pathlib import Path
from typing import Literal

import httpx
from pydantic import BaseModel, Field

ENV_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
SCENE_CLASS_RE = re.compile(r"class\s+([A-Za-z_]\w*)\s*\(\s*([A-Za-z_]\w*)?Scene\s*\)")


def resolve_env_path() -> Path:
    override = os.getenv("MANIMBOX_ENV_FILE", "").strip()
    if override:
        candidate = Path(override).expanduser()
        if candidate.is_absolute():
            return candidate
        return Path.cwd() / candidate
    return Path(__file__).resolve().parent.parent / ".env"


def parse_env_line(line: str) -> tuple[str, str] | None:
    text = line.strip()
    if not text or text.startswith("#"):
        return None

    if text.startswith("export "):
        text = text[7:].lstrip()

    if "=" not in text:
        return None

    key, raw_value = text.split("=", 1)
    key = key.strip()
    if not key or not ENV_KEY_RE.match(key):
        return None

    value = raw_value.strip()
    if not value:
        return key, ""

    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        quote = value[0]
        inner = value[1:-1]
        if quote == '"':
            inner = (
                inner.replace("\\\\", "\\")
                .replace('\\"', '"')
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t")
            )
        return key, inner

    inline_comment_index = value.find(" #")
    if inline_comment_index != -1:
        value = value[:inline_comment_index].rstrip()

    return key, value


def load_env(path: Path | None = None) -> Path:
    env_path = path or resolve_env_path()
    if not env_path.exists():
        return env_path

    for line in env_path.read_text(encoding="utf-8").splitlines():
        parsed = parse_env_line(line)
        if not parsed:
            continue
        key, value = parsed
        os.environ.setdefault(key, value)

    return env_path


ENV_FILE_PATH = load_env()

WEB_APP_BASE_URL = os.getenv("WEB_APP_BASE_URL", "").strip().rstrip("/")
MANIMBOX_WORKER_TOKEN = os.getenv("MANIMBOX_WORKER_TOKEN", "").strip()
MANIMBOX_WORKER_ID = os.getenv("MANIMBOX_WORKER_ID", "").strip() or socket.gethostname()
MANIMBOX_PUBLIC_BASE_URL = os.getenv("MANIMBOX_PUBLIC_BASE_URL", "").strip().rstrip("/")
MANIMBOX_POLL_INTERVAL_SEC = float(os.getenv("MANIMBOX_POLL_INTERVAL_SEC", "2"))
MANIMBOX_HEARTBEAT_SEC = float(os.getenv("MANIMBOX_HEARTBEAT_SEC", "5"))
MANIMBOX_RENDER_TIMEOUT_SEC = int(os.getenv("MANIMBOX_RENDER_TIMEOUT_SEC", "900"))
MANIMBOX_WORK_DIR = Path(os.getenv("MANIMBOX_WORK_DIR", "/tmp/manimbox-work"))
MANIMBOX_OUTPUT_DIR = Path(os.getenv("MANIMBOX_OUTPUT_DIR", "/data/outputs"))

CLAIM_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/claim" if WEB_APP_BASE_URL else ""
UPDATE_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/update" if WEB_APP_BASE_URL else ""
HEARTBEAT_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/heartbeat" if WEB_APP_BASE_URL else ""


class WorkerJob(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    quality: Literal["preview", "1080p"] = "preview"
    code: str = Field(min_length=20)
    codeLength: int = Field(default=0)
    createdAt: str
    updatedAt: str


class ClaimResponse(BaseModel):
    ok: bool
    job: WorkerJob | None = None


class RuntimeState:
    def __init__(self) -> None:
        self.status: Literal["idle", "busy"] = "idle"
        self.active_job_id: str | None = None
        self.jobs_succeeded = 0
        self.jobs_failed = 0
        self.last_error: str | None = None


runtime_state = RuntimeState()
state_lock = asyncio.Lock()


def ensure_directories() -> None:
    MANIMBOX_WORK_DIR.mkdir(parents=True, exist_ok=True)
    MANIMBOX_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


async def set_runtime_status(
    *,
    status: Literal["idle", "busy"],
    active_job_id: str | None = None,
    error: str | None = None,
) -> None:
    async with state_lock:
        runtime_state.status = status
        runtime_state.active_job_id = active_job_id
        if error:
            runtime_state.last_error = error


async def mark_success() -> None:
    async with state_lock:
        runtime_state.jobs_succeeded += 1
        runtime_state.last_error = None


async def mark_failure(error: str) -> None:
    async with state_lock:
        runtime_state.jobs_failed += 1
        runtime_state.last_error = error


async def get_runtime_snapshot() -> dict:
    async with state_lock:
        return {
            "status": runtime_state.status,
            "active_job_id": runtime_state.active_job_id,
            "jobs_succeeded": runtime_state.jobs_succeeded,
            "jobs_failed": runtime_state.jobs_failed,
            "last_error": runtime_state.last_error,
        }


async def post_worker_heartbeat(client: httpx.AsyncClient) -> None:
    snapshot = await get_runtime_snapshot()

    payload: dict = {
        "workerId": MANIMBOX_WORKER_ID,
        "status": snapshot["status"],
        "details": {
            "hostname": socket.gethostname(),
            "pollIntervalSec": MANIMBOX_POLL_INTERVAL_SEC,
            "heartbeatSec": MANIMBOX_HEARTBEAT_SEC,
            "renderTimeoutSec": MANIMBOX_RENDER_TIMEOUT_SEC,
            "jobsSucceeded": snapshot["jobs_succeeded"],
            "jobsFailed": snapshot["jobs_failed"],
        },
    }
    if snapshot["active_job_id"]:
        payload["activeJobId"] = snapshot["active_job_id"]

    response = await client.post(
        HEARTBEAT_URL,
        headers={
            "x-render-worker-token": MANIMBOX_WORKER_TOKEN,
            "x-worker-id": MANIMBOX_WORKER_ID,
            "content-type": "application/json",
        },
        json=payload,
    )

    if response.status_code >= 400:
        message = response.text[:400]
        raise RuntimeError(f"heartbeat failed ({response.status_code}): {message}")


async def post_worker_update(
    client: httpx.AsyncClient,
    *,
    job_id: str,
    status: Literal["running", "succeeded", "failed"],
    logs: list[str] | None = None,
    error: str | None = None,
    output: dict | None = None,
) -> None:
    payload: dict = {
        "jobId": job_id,
        "status": status,
    }

    if logs:
        payload["logs"] = logs[-120:]
    if error:
        payload["error"] = error
    if output:
        payload["output"] = output

    response = await client.post(
        UPDATE_URL,
        headers={
            "x-render-worker-token": MANIMBOX_WORKER_TOKEN,
            "x-worker-id": MANIMBOX_WORKER_ID,
            "content-type": "application/json",
        },
        json=payload,
    )

    if response.status_code >= 400:
        message = response.text[:400]
        raise RuntimeError(f"worker update failed ({response.status_code}): {message}")


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


async def run_manim_render(job: WorkerJob) -> tuple[Path, list[str], float, str]:
    scene_name = extract_scene_name(job.code)
    job_dir = MANIMBOX_WORK_DIR / job.id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)

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

    if process.returncode != 0:
        tail = "\n".join(output_lines[-12:]) if output_lines else "no process output"
        raise RuntimeError(f"Manim 返回非零退出码 {process.returncode}\n{tail}")

    source_video = find_output_video(media_dir, scene_name)
    target_video = MANIMBOX_OUTPUT_DIR / f"{job.id}.mp4"
    shutil.copy2(source_video, target_video)

    duration_sec, resolution = await asyncio.to_thread(probe_video, target_video)
    return target_video, output_lines[-80:], duration_sec, resolution


def build_video_url(filename: str) -> str | None:
    if not MANIMBOX_PUBLIC_BASE_URL:
        return None
    return f"{MANIMBOX_PUBLIC_BASE_URL}/outputs/{filename}"


async def process_job(client: httpx.AsyncClient, job: WorkerJob) -> None:
    await set_runtime_status(status="busy", active_job_id=job.id)
    logs = [f"Worker {MANIMBOX_WORKER_ID} accepted job {job.id}"]

    try:
        await post_worker_update(client, job_id=job.id, status="running", logs=logs)
    except Exception as error:  # noqa: BLE001
        print(f"[manimbox] failed to set running status: {error}")

    try:
        video_path, render_logs, duration_sec, resolution = await run_manim_render(job)
        logs.extend(render_logs)

        video_url = build_video_url(video_path.name)
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
        print(f"[manimbox] job succeeded: {job.id}")
    except Exception as error:  # noqa: BLE001
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
        except Exception as update_error:  # noqa: BLE001
            print(f"[manimbox] failed to post failed status for {job.id}: {update_error}")

        await mark_failure(message)
        print(f"[manimbox] job failed: {job.id} -> {message}")
    finally:
        await set_runtime_status(status="idle", active_job_id=None)


async def claim_next_job(client: httpx.AsyncClient) -> WorkerJob | None:
    response = await client.post(
        CLAIM_URL,
        headers={
            "x-render-worker-token": MANIMBOX_WORKER_TOKEN,
            "x-worker-id": MANIMBOX_WORKER_ID,
        },
    )

    if response.status_code >= 400:
        message = response.text[:400]
        raise RuntimeError(f"claim failed ({response.status_code}): {message}")

    parsed = ClaimResponse.model_validate(response.json())
    return parsed.job


async def worker_loop(stop_event: asyncio.Event) -> None:
    timeout = httpx.Timeout(connect=10.0, read=40.0, write=20.0, pool=20.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        while not stop_event.is_set():
            try:
                job = await claim_next_job(client)
            except Exception as error:  # noqa: BLE001
                print(f"[manimbox] claim error: {error}")
                job = None

            if job is None:
                await set_runtime_status(status="idle", active_job_id=None)
                try:
                    await asyncio.wait_for(stop_event.wait(), timeout=MANIMBOX_POLL_INTERVAL_SEC)
                except TimeoutError:
                    pass
                continue

            await process_job(client, job)


async def heartbeat_loop(stop_event: asyncio.Event) -> None:
    timeout = httpx.Timeout(connect=10.0, read=20.0, write=20.0, pool=20.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        while not stop_event.is_set():
            try:
                await post_worker_heartbeat(client)
            except Exception as error:  # noqa: BLE001
                print(f"[manimbox] heartbeat error: {error}")

            try:
                await asyncio.wait_for(stop_event.wait(), timeout=MANIMBOX_HEARTBEAT_SEC)
            except TimeoutError:
                pass


async def stop_tasks(tasks: list[asyncio.Task]) -> None:
    for task in tasks:
        task.cancel()

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for result in results:
        if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
            print(f"[manimbox] background task stopped with error: {result}")


def validate_config() -> None:
    if not WEB_APP_BASE_URL:
        raise RuntimeError("WEB_APP_BASE_URL is required")
    if not MANIMBOX_WORKER_TOKEN:
        raise RuntimeError("MANIMBOX_WORKER_TOKEN is required")


async def async_main() -> None:
    validate_config()
    ensure_directories()

    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except NotImplementedError:
            # Windows may not support this API in some runtimes.
            pass

    worker_task = asyncio.create_task(worker_loop(stop_event), name="manimbox-worker-loop")
    heartbeat_task = asyncio.create_task(heartbeat_loop(stop_event), name="manimbox-heartbeat-loop")

    print(
        "[manimbox] worker started "
        f"web={WEB_APP_BASE_URL} workerId={MANIMBOX_WORKER_ID} "
        f"poll={MANIMBOX_POLL_INTERVAL_SEC}s heartbeat={MANIMBOX_HEARTBEAT_SEC}s"
    )

    try:
        await stop_event.wait()
    finally:
        stop_event.set()
        await stop_tasks([worker_task, heartbeat_task])
        print("[manimbox] worker stopped")


def main() -> int:
    try:
        asyncio.run(async_main())
        return 0
    except KeyboardInterrupt:
        print("[manimbox] interrupted")
        return 130
    except Exception as error:  # noqa: BLE001
        print(f"[manimbox] fatal error: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
