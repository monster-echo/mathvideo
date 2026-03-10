import asyncio
import logging
import signal
import traceback
import sys

# Set up logging before imports to ensure they inherit configuration
import os
logging.basicConfig(
    level=logging.DEBUG if os.getenv("HTTPX_LOG_LEVEL") == "debug" else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("manimbox")

try:
    from .config import (
        validate_config, JOBS_DIR,
        MANIMBOX_POLL_INTERVAL_SEC, MANIMBOX_HEARTBEAT_SEC,
        WEB_APP_BASE_URL, MANIMBOX_WORKER_ID
    )
    from .state import set_runtime_status
    from .api import claim_next_job, post_worker_heartbeat
    from .worker import process_job
except ImportError:
    # Handle running as a script (python app/main.py) vs package (python -m app.main)
    from config import (
        validate_config, JOBS_DIR,
        MANIMBOX_POLL_INTERVAL_SEC, MANIMBOX_HEARTBEAT_SEC,
        WEB_APP_BASE_URL, MANIMBOX_WORKER_ID
    )
    from state import set_runtime_status
    from api import claim_next_job, post_worker_heartbeat
    from worker import process_job

import httpx

async def worker_loop(stop_event: asyncio.Event) -> None:
    timeout = httpx.Timeout(connect=10.0, read=40.0, write=20.0, pool=20.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        while not stop_event.is_set():
            try:
                logger.debug("Polling for jobs...")
                job = await claim_next_job(client)
                if job:
                    logger.info(f"Successfully claimed job: {job.id}")
                    await process_job(client, job)
                else:
                    logger.debug("No jobs available.")
            except Exception as error:  # noqa: BLE001
                logger.error(f"Claim/Process error: {error}")
                logger.error(traceback.format_exc())
                job = None

            if job is None:
                await set_runtime_status(status="idle", active_job_id=None)
                try:
                    await asyncio.wait_for(stop_event.wait(), timeout=MANIMBOX_POLL_INTERVAL_SEC)
                except (asyncio.TimeoutError, TimeoutError):
                    pass


async def heartbeat_loop(stop_event: asyncio.Event) -> None:
    timeout = httpx.Timeout(connect=10.0, read=20.0, write=20.0, pool=20.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        while not stop_event.is_set():
            try:
                logger.debug("Sending heartbeat...")
                await post_worker_heartbeat(client)
            except Exception as error:  # noqa: BLE001
                logger.error(f"Heartbeat error: {error}")
                # logger.error(traceback.format_exc())

            try:
                await asyncio.wait_for(stop_event.wait(), timeout=MANIMBOX_HEARTBEAT_SEC)
            except (asyncio.TimeoutError, TimeoutError):
                pass


async def stop_tasks(tasks: list[asyncio.Task]) -> None:
    for task in tasks:
        task.cancel()

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for result in results:
        if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
            logger.error(f"Background task stopped with error: {result}")


async def async_main() -> None:
    validate_config()
    JOBS_DIR.mkdir(parents=True, exist_ok=True)

    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except NotImplementedError:
            pass

    worker_task = asyncio.create_task(worker_loop(stop_event), name="manimbox-worker-loop")
    heartbeat_task = asyncio.create_task(heartbeat_loop(stop_event), name="manimbox-heartbeat-loop")

    logger.info(
        f"Worker started. web={WEB_APP_BASE_URL} workerId={MANIMBOX_WORKER_ID} "
        f"poll={MANIMBOX_POLL_INTERVAL_SEC}s heartbeat={MANIMBOX_HEARTBEAT_SEC}s"
    )

    try:
        await stop_event.wait()
    finally:
        stop_event.set()
        await stop_tasks([worker_task, heartbeat_task])
        logger.info("Worker stopped.")


def main() -> int:
    try:
        asyncio.run(async_main())
        return 0
    except KeyboardInterrupt:
        return 0
    except Exception as error:  # noqa: BLE001
        logger.critical(f"Fatal error: {error}")
        logger.critical(traceback.format_exc())
        return 1

if __name__ == "__main__":
    sys.exit(main())
