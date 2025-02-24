
import { Prisma } from "@prisma/client";
import { HttpStatus } from "./http-status";
import  HttpException  from "./http-error";

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
    const lines = error.message.split("\n").map(line => line.trim());

    // Look for the specific error explanation with field context
    const errorDetail = lines.find(line => 
      line.includes("needs at least one") || 
      line.includes("is missing") || 
      line.includes("is invalid")
    );

    if (errorDetail) {
      // Extract the field name (e.g., `where`)
      const fieldMatch = errorDetail.match(/Argument `([^`]+)`/) || [];
      const fieldName = fieldMatch[1] || "unknown field";

      // Extract the specific required fields (e.g., `hostelId` or others)
      const requiredFieldsMatch = errorDetail.match(/needs at least one of ([^.]+)/);
      let requiredFields = "required arguments";
      if (requiredFieldsMatch && requiredFieldsMatch[1]) {
        // Parse the fields listed between "needs at least one of" and the next period
        requiredFields = requiredFieldsMatch[1]
          .trim()
          .split(/` or `/)
          .map(field => field.replace(/`/g, "").trim())
          .filter(Boolean)
          .join(" or ");
      }

      // Construct a clear message
      if (fieldName !== "unknown field" && requiredFields !== "required arguments") {
        return new HttpException(
          HttpStatus.BAD_REQUEST,
          `Validation error: The \`${fieldName}\` field requires at least one of: ${requiredFields}.`
        );
      }

      // Fallback if we can't parse fields properly
      const cleanMessage = errorDetail
        .replace(/.*invocation in [^:]+:\d+:\d+\s*/, "") // Remove file path
        .replace(/Available options are marked with \?.*/, "") // Remove extra hints
        .replace(/Argument `[^`]+` of type \S+/, "") // Remove type info
        .trim();

      return new HttpException(
        HttpStatus.BAD_REQUEST,
        `Validation error: ${cleanMessage}`
      );
    }

    // Fallback to a concise version of the message
    const cleanMessage = lines
      .filter(line => 
        !line.includes("invocation in") && 
        !line.startsWith("→") && 
        line.length > 0
      )
      .join(" ")
      .trim() || "Invalid request format";

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