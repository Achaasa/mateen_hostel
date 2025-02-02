import { Prisma } from "@prisma/client";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";

export const formatPrismaError = (error: unknown): HttpException => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new HttpException(
          HttpStatus.CONFLICT,
          "Duplicate entry: A record with this value already exists."
        );
      case "P2025":
        return new HttpException(
          HttpStatus.NOT_FOUND,
          "Record not found: The requested resource does not exist."
        );
      case "P2003":
        return new HttpException(
          HttpStatus.BAD_REQUEST,
          "Invalid reference: The related resource does not exist."
        );
      case "P2014":
        return new HttpException(
          HttpStatus.BAD_REQUEST,
          "Invalid operation: This change would violate a required relation."
        );
      default:
        return new HttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Database error: ${error.message}`
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new HttpException(
      HttpStatus.BAD_REQUEST,
      "Validation error: Ensure all required fields are provided with valid values."
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new HttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Database connection error: Unable to connect to the database."
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new HttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Unexpected database error: Prisma encountered a critical issue."
    );
  }

  // Custom handling for invalid findUnique() query (undefined ID)
  if (
    error instanceof Prisma.PrismaClientUnknownRequestError &&
    error.message.includes("Invalid `prisma.amenities.findUnique()` invocation")
  ) {
    return new HttpException(
      HttpStatus.BAD_REQUEST,
      "Invalid query: The provided ID is undefined. Ensure a valid ID is passed."
    );
  }

  // Default case for unknown errors
  return error instanceof HttpException
    ? error
    : new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
};
