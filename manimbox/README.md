# ManimBox (Background Runner)

`manimbox` 是一个独立的后台渲染 runner，不再提供 FastAPI HTTP 服务。
它会像 GitHub Action runner 一样常驻运行，持续从 web 拉任务、执行 Manim、并回传状态与结果：

1. `POST /api/renders/worker/claim` 领取任务
2. 本地执行 `manim` 渲染
3. `POST /api/renders/worker/update` 回写任务状态与输出
4. 周期性 `POST /api/renders/worker/heartbeat` 上报 worker 心跳（支持多节点）

## 环境变量

- `WEB_APP_BASE_URL`：AnimG web 地址，例如 `https://your-web-domain.com`
- `MANIMBOX_WORKER_TOKEN`：与 web 端 `MANIMBOX_WORKER_TOKEN` 一致
- `MANIMBOX_WORKER_ID`：worker 唯一 ID（不填默认主机名）
- `MANIMBOX_POLL_INTERVAL_SEC`：拉任务间隔，默认 `2`
- `MANIMBOX_HEARTBEAT_SEC`：心跳间隔，默认 `5`
- `MANIMBOX_RENDER_TIMEOUT_SEC`：单任务超时（秒），默认 `900`
- `MANIMBOX_WORK_DIR`：临时工作目录，默认 `/tmp/manimbox-work`
- `MANIMBOX_OUTPUT_DIR`：输出目录，默认 `/data/outputs`
- `MANIMBOX_ENV_FILE`：可选，指定 `.env` 文件路径（默认读取 `manimbox/.env`）

`manimbox` 启动时会自动加载 `.env`，不会覆盖已存在的系统环境变量。

## 本地运行

```bash
cd manimbox
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入配置
# WEB_APP_BASE_URL=http://localhost:3000
# MANIMBOX_WORKER_TOKEN=replace-with-strong-token
# MANIMBOX_WORKER_ID=worker-sh-01

python -m app.main
```

后台运行示例：

```bash
nohup python -m app.main > /var/log/manimbox.log 2>&1 &
```

## Docker 运行

```bash
cd manimbox
docker build -t animg-manimbox:latest .

docker run -d \
  --name manimbox-worker-1 \
  --env-file .env \
  -v $(pwd)/output:/data/outputs \
  animg-manimbox:latest
```

## 多 worker 部署

多实例并行消费要求：

- 所有 worker 使用同一个 `MANIMBOX_WORKER_TOKEN`
- 每个 worker 使用不同的 `MANIMBOX_WORKER_ID`

web 端领取任务时会在 Firestore 内原子领取，避免同一任务被多个 worker 重复执行。

## 安全说明

- 该 runner 会执行来自 web 的 Python 代码，请只在可信网络/可信任务源中使用。
- 强烈建议将 runner 运行在隔离环境（独立机器、容器、最小权限账号）。
