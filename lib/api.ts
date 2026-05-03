import { NextResponse } from "next/server";

type ApiPayload = Record<string, unknown>;

export function apiOk(payload: ApiPayload = {}, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...payload,
    },
    { status }
  );
}

export function apiError(
  error: string,
  status = 500,
  payload: ApiPayload = {}
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...payload,
    },
    { status }
  );
}

export function apiBadRequest(error = "Bad request.", payload: ApiPayload = {}) {
  return apiError(error, 400, payload);
}

export function apiUnauthorized(error = "Unauthorized.", payload: ApiPayload = {}) {
  return apiError(error, 401, payload);
}

export function apiNotFound(error = "Not found.", payload: ApiPayload = {}) {
  return apiError(error, 404, payload);
}

export function apiTooManyRequests(
  error = "Too many requests.",
  payload: ApiPayload = {}
) {
  return apiError(error, 429, payload);
}

export function apiServerError(
  error = "Something went wrong.",
  payload: ApiPayload = {}
) {
  return apiError(error, 500, payload);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
