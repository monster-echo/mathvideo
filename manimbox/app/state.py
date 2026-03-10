import asyncio
from typing import Literal

class RuntimeState:
    def __init__(self) -> None:
        self.status: Literal["idle", "busy"] = "idle"
        self.active_job_id: str | None = None
        self.jobs_succeeded = 0
        self.jobs_failed = 0
        self.last_error: str | None = None

runtime_state = RuntimeState()
state_lock = asyncio.Lock()

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
