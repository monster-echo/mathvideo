import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, generateText, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { chatStreamRequestSchema } from "@/contracts/chat";
import { getSessionUser } from "@/lib/auth/session";
import { upsertChatThreadMessages } from "@/lib/server/chat-threads";
import { logServerEvent } from "@/lib/server/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

const deepseekApiKey = process.env.DEEPSEEK_API_KEY?.trim();
const deepseekBaseUrl = process.env.DEEPSEEK_API_BASE_URL?.trim() || "https://api.deepseek.com/v1";
const deepseekModel = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
const customSystemPrompt = process.env.DEEPSEEK_SYSTEM_PROMPT?.trim();
const deepseek = deepseekApiKey
  ? createOpenAI({
      name: "deepseek",
      apiKey: deepseekApiKey,
      baseURL: deepseekBaseUrl,
    })
  : null;

const defaultChatSystemPrompt = `
You are AnimG's senior math animation copilot.

Primary objective:
- Convert user intent into production-ready Manim Python code.

Hard rules:
- Reply in the same language as the latest user message.
- Always output these two sections in order:
  1) Report
  2) Python code
- The Python section must contain exactly one \`\`\`python code block.
- The code must be runnable Manim Community code, include imports, and include at least one class that extends Scene.
- Do not output pseudo-code. Do not use placeholders like TODO/...
- Keep animations deterministic and concise (clear timing, clean structure, maintainable naming).
- If user request is ambiguous, make minimal reasonable assumptions and state them briefly in Report.

Output format:
## Report
- Objective: ...
- Visual plan: ...
- Timing: ...
- Notes: ...

\`\`\`python
# runnable manim code
\`\`\`
`;
const chatSystemPrompt = customSystemPrompt || defaultChatSystemPrompt;

function getOwnerKey(request: Request, uid?: string) {
  if (uid) return `user:${uid}`;
  return `guest:${getClientIp(request)}`;
}

function extractMessageText(message: UIMessage | undefined): string {
  if (!message || !Array.isArray(message.parts)) return "";
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? String(part.text ?? "") : ""))
    .join(" ")
    .trim();
}

function shouldGenerateThreadTitleOnFirstTurn(messages: UIMessage[]): boolean {
  const userCount = messages.filter((message) => message.role === "user").length;
  const assistantCount = messages.filter((message) => message.role === "assistant").length;
  return userCount === 1 && assistantCount === 0;
}

function containsChinese(text: string): boolean {
  return /[\u4E00-\u9FFF]/u.test(text);
}

function normalizeChineseTeachingTitle(text: string): string {
  let next = text
    .replace(/\s+/gu, "")
    .replace(/[“”"'`《》【】[\]（）()<>]/gu, "")
    .replace(/[，。！？、；：,.!?;:]/gu, "")
    .trim();

  if (!next) {
    next = "数学动画概念可视化教学演示";
  }

  const hasTeachingTone = /(讲解|教学|可视化|推导|证明|示例|入门|演示)/u.test(next);
  if (!hasTeachingTone) {
    next += "讲解";
  }

  if (next.length < 12) {
    next += "教学演示";
  }

  if (next.length < 12) {
    next += "示例";
  }

  if (next.length > 18) {
    next = next.slice(0, 18);
  }

  return next;
}

function sanitizeThreadTitle(raw: string, fallbackSeed: string): string | null {
  const withoutQuotes = raw.trim().replace(/^["'`]+|["'`]+$/g, "");
  const firstLine = withoutQuotes.split(/\r?\n/u)[0]?.trim() ?? "";
  const candidate = firstLine || fallbackSeed;
  if (!candidate) return null;

  if (containsChinese(candidate)) {
    return normalizeChineseTeachingTitle(candidate);
  }

  return candidate.length > 80 ? `${candidate.slice(0, 80)}…` : candidate;
}

async function generateThreadTitleFromMessages(
  model: ReturnType<NonNullable<typeof deepseek>["chat"]>,
  messages: UIMessage[],
): Promise<string | null> {
  const pairs = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => {
      const role = message.role === "user" ? "User" : "Assistant";
      const text = extractMessageText(message);
      return text ? `${role}: ${text}` : "";
    })
    .filter((line) => line.length > 0)
    .slice(0, 6);

  if (pairs.length === 0) return null;

  const fallbackSeed = pairs
    .map((line) => line.replace(/^(User|Assistant):\s*/u, "").trim())
    .find((line) => line.length > 0);

  const prompt = `
You are AnimG's thread title writer for a teaching-focused math animation product.

Generate one high-quality title for this conversation.

Hard rules:
- Return title text only, no markdown and no quotes.
- Use the same language as the user's latest message.
- If the title is Chinese, keep it to 12-18 Chinese characters.
- Prefer teaching-style phrasing (e.g. explain, visualize, derive, prove, lesson/demo).
- Avoid generic names like "新线程", "数学动画", or "Untitled".
- Make it specific to the current topic.

Style references:
- 勾股定理可视化证明讲解课
- 梯度下降收敛过程直观教学
- 矩阵乘法几何意义可视化示例

Conversation:
${pairs.join("\n")}
`;

  const result = await generateText({
    model,
    prompt,
    temperature: 0.2,
  });

  return sanitizeThreadTitle(String(result.text ?? ""), fallbackSeed ?? "");
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);
  const ip = getClientIp(request);

  const rateLimit = checkRateLimit({
    key: `chat:${ownerKey}:${ip}`,
    max: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 30),
      },
    );
  }

  if (!deepseek) {
    return NextResponse.json(
      { error: "LLM 未配置：缺少 DEEPSEEK_API_KEY" },
      {
        status: 503,
        headers: getRateLimitHeaders(rateLimit, 30),
      },
    );
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(chatStreamRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const messages = validated.data.messages as UIMessage[];
  const threadId = validated.data.threadId ?? validated.data.id ?? crypto.randomUUID();
  const latestUserMessage = [...messages].reverse().find((item) => item.role === "user");
  const userPrompt = extractMessageText(latestUserMessage);
  const shouldGenerateTitle = shouldGenerateThreadTitleOnFirstTurn(messages);

  if (!userPrompt) {
    return NextResponse.json({ error: "缺少用户输入内容" }, { status: 400 });
  }

  try {
    const result = streamText({
      model: deepseek.chat(deepseekModel),
      system: chatSystemPrompt,
      messages: await convertToModelMessages(messages),
      onError: ({ error }) => {
        logServerEvent("warn", "chat_llm_stream_error", {
          ownerKey,
          threadId,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      headers: getRateLimitHeaders(rateLimit, 30),
      onFinish: async ({ messages: updatedMessages }) => {
        try {
          let generatedTitle: string | undefined;
          if (shouldGenerateTitle) {
            try {
              const nextTitle = await generateThreadTitleFromMessages(
                deepseek.chat(deepseekModel),
                updatedMessages,
              );
              if (nextTitle) {
                generatedTitle = nextTitle;
              }
            } catch (error) {
              logServerEvent("warn", "chat_thread_title_generate_failed", {
                ownerKey,
                threadId,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          await upsertChatThreadMessages({
            ownerKey,
            threadId,
            messages: updatedMessages,
            title: generatedTitle,
            suggestedTitle: userPrompt,
          });
        } catch (error) {
          logServerEvent("error", "chat_thread_persist_failed", {
            ownerKey,
            threadId,
            error: error instanceof Error ? error.message : "unknown_error",
          });
          throw error;
        }
      },
      onError: () => "LLM 请求失败，请稍后重试。",
    });
  } catch (error) {
    logServerEvent("error", "chat_llm_request_failed", {
      ownerKey,
      threadId,
      model: deepseekModel,
      baseUrl: deepseekBaseUrl,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "LLM 请求失败" },
      {
        status: 502,
        headers: getRateLimitHeaders(rateLimit, 30),
      },
    );
  }
}
