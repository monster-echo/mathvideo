import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { playgroundOptimizeRequestSchema } from "@/contracts/playground-optimize";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

const deepseekApiKey = process.env.DEEPSEEK_API_KEY?.trim();
const deepseekBaseUrl = process.env.DEEPSEEK_API_BASE_URL?.trim() || "https://api.deepseek.com/v1";
const deepseekModel = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";

const deepseek = deepseekApiKey
  ? createOpenAI({
      name: "deepseek",
      apiKey: deepseekApiKey,
      baseURL: deepseekBaseUrl,
    })
  : null;

function extractPythonCodeBlocks(text: string): string[] {
  const blocks: string[] = [];
  const regex = /```(?:python|py)?\s*([\s\S]*?)```/gi;

  let match = regex.exec(text);
  while (match) {
    const code = String(match[1] ?? "").trim();
    if (code.length > 0) {
      blocks.push(code);
    }
    match = regex.exec(text);
  }

  return blocks;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `playground:optimize:${ip}`,
    max: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 20),
      },
    );
  }

  if (!deepseek) {
    return NextResponse.json(
      { error: "LLM 未配置：缺少 DEEPSEEK_API_KEY" },
      { status: 503, headers: getRateLimitHeaders(rateLimit, 20) },
    );
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(playgroundOptimizeRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const historyText = validated.data.history
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}:\n${item.content}`)
    .join("\n\n");

  const prompt = `
You are a senior Manim code reviewer and optimizer.

Conversation history:
${historyText || "(none)"}

Current Python code:
\`\`\`python
${validated.data.code}
\`\`\`

User optimization request:
${validated.data.instruction}

Rules:
- Reply in the same language as the latest user request.
- Keep changes deterministic and runnable in Manim Community.
- Preserve intent but improve clarity, animation timing, and structure.
- Output exactly:
  1) A short explanation section
  2) Exactly one python fenced code block with full runnable code.
`;

  try {
    const result = await generateText({
      model: deepseek.chat(deepseekModel),
      prompt,
      temperature: 0.2,
    });

    const text = String(result.text ?? "").trim();
    const blocks = extractPythonCodeBlocks(text);
    const optimizedCode = blocks[0]?.trim();

    if (!optimizedCode) {
      return NextResponse.json(
        {
          error: "模型返回中缺少可解析的 Python 代码块，请重试。",
        },
        {
          status: 502,
          headers: getRateLimitHeaders(rateLimit, 20),
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        reply: text,
        optimizedCode,
      },
      {
        headers: getRateLimitHeaders(rateLimit, 20),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "代码优化请求失败";
    return NextResponse.json(
      { error: message },
      {
        status: 502,
        headers: getRateLimitHeaders(rateLimit, 20),
      },
    );
  }
}
