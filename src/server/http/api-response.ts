import { ApiError, getApiErrorResponse } from "@/server/http/api-error";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return Response.json(
    {
      ok: true,
      data,
    },
    init
  );
}

export function apiCreated<T>(data: T) {
  return apiOk(data, {
    status: 201,
  });
}

export function apiFail(error: unknown) {
  const response = getApiErrorResponse(error);

  return Response.json(response.body, {
    status: response.status,
  });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}
