"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { authMeResponseSchema, type SessionUser } from "@/contracts/auth";
import { createAnimationShareSuccessResponseSchema } from "@/contracts/animations";
import {
  chatThreadResponseSchema,
  chatThreadsListResponseSchema,
  type ChatThread,
  type ChatThreadSummary,
  type ChatThreadTask,
} from "@/contracts/chat";
import {
  createRenderRequestSchema,
  createRenderSuccessResponseSchema,
  getRenderSuccessResponseSchema,
} from "@/contracts/renders";
import { SignInModal } from "@/components/auth/sign-in-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/ui/chat-markdown";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  parseWithSchema,
  readJsonSafely,
} from "@/lib/api/client";
import { localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

type CreatorWorkbenchProps = {
  locale: Locale;
  initialPrompt: string;
};

type CreatorCopy = {
  pageTitle: string;
  newThread: string;
  chatHistory: string;
  emptyHistory: string;
  loadingThreads: string;
  loadingThreadsFailed: string;
  retryLoadThreads: string;
  heroTitle: string;
  heroSubtitle: string;
  howItWorks: string;
  promptPlaceholder: string;
  promptHint: string;
  quickIdeasLabel: string;
  sendPrompt: string;
  generating: string;
  signInRequired: string;
  sidebarAria: string;
  threadActions: string;
  renameThread: string;
  deleteThread: string;
  renameThreadPrompt: string;
  deleteThreadConfirm: string;
  threadTasksTitle: string;
  noThreadTasks: string;
  suggestedTasksTitle: string;
  saveAsTask: string;
  runTask: string;
  runningTask: string;
  reportLabel: string;
  codeLabel: string;
  qualityPreview: string;
  quality1080: string;
  renderIdle: string;
  renderQueued: string;
  renderRunning: string;
  renderSucceeded: string;
  renderFailed: string;
  taskNotifyTitle: string;
  taskNotifySuccess: string;
  taskNotifyFailed: string;
  shareThread: string;
  sharingThread: string;
  shareSuccess: string;
  shareFailedNoTask: string;
  codeHiddenHint: string;
  latestTaskLabel: string;
  taskHistoryTitle: string;
  editTask: string;
  saveTask: string;
  cancelTask: string;
  linkVideo: string;
  linkJob: string;
  taskEditInvalid: string;
  noTaskHistory: string;
  threadTitleLabel: string;
  threadTitlePlaceholder: string;
  playCode: string;
};

const creatorCopyByLocale: Record<Locale, CreatorCopy> = {
  en: {
    pageTitle: "Create Manim Animations with AI",
    newThread: "New Thread",
    chatHistory: "Threads",
    emptyHistory: "No threads yet",
    loadingThreads: "Loading threads...",
    loadingThreadsFailed:
      "Failed to load threads. Please check Firestore configuration and try again.",
    retryLoadThreads: "Retry",
    heroTitle: "Chat to create Manim animation",
    heroSubtitle:
      "Describe your idea and iterate with AI-generated scene drafts.",
    howItWorks: "How AnimG works?",
    promptPlaceholder: "Describe the animation you want to create...",
    promptHint: "Press Enter to send · Shift+Enter for a new line",
    quickIdeasLabel: "Try:",
    sendPrompt: "Send",
    generating: "Generating...",
    signInRequired: "Please sign in before sending this prompt.",
    sidebarAria: "Toggle sidebar",
    threadActions: "Thread actions",
    renameThread: "Rename",
    deleteThread: "Delete",
    renameThreadPrompt: "Enter a new thread title",
    deleteThreadConfirm: "Delete this thread? This action cannot be undone.",
    threadTasksTitle: "Thread Tasks",
    noThreadTasks: "No saved task yet. Save Python plans from chat first.",
    suggestedTasksTitle: "Suggested from latest discussion",
    saveAsTask: "Save as task",
    runTask: "Generate Animation",
    runningTask: "Generating...",
    reportLabel: "Report",
    codeLabel: "Python",
    qualityPreview: "Preview",
    quality1080: "1080p",
    renderIdle: "Ready",
    renderQueued: "Queued",
    renderRunning: "Rendering",
    renderSucceeded: "Succeeded",
    renderFailed: "Failed",
    taskNotifyTitle: "Render update",
    taskNotifySuccess: "Render completed",
    taskNotifyFailed: "Render failed",
    shareThread: "Share to Community",
    sharingThread: "Sharing...",
    shareSuccess: "Thread shared to community.",
    shareFailedNoTask: "Share requires a rendered task with video output.",
    codeHiddenHint: "Click to expand code",
    latestTaskLabel: "Latest task (editable)",
    taskHistoryTitle: "Task history",
    editTask: "Edit",
    saveTask: "Save",
    cancelTask: "Cancel",
    linkVideo: "Video",
    linkJob: "Job",
    taskEditInvalid: "Title and Python code are required.",
    noTaskHistory: "No finished tasks yet.",
    threadTitleLabel: "Thread title",
    threadTitlePlaceholder: "Enter thread title",
    playCode: "Play",
  },
  zh: {
    pageTitle: "用 AI 创建 Manim 动画",
    newThread: "新线程",
    chatHistory: "线程历史",
    emptyHistory: "暂无线程",
    loadingThreads: "正在加载线程...",
    loadingThreadsFailed: "线程加载失败，请检查 Firestore 配置后重试。",
    retryLoadThreads: "重试",
    heroTitle: "通过对话创建 Manim 动画",
    heroSubtitle: "描述你的想法，持续迭代可渲染的动画草案。",
    howItWorks: "AnimG 如何工作？",
    promptPlaceholder: "描述你想创作的动画…",
    promptHint: "按 Enter 发送 · Shift+Enter 换行",
    quickIdeasLabel: "试试：",
    sendPrompt: "发送",
    generating: "生成中...",
    signInRequired: "请先登录再发送提示词。",
    sidebarAria: "切换侧边栏",
    threadActions: "线程操作",
    renameThread: "重命名",
    deleteThread: "删除",
    renameThreadPrompt: "输入新的线程标题",
    deleteThreadConfirm: "确认删除该线程？删除后不可恢复。",
    threadTasksTitle: "线程任务",
    noThreadTasks: "还没有任务。先从对话中的 Python 方案保存任务。",
    suggestedTasksTitle: "根据最近讨论生成的候选任务",
    saveAsTask: "保存为任务",
    runTask: "生成动画",
    runningTask: "生成中...",
    reportLabel: "报告",
    codeLabel: "Python",
    qualityPreview: "预览",
    quality1080: "1080p",
    renderIdle: "待生成",
    renderQueued: "排队中",
    renderRunning: "渲染中",
    renderSucceeded: "已完成",
    renderFailed: "失败",
    taskNotifyTitle: "渲染通知",
    taskNotifySuccess: "渲染已完成",
    taskNotifyFailed: "渲染失败",
    shareThread: "分享到社区",
    sharingThread: "分享中...",
    shareSuccess: "已分享到社区。",
    shareFailedNoTask: "分享需要一个已渲染并带视频输出的任务。",
    codeHiddenHint: "点击展开代码",
    latestTaskLabel: "最新任务（可修改）",
    taskHistoryTitle: "任务历史",
    editTask: "修改",
    saveTask: "保存",
    cancelTask: "取消",
    linkVideo: "视频",
    linkJob: "任务",
    taskEditInvalid: "标题和 Python 代码不能为空。",
    noTaskHistory: "还没有已完成任务。",
    threadTitleLabel: "线程标题",
    threadTitlePlaceholder: "输入线程标题",
    playCode: "运行",
  },
  de: {
    pageTitle: "Create Manim Animations with AI",
    newThread: "New Thread",
    chatHistory: "Threads",
    emptyHistory: "No threads yet",
    loadingThreads: "Loading threads...",
    loadingThreadsFailed:
      "Failed to load threads. Please check Firestore configuration and try again.",
    retryLoadThreads: "Retry",
    heroTitle: "Chat to create Manim animation",
    heroSubtitle:
      "Describe your idea and iterate with AI-generated scene drafts.",
    howItWorks: "How AnimG works?",
    promptPlaceholder: "Describe the animation you want to create...",
    promptHint: "Press Enter to send · Shift+Enter for a new line",
    quickIdeasLabel: "Try:",
    sendPrompt: "Send",
    generating: "Generating...",
    signInRequired: "Please sign in before sending this prompt.",
    sidebarAria: "Toggle sidebar",
    threadActions: "Thread actions",
    renameThread: "Rename",
    deleteThread: "Delete",
    renameThreadPrompt: "Enter a new thread title",
    deleteThreadConfirm: "Delete this thread? This action cannot be undone.",
    threadTasksTitle: "Thread Tasks",
    noThreadTasks: "No saved task yet. Save Python plans from chat first.",
    suggestedTasksTitle: "Suggested from latest discussion",
    saveAsTask: "Save as task",
    runTask: "Generate Animation",
    runningTask: "Generating...",
    reportLabel: "Report",
    codeLabel: "Python",
    qualityPreview: "Preview",
    quality1080: "1080p",
    renderIdle: "Ready",
    renderQueued: "Queued",
    renderRunning: "Rendering",
    renderSucceeded: "Succeeded",
    renderFailed: "Failed",
    taskNotifyTitle: "Render update",
    taskNotifySuccess: "Render completed",
    taskNotifyFailed: "Render failed",
    shareThread: "Share to Community",
    sharingThread: "Sharing...",
    shareSuccess: "Thread shared to community.",
    shareFailedNoTask: "Share requires a rendered task with video output.",
    codeHiddenHint: "Click to expand code",
    latestTaskLabel: "Latest task (editable)",
    taskHistoryTitle: "Task history",
    editTask: "Edit",
    saveTask: "Save",
    cancelTask: "Cancel",
    linkVideo: "Video",
    linkJob: "Job",
    taskEditInvalid: "Title and Python code are required.",
    noTaskHistory: "No finished tasks yet.",
    threadTitleLabel: "Thread title",
    threadTitlePlaceholder: "Enter thread title",
    playCode: "Play",
  },
};

const promptQuickIdeasByLocale: Record<Locale, string[]> = {
  en: [
    "Create a 30-second animation proving the Pythagorean theorem.",
    "Visualize gradient descent with one clear curve and tangent updates.",
    "Explain matrix multiplication with moving vectors and a 2x2 grid.",
  ],
  zh: [
    "做一个 30 秒勾股定理证明动画，适合课堂演示。",
    "用一个简单曲线演示梯度下降迭代过程。",
    "用向量运动演示 2x2 矩阵乘法的几何意义。",
  ],
  de: [
    "Create a 30-second animation proving the Pythagorean theorem.",
    "Visualize gradient descent with one clear curve and tangent updates.",
    "Explain matrix multiplication with moving vectors and a 2x2 grid.",
  ],
};

const PLAYGROUND_SEED_CODE_STORAGE_KEY = "animg:playground:incoming-code";

function extractMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? String(part.text ?? "") : ""))
    .join(" ")
    .trim();
}

function firstAvatarLetter(
  input: string | null | undefined,
  fallback = "A",
): string {
  const text = (input ?? "").trim();
  if (!text) return fallback;
  return text.charAt(0).toUpperCase();
}

function taskStatusLabel(copy: CreatorCopy, task: ChatThreadTask): string {
  if (!task.renderStatus) return copy.renderIdle;
  if (task.renderStatus === "queued") return copy.renderQueued;
  if (task.renderStatus === "running") return copy.renderRunning;
  if (task.renderStatus === "succeeded") return copy.renderSucceeded;
  return copy.renderFailed;
}

function toSummary(thread: ChatThread): ChatThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    messageCount: thread.messageCount,
    taskCount: thread.taskCount,
    lastMessagePreview: thread.lastMessagePreview,
  };
}

type TaskToast = {
  id: string;
  title: string;
  message: string;
  tone: "success" | "error";
};

function TaskToastStack({
  notices,
  onDismiss,
}: {
  notices: TaskToast[];
  onDismiss: (id: string) => void;
}) {
  if (notices.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-40 space-y-2">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={cn(
            "pointer-events-auto w-[min(92vw,360px)] rounded-xl border bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:bg-slate-900/95",
            notice.tone === "success"
              ? "border-emerald-300 dark:border-emerald-700/60"
              : "border-rose-300 dark:border-rose-700/60",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {notice.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {notice.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notice.id)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Dismiss notification"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadSidebar({
  copy,
  threads,
  activeThreadId,
  loadingThreads,
  onNewThread,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
}: {
  copy: CreatorCopy;
  threads: ChatThreadSummary[];
  activeThreadId: string | null;
  loadingThreads: boolean;
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
  onRenameThread: (threadId: string, title: string) => Promise<void>;
  onDeleteThread: (threadId: string) => Promise<void>;
}) {
  const { open } = useSidebar();
  const [menuOpenThreadId, setMenuOpenThreadId] = useState<string | null>(null);
  const [busyThreadId, setBusyThreadId] = useState<string | null>(null);
  const [renameThreadId, setRenameThreadId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [pendingDeleteThread, setPendingDeleteThread] =
    useState<ChatThreadSummary | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpenThreadId) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuAnchorRef.current?.contains(target)) return;
      setMenuOpenThreadId(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpenThreadId]);

  useEffect(() => {
    setMenuOpenThreadId(null);
    setRenameThreadId(null);
    setRenameDraft("");
    setPendingDeleteThread(null);
  }, [activeThreadId, open]);

  function beginRenameThread(thread: ChatThreadSummary) {
    setRenameThreadId(thread.id);
    setRenameDraft(thread.title);
    setMenuOpenThreadId(null);
  }

  function cancelRenameThread() {
    setRenameThreadId(null);
    setRenameDraft("");
  }

  async function submitRenameThread(thread: ChatThreadSummary) {
    const sanitized = renameDraft.trim();
    if (!sanitized || sanitized === thread.title) {
      cancelRenameThread();
      return;
    }

    setBusyThreadId(thread.id);
    try {
      await onRenameThread(thread.id, sanitized);
      cancelRenameThread();
    } catch (error) {
      if (typeof window === "undefined") return;
      const message =
        error instanceof Error ? error.message : copy.loadingThreadsFailed;
      window.alert(message);
    } finally {
      setBusyThreadId(null);
      setMenuOpenThreadId(null);
    }
  }

  function askDeleteThread(thread: ChatThreadSummary) {
    setPendingDeleteThread(thread);
    setMenuOpenThreadId(null);
  }

  async function deleteThread(thread: ChatThreadSummary) {
    setBusyThreadId(thread.id);
    let deleted = false;
    try {
      await onDeleteThread(thread.id);
      deleted = true;
    } catch (error) {
      if (typeof window === "undefined") return;
      const message =
        error instanceof Error ? error.message : copy.loadingThreadsFailed;
      window.alert(message);
    } finally {
      setBusyThreadId(null);
      setMenuOpenThreadId(null);
      if (deleted) {
        setPendingDeleteThread((previous) =>
          previous?.id === thread.id ? null : previous,
        );
      }
    }
  }

  return (
    <Sidebar collapseMode="hidden">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <SidebarTrigger aria-label={copy.sidebarAria}>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </SidebarTrigger>

          <Button
            type="button"
            size="sm"
            onClick={onNewThread}
            className={cn("h-8", !open && "px-0")}
          >
            {open ? copy.newThread : "+"}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {open ? (
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {copy.chatHistory}
          </p>
        ) : null}

        {loadingThreads ? (
          <p className="px-2 py-2 text-xs text-slate-500">
            {open ? copy.loadingThreads : "..."}
          </p>
        ) : (
          <SidebarMenu>
            {threads.length === 0 ? (
              <SidebarMenuItem>
                <p className="px-2 py-2 text-xs text-slate-500">
                  {open ? copy.emptyHistory : "-"}
                </p>
              </SidebarMenuItem>
            ) : null}

            {threads.map((thread) => (
              <SidebarMenuItem key={thread.id}>
                <div className="relative">
                  {renameThreadId === thread.id ? (
                    <div
                      className={cn(
                        "rounded-md border bg-white p-2 dark:bg-slate-900",
                        thread.id === activeThreadId
                          ? "border-blue-300 dark:border-blue-500/70"
                          : "border-slate-200 dark:border-slate-700",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-[11px] dark:border-slate-700">
                          #
                        </span>
                        <div className="min-w-0 flex-1">
                          <input
                            value={renameDraft}
                            onChange={(event) =>
                              setRenameDraft(event.target.value)
                            }
                            placeholder={copy.renameThreadPrompt}
                            disabled={busyThreadId === thread.id}
                            autoFocus
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void submitRenameThread(thread);
                                return;
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelRenameThread();
                              }
                            }}
                            className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                void submitRenameThread(thread);
                              }}
                              disabled={busyThreadId === thread.id}
                              className="inline-flex h-7 items-center rounded-md border border-slate-300 px-2 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {copy.saveTask}
                            </button>
                            <button
                              type="button"
                              onClick={cancelRenameThread}
                              disabled={busyThreadId === thread.id}
                              className="inline-flex h-7 items-center rounded-md border border-slate-300 px-2 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              {copy.cancelTask}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <SidebarMenuButton
                      isActive={thread.id === activeThreadId}
                      onClick={() => {
                        setMenuOpenThreadId(null);
                        onSelectThread(thread.id);
                      }}
                      className={cn(open && "pr-10")}
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-[11px] dark:border-slate-700">
                        #
                      </span>
                      {open ? (
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {thread.title}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {thread.messageCount} msg · {thread.taskCount} tasks
                          </span>
                        </span>
                      ) : null}
                    </SidebarMenuButton>
                  )}

                  {open && renameThreadId !== thread.id ? (
                    <div
                      ref={
                        menuOpenThreadId === thread.id ? menuAnchorRef : null
                      }
                      className="absolute inset-y-0 right-1 flex items-center"
                    >
                      <button
                        type="button"
                        aria-label={copy.threadActions}
                        title={copy.threadActions}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setMenuOpenThreadId((current) =>
                            current === thread.id ? null : thread.id,
                          );
                        }}
                        disabled={busyThreadId === thread.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </button>

                      {menuOpenThreadId === thread.id ? (
                        <div className="absolute right-0 top-8 z-30 w-36 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              beginRenameThread(thread);
                            }}
                            disabled={busyThreadId === thread.id}
                            className="block w-full px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {copy.renameThread}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              askDeleteThread(thread);
                            }}
                            disabled={busyThreadId === thread.id}
                            className="block w-full px-3 py-2 text-left text-xs text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            {copy.deleteThread}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>

      <AlertDialog
        open={Boolean(pendingDeleteThread)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !busyThreadId) {
            setPendingDeleteThread(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteThread}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteThreadConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyThreadId)}>
              {copy.cancelTask}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
              disabled={Boolean(busyThreadId)}
              onClick={(event) => {
                event.preventDefault();
                if (!pendingDeleteThread || busyThreadId) return;
                void deleteThread(pendingDeleteThread);
              }}
            >
              {copy.deleteThread}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}

function SidebarRevealButton({ copy }: { copy: CreatorCopy }) {
  const { open } = useSidebar();

  if (open) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20">
      <SidebarTrigger
        aria-label={copy.sidebarAria}
        className="pointer-events-auto h-9 w-9 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </SidebarTrigger>
    </div>
  );
}

function ThreadTaskBoard({
  copy,
  tasks,
  onRunTask,
  onCancelQueuedTask,
  cancellingTaskIds,
}: {
  copy: CreatorCopy;
  tasks: ChatThreadTask[];
  onRunTask: (taskId: string) => void;
  onCancelQueuedTask: (taskId: string) => void;
  cancellingTaskIds: ReadonlySet<string>;
}) {
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((left, right) => {
        const leftTime = Date.parse(left.updatedAt);
        const rightTime = Date.parse(right.updatedAt);
        if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
          return rightTime - leftTime;
        }
        return right.updatedAt.localeCompare(left.updatedAt);
      }),
    [tasks],
  );
  const latestTask = sortedTasks[0] ?? null;
  if (!latestTask) return null;

  function renderTaskLinks(task: ChatThreadTask) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {task.renderOutput?.videoUrl ? (
          <a
            href={task.renderOutput.videoUrl}
            target="_blank"
            rel="noreferrer"
            title={copy.linkVideo}
            aria-label={copy.linkVideo}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
            </svg>
          </a>
        ) : null}

        {task.renderJobId ? (
          <a
            href={`/api/renders?id=${encodeURIComponent(task.renderJobId)}`}
            target="_blank"
            rel="noreferrer"
            title={copy.linkJob}
            aria-label={copy.linkJob}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-500 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M14 3h7v7" />
              <path d="M10 14 21 3" />
              <path d="M21 14v7h-7" />
              <path d="M3 10 14 21" />
            </svg>
          </a>
        ) : null}
      </div>
    );
  }

  const isRunning =
    latestTask.renderStatus === "queued" ||
    latestTask.renderStatus === "running";
  const canCancelQueued =
    latestTask.renderStatus === "queued" && Boolean(latestTask.renderJobId);
  const cancellingCurrentTask = cancellingTaskIds.has(latestTask.id);
  const statusLabel = taskStatusLabel(copy, latestTask);
  const statusTooltip =
    latestTask.renderStatus === "failed" && latestTask.renderError
      ? `${statusLabel}: ${latestTask.renderError}`
      : statusLabel;
  const statusTone =
    latestTask.renderStatus === "succeeded"
      ? "text-emerald-600 dark:text-emerald-400"
      : latestTask.renderStatus === "failed"
        ? "text-rose-600 dark:text-rose-400"
        : latestTask.renderStatus === "queued" ||
            latestTask.renderStatus === "running"
          ? "text-amber-600 dark:text-amber-400"
          : "text-slate-500 dark:text-slate-400";

  return (
    <section className="mt-5 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {copy.threadTasksTitle}
      </p>
      <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-2 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onRunTask(latestTask.id)}
            disabled={isRunning}
            className="h-8 shrink-0 rounded-xl border-slate-400/70 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            PythagoreanTheoremProof
          </Button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {canCancelQueued ? (
              <button
                type="button"
                title={copy.cancelTask}
                aria-label={copy.cancelTask}
                onClick={() => onCancelQueuedTask(latestTask.id)}
                disabled={cancellingCurrentTask}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:border-rose-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500 dark:hover:text-rose-400"
              >
                {cancellingCurrentTask ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="8" opacity="0.3" />
                    <path d="M20 12a8 8 0 0 0-8-8" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M6 6h12v12H6z" />
                  </svg>
                )}
              </button>
            ) : null}

            <span
              title={statusTooltip}
              aria-label={statusTooltip}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900",
                statusTone,
              )}
            >
              {latestTask.renderStatus === "queued" ||
              latestTask.renderStatus === "running" ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="8" opacity="0.3" />
                  <path d="M20 12a8 8 0 0 0-8-8" />
                </svg>
              ) : latestTask.renderStatus === "succeeded" ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              ) : latestTask.renderStatus === "failed" ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m8 8 8 8M16 8l-8 8" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="5" />
                </svg>
              )}
            </span>
            {renderTaskLinks(latestTask)}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatAvatar({
  label,
  imageUrl,
  tone,
}: {
  label: string;
  imageUrl?: string | null;
  tone: "user" | "assistant";
}) {
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;

  if (hasImage) {
    return (
      <span
        aria-label="User avatar"
        className="inline-flex h-8 w-8 shrink-0 rounded-full border border-slate-300 bg-slate-100 bg-cover bg-center dark:border-slate-700 dark:bg-slate-800"
        style={{
          backgroundImage: `url(\"${imageUrl!.replace(/"/g, '\\"')}\")`,
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase",
        tone === "user"
          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-900/30 dark:text-blue-300"
          : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
      )}
    >
      {label}
    </span>
  );
}

function ThreadChatPanel({
  locale,
  copy,
  threadId,
  initialMessages,
  initialPrompt,
  tasks,
  authenticated,
  queuedPrompt,
  onRequireSignIn,
  onQueuedPromptConsumed,
  onPersistMessages,
  onPlayCodeInPlayground,
  onRunTask,
  onCancelQueuedTask,
  cancellingTaskIds,
  onShareThread,
  sharingThread,
  canShareThread,
  shareFeedback,
  userAvatarUrl,
  userAvatarLabel,
  assistantAvatarLabel,
}: {
  locale: Locale;
  copy: CreatorCopy;
  threadId: string;
  initialMessages: UIMessage[];
  initialPrompt: string;
  tasks: ChatThreadTask[];
  authenticated: boolean;
  queuedPrompt: string;
  onRequireSignIn: (prompt: string) => void;
  onQueuedPromptConsumed: () => void;
  onPersistMessages: (messages: UIMessage[]) => Promise<void>;
  onPlayCodeInPlayground: (code: string) => void;
  onRunTask: (taskId: string) => void;
  onCancelQueuedTask: (taskId: string) => void;
  cancellingTaskIds: ReadonlySet<string>;
  onShareThread: () => Promise<void>;
  sharingThread: boolean;
  canShareThread: boolean;
  shareFeedback: { kind: "success" | "error"; message: string } | null;
  userAvatarUrl?: string | null;
  userAvatarLabel: string;
  assistantAvatarLabel: string;
}) {
  const [draft, setDraft] = useState(initialPrompt);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { threadId },
    }),
    onFinish: ({ messages: finishedMessages }) => {
      void onPersistMessages(finishedMessages);
    },
  });

  useEffect(() => {
    if (!queuedPrompt) return;
    if (!authenticated) return;

    void sendMessage({ text: queuedPrompt });
    onQueuedPromptConsumed();
  }, [authenticated, onQueuedPromptConsumed, queuedPrompt, sendMessage]);

  const isLoading = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;
  const quickIdeas = promptQuickIdeasByLocale[locale];

  async function submitPromptFromDraft() {
    const text = draft.trim();
    if (!text || isLoading) return;

    if (!authenticated) {
      onRequireSignIn(text);
      return;
    }

    setDraft("");
    await sendMessage({ text });
  }

  async function onSubmitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPromptFromDraft();
  }

  async function onPromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    await submitPromptFromDraft();
  }

  function renderGeminiComposer({
    compact,
    showIdeas,
  }: {
    compact: boolean;
    showIdeas: boolean;
  }) {
    return (
      <form
        onSubmit={onSubmitPrompt}
        className={cn("mx-auto w-full max-w-3xl", compact ? "" : "mt-6")}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/95 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900/95">
          <div className="pointer-events-none absolute inset-0 " />
          <div className="relative p-4 pb-3 sm:p-5 sm:pb-4">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onPromptKeyDown}
              placeholder={copy.promptPlaceholder}
              rows={compact ? 2 : 3}
              maxLength={5000}
              className={cn(
                "resize-none border-0 bg-transparent px-0 py-0 text-base leading-7 placeholder:text-slate-400 focus-visible:ring-0",
                compact ? "min-h-[104px]" : "min-h-[138px]",
              )}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{draft.length}/5000</span>
                <span className="hidden sm:inline">{copy.promptHint}</span>
              </div>

              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !draft.trim()}
                className="h-11 w-11 rounded-full  text-white shadow-sm "
              >
                <span className="sr-only">
                  {isLoading ? copy.generating : copy.sendPrompt}
                </span>
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 5 7 7-7 7" />
                  </svg>
                )}
              </Button>
            </div>

            {showIdeas ? (
              <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
                <p className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {copy.quickIdeasLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickIdeas.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setDraft(idea)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/30"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-left text-sm text-rose-600">
            {error.message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "min-h-0 flex-1 px-4 sm:px-6 md:px-8",
          isEmpty ? "flex items-center justify-center" : "overflow-y-auto py-6",
        )}
      >
        {isEmpty ? (
          <div className="w-full max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
              {copy.heroTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {copy.heroSubtitle}
            </p>
            <Link
              href={localePath(locale, "/how-it-works")}
              className="mt-2 inline-block text-sm text-slate-500 underline transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              {copy.howItWorks}
            </Link>

            {renderGeminiComposer({ compact: false, showIdeas: true })}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void onShareThread()}
                disabled={sharingThread || !canShareThread}
                title={!canShareThread ? copy.shareFailedNoTask : undefined}
              >
                {sharingThread ? copy.sharingThread : copy.shareThread}
              </Button>
            </div>

            {shareFeedback ? (
              <p
                className={cn(
                  "rounded-lg px-3 py-2 text-xs",
                  shareFeedback.kind === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
                )}
              >
                {shareFeedback.message}
              </p>
            ) : null}

            {messages.map((message) => {
              const text = extractMessageText(message);
              const isUser = message.role === "user";

              return (
                <article
                  key={message.id}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-[92%] items-end gap-2",
                      isUser ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <ChatAvatar
                      label={isUser ? userAvatarLabel : assistantAvatarLabel}
                      imageUrl={isUser ? userAvatarUrl : undefined}
                      tone={isUser ? "user" : "assistant"}
                    />
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
                        isUser
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                      )}
                    >
                      {text ? (
                        <ChatMarkdown
                          content={text}
                          collapseCodeBlocks={!isUser}
                          codeBlockHint={copy.codeHiddenHint}
                          codeRunLabel={copy.playCode}
                          onRunCodeBlock={({ code }) =>
                            onPlayCodeInPlayground(code)
                          }
                          className={cn(
                            "text-sm leading-7",
                            isUser
                              ? "text-white [&_code]:bg-blue-500/80 [&_pre]:bg-blue-500/70"
                              : "",
                          )}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">...</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            <ThreadTaskBoard
              copy={copy}
              tasks={tasks}
              onRunTask={onRunTask}
              onCancelQueuedTask={onCancelQueuedTask}
              cancellingTaskIds={cancellingTaskIds}
            />
          </div>
        )}
      </div>

      {!isEmpty ? (
        <div className="border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 md:px-8">
          {renderGeminiComposer({ compact: true, showIdeas: false })}
        </div>
      ) : null}
    </div>
  );
}

export function CreatorWorkbench({
  locale,
  initialPrompt,
}: CreatorWorkbenchProps) {
  const copy = creatorCopyByLocale[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread");
  const initialUrlThreadIdRef = useRef<string | null>(null);
  if (initialUrlThreadIdRef.current === null) {
    initialUrlThreadIdRef.current = urlThreadId;
  }

  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadMessages, setActiveThreadMessages] = useState<UIMessage[]>(
    [],
  );
  const [activeThreadTasks, setActiveThreadTasks] = useState<ChatThreadTask[]>(
    [],
  );
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThreadDetail, setLoadingThreadDetail] = useState(false);
  const [threadLoadError, setThreadLoadError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [seedPrompt, setSeedPrompt] = useState(initialPrompt);
  const [sharingThread, setSharingThread] = useState(false);
  const [cancellingTaskIds, setCancellingTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [shareFeedback, setShareFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [taskToasts, setTaskToasts] = useState<TaskToast[]>([]);
  const taskToastTimerIdsRef = useRef<Map<string, number>>(new Map());
  const taskStatusSnapshotRef = useRef<
    Map<string, ChatThreadTask["renderStatus"]>
  >(new Map());
  const taskStatusThreadRef = useRef<string | null>(null);
  const triedNotificationPermissionRef = useRef(false);

  const activeThreadSummary = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads],
  );
  const userAvatarLabel = useMemo(
    () =>
      firstAvatarLetter(
        sessionUser?.name || sessionUser?.email || undefined,
        "U",
      ),
    [sessionUser?.email, sessionUser?.name],
  );
  const assistantAvatarLabel = useMemo(
    () => firstAvatarLetter(activeThreadSummary?.title, "A"),
    [activeThreadSummary?.title],
  );

  const toThreadErrorMessage = useCallback(
    (error: unknown) =>
      error instanceof Error ? error.message : copy.loadingThreadsFailed,
    [copy.loadingThreadsFailed],
  );

  const dismissTaskToast = useCallback((toastId: string) => {
    const timerId = taskToastTimerIdsRef.current.get(toastId);
    if (timerId) {
      window.clearTimeout(timerId);
      taskToastTimerIdsRef.current.delete(toastId);
    }
    setTaskToasts((current) => current.filter((item) => item.id !== toastId));
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const notification = new Notification(title, { body });
      window.setTimeout(() => notification.close(), 7000);
    } catch {
      // Ignore browser notification failures and keep in-app notifications.
    }
  }, []);

  const ensureNotificationPermission = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (triedNotificationPermissionRef.current) return;

    triedNotificationPermissionRef.current = true;
    void Notification.requestPermission().catch(() => {
      // Ignore permission prompt errors and keep in-app notifications.
    });
  }, []);

  const pushTaskToast = useCallback(
    (notice: Omit<TaskToast, "id">) => {
      if (typeof window === "undefined") return;

      const id = crypto.randomUUID();
      const nextToast: TaskToast = {
        id,
        title: notice.title,
        message: notice.message,
        tone: notice.tone,
      };

      setTaskToasts((current) => [nextToast, ...current].slice(0, 4));

      const timerId = window.setTimeout(() => {
        setTaskToasts((current) => current.filter((item) => item.id !== id));
        taskToastTimerIdsRef.current.delete(id);
      }, 7000);
      taskToastTimerIdsRef.current.set(id, timerId);
    },
    [],
  );

  const syncThreadToUrl = useCallback(
    (threadId: string | null) => {
      const current = searchParams.get("thread");
      const next = threadId?.trim() || null;
      if ((current ?? null) === next) return;

      const query = new URLSearchParams(searchParams.toString());
      if (next) {
        query.set("thread", next);
      } else {
        query.delete("thread");
      }

      const nextUrl = query.toString()
        ? `${pathname}?${query.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadThreadDetail = useCallback(
    async (threadId: string) => {
      setLoadingThreadDetail(true);
      try {
        const response = await fetch(`/api/chat/threads/${threadId}`);
        const raw = await readJsonSafely(response);
        const data = parseWithSchema(chatThreadResponseSchema, raw);

        if (!response.ok || !data) {
          throw new Error(getApiErrorMessage(raw) ?? copy.loadingThreadsFailed);
        }

        setActiveThreadId(data.thread.id);
        setActiveThreadMessages(data.thread.messages as UIMessage[]);
        setActiveThreadTasks(data.thread.tasks ?? []);
        setThreadLoadError(null);
      } finally {
        setLoadingThreadDetail(false);
      }
    },
    [copy.loadingThreadsFailed],
  );

  const createThread = useCallback(async () => {
    const response = await fetch("/api/chat/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const raw = await readJsonSafely(response);
    const data = parseWithSchema(chatThreadResponseSchema, raw);

    if (!response.ok || !data) {
      throw new Error(getApiErrorMessage(raw) ?? copy.loadingThreadsFailed);
    }

    const nextSummary = toSummary(data.thread);
    setThreads((prev) => [
      nextSummary,
      ...prev.filter((thread) => thread.id !== nextSummary.id),
    ]);
    setActiveThreadId(nextSummary.id);
    setActiveThreadMessages(data.thread.messages as UIMessage[]);
    setActiveThreadTasks(data.thread.tasks ?? []);
    setThreadLoadError(null);
    return nextSummary.id;
  }, [copy.loadingThreadsFailed]);

  const createAndSelectThread = useCallback(async () => {
    const nextId = await createThread();
    if (nextId) {
      syncThreadToUrl(nextId);
    }
    return nextId;
  }, [createThread, syncThreadToUrl]);

  const reloadThreads = useCallback(async () => {
    const response = await fetch("/api/chat/threads");
    const raw = await readJsonSafely(response);
    const data = parseWithSchema(chatThreadsListResponseSchema, raw);
    if (!response.ok || !data) {
      throw new Error(getApiErrorMessage(raw) ?? copy.loadingThreadsFailed);
    }

    setThreads(data.threads);
    setThreadLoadError(null);
    return data.threads;
  }, [copy.loadingThreadsFailed]);

  const persistThreadPatch = useCallback(
    async ({
      title,
      messages,
      tasks,
    }: {
      title?: string;
      messages?: UIMessage[];
      tasks?: ChatThreadTask[];
    }) => {
      if (!activeThreadId) return null;
      if (
        title === undefined &&
        messages === undefined &&
        tasks === undefined
      ) {
        return null;
      }

      const payload: Record<string, unknown> = {};

      if (title !== undefined) payload.title = title;
      if (messages !== undefined) payload.messages = messages;
      if (tasks !== undefined) payload.tasks = tasks;

      const response = await fetch(`/api/chat/threads/${activeThreadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = parseWithSchema(
        chatThreadResponseSchema,
        await readJsonSafely(response),
      );
      if (!response.ok || !data) return null;

      setActiveThreadMessages(data.thread.messages as UIMessage[]);
      setActiveThreadTasks(data.thread.tasks ?? []);
      setThreads((prev) => {
        const next = toSummary(data.thread);
        return [next, ...prev.filter((thread) => thread.id !== next.id)];
      });

      return data.thread;
    },
    [activeThreadId],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoadingThreads(true);
      setThreadLoadError(null);

      try {
        const [sessionResponse, listedThreads] = await Promise.all([
          fetch("/api/auth/me"),
          reloadThreads(),
        ]);

        if (cancelled) return;

        const sessionData = parseWithSchema(
          authMeResponseSchema,
          await readJsonSafely(sessionResponse),
        );
        const user = sessionData?.authenticated ? sessionData.user : null;
        setAuthenticated(Boolean(user));
        setSessionUser(user ?? null);

        const preferredThreadId = initialUrlThreadIdRef.current?.trim();
        if (
          preferredThreadId &&
          listedThreads.some((item) => item.id === preferredThreadId)
        ) {
          await loadThreadDetail(preferredThreadId);
          return;
        }

        if (listedThreads.length > 0) {
          await loadThreadDetail(listedThreads[0].id);
          return;
        }

        await createThread();
      } catch (error) {
        if (!cancelled) {
          setThreadLoadError(toThreadErrorMessage(error));
          setActiveThreadId(null);
          setActiveThreadMessages([]);
          setActiveThreadTasks([]);
          setAuthenticated(false);
          setSessionUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingThreads(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [createThread, loadThreadDetail, reloadThreads, toThreadErrorMessage]);

  useEffect(() => {
    if (loadingThreads) return;

    const targetThreadId = urlThreadId?.trim();
    if (!targetThreadId) return;
    if (targetThreadId === activeThreadId) return;

    if (!threads.some((item) => item.id === targetThreadId)) {
      if (activeThreadId) {
        syncThreadToUrl(activeThreadId);
      }
      return;
    }

    void loadThreadDetail(targetThreadId).catch((error) => {
      setThreadLoadError(toThreadErrorMessage(error));
    });
  }, [
    activeThreadId,
    loadThreadDetail,
    loadingThreads,
    syncThreadToUrl,
    threads,
    toThreadErrorMessage,
    urlThreadId,
  ]);

  useEffect(() => {
    setShareFeedback(null);
  }, [activeThreadId]);

  useEffect(() => {
    setCancellingTaskIds(new Set());
  }, [activeThreadId]);

  useEffect(() => {
    const timerMap = taskToastTimerIdsRef.current;
    return () => {
      for (const timerId of timerMap.values()) {
        window.clearTimeout(timerId);
      }
      timerMap.clear();
    };
  }, []);

  useEffect(() => {
    if (taskStatusThreadRef.current !== activeThreadId) {
      taskStatusThreadRef.current = activeThreadId;
      taskStatusSnapshotRef.current = new Map(
        activeThreadTasks.map((task) => [task.id, task.renderStatus]),
      );
      return;
    }

    const previousSnapshot = taskStatusSnapshotRef.current;
    const nextSnapshot = new Map<string, ChatThreadTask["renderStatus"]>();

    for (const task of activeThreadTasks) {
      nextSnapshot.set(task.id, task.renderStatus);

      const previousStatus = previousSnapshot.get(task.id);
      const currentStatus = task.renderStatus;
      const becameTerminal =
        (currentStatus === "succeeded" || currentStatus === "failed") &&
        (previousStatus === "queued" || previousStatus === "running");

      if (!becameTerminal) continue;

      const success = currentStatus === "succeeded";
      const summary = success ? copy.taskNotifySuccess : copy.taskNotifyFailed;
      const body = `${summary}: ${task.title}`;

      pushTaskToast({
        title: copy.taskNotifyTitle,
        message: body,
        tone: success ? "success" : "error",
      });
      showBrowserNotification(copy.taskNotifyTitle, body);
    }

    taskStatusSnapshotRef.current = nextSnapshot;
  }, [
    activeThreadId,
    activeThreadTasks,
    copy.taskNotifyFailed,
    copy.taskNotifySuccess,
    copy.taskNotifyTitle,
    pushTaskToast,
    showBrowserNotification,
  ]);

  const retryThreadBootstrap = useCallback(async () => {
    setLoadingThreads(true);
    setThreadLoadError(null);

    try {
      const listedThreads = await reloadThreads();
      if (listedThreads.length > 0) {
        await loadThreadDetail(listedThreads[0].id);
        syncThreadToUrl(listedThreads[0].id);
        return;
      }

      await createAndSelectThread();
    } catch (error) {
      setThreadLoadError(toThreadErrorMessage(error));
    } finally {
      setLoadingThreads(false);
    }
  }, [
    createAndSelectThread,
    loadThreadDetail,
    reloadThreads,
    syncThreadToUrl,
    toThreadErrorMessage,
  ]);

  const onPersistMessages = useCallback(
    async (messages: UIMessage[]) => {
      await persistThreadPatch({ messages });
    },
    [persistThreadPatch],
  );

  const onPersistTasks = useCallback(
    async (tasks: ChatThreadTask[]) => {
      await persistThreadPatch({ tasks });
    },
    [persistThreadPatch],
  );

  const renameThreadById = useCallback(
    async (threadId: string, title: string) => {
      const sanitized = title.trim();
      if (!sanitized) return;

      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sanitized }),
      });
      const raw = await readJsonSafely(response);
      const data = parseWithSchema(chatThreadResponseSchema, raw);
      if (!response.ok || !data) {
        throw new Error(getApiErrorMessage(raw) ?? copy.loadingThreadsFailed);
      }

      setThreads((prev) => {
        const next = toSummary(data.thread);
        return [next, ...prev.filter((thread) => thread.id !== next.id)];
      });

      if (activeThreadId === data.thread.id) {
        setActiveThreadMessages(data.thread.messages as UIMessage[]);
        setActiveThreadTasks(data.thread.tasks ?? []);
      }
    },
    [activeThreadId, copy.loadingThreadsFailed],
  );

  const deleteThreadById = useCallback(
    async (threadId: string) => {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: "DELETE",
      });
      const raw = await readJsonSafely(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(raw) ?? copy.loadingThreadsFailed);
      }

      const remainingThreads = threads.filter(
        (thread) => thread.id !== threadId,
      );
      setThreads(remainingThreads);

      if (activeThreadId !== threadId) {
        return;
      }

      setActiveThreadId(null);
      setActiveThreadMessages([]);
      setActiveThreadTasks([]);
      setShareFeedback(null);

      if (remainingThreads.length === 0) {
        const nextId = await createAndSelectThread();
        if (!nextId) {
          syncThreadToUrl(null);
        }
        return;
      }

      const nextThreadId = remainingThreads[0]?.id;
      if (!nextThreadId) {
        syncThreadToUrl(null);
        return;
      }

      await loadThreadDetail(nextThreadId);
      syncThreadToUrl(nextThreadId);
    },
    [
      activeThreadId,
      copy.loadingThreadsFailed,
      createAndSelectThread,
      loadThreadDetail,
      syncThreadToUrl,
      threads,
    ],
  );

  const onPlayCodeInPlayground = useCallback(
    (code: string) => {
      const sanitized = code.trim();
      if (!sanitized) return;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          PLAYGROUND_SEED_CODE_STORAGE_KEY,
          sanitized,
        );
      }
      router.push(localePath(locale, "/playground"));
    },
    [locale, router],
  );

  function onRequireSignIn(prompt: string) {
    setPendingPrompt(prompt);
    setShowSignInModal(true);
  }

  const runTask = useCallback(
    (taskId: string) => {
      const task = activeThreadTasks.find((item) => item.id === taskId);
      if (!task) return;

      ensureNotificationPermission();

      const timestamp = new Date().toISOString();
      const markQueued: ChatThreadTask[] = activeThreadTasks.map((item): ChatThreadTask =>
        item.id === taskId
          ? {
              ...item,
              renderStatus: "queued",
              renderError: undefined,
              renderOutput: undefined,
              updatedAt: timestamp,
            }
          : item,
      );
      setActiveThreadTasks(markQueued);
      void onPersistTasks(markQueued);

      void (async () => {
        try {
          const payload = createRenderRequestSchema.parse({
            title: task.title,
            code: task.code,
            quality: task.renderQuality ?? "preview",
          });

          const response = await fetch("/api/renders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await readJsonSafely(response);
          if (response.status === 402) {
            const message =
              getApiErrorMessage(data) ?? "1080p 任务需要升级订阅";
            const failed: ChatThreadTask[] = markQueued.map((item): ChatThreadTask =>
              item.id === taskId
                ? {
                    ...item,
                    renderStatus: "failed",
                    renderError: message,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            );
            setActiveThreadTasks(failed);
            await onPersistTasks(failed);
            return;
          }

          const parsed = parseWithSchema(
            createRenderSuccessResponseSchema,
            data,
          );
          if (!response.ok || !parsed) {
            throw new Error(getApiErrorMessage(data) ?? "创建渲染任务失败");
          }

          const withJob: ChatThreadTask[] = markQueued.map((item): ChatThreadTask =>
            item.id === taskId
              ? {
                  ...item,
                  renderJobId: parsed.job.id,
                  renderStatus: parsed.job.status,
                  renderError: undefined,
                  renderOutput: parsed.job.output,
                  renderLogs: parsed.job.logs,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          );

          setActiveThreadTasks(withJob);
          await onPersistTasks(withJob);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "渲染任务创建失败";
          const failed: ChatThreadTask[] = markQueued.map((item): ChatThreadTask =>
            item.id === taskId
              ? {
                  ...item,
                  renderStatus: "failed",
                  renderError: message,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          );

          setActiveThreadTasks(failed);
          await onPersistTasks(failed);
        }
      })();
    },
    [activeThreadTasks, ensureNotificationPermission, onPersistTasks],
  );

  const cancelQueuedTask = useCallback(
    (taskId: string) => {
      const task = activeThreadTasks.find((item) => item.id === taskId);
      if (!task) return;
      if (task.renderStatus !== "queued") return;
      if (!task.renderJobId) return;

      setCancellingTaskIds((previous) => {
        if (previous.has(taskId)) return previous;
        const next = new Set(previous);
        next.add(taskId);
        return next;
      });

      void (async () => {
        try {
          const response = await fetch(
            `/api/renders?id=${encodeURIComponent(task.renderJobId!)}`,
            {
              method: "DELETE",
            },
          );
          const raw = await readJsonSafely(response);
          const parsed = parseWithSchema(getRenderSuccessResponseSchema, raw);
          if (!response.ok || !parsed) {
            throw new Error(getApiErrorMessage(raw) ?? "取消任务失败");
          }

          const nextTasks: ChatThreadTask[] = activeThreadTasks.map((item): ChatThreadTask =>
            item.id === taskId
              ? {
                  ...item,
                  renderStatus: parsed.job.status,
                  renderError: parsed.job.error,
                  renderOutput: parsed.job.output,
                  renderLogs: parsed.job.logs,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          );

          setActiveThreadTasks(nextTasks);
          await onPersistTasks(nextTasks);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "取消任务失败";
          const nextTasks: ChatThreadTask[] = activeThreadTasks.map((item): ChatThreadTask =>
            item.id === taskId
              ? {
                  ...item,
                  renderError: message,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          );

          setActiveThreadTasks(nextTasks);
          await onPersistTasks(nextTasks);
        } finally {
          setCancellingTaskIds((previous) => {
            if (!previous.has(taskId)) return previous;
            const next = new Set(previous);
            next.delete(taskId);
            return next;
          });
        }
      })();
    },
    [activeThreadTasks, onPersistTasks],
  );

  const shareCurrentThread = useCallback(async () => {
    if (!activeThreadId) {
      setShareFeedback({
        kind: "error",
        message: copy.shareFailedNoTask,
      });
      return;
    }

    const hasCompletedTaskWithVideo = activeThreadTasks.some(
      (task) =>
        task.renderStatus === "succeeded" &&
        Boolean(task.renderOutput?.videoUrl),
    );
    if (!hasCompletedTaskWithVideo) {
      setShareFeedback({
        kind: "error",
        message: copy.shareFailedNoTask,
      });
      return;
    }

    if (sharingThread) return;

    setSharingThread(true);
    setShareFeedback(null);

    try {
      const response = await fetch("/api/animations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId }),
      });

      const raw = await readJsonSafely(response);
      const data = parseWithSchema(
        createAnimationShareSuccessResponseSchema,
        raw,
      );
      if (!response.ok || !data) {
        throw new Error(getApiErrorMessage(raw) ?? copy.shareFailedNoTask);
      }

      setShareFeedback({
        kind: "success",
        message: `${copy.shareSuccess} (#${data.item.slug.slice(0, 8)})`,
      });
    } catch (error) {
      setShareFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : copy.shareFailedNoTask,
      });
    } finally {
      setSharingThread(false);
    }
  }, [
    activeThreadId,
    activeThreadTasks,
    copy.shareFailedNoTask,
    copy.shareSuccess,
    sharingThread,
  ]);

  useEffect(() => {
    if (!activeThreadId) return;

    const pollingTargets = activeThreadTasks.filter(
      (task) =>
        task.renderJobId &&
        (task.renderStatus === "queued" || task.renderStatus === "running"),
    );

    if (pollingTargets.length === 0) return;

    let stopped = false;

    const poll = async () => {
      const updates = await Promise.all(
        pollingTargets.map(async (task) => {
          const response = await fetch(
            `/api/renders?id=${encodeURIComponent(task.renderJobId!)}`,
          );
          const data = parseWithSchema(
            getRenderSuccessResponseSchema,
            await readJsonSafely(response),
          );
          if (!response.ok || !data) return null;
          return {
            taskId: task.id,
            status: data.job.status,
            output: data.job.output,
            error: data.job.error,
            logs: data.job.logs,
          };
        }),
      );

      if (stopped) return;

      const map = new Map(
        updates.filter(Boolean).map((item) => [item!.taskId, item!]),
      );
      if (map.size === 0) return;

      let changed = false;
      const nextTasks: ChatThreadTask[] = activeThreadTasks.map((task): ChatThreadTask => {
        const next = map.get(task.id);
        if (!next) return task;

        const same =
          task.renderStatus === next.status &&
          task.renderError === next.error &&
          (task.renderLogs?.join("\n") ?? "") === next.logs.join("\n") &&
          JSON.stringify(task.renderOutput ?? null) ===
            JSON.stringify(next.output ?? null);

        if (same) return task;

        changed = true;
        return {
          ...task,
          renderStatus: next.status,
          renderError: next.error,
          renderOutput: next.output,
          renderLogs: next.logs,
          updatedAt: new Date().toISOString(),
        };
      });

      if (!changed) return;

      setActiveThreadTasks(nextTasks);
      await onPersistTasks(nextTasks);
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 1000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [activeThreadId, activeThreadTasks, onPersistTasks]);

  return (
    <SidebarProvider defaultOpen className="h-full">
      <div className="flex h-full w-full overflow-hidden">
        <h1 className="sr-only">{copy.pageTitle}</h1>

        <ThreadSidebar
          copy={copy}
          threads={threads}
          activeThreadId={activeThreadId}
          loadingThreads={loadingThreads}
          onNewThread={() => {
            void createAndSelectThread().catch((error) => {
              setThreadLoadError(toThreadErrorMessage(error));
            });
          }}
          onSelectThread={(threadId) => {
            void loadThreadDetail(threadId).catch((error) => {
              setThreadLoadError(toThreadErrorMessage(error));
            });
            syncThreadToUrl(threadId);
          }}
          onRenameThread={renameThreadById}
          onDeleteThread={deleteThreadById}
        />

        <SidebarInset className="relative bg-slate-50 dark:bg-slate-900">
          <SidebarRevealButton copy={copy} />
          <TaskToastStack notices={taskToasts} onDismiss={dismissTaskToast} />
          {loadingThreads || loadingThreadDetail ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              {copy.loadingThreads}
            </div>
          ) : threadLoadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="max-w-xl text-sm text-rose-600">
                {threadLoadError}
              </p>
              <Button
                variant="outline"
                onClick={() => void retryThreadBootstrap()}
              >
                {copy.retryLoadThreads}
              </Button>
            </div>
          ) : !activeThreadId ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              {copy.emptyHistory}
            </div>
          ) : (
            <ThreadChatPanel
              key={activeThreadId}
              locale={locale}
              copy={copy}
              threadId={activeThreadId}
              initialMessages={activeThreadMessages}
              initialPrompt={
                activeThreadMessages.length === 0 ? seedPrompt : ""
              }
              tasks={activeThreadTasks}
              authenticated={authenticated}
              queuedPrompt={pendingPrompt}
              onRequireSignIn={onRequireSignIn}
              onQueuedPromptConsumed={() => {
                setPendingPrompt("");
                setSeedPrompt("");
              }}
              onPersistMessages={onPersistMessages}
              onPlayCodeInPlayground={onPlayCodeInPlayground}
              onRunTask={runTask}
              onCancelQueuedTask={cancelQueuedTask}
              cancellingTaskIds={cancellingTaskIds}
              onShareThread={shareCurrentThread}
              sharingThread={sharingThread}
              canShareThread={activeThreadTasks.some(
                (task) =>
                  task.renderStatus === "succeeded" &&
                  Boolean(task.renderOutput?.videoUrl),
              )}
              shareFeedback={shareFeedback}
              userAvatarUrl={sessionUser?.avatarUrl}
              userAvatarLabel={userAvatarLabel}
              assistantAvatarLabel={assistantAvatarLabel}
            />
          )}
        </SidebarInset>

        <SignInModal
          open={showSignInModal}
          locale={locale}
          onClose={() => {
            setShowSignInModal(false);
            setPendingPrompt("");
          }}
          onSuccess={() => {
            setShowSignInModal(false);
            void (async () => {
              const response = await fetch("/api/auth/me");
              const sessionData = parseWithSchema(
                authMeResponseSchema,
                await readJsonSafely(response),
              );
              const user = sessionData?.authenticated ? sessionData.user : null;
              setAuthenticated(Boolean(user));
              setSessionUser(user ?? null);

              await reloadThreads();
            })().catch((error) => {
              setThreadLoadError(toThreadErrorMessage(error));
            });
          }}
        />
      </div>
    </SidebarProvider>
  );
}
