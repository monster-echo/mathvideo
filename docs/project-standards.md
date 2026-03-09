# Project Standards (Global)

本规范对整个项目生效，目标是保证：
- UI 组件一致
- API 类型一致
- 前后端逻辑一致
- 样式体系一致

## 1) UI: shadcn-first

- 默认优先使用 `src/components/ui/*` 下的 shadcn 风格基础组件。
- 当前基础组件：
  - `Button`
  - `Input`
  - `Textarea`
  - `Card`
- 只有在以下场景允许不使用 shadcn 组件：
  - 组件是强业务定制且无法通过现有 shadcn 组合实现。
  - 需要第三方可视化/编辑器组件，且其 DOM 结构不可控。

实施要求：
- 新建可复用交互组件时，先考虑放入 `src/components/ui/`。
- 页面内临时按钮/输入框禁止复制粘贴大段样式，优先复用 `Button`/`Input`。

## 2) API: Zod Contract Required

- 所有 API 请求/响应结构统一定义在 `src/contracts/*`。
- 路由层（`src/app/api/**/route.ts`）必须复用 contract schema 校验请求体。
- 客户端调用 API 必须通过 Zod 校验响应；禁止手写 `response.json() as ...`。

已落地的 contracts：
- `prompt`
- `renders`
- `auth`
- `aha-offer`
- `billing`
- `leads`
- `common`

客户端统一解析入口：
- `src/lib/api/client.ts`

## 3) Spacing Rule: Padding on 2px Grid

- 所有 padding 必须落在 2px 网格上。
- Tailwind spacing token 默认符合 2px 网格。
- 明确禁止：
  - `p-px`（1px）
  - `p-[3px]`、`py-[5px]` 等非 2px 倍数
- 若使用 arbitrary value，必须是 `[Npx]` 且 `N` 为 2 的倍数。

## 4) Full-Stack Consistency (Frontend + Backend)

同一业务改动必须在一个 PR 内同步包含以下内容：
1. `contract` 更新（请求/响应 schema）。
2. 路由更新（请求校验与响应结构对齐 contract）。
3. 客户端更新（按 contract 解析响应）。
4. 测试更新（至少覆盖关键成功/失败路径）。

禁止只改前端或只改后端导致协议漂移。

## 5) Styling: Tailwind-first

- 样式优先使用 Tailwind utility class。
- 禁止新增页面级/组件级 `.css` 文件。
- 当前唯一允许的 CSS 文件：`src/app/globals.css`（全局主题与基础样式）。

例外策略：
- 确需新增全局样式能力时，先评估能否抽成 Tailwind class 或 UI 组件变体。
- 无法避免时，必须在 PR 描述中写明原因、影响范围、回滚方案。

## 6) Enforcement

新增标准检查命令：

```bash
npm run check:standards
```

当前检查项：
- 禁止新增 allowlist 之外的 `.css` 文件。
- 检查 padding 是否为 2px 网格。
- 客户端代码禁止直接 `response.json()`（必须走 Zod contract 解析）。

CI 会执行该命令，未通过则阻止合并。

## 7) PR Checklist

提交前必须确认：
- [ ] 使用 shadcn 组件或说明无法复用原因。
- [ ] API 结构已定义/更新到 `src/contracts/*`。
- [ ] 前后端都对齐同一 contract。
- [ ] 未新增额外 `.css` 文件。
- [ ] `npm run check:standards && npm run lint && npm run test && npm run build` 全部通过。
