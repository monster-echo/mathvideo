"use client";

import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils/cn";

type ChatMarkdownProps = {
  content: string;
  className?: string;
  collapseCodeBlocks?: boolean;
  codeBlockHint?: string;
  codeRunLabel?: string;
  onRunCodeBlock?: (payload: { code: string; language: string }) => void;
};

function extractCodeLanguageRaw(children: ReactNode): string {
  const firstChild =
    Array.isArray(children) && children.length > 0
      ? children[0]
      : !Array.isArray(children)
        ? children
        : null;

  if (!firstChild || typeof firstChild !== "object") return "";
  const codeProps = "props" in firstChild ? (firstChild.props as { className?: unknown } | undefined) : undefined;
  const className = typeof codeProps?.className === "string" ? codeProps.className : "";
  return (
    className
      .split(" ")
      .find((item) => item.startsWith("language-"))
      ?.replace("language-", "")
      .trim()
      .toLowerCase() ?? ""
  );
}

function reactNodeToText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node === null || node === undefined || typeof node === "boolean") return "";

  if (Array.isArray(node)) {
    return node.map((item) => reactNodeToText(item)).join("");
  }

  if (typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode } | undefined;
    return reactNodeToText(props?.children);
  }

  return "";
}

function extractCodeBlock(children: ReactNode): { language: string; label: string; code: string } {
  const language = extractCodeLanguageRaw(children);
  const label = language ? language.toUpperCase() : "";
  const raw = reactNodeToText(children);
  const code = raw.replace(/\n$/, "");

  return {
    language: language || "text",
    label,
    code,
  };
}

function buildMarkdownComponents(options: {
  collapseCodeBlocks: boolean;
  codeBlockHint: string;
  codeRunLabel: string;
  onRunCodeBlock?: (payload: { code: string; language: string }) => void;
}): Components {
  return {
    h1: ({ className, ...props }) => <h1 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />,
    h2: ({ className, ...props }) => <h2 className={cn("text-base font-semibold tracking-tight", className)} {...props} />,
    h3: ({ className, ...props }) => <h3 className={cn("text-sm font-semibold", className)} {...props} />,
    p: ({ className, ...props }) => <p className={cn("whitespace-pre-wrap", className)} {...props} />,
    ul: ({ className, ...props }) => <ul className={cn("ml-5 list-disc space-y-1", className)} {...props} />,
    ol: ({ className, ...props }) => <ol className={cn("ml-5 list-decimal space-y-1", className)} {...props} />,
    li: ({ className, ...props }) => <li className={cn("pl-1", className)} {...props} />,
    a: ({ className, ...props }) => (
      <a
        className={cn(
          "font-medium text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
          className,
        )}
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn("border-l-2 border-slate-300 pl-3 text-slate-600 dark:border-slate-700 dark:text-slate-300", className)}
        {...props}
      />
    ),
    table: ({ className, ...props }) => (
      <div className="my-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className={cn("w-full min-w-[380px] border-collapse text-left text-xs", className)} {...props} />
      </div>
    ),
    thead: ({ className, ...props }) => <thead className={cn("bg-slate-100 dark:bg-slate-800", className)} {...props} />,
    th: ({ className, ...props }) => <th className={cn("px-3 py-2 font-semibold text-slate-700 dark:text-slate-200", className)} {...props} />,
    td: ({ className, ...props }) => <td className={cn("border-t border-slate-200 px-3 py-2 dark:border-slate-700", className)} {...props} />,
    hr: ({ className, ...props }) => <hr className={cn("my-2 border-slate-200 dark:border-slate-700", className)} {...props} />,
    pre: ({ className, children, ...props }) => {
      const block = extractCodeBlock(children);
      const canRunCode = typeof options.onRunCodeBlock === "function";

      if (!options.collapseCodeBlocks) {
        return (
          <div
            className={cn(
              "animg-code-scroll-hidden relative my-2 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900 px-4 py-3 text-[13px] leading-6 text-slate-100",
              className,
            )}
            {...props}
          >
            {canRunCode ? (
              <button
                type="button"
                onClick={() => options.onRunCodeBlock?.({ code: block.code, language: block.language })}
                className="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-md border border-slate-600 bg-slate-800/90 px-2 text-[11px] font-medium text-slate-100 transition-colors hover:border-blue-500 hover:text-blue-300"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {options.codeRunLabel}
              </button>
            ) : null}
            <SyntaxHighlighter
              language={block.language}
              style={oneDark}
              PreTag="div"
              customStyle={{ margin: 0, padding: canRunCode ? "22px 0 0 0" : 0, background: "transparent" }}
              codeTagProps={{ className: "font-mono text-[13px] leading-6" }}
            >
              {block.code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <details className="my-2 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 text-slate-100">
          <summary className="flex cursor-pointer select-none items-center justify-between gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white">
            <span>
              {options.codeBlockHint}
              {block.label ? ` · ${block.label}` : ""}
            </span>
            {canRunCode ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  options.onRunCodeBlock?.({ code: block.code, language: block.language });
                }}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-600 bg-slate-800/90 px-2 text-[11px] font-medium text-slate-100 transition-colors hover:border-blue-500 hover:text-blue-300"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {options.codeRunLabel}
              </button>
            ) : null}
          </summary>
          <div
            className={cn(
              "animg-code-scroll-hidden overflow-x-auto border-t border-slate-700/80 px-4 py-3",
              className,
            )}
            {...props}
          >
            <SyntaxHighlighter
              language={block.language}
              style={oneDark}
              PreTag="div"
              customStyle={{ margin: 0, padding: 0, background: "transparent" }}
              codeTagProps={{ className: "font-mono text-[13px] leading-6" }}
            >
              {block.code}
            </SyntaxHighlighter>
          </div>
        </details>
      );
    },
    code: ({ className, children, ...props }) => {
      const languageClass = className?.split(" ").find((item) => item.startsWith("language-"));
      const isCodeBlock = Boolean(languageClass);

      if (isCodeBlock) {
        return (
          <code className={cn("font-mono text-[13px] leading-6 text-slate-100", className)} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code
          className={cn(
            "rounded-md bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 dark:bg-slate-700/80 dark:text-slate-100",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
  };
}

export function ChatMarkdown({
  content,
  className,
  collapseCodeBlocks = false,
  codeBlockHint = "Click to expand code",
  codeRunLabel = "Play",
  onRunCodeBlock,
}: ChatMarkdownProps) {
  const components = buildMarkdownComponents({
    collapseCodeBlocks,
    codeBlockHint,
    codeRunLabel,
    onRunCodeBlock,
  });

  return (
    <div className={cn("space-y-3 break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
