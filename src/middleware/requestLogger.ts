import type { NextFunction, Request, Response } from "express";

function errorText(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const record = body as { error?: unknown; message?: unknown };
  const text = typeof record.error === "string" ? record.error : typeof record.message === "string" ? record.message : "";
  return text.replace(/\s+/g, " ").slice(0, 180);
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  const sendJson = res.json.bind(res);

  res.json = (body: unknown) => {
    res.locals.responseBody = body;
    return sendJson(body);
  };

  res.on("finish", () => {
    const status = res.statusCode;
    const failed = status >= 400;
    const type = failed ? "ERROR" : "SUCCESS";
    const stored = res.locals.errorMessage;
    const detail = failed
      ? (typeof stored === "string" && stored ? stored.replace(/\s+/g, " ").slice(0, 180) : errorText(res.locals.responseBody))
      : "";
    const line = `[${type}] ${req.method} ${req.originalUrl} ${status} ${Date.now() - started}ms${detail ? ` ${detail}` : ""}`;

    if (failed) console.error(line);
    else console.log(line);
  });

  next();
}
