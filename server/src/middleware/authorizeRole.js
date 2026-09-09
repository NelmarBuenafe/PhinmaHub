import { canAccessRole } from "../utils/auth.js";

export function authorizeRole(...allowedRoles) {
  return function roleAuthorization(request, response, next) {
    if (!request.auth?.profile) {
      return response.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication is required.",
      });
    }

    if (
      !allowedRoles.some((role) => canAccessRole(request.auth.profile, role))
    ) {
      return response.status(403).json({
        success: false,
        code: "ACCESS_DENIED",
        message: "Your account cannot access this resource.",
      });
    }

    return next();
  };
}
