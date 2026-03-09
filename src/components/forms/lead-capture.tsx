"use client";

import { FormEvent, useState } from "react";

import { leadRequestSchema, leadSuccessResponseSchema } from "@/contracts/leads";
import { getApiErrorMessage, parseWithSchema, readJsonSafely } from "@/lib/api/client";

type LeadCaptureProps = {
  source: string;
  segment: string;
  buttonLabel?: string;
  placeholder?: string;
};

export function LeadCapture({
  source,
  segment,
  buttonLabel = "获取方案",
  placeholder = "输入你的工作邮箱",
}: LeadCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const payload = leadRequestSchema.parse({ email, source, segment });
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely(response);
      const parsed = parseWithSchema(leadSuccessResponseSchema, data);

      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? "提交失败，请重试");
      }

      setStatus("ok");
      setMessage("已提交，我们会在 24 小时内联系你。");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "提交失败，请重试");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "提交中..." : buttonLabel}
        </button>
      </div>
      {message ? (
        <p className={`mt-2 text-sm ${status === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>
      ) : null}
    </form>
  );
}
