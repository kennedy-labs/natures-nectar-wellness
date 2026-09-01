import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getApiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 422,
      body: {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The submitted data is invalid.",
          issues: error.issues,
        },
      },
    };
  }

  console.error("UNHANDLED SERVER ERROR:");
  console.error(error);

  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong.",
      },
    },
  };
}