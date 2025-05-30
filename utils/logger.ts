export function logWithTimestamp(level: "info" | "error", ...args: any[]) {
  const now = new Date();
  const timestamp = now.toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}