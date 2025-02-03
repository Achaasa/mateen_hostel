// http-error.ts (updated)
export class HttpException extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// error-formatter.ts (new utility)
import { Prisma } from "@prisma/client";
import { HttpStatus } from "./http-status";

export const formatPrismaError = (error: unknown): HttpException => {
  // Handle Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const cleanMessage = (message: string) =>
      message
        .replace(/\\n/g, "\n")
        .replace(/\s+at\s+.*\.ts:\d+:\d+/g, "")
        .replace(/Invocation:\n\n/, "")
        .trim();

    switch (error.code) {
      case "P2002":
        const fields = error.meta?.target
          ? (error.meta.target as string[]).join(", ")
          : "field";
        return new HttpException(
          HttpStatus.CONFLICT,
          `Duplicate entry: The ${fields} already exists.`
        );

      case "P2025":
        return new HttpException(
          HttpStatus.NOT_FOUND,
          "Record not found: The requested resource does not exist."
        );

      case "P2003":
        return new HttpException(
          HttpStatus.BAD_REQUEST,
          "Invalid reference: Related resource not found."
        );

      default:
        return new HttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Database error: ${cleanMessage(error.message)}`
        );
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const cleanMessage =
      error.message
        .split("\n")
        .find((line) => line.includes("Argument"))
        ?.replace(/Error: /, "") || "Invalid request format";

    return new HttpException(
      HttpStatus.BAD_REQUEST,
      `Validation error: ${cleanMessage}`
    );
  }

  // Handle other Prisma errors
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new HttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Database connection error. Please try again later."
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  }

  // Fallback for unknown errors
  return new HttpException(
    HttpStatus.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred."
  );
};
