# AnimG Web (Next.js + Firebase)

高保真原型实现版，目标：

- 1:1 对应你确认的核心页面结构（首页、创作、发现、演练场、价格、支持、登录）
- 强化高转化路径（新定价结构 + Aha 后付费弹层 + 教师/创作者/机构落地页）
- 底层接入 Firebase（Auth / Firestore）

## 技术栈

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Firebase Client SDK（登录）
- Firebase Admin SDK（服务端写入事件）

## 页面路由

- `/` 首页（高转化结构）
- `/creator` 创作台（含 Aha 付费触发）
- `/explore` 发现页
- `/playground` 在线演练场
- `/subscription` 新定价结构页
- `/support` 支持页
- `/login` 登录页（Email/Google）
- `/solutions/teachers` 教师落地页
- `/solutions/creators` 创作者落地页
- `/solutions/institutions` 机构落地页

## API 路由

- `POST /api/prompt`：生成场景草案（可选透传外部 AI）
- `POST /api/playground/optimize`：在 Playground 中对话式优化 Manim 代码
- `POST /api/aha-offer`：Aha 付费触发与推荐方案
- `POST /api/leads`：收集线索
- `POST /api/renders`：创建演练场渲染任务（异步）
- `GET /api/renders?id=...`：查询渲染任务状态
- `GET /api/renders?limit=8`：获取当前用户/访客的最近渲染任务
- `POST /api/renders/worker/claim`：ManimBox 领取排队任务（需 Worker Token）
- `POST /api/renders/worker/update`：ManimBox 回写任务状态/输出（需 Worker Token）
- `POST /api/renders/worker/heartbeat`：ManimBox 心跳与节点状态上报（需 Worker Token）
- `POST /api/auth/session-login`：用 Firebase ID Token 换服务端会话 Cookie
- `POST /api/auth/session-logout`：清理服务端会话
- `GET /api/auth/me`：获取当前会话与订阅状态
- `POST /api/billing/checkout`：创建 Stripe Checkout 会话
- `POST /api/billing/portal`：进入 Stripe Billing Portal
- `POST /api/billing/webhook`：Stripe 订阅事件回调
- `GET /api/animations`：获取动画列表
- `POST /api/animations`：将 Creator 线程任务分享到社区

### API 生产基线（已落地）

- 所有公开 `POST` 接口均启用：
  - JSON 请求体校验
  - 参数 schema 校验
  - 基于 IP 的限流（返回 `429` 与 `X-RateLimit-*` 头）
- `/api/prompt` 已启用外部 AI 返回结构校验与降级原因标记
- 关键失败路径已增加结构化日志（便于后续接 Sentry/日志平台）
- 1080p 渲染已接订阅权限拦截（未登录/未订阅返回权限错误）
- Creator 线程/任务持久化采用 Firestore Fail-Fast（异常直接返回错误，不自动降级到内存存储）
- 渲染执行采用 Worker Pull：web 仅排队与持久化，ManimBox 主动拉取任务
- web 侧不再保留本地渲染执行逻辑（无本地模拟渲染回退）
- Creator 对话支持 Markdown/GFM（含代码块）渲染

### Phase 2（已落地）

- Firebase 登录后会创建服务端会话 Cookie（用于后端鉴权）
- 价格页与 Aha 付费弹层支持直接创建 Stripe Checkout
- Stripe webhook 会将订阅状态同步回 Firestore `subscriptions` 集合

## 本地启动

1. 安装依赖

```bash
npm install
```

1. 配置环境变量

```bash
cp .env.example .env.local
```

1. 启动开发

```bash
npm run dev
```

1. 运行质量检查

```bash
npm run check:standards
npm run lint
npm run test
npm run build
```

## 全局工程规范

- 规范文档：`docs/project-standards.md`
- 核心原则：
  - `shadcn/ui` 优先（无法实现时再例外）
  - API 交互使用共享 Zod contracts（`src/contracts/*`）
  - Padding 保持 2px 网格
  - 前后端协议必须同 PR 同步更新
  - Tailwind 优先，禁止新增额外 `.css` 文件
  - 关键持久化链路坚持 Fail-Fast：Firestore 异常直接抛出并暴露错误，不使用内存替代存储

## ManimBox 渲染节点

- 节点实现位于 [`manimbox/README.md`](/Volumes/MacMiniDisk/workspace/mathvideo/manimbox/README.md)
- web 端需要在 `.env.local` 配置：
  - `MANIMBOX_WORKER_TOKEN`
- 多 worker 并行部署时：
  - 所有节点使用同一个 `MANIMBOX_WORKER_TOKEN`
  - 每个节点设置不同的 `MANIMBOX_WORKER_ID`

## 你后续提供的 AI Key / URL 如何接入

我已经预留好接口：

- `AI_API_URL`
- `AI_API_KEY`

当你提供后，只需要写入 `.env.local`，`/api/prompt` 会优先调用外部 AI；失败会自动 fallback 到本地草案逻辑，保证演示不中断。

## Stripe 配置（Phase 2）

你需要在 `.env.local` 中补齐：

- `APP_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_TEACHER_PRO_MONTHLY`
- `STRIPE_PRICE_TEACHER_PRO_YEARLY`
- `STRIPE_PRICE_CREATOR_PRO_MONTHLY`
- `STRIPE_PRICE_CREATOR_PRO_YEARLY`
- `STRIPE_PRICE_SCHOOL_TEAM_MONTHLY`
- `STRIPE_PRICE_SCHOOL_TEAM_YEARLY`

## Firebase 数据建议

### 环境变量补充

- 若你使用的是非默认 Firestore 数据库（不是 `(default)`），请在 `.env.local` 设置：
  - `FB_FIRESTORE_DATABASE_ID=你的数据库ID`

- 服务器端 Firebase Admin 凭据请使用 `FB_ADMIN_*` 前缀。
  - `FIREBASE_*` 在 Firebase Functions / frameworks runtime 中属于保留前缀，不建议用于自定义环境变量。

### Collections

- `promptEvents`
  - `prompt`, `persona`, `source`, `createdAt`
- `ahaEvents`
  - `persona`, `trigger`, `offerPlanId`, `createdAt`
- `leadEvents`
  - `email`, `source`, `segment`, `message`, `createdAt`
- `animations`（可选）
  - `title`, `duration`, `summary`, `tags`, `createdAt`
- `renderJobs`
  - `ownerKey`, `title`, `code`, `quality`, `status`, `logs`, `output`, `claimedBy`, `claimedAt`, `createdAt`, `updatedAt`
- `renderWorkers`
  - `workerId`, `status`, `activeJobId`, `lastSeenAt`, `updatedAt`, `details`

## 设计与转化说明

该版本重点做了：

- 把“功能卖点”改成“角色价值卖点”
- 把升级触发点放在 Aha 之后（首个动画成功后）
- 把价格表达改为可预算/可采购（角色化套餐）

## 任务清单

- 生产推进清单见：
  - `docs/production-task-list.md`
- CI 工作流：
  - `.github/workflows/ci.yml`
- Firebase Hosting 部署工作流：
  - `.github/workflows/firebase-deploy.yml`
- ManimBox Docker 镜像工作流：
  - `.github/workflows/manimbox-docker.yml`

## GitHub Action 自动部署到 Firebase

已内置 Firebase Hosting（Next.js framework-aware）配置：

- `firebase.json`（`frameworksBackend.region = asia-east1`）
- `.firebaserc`（默认项目：`mathvideo-llm`）
- `.github/workflows/firebase-deploy.yml`（push 到 `main/master` 自动部署 `live`）

### 需要在 GitHub Secrets 中配置

核心部署凭据：

- `FIREBASE_SERVICE_ACCOUNT_MATHVIDEO_LLM`
  - 内容为 Firebase Service Account JSON（建议具备 Hosting Admin + Cloud Functions Admin + Service Account User 权限）

建议同步配置（与 `.env.example` 对齐）：

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `FB_ADMIN_PROJECT_ID`
- `FB_ADMIN_CLIENT_EMAIL`
- `FB_ADMIN_PRIVATE_KEY`
- `FB_FIRESTORE_DATABASE_ID`
- `APP_BASE_URL`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_API_BASE_URL`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_SYSTEM_PROMPT`
- `MANIMBOX_WORKER_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_TEACHER_PRO_MONTHLY`
- `STRIPE_PRICE_TEACHER_PRO_YEARLY`
- `STRIPE_PRICE_CREATOR_PRO_MONTHLY`
- `STRIPE_PRICE_CREATOR_PRO_YEARLY`
- `STRIPE_PRICE_SCHOOL_TEAM_MONTHLY`
- `STRIPE_PRICE_SCHOOL_TEAM_YEARLY`

### GitHub Secrets 填写格式清单

下面这份清单是给 GitHub Actions 用的，重点是：**GitHub Secret 的原始值不等于 `.env` 文件里看到的值**。为了避免部署时生成非法 dotenv 文件，建议按下面格式填写。

#### 1. 纯文本 / URL / ID 类

适用于：

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `FB_ADMIN_PROJECT_ID` / `FIREBASE_PROJECT_ID`
- `FB_ADMIN_CLIENT_EMAIL` / `FIREBASE_CLIENT_EMAIL`
- `FB_FIRESTORE_DATABASE_ID` / `FIREBASE_FIRESTORE_DATABASE_ID`
- `APP_BASE_URL`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_API_BASE_URL`
- `DEEPSEEK_MODEL`
- `MANIMBOX_WORKER_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_TEACHER_PRO_MONTHLY`
- `STRIPE_PRICE_TEACHER_PRO_YEARLY`
- `STRIPE_PRICE_CREATOR_PRO_MONTHLY`
- `STRIPE_PRICE_CREATOR_PRO_YEARLY`
- `STRIPE_PRICE_SCHOOL_TEAM_MONTHLY`
- `STRIPE_PRICE_SCHOOL_TEAM_YEARLY`

填写要求：

- 直接填写原始字符串
- **不要额外加单引号或双引号**
- **不要手动写成 `KEY=value`**，只填右边的值
- 默认保持单行

示例：

- `APP_BASE_URL` → `https://mathvideo.example.com`
- `FIREBASE_CLIENT_EMAIL` → `firebase-adminsdk-xxxxx@mathvideo-llm.iam.gserviceaccount.com`
- `STRIPE_PRICE_TEACHER_PRO_MONTHLY` → `price_1234567890`

#### 2. Firebase 私钥 `FIREBASE_PRIVATE_KEY`

推荐填写成**单行字符串**，把换行写成字面量 `\n`：

`-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n`

注意：

- 不要写成 `FIREBASE_PRIVATE_KEY=...`
- 不要再套一层引号
- **不要直接粘贴成多行 PEM**，除非你非常确定后续脚本会替你做换行转义

原因：

- 多行 PEM 很容易在 CI 里把 `.env` 文件写坏
- 当前代码会把 `\n` 自动还原成真实换行，所以单行转义格式最稳

#### 3. 长文本提示词 `DEEPSEEK_SYSTEM_PROMPT`

推荐优先使用**单行**。

如果内容较长：

- 可以保留自然空格
- 尽量避免直接使用真实换行
- 如确实要多段文本，建议先整理成单行版本再存入 GitHub Secret

虽然当前工作流会安全序列化这个值，但单行文本更方便：

- diff / 审查
- 排查格式问题
- 避免被其它脚本误当作多行 dotenv 内容

#### 4. Service Account JSON 不要填错位置

`FIREBASE_SERVICE_ACCOUNT_MATHVIDEO_LLM` 和 `FIREBASE_PRIVATE_KEY` 不是一回事：

- `FIREBASE_SERVICE_ACCOUNT_MATHVIDEO_LLM`
  - 用在 GitHub Action `firebaseServiceAccount`
  - **这里应该填完整的 Service Account JSON**
- `FIREBASE_PRIVATE_KEY`
  - 用在应用运行时 `FB_ADMIN_PRIVATE_KEY`
  - **这里只填私钥字段本身，不是整个 JSON**

如果把整份 JSON 塞进 `FIREBASE_PRIVATE_KEY`，运行时就会直接“我不是这个意思”地报错。

#### 5. 粘贴前的自检清单

每次新增或修改 GitHub Secrets 前，建议快速确认：

- 只填写值，不要包含变量名
- 不要额外加引号
- 除 `FIREBASE_PRIVATE_KEY` 外，优先保持单行
- `FIREBASE_PRIVATE_KEY` 使用 `\n` 转义的单行格式
- `FIREBASE_SERVICE_ACCOUNT_MATHVIDEO_LLM` 是完整 JSON，不是私钥片段
- URL 类变量以 `https://` 开头
- Price ID / token / API key 前后没有空格

## ManimBox Docker 镜像自动构建

- 工作流：`.github/workflows/manimbox-docker.yml`
- 触发：
  - 修改 `manimbox/**` 后 push 到 `main/master`
  - Pull Request（仅构建校验，不推送）
  - 手动触发 `workflow_dispatch`
- 镜像仓库（GHCR）：
  - `ghcr.io/<owner>/<repo>-manimbox`
- 默认标签：
  - `latest`（默认分支）
  - `sha-*`
  - 分支名 / PR 标签
