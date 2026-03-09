"use client";

import { useEffect, useMemo, useState } from "react";

import { ahaOfferRequestSchema, ahaOfferSuccessResponseSchema, type AhaOffer } from "@/contracts/aha-offer";
import { createRenderRequestSchema, createRenderSuccessResponseSchema, getRenderSuccessResponseSchema, listRendersSuccessResponseSchema, type RenderJob } from "@/contracts/renders";
import { PaywallModal } from "@/components/paywall/paywall-modal";
import { getApiErrorMessage, parseApiResponseOrThrow, parseWithSchema, readJsonSafely } from "@/lib/api/client";

const demoCode = `from manim import *

class ShapeTransformation(Scene):
    def construct(self):
        ax = ThreeDAxes()
        sin_curve = ParametricFunction(lambda t: np.array([t, np.sin(t), 0]), t_range=[-4, 4], color=BLUE)
        cos_curve = ParametricFunction(lambda t: np.array([t, np.cos(t), 0]), t_range=[-4, 4], color=GREEN)

        self.add(ax)
        self.play(Create(sin_curve), run_time=2)
        self.play(Transform(sin_curve, cos_curve), run_time=3)
        self.wait()`;

export default function PlaygroundPage() {
  const [code, setCode] = useState(demoCode);
  const [quality, setQuality] = useState<"preview" | "1080p">("preview");
  const [job, setJob] = useState<RenderJob | null>(null);
  const [history, setHistory] = useState<RenderJob[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [offer, setOffer] = useState<AhaOffer | null>(null);

  const statusText = useMemo(() => {
    if (!job) return "尚未开始渲染";
    if (job.status === "queued") return "排队中";
    if (job.status === "running") return "渲染中";
    if (job.status === "succeeded") return "渲染成功";
    return "渲染失败";
  }, [job]);

  const jobId = job?.id;
  const jobStatus = job?.status;

  async function loadHistory() {
    try {
      const response = await fetch("/api/renders?limit=8");
      const data = parseWithSchema(listRendersSuccessResponseSchema, await readJsonSafely(response));
      if (!response.ok || !data) return;
      setHistory(data.items);
    } catch {
      // Keep UI usable even if history query fails.
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    if (!jobId) return;
    if (jobStatus !== "queued" && jobStatus !== "running") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/renders?id=${encodeURIComponent(jobId)}`);
        const data = parseWithSchema(getRenderSuccessResponseSchema, await readJsonSafely(response));
        if (response.ok && data) {
          const jobItem = data.job;
          setJob(jobItem);
          setHistory((prev) => {
            const merged = [jobItem, ...prev.filter((item) => item.id !== jobItem.id)];
            return merged.slice(0, 8);
          });
        }
      } catch {
        // Keep polling resilient during temporary network jitter.
      }
    }, 900);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  async function startRender() {
    setSubmitting(true);
    setError("");

    try {
      const payload = createRenderRequestSchema.parse({
        title: "ShapeTransformation.py",
        code,
        quality,
      });
      const response = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely(response);
      if (response.status === 402) {
        setError(getApiErrorMessage(data) ?? "1080p 导出需升级订阅");
        await triggerUpgrade();
        return;
      }
      const parsed = parseWithSchema(createRenderSuccessResponseSchema, data);
      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? "渲染任务创建失败");
      }

      const jobItem = parsed.job;
      setJob(jobItem);
      setHistory((prev) => [jobItem, ...prev.filter((item) => item.id !== jobItem.id)].slice(0, 8));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "渲染任务创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function triggerUpgrade() {
    try {
      const payload = ahaOfferRequestSchema.parse({ persona: "creator", trigger: "download_1080" });
      const response = await fetch("/api/aha-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseApiResponseOrThrow({
        response,
        successSchema: ahaOfferSuccessResponseSchema,
        fallbackError: "获取升级方案失败",
      });
      setOffer(data.offer);
    } catch {
      // keep default modal offer
    } finally {
      setShowPaywall(true);
    }
  }

  const isRendering = submitting || job?.status === "queued" || job?.status === "running";
  const renderFailed = job?.status === "failed";
  const renderSucceeded = job?.status === "succeeded";

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
            <span>ShapeTransformation.py</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuality("preview")}
                className={`rounded-md px-2 py-1 text-xs ${quality === "preview" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                预览
              </button>
              <button
                onClick={() => setQuality("1080p")}
                className={`rounded-md px-2 py-1 text-xs ${quality === "1080p" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}
              >
                1080p
              </button>
              <button
                onClick={startRender}
                disabled={isRendering}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRendering ? "渲染中..." : "渲染"}
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="h-[540px] w-full resize-none bg-slate-900 p-4 font-mono text-xs leading-relaxed text-cyan-200 outline-none"
            spellCheck={false}
          />

          <div className="border-t border-slate-700 bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white">
            <p className="text-sm font-semibold">AI + Playground 协同</p>
            <p className="text-xs text-blue-100">先用创作台生成草案，再在演练场调参并快速迭代。</p>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="math-card p-4">
            <h1 className="text-2xl font-semibold">AnimG Manim 演练场</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">可编辑代码、提交渲染任务、查看日志与结果状态。</p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-wide text-slate-500">任务状态</p>
              <p className="mt-1 text-lg font-semibold">{statusText}</p>
              {job ? (
                <p className="mt-1 text-xs text-slate-500">
                  ID: {job.id.slice(0, 8)} · 质量: {job.quality}
                </p>
              ) : null}
            </div>

            <div className="mt-3 h-40 rounded-xl bg-black p-4 text-xs text-slate-300">
              {renderSucceeded ? (
                <>
                  <p>渲染输出：{job?.output?.resolution}</p>
                  <p className="mt-1">视频时长：{job?.output?.durationSec}s</p>
                  <p className="mt-2 text-slate-400">{job?.output?.previewText}</p>
                </>
              ) : (
                <p className="text-slate-500">{renderFailed ? job?.error : "渲染结果将在此处显示"}</p>
              )}
            </div>

            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

            <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {job?.logs?.slice(-3).map((item) => (
                <p key={item}>• {item}</p>
              )) ?? <p>• 等待任务创建</p>}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={triggerUpgrade}
                disabled={!renderSucceeded}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                下载 1080p
              </button>
              <button
                type="button"
                onClick={() => {
                  setCode(demoCode);
                  setError("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                恢复示例代码
              </button>
            </div>
          </div>

          <div className="math-card p-4">
            <h2 className="text-lg font-semibold">快速提示</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• 保留 `class xxx(Scene)` 结构，便于引擎识别。</li>
              <li>• 预览模式用于快速迭代，1080p 用于导出交付。</li>
              <li>• 报错后优先检查 Scene 类定义和代码完整性。</li>
            </ul>
          </div>

          <div className="math-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近任务</h2>
              <button
                type="button"
                onClick={loadHistory}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
              >
                刷新
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">暂无渲染历史</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setJob(item)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {item.title} · {item.quality}
                    </p>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                      状态：{item.status} · {new Date(item.updatedAt).toLocaleTimeString("zh-CN", { hour12: false })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        planId={offer?.planId}
        planName={offer?.planName}
        monthly={offer?.monthly}
        yearly={offer?.yearly}
        discount={offer?.discount}
      />
    </>
  );
}
