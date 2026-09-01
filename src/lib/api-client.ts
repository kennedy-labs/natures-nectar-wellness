type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiValidationIssue = {
  path: Array<string | number>;
  message: string;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    issues?: ApiValidationIssue[];
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  code: string;
  issues?: ApiValidationIssue[];

  constructor(
    code: string,
    message: string,
    issues?: ApiValidationIssue[]
  ) {
    super(message);

    this.name = "ApiClientError";
    this.code = code;
    this.issues = issues;
  }
}

export async function readApiData<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(`Invalid JSON response (status ${response.status})`);
  }

  if (!body || typeof body !== "object") {
    throw new Error(`Unexpected response format (status ${response.status})`);
  }

  const typed = body as ApiResponse<T>;

  if (!response.ok) {
    const error =
      "error" in typed ? typed.error : undefined;

    
    throw new ApiClientError(
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? `Request failed (status ${response.status})`,
      error?.issues
    );
  }

  if (typed.ok === true) {
    return typed.data;
  }

  throw new Error(`Invalid API response structure (status ${response.status})`);
}