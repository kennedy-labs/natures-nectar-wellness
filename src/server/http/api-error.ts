import { Prisma } from "@prisma/client";
import { ZodError, type ZodIssue } from "zod";

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

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  benefits: "Wellness benefits",
  usageInstructions: "Usage instructions",
  ingredients: "Ingredients",
  price: "Price (KES)",
  stockQuantity: "Stock quantity",
  image: "Photo",
  categoryId: "Category",
  customerName: "Full name",
  customerPhone: "Phone number",
  customerEmail: "Email address",
  deliveryLocation: "Delivery location",
};

function formatFieldLabel(path: ReadonlyArray<PropertyKey>): string {
  const firstSegment = path[0];
  if (typeof firstSegment !== "string") return "Field";
  if (FIELD_LABELS[firstSegment]) return FIELD_LABELS[firstSegment];
  return firstSegment
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatZodIssueMessage(issue: ZodIssue): string {
  const label = formatFieldLabel(issue.path);
  const rawMessage = issue.message;

  // If the schema already provided a tailored sentence referencing the field, keep it.
  if (
    rawMessage.toLowerCase().startsWith(label.toLowerCase()) ||
    rawMessage.startsWith("Please ") ||
    rawMessage.startsWith("Image ") ||
    rawMessage.startsWith("Must ")
  ) {
    return rawMessage;
  }

  return `${label}: ${rawMessage}`;
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
    const formattedIssues = error.issues.map((issue) => ({
      path: issue.path.filter(
        (segment): segment is string | number =>
          typeof segment === "string" || typeof segment === "number"
      ),
      label: formatFieldLabel(issue.path),
      message: formatZodIssueMessage(issue),
    }));

    const uniqueMessages = Array.from(
      new Set(formattedIssues.map((item) => item.message))
    );

    return {
      status: 422,
      body: {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            uniqueMessages.length > 0
              ? uniqueMessages.join(" • ")
              : "The submitted data is invalid.",
          issues: formattedIssues,
        },
      },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        status: 409,
        body: {
          ok: false,
          error: {
            code: "DUPLICATE_RECORD",
            message:
              "An item with that name or identifier already exists. Please use a slightly different name.",
          },
        },
      };
    }

    if (error.code === "P2003") {
      return {
        status: 400,
        body: {
          ok: false,
          error: {
            code: "INVALID_REFERENCE",
            message:
              "The selected category or linked record could not be found. Refresh the page and try again.",
          },
        },
      };
    }

    if (error.code === "P2025") {
      return {
        status: 404,
        body: {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "The requested item no longer exists.",
          },
        },
      };
    }
  }

  console.error("UNHANDLED SERVER ERROR:");
  console.error(error);

  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong on the server. Please try again.",
      },
    },
  };
}