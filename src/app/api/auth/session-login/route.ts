import { NextResponse } from "next/server";
import https from "node:https";

import { JWT } from "google-auth-library";
import { HttpsProxyAgent } from "https-proxy-agent";

import { sessionLoginRequestSchema, type SessionLoginSuccessResponse } from "@/contracts/auth";
import { getSessionCookieSettings } from "@/lib/auth/session";
import { hasFirebaseAdminConfig } from "@/lib/firebase/admin";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

type SessionCookieResponse = {
  sessionCookie?: string;
  error?: {
    message?: string;
  };
};

function getProxyAgent() {
  const proxyUrl =
    process.env.HTTPS_PROXY?.trim() ||
    process.env.https_proxy?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.http_proxy?.trim();

  if (!proxyUrl) return undefined;
  return new HttpsProxyAgent(proxyUrl);
}

async function postJsonWithHttps(input: { url: string; body: object; headers: Record<string, string> }) {
  const { url, body, headers } = input;

  return new Promise<{ status: number; data: unknown }>((resolve, reject) => {
    const bodyText = JSON.stringify(body);
    const parsedUrl = new URL(url);
    const request = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || undefined,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        agent: getProxyAgent(),
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyText).toString(),
        },
      },
      (response) => {
        let text = "";
        response.on("data", (chunk) => {
          text += chunk.toString();
        });
        response.on("end", () => {
          const status = response.statusCode ?? 500;
          try {
            resolve({ status, data: text ? JSON.parse(text) : null });
          } catch {
            resolve({ status, data: null });
          }
        });
      },
    );

    request.setTimeout(30_000, () => {
      request.destroy(new Error("identitytoolkit_request_timeout"));
    });
    request.on("error", reject);
    request.write(bodyText);
    request.end();
  });
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) return {};
  try {
    const payload = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function createSessionCookieViaIdentityToolkit(input: { idToken: string; expiresInMs: number }) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin 未配置，无法创建服务端会话");
  }

  const jwt = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/identitytoolkit"],
  });
  const tokenResult = await jwt.getAccessToken();
  const accessToken = typeof tokenResult === "string" ? tokenResult : tokenResult?.token;
  if (!accessToken) {
    throw new Error("无法获取 Google Access Token");
  }

  const validDuration = Math.floor(input.expiresInMs / 1000);
  const result = await postJsonWithHttps({
    url: `https://identitytoolkit.googleapis.com/v1/projects/${projectId}:createSessionCookie`,
    body: {
      idToken: input.idToken,
      validDuration,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = result.data as SessionCookieResponse | null;
  if (result.status >= 400 || !payload?.sessionCookie) {
    const message = payload?.error?.message || "创建会话失败";
    throw new Error(message);
  }

  const decoded = parseJwtPayload(input.idToken);
  const uid = String(decoded.user_id ?? decoded.sub ?? "").trim();
  if (!uid) {
    throw new Error("无效的 Firebase ID Token");
  }

  return {
    sessionCookie: payload.sessionCookie,
    user: {
      uid,
      email: typeof decoded.email === "string" ? decoded.email : null,
      name: typeof decoded.name === "string" ? decoded.name : null,
      avatarUrl: typeof decoded.picture === "string" ? decoded.picture : null,
    },
  };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `session_login:${ip}`,
    max: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "登录请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 20),
      },
    );
  }

  if (!hasFirebaseAdminConfig) {
    return NextResponse.json(
      { error: "Firebase Admin 未配置，无法创建服务端会话" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateBody(sessionLoginRequestSchema, body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { idToken } = validated.data;

  try {
    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const { sessionCookie, user } = await createSessionCookieViaIdentityToolkit({ idToken, expiresInMs: expiresIn });

    const payload: SessionLoginSuccessResponse = {
      ok: true,
      user,
    };
    const response = NextResponse.json(payload);

    response.cookies.set({
      ...getSessionCookieSettings(),
      value: sessionCookie,
    });

    response.headers.set("X-RateLimit-Limit", "20");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
    response.headers.set("Retry-After", String(rateLimit.retryAfterSec));
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建会话失败",
      },
      { status: 401 },
    );
  }
}
