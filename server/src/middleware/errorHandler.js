export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || error.status || 500;

  if (process.env.NODE_ENV !== "test") {
    const databaseError = error.cause || error;

    if (process.env.NODE_ENV === "production") {
      console.error(`[${statusCode}] ${error.message}`);
    } else {
      console.error(`[${statusCode}] ${error.message}`, {
        code: databaseError.code,
        message: databaseError.message,
        details: databaseError.details,
        hint: databaseError.hint,
      });
    }
  }

  response.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : error.message,
  });
}
