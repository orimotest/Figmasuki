export type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, details?: unknown): void {
  const payload = details === undefined ? message : [message, details];
  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.info(payload);
}
