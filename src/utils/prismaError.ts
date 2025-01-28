function formatPrismaError(error: any) {
    const message = error?.message || "Unknown error";
  
    // Regex to extract relevant information from the error message
    const regex = /Invalid `(.+?)` invocation in (.+?)\n(?:.*)\n\*\*Argument `(.+?)`: Invalid value provided\. Expected (.+?), provided (.+?)\./;
  
    const match = message.match(regex);
  
    if (match) {
      const [_, method, filePath, argument, expected, provided] = match;
      
      return {
        errorMessage: `Error occurred while invoking Prisma method \`${method}\`.`,
        details: {
          filePath: filePath,
          argument: argument,
          expectedType: expected,
          providedValue: provided,
        },
      };
    }
  
    return { errorMessage: message };
  }

  export default formatPrismaError;