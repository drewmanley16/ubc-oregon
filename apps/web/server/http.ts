// LANE C. Uniform JSON error shape (ApiError in @sway/shared).
export const apiError = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export const notImplemented = (what: string) => apiError(501, "NOT_IMPLEMENTED", `${what} — TODO(lane-C)`);
