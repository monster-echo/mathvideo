import os
import socket
import re
from pathlib import Path
from dotenv import load_dotenv

ENV_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

def resolve_env_path() -> Path:
    override = os.getenv("MANIMBOX_ENV_FILE", "").strip()
    if override:
        candidate = Path(override).expanduser()
        if candidate.is_absolute():
            return candidate
        return Path.cwd() / candidate
    return Path(__file__).resolve().parent.parent / ".env"

def load_config():
    env_path = resolve_env_path()
    if env_path.exists():
        load_dotenv(env_path)

load_config()

WEB_APP_BASE_URL = os.getenv("WEB_APP_BASE_URL", "").strip().rstrip("/")
MANIMBOX_WORKER_TOKEN = os.getenv("MANIMBOX_WORKER_TOKEN", "").strip()
MANIMBOX_WORKER_ID = os.getenv("MANIMBOX_WORKER_ID", "").strip() or socket.gethostname()

MANIMBOX_POLL_INTERVAL_SEC = float(os.getenv("MANIMBOX_POLL_INTERVAL_SEC", "2"))
MANIMBOX_HEARTBEAT_SEC = float(os.getenv("MANIMBOX_HEARTBEAT_SEC", "5"))
MANIMBOX_RENDER_TIMEOUT_SEC = int(os.getenv("MANIMBOX_RENDER_TIMEOUT_SEC", "900"))

# Job-specific directories will be subfolders of JOBS_DIR
JOBS_DIR = Path("jobs")

CLAIM_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/claim" if WEB_APP_BASE_URL else ""
UPDATE_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/update" if WEB_APP_BASE_URL else ""
UPLOAD_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/upload" if WEB_APP_BASE_URL else ""
HEARTBEAT_URL = f"{WEB_APP_BASE_URL}/api/renders/worker/heartbeat" if WEB_APP_BASE_URL else ""

def validate_config() -> None:
    if not WEB_APP_BASE_URL:
        raise RuntimeError("WEB_APP_BASE_URL is required")
    if not MANIMBOX_WORKER_TOKEN:
        raise RuntimeError("MANIMBOX_WORKER_TOKEN is required")
