"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPrismaError = void 0;
// error-formatter.ts
const client_1 = require("@prisma/client");
const http_status_1 = require("./http-status");
const http_error_1 = __importDefault(require("./http-error"));
const formatPrismaError = (error) => {
    var _a, _b;
    // Handle Prisma known errors
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const cleanMessage = (message) => message
            .replace(/\\n/g, "\n")
            .replace(/\s+at\s+.*\.ts:\d+:\d+/g, "")
            .replace(/Invocation:\n\n/, "")
            .trim();
        switch (error.code) {
            case "P2002": {
                const fields = ((_a = error.meta) === null || _a === void 0 ? void 0 : _a.target)
                    ? error.meta.target.join(", ")
                    : "field";
                return new http_error_1.default(http_status_1.HttpStatus.CONFLICT, `Duplicate entry: The ${fields} already exists.`);
            }
            case "P2025":
                return new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Record not found: The requested resource does not exist.");
            case "P2003": {
                // Extracting the specific field that caused the error
                const field = ((_b = error.meta) === null || _b === void 0 ? void 0 : _b.field_name) || "unknown field";
                return new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Invalid reference: The provided value for '${field}' does not exist.`);
            }
            default:
                return new http_error_1.default(http_status_1.HttpStatus.INTERNAL_SERVER_ERROR, `Database error: ${cleanMessage(error.message)}`);
        }
    }
    // Handle Prisma validation errors
    if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        const lines = error.message.split("\n").map((line) => line.trim());
        // Look for specific error explanation
        const errorDetail = lines.find((line) => line.includes("needs at least one") ||
            line.includes("is missing") ||
            line.includes("is invalid") ||
            line.includes("Unknown argument"));
        if (errorDetail) {
            // Handle "Unknown argument" case
            const unknownArgMatch = errorDetail.match(/Unknown argument `([^`]+)`. Did you mean `([^`]+)`?/);
            if (unknownArgMatch) {
                const [, invalidArg, suggestedArg] = unknownArgMatch;
                return new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Validation error: Invalid argument \`${invalidArg}\`. Did you mean \`${suggestedArg}\`?`);
            }
            // Handle "needs at least one" case
            const fieldMatch = errorDetail.match(/Argument `([^`]+)`/) || [];
            const fieldName = fieldMatch[1] || "unknown field";
            const requiredFieldsMatch = errorDetail.match(/needs at least one of ([^.]+)/);
            let requiredFields = "required arguments";
            if (requiredFieldsMatch && requiredFieldsMatch[1]) {
                requiredFields = requiredFieldsMatch[1]
                    .trim()
                    .split(/` or `/)
                    .map((field) => field.replace(/`/g, "").trim())
                    .filter(Boolean)
                    .join(" or ");
            }
            if (fieldName !== "unknown field" && requiredFields !== "required arguments") {
                return new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Validation error: The \`${fieldName}\` field requires at least one of: ${requiredFields}.`);
            }
            // Fallback for other validation errors
            const cleanMessage = errorDetail
                .replace(/.*invocation in [^:]+:\d+:\d+\s*/, "") // Remove file path
                .replace(/Available options are marked with \?.*/, "") // Remove extra hints
                .replace(/Argument `[^`]+` of type \S+/, "") // Remove type info
                .trim();
            return new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Validation error: ${cleanMessage}`);
        }
        // Fallback to a concise version of the message
        const cleanMessage = lines
            .filter((line) => !line.includes("invocation in") &&
            !line.startsWith("→") &&
            line.length > 0)
            .join(" ")
            .trim() || "Invalid request format";
        return new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Validation error: ${cleanMessage}`);
    }
    // Handle other Prisma errors
    if (error instanceof client_1.Prisma.PrismaClientInitializationError ||
        error instanceof client_1.Prisma.PrismaClientRustPanicError) {
        return new http_error_1.default(http_status_1.HttpStatus.INTERNAL_SERVER_ERROR, "Database connection error. Please try again later.");
    }
    // Handle generic errors
    if (error instanceof Error) {
        return new http_error_1.default(http_status_1.HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
    // Fallback for unknown errors
    return new http_error_1.default(http_status_1.HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
};
exports.formatPrismaError = formatPrismaError;
