import type { NextFunction, Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: "Not found",
    error: "Not found",
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  res.locals.errorMessage = message;

  if (res.headersSent) return;

  const production = process.env.NODE_ENV === "production";
  const publicMessage = production ? "Something went wrong" : message;

  res.status(500).json({
    success: false,
    message: publicMessage,
    error: publicMessage,
  });
}
