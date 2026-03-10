import logging
import httpx
from pathlib import Path
from .config import UPLOAD_URL, MANIMBOX_WORKER_ID, MANIMBOX_WORKER_TOKEN

logger = logging.getLogger("manimbox")

async def upload_video_to_storage(client: httpx.AsyncClient, local_path: Path, job_id: str) -> str | None:
    if not UPLOAD_URL:
        logger.error("[storage] UPLOAD_URL not configured.")
        return None
        
    if not local_path.exists():
        logger.error(f"[storage] Local file not found: {local_path}")
        return None

    try:
        logger.info(f"[storage] Uploading {local_path} to {UPLOAD_URL} for job {job_id}")
        
        # Open file in binary mode
        with open(local_path, "rb") as f:
            files = {"file": (local_path.name, f, "video/mp4")}
            data = {"jobId": job_id}
            
            response = await client.post(
                UPLOAD_URL,
                headers={
                    "x-render-worker-token": MANIMBOX_WORKER_TOKEN,
                    "x-worker-id": MANIMBOX_WORKER_ID,
                },
                files=files,
                data=data,
                timeout=httpx.Timeout(60.0) # Larger timeout for file upload
            )
            
        if response.status_code >= 400:
            logger.error(f"[storage] Upload failed ({response.status_code}): {response.text[:400]}")
            return None
            
        result = response.json()
        if not result.get("ok"):
            logger.error(f"[storage] Upload returned error: {result.get('error')}")
            return None
            
        video_url = result.get("videoUrl")
        logger.info(f"[storage] Upload successful: {video_url}")
        return video_url
        
    except Exception as e:
        logger.error(f"[storage] Unexpected error during upload: {e}")
        return None
