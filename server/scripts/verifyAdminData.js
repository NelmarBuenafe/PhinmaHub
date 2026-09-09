import "dotenv/config";

const { dashboard, listApplications, listCourses, listUsers } = await import(
  "../src/controllers/adminController.js"
);

function runHandler(name, handler, query = {}) {
  return new Promise((resolve) => {
    const request = { query };
    const response = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({
          name,
          statusCode: this.statusCode,
          success: payload.success,
          itemCount: Array.isArray(payload.data) ? payload.data.length : null,
          summary: payload.summary || null,
        });
      },
    };
    const next = (error) => {
      resolve({
        name,
        statusCode: error?.statusCode || 500,
        success: false,
        error: {
          message: error?.message,
          code: error?.cause?.code,
          causeMessage: error?.cause?.message || String(error?.cause || ""),
          details: error?.cause?.details,
          hint: error?.cause?.hint,
        },
      });
    };

    Promise.resolve(handler(request, response, next)).catch(next);
  });
}

const results = await Promise.all([
  runHandler("dashboard", dashboard),
  runHandler("applications", listApplications, { page: "1", limit: "20" }),
  runHandler("users", listUsers, { page: "1", limit: "20" }),
  runHandler("courses", listCourses, { page: "1", limit: "20" }),
]);

for (const result of results) console.log(JSON.stringify(result));
process.exitCode = results.some((result) => !result.success) ? 1 : 0;
