import httpx
import socket
import logging
from typing import Literal
from .config import (
    MANIMBOX_WORKER_ID, MANIMBOX_WORKER_TOKEN,
    CLAIM_URL, UPDATE_URL, HEARTBEAT_URL,
    MANIMBOX_POLL_INTERVAL_SEC, MANIMBOX_HEARTBEAT_SEC, MANIMBOX_RENDER_TIMEOUT_SEC
)
from .models import WorkerJob, ClaimResponse
from .state import get_runtime_snapshot

logger = logging.getLogger("manimbox")

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
    status: Literal["queued", "running", "succeeded", "failed"],
    logs: list[str] | None = None,
    error: str | None = None,
    output: dict | None = None,
) -> None:
    payload: dict = {
        "jobId": job_id,
        "status": status,
    }
    if logs:
        payload["logs"] = [line for line in logs[-120:] if line.strip()]
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
    
    data = response.json()
    parsed = ClaimResponse.model_validate(data)
    return parsed.job
