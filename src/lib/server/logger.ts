type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function sanitize(fields: LogFields): LogFields {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

export function logServerEvent(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(fields),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

