"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { authMeResponseSchema } from "@/contracts/auth";
import { playgroundOptimizeSuccessResponseSchema } from "@/contracts/playground-optimize";
import {
  createRenderRequestSchema,
  createRenderSuccessResponseSchema,
  getRenderSuccessResponseSchema,
  type RenderJob,
  type RenderJobStatus,
} from "@/contracts/renders";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { getApiErrorMessage, parseWithSchema, readJsonSafely } from "@/lib/api/client";
import { type Locale } from "@/lib/i18n";

type PlaygroundCopy = {
  title: string;
  subtitle: string;
  render: string;
  rendering: string;
  renderAnimation: string;
  editorTitle: string;
  editorHint: string;
  optimizeTitle: string;
  optimizeHint: string;
  optimizePlaceholder: string;
  optimizeSend: string;
  optimizing: string;
  inlineReady: string;
  inlineShortcutHint: string;
  dismiss: string;
  openCopilot: string;
  closeCopilot: string;
  applyCode: string;
  applyAndRender: string;
  statusLabel: string;
  idle: string;
  queued: string;
  renderingStatus: string;
  completed: string;
  failed: string;
  jobIdLabel: string;
  logsTitle: string;
  logsReady: string;
  resultTitle: string;
  previewPlaceholder: string;
  resolutionLabel: string;
  durationLabel: string;
  summaryLabel: string;
  openVideo: string;
  play: string;
  pause: string;
  restart: string;
  renderFailedFallback: string;
  optimizeFailedFallback: string;
  signInRequired: string;
};

const playgroundCopyByLocale: Record<Locale, PlaygroundCopy> = {
  en: {
    title: "AnimG Manim Playground",
    subtitle: "Code, run inline optimization like Copilot, submit render tasks, and watch progress.",
    render: "Render",
    rendering: "Rendering...",
    renderAnimation: "Render Animation",
    editorTitle: "Python Code Editor",
    editorHint: "Syntax-highlighted editor. Keep one Scene class and iterate fast.",
    optimizeTitle: "Inline Copilot",
    optimizeHint: "Describe how to improve current code and execute optimization inline.",
    optimizePlaceholder: "Example: keep this scene at 20s and improve visual rhythm",
    optimizeSend: "Run",
    optimizing: "Running...",
    inlineReady: "Inline suggestion is ready",
    inlineShortcutHint: "Press Tab in editor to accept quickly",
    dismiss: "Dismiss",
    openCopilot: "Copilot",
    closeCopilot: "Close",
    applyCode: "Apply Code",
    applyAndRender: "Apply + Render",
    statusLabel: "Render Status",
    idle: "Idle",
    queued: "Queued",
    renderingStatus: "Rendering",
    completed: "Completed",
    failed: "Failed",
    jobIdLabel: "Job ID",
    logsTitle: "Render Logs",
    logsReady: "Ready to submit",
    resultTitle: "Render Result",
    previewPlaceholder: "Video result will appear here after render succeeds",
    resolutionLabel: "Resolution",
    durationLabel: "Duration",
    summaryLabel: "Summary",
    openVideo: "Open video",
    play: "Play",
    pause: "Pause",
    restart: "Restart",
    renderFailedFallback: "Failed to create render job",
    optimizeFailedFallback: "Failed to optimize code",
    signInRequired: "Please sign in before submitting a render task.",
  },
  zh: {
    title: "AnimG Manim 演练场",
    subtitle: "编写代码，像 Copilot 一样内联优化，提交渲染任务并实时查看进度与结果。",
    render: "渲染",
    rendering: "渲染中...",
    renderAnimation: "渲染动画",
    editorTitle: "Python 代码编辑器",
    editorHint: "支持语法高亮，建议保持一个主 Scene 类并快速迭代。",
    optimizeTitle: "Inline Copilot",
    optimizeHint: "输入优化指令后直接执行，不显示对话历史。",
    optimizePlaceholder: "例如：控制总时长 20 秒，并增强公式推导的节奏感",
    optimizeSend: "执行",
    optimizing: "执行中...",
    inlineReady: "内联建议已生成",
    inlineShortcutHint: "在编辑器中按 Tab 可快速接受",
    dismiss: "丢弃",
    openCopilot: "Copilot",
    closeCopilot: "关闭",
    applyCode: "应用代码",
    applyAndRender: "应用并渲染",
    statusLabel: "渲染状态",
    idle: "空闲",
    queued: "排队中",
    renderingStatus: "渲染中",
    completed: "已完成",
    failed: "失败",
    jobIdLabel: "任务 ID",
    logsTitle: "渲染日志",
    logsReady: "等待提交任务",
    resultTitle: "渲染结果",
    previewPlaceholder: "渲染成功后将在此显示视频结果",
    resolutionLabel: "分辨率",
    durationLabel: "时长",
    summaryLabel: "说明",
    openVideo: "打开视频",
    play: "播放",
    pause: "暂停",
    restart: "重播",
    renderFailedFallback: "创建渲染任务失败",
    optimizeFailedFallback: "代码优化失败",
    signInRequired: "提交渲染任务前请先登录。",
  },
  de: {
    title: "AnimG Manim Playground",
    subtitle: "Code, run inline optimization like Copilot, submit render tasks, and watch progress.",
    render: "Render",
    rendering: "Rendering...",
    renderAnimation: "Render Animation",
    editorTitle: "Python Code Editor",
    editorHint: "Syntax-highlighted editor. Keep one Scene class and iterate fast.",
    optimizeTitle: "Inline Copilot",
    optimizeHint: "Describe how to improve current code and execute optimization inline.",
    optimizePlaceholder: "Example: keep this scene at 20s and improve visual rhythm",
    optimizeSend: "Run",
    optimizing: "Running...",
    inlineReady: "Inline suggestion is ready",
    inlineShortcutHint: "Press Tab in editor to accept quickly",
    dismiss: "Dismiss",
    openCopilot: "Copilot",
    closeCopilot: "Close",
    applyCode: "Apply Code",
    applyAndRender: "Apply + Render",
    statusLabel: "Render Status",
    idle: "Idle",
    queued: "Queued",
    renderingStatus: "Rendering",
    completed: "Completed",
    failed: "Failed",
    jobIdLabel: "Job ID",
    logsTitle: "Render Logs",
    logsReady: "Ready to submit",
    resultTitle: "Render Result",
    previewPlaceholder: "Video result will appear here after render succeeds",
    resolutionLabel: "Resolution",
    durationLabel: "Duration",
    summaryLabel: "Summary",
    openVideo: "Open video",
    play: "Play",
    pause: "Pause",
    restart: "Restart",
    renderFailedFallback: "Failed to create render job",
    optimizeFailedFallback: "Failed to optimize code",
    signInRequired: "Please sign in before submitting a render task.",
  },
};

const demoCode = `from manim import *

class ShapeTransformation(Scene):
    def construct(self):
        colors = [BLUE, RED]
        circle = Circle(color=colors[0])
        square = Square(color=colors[1])
        triangle = Triangle(color=colors[1]).scale(1.5)

        self.play(Create(circle))
        self.play(Transform(circle, square), run_time=2)
        self.play(Transform(circle, triangle), run_time=2)
        self.wait()`;

const PLAYGROUND_SEED_CODE_STORAGE_KEY = "animg:playground:incoming-code";

function renderProgress(status: RenderJobStatus | undefined) {
  if (!status) return 0;
  if (status === "queued") return 20;
  if (status === "running") return 70;
  return 100;
}

function inferRenderTitle(code: string) {
  const match = code.match(/class\s+([A-Za-z_]\w*)\s*\(\s*Scene\s*\)/);
  if (match?.[1]) {
    return `${match[1]}.py`;
  }
  return "Scene.py";
}

export function PlaygroundClient({ locale }: { locale: Locale }) {
  const copy = playgroundCopyByLocale[locale];

  const [code, setCode] = useState(demoCode);
  const quality = "preview" as const;

  const [job, setJob] = useState<RenderJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [renderError, setRenderError] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingRenderCode, setPendingRenderCode] = useState<string | null>(null);

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [optimizeInput, setOptimizeInput] = useState("");
  const [optimizing, setOptimizing] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const jobId = job?.id;
  const jobStatus = job?.status;

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me");
        const data = parseWithSchema(authMeResponseSchema, await readJsonSafely(response));

        if (!cancelled) {
          setAuthenticated(Boolean(data?.authenticated));
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const incoming = window.localStorage.getItem(PLAYGROUND_SEED_CODE_STORAGE_KEY);
    if (!incoming) return;

    window.localStorage.removeItem(PLAYGROUND_SEED_CODE_STORAGE_KEY);
    if (incoming.trim().length === 0) return;

    setCode(incoming);
    setRenderError("");
  }, []);

  useEffect(() => {
    if (!jobId) return;
    if (jobStatus !== "queued" && jobStatus !== "running") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/renders?id=${encodeURIComponent(jobId)}`);
        const data = parseWithSchema(getRenderSuccessResponseSchema, await readJsonSafely(response));
        if (response.ok && data) {
          setJob(data.job);
        }
      } catch {
        // Best-effort polling
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const lineCount = useMemo(() => Math.max(code.split("\n").length, 18), [code]);
  const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, index) => index + 1), [lineCount]);
  const isRendering = submitting || jobStatus === "queued" || jobStatus === "running";

  const statusProgress = renderProgress(jobStatus);
  const videoUrl = job?.output?.videoUrl;

  function onEditorScroll() {
    const text = editorRef.current;
    const highlight = highlightRef.current;
    if (!text || !highlight) return;

    highlight.scrollTop = text.scrollTop;
    highlight.scrollLeft = text.scrollLeft;
  }

  async function createRender(codeToRender: string) {
    setSubmitting(true);
    setRenderError("");

    try {
      const payload = createRenderRequestSchema.parse({
        title: inferRenderTitle(codeToRender),
        code: codeToRender,
        quality,
      });

      const response = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely(response);
      const parsed = parseWithSchema(createRenderSuccessResponseSchema, data);
      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? copy.renderFailedFallback);
      }

      setJob(parsed.job);
    } catch (requestError) {
      setRenderError(requestError instanceof Error ? requestError.message : copy.renderFailedFallback);
    } finally {
      setSubmitting(false);
    }
  }

  async function startRender(codeToRender = code) {
    if (!authenticated) {
      setRenderError(copy.signInRequired);
      setPendingRenderCode(codeToRender);
      setShowSignInModal(true);
      return;
    }

    await createRender(codeToRender);
  }

  async function onSubmitOptimize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (optimizing) return;

    const instruction = optimizeInput.trim();
    if (!instruction) return;

    setOptimizing(true);

    try {
      const response = await fetch("/api/playground/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          instruction,
          history: [],
        }),
      });

      const raw = await readJsonSafely(response);
      const data = parseWithSchema(playgroundOptimizeSuccessResponseSchema, raw);

      if (!response.ok || !data) {
        throw new Error(getApiErrorMessage(raw) ?? copy.optimizeFailedFallback);
      }

      setCode(data.optimizedCode);
      setOptimizeInput("");
      setCopilotOpen(false);
      editorRef.current?.focus();
    } catch (requestError) {
      setRenderError(requestError instanceof Error ? requestError.message : copy.optimizeFailedFallback);
    } finally {
      setOptimizing(false);
    }
  }

  async function onSignInSuccess() {
    setAuthenticated(true);

    if (!pendingRenderCode) return;
    const queuedCode = pendingRenderCode;
    setPendingRenderCode(null);
    setRenderError("");
    await createRender(queuedCode);
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-semibold">{copy.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{copy.subtitle}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="relative flex min-h-0 min-w-0 flex-[1.6] flex-col border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{copy.editorTitle}</p>
                <p className="text-xs text-slate-500">{copy.editorHint}</p>
              </div>

              <button
                type="button"
                onClick={() => void startRender()}
                disabled={isRendering || authLoading}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-label={copy.renderAnimation}
                title={copy.renderAnimation}
              >
                <svg viewBox="0 0 512 512" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M133 440a35.37 35.37 0 0 1-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0 1 35.77.45l247.85 148.36a36 36 0 0 1 0 61l-247.89 148.4A35.5 35.5 0 0 1 133 440z" />
                </svg>
                <span>{isRendering ? copy.rendering : copy.render}</span>
              </button>
            </div>

            <div className="min-h-0 flex flex-1 overflow-hidden bg-slate-900">
              <div className="select-none border-r border-slate-700 bg-slate-900 px-3 py-3 font-mono text-sm leading-relaxed text-slate-500">
                {lineNumbers.map((lineNumber) => (
                  <div key={lineNumber} className="text-right">
                    {lineNumber}
                  </div>
                ))}
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div ref={highlightRef} className="pointer-events-none absolute inset-0 overflow-auto p-4">
                  <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: 0,
                      background: "transparent",
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      lineHeight: "1.625",
                      tabSize: 2,
                      fontVariantLigatures: "none",
                      minHeight: "100%",
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        lineHeight: "1.625",
                        tabSize: 2,
                        fontVariantLigatures: "none",
                      },
                    }}
                  >
                    {code.length > 0 ? code : " "}
                  </SyntaxHighlighter>
                </div>

                <textarea
                  ref={editorRef}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  onScroll={onEditorScroll}
                  wrap="off"
                  className="absolute inset-0 min-h-0 w-full resize-none whitespace-pre bg-transparent p-4 text-transparent caret-white outline-none selection:bg-blue-500/30 selection:text-white"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    lineHeight: 1.625,
                    tabSize: 2,
                    fontVariantLigatures: "none",
                  }}
                  spellCheck={false}
                  aria-label="Python code editor"
                />
              </div>
            </div>

            {!copilotOpen ? (
              <button
                type="button"
                onClick={() => setCopilotOpen(true)}
                className="absolute bottom-4 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-medium text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <svg viewBox="0 0 512 512" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M208 512a24.84 24.84 0 0 1-23.34-16l-39.84-103.6a16.06 16.06 0 0 0-9.19-9.19L32 343.34a25 25 0 0 1 0-46.68l103.6-39.84a16.06 16.06 0 0 0 9.19-9.19L184.66 144a25 25 0 0 1 46.68 0l39.84 103.6a16.06 16.06 0 0 0 9.19 9.19l103 39.63a25.49 25.49 0 0 1 16.63 24.1 24.82 24.82 0 0 1-16 22.82l-103.6 39.84a16.06 16.06 0 0 0-9.19 9.19L231.34 496A24.84 24.84 0 0 1 208 512z" />
                </svg>
                {copy.openCopilot}
              </button>
            ) : (
              <div className="absolute bottom-4 right-4 z-30 w-[min(92vw,420px)] rounded-full border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <form onSubmit={onSubmitOptimize} className="flex items-center gap-2">
                  <input
                    value={optimizeInput}
                    onChange={(event) => setOptimizeInput(event.target.value)}
                    placeholder={copy.optimizePlaceholder}
                    className="h-10 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={optimizing || !optimizeInput.trim()}
                    aria-label={copy.optimizeSend}
                    title={copy.optimizeSend}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {optimizing ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M5 12h14" />
                        <path d="m13 5 7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            )}
          </section>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
            <div className="space-y-3 p-4">
              {videoUrl ? (
                <article className="overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
                  <video src={videoUrl} className="aspect-video w-full object-cover" preload="metadata" controls />
                </article>
              ) : (
                <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40">
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-300">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
                    </svg>
                    <p className="px-6 text-center text-xs">{copy.previewPlaceholder}</p>
                  </div>
                </article>
              )}

              {!videoUrl ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full bg-blue-600 transition-all duration-500 dark:bg-blue-500" style={{ width: `${statusProgress}%` }} />
                </div>
              ) : null}

              {renderError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">{renderError}</p> : null}
            </div>
          </section>
        </div>
      </div>

      <SignInModal
        open={showSignInModal}
        locale={locale}
        onClose={() => {
          setShowSignInModal(false);
          setPendingRenderCode(null);
        }}
        onSuccess={() => {
          setShowSignInModal(false);
          void onSignInSuccess();
        }}
      />
    </>
  );
}
