import { Router } from "express";
import {
  getCaptcha,
  checkRegistrationEmail,
  getCurrentUser,
  logout,
  validateOAuthIdentity,
  validateAuthentication,
  verifyCaptcha,
} from "../controllers/authController.js";
import { finalizeGoogleAuthentication } from "../controllers/googleAuthController.js";
import {
  activateRegistration,
  registerStudent,
  registerTeacher,
} from "../controllers/registrationController.js";
import {
  authenticate,
  authenticateIdentity,
  requireGoogleIdentity,
} from "../middleware/authenticate.js";
import {
  authRateLimiter,
  captchaRateLimiter,
} from "../middleware/rateLimiters.js";
import { requireCaptcha } from "../middleware/requireCaptcha.js";

const router = Router();

router.get("/captcha", captchaRateLimiter, getCaptcha);
router.post("/captcha/verify", captchaRateLimiter, verifyCaptcha);

router.post(
  "/email/check",
  authRateLimiter,
  requireCaptcha,
  checkRegistrationEmail,
);
router.post(
  "/oauth-check",
  authRateLimiter,
  authenticateIdentity,
  requireGoogleIdentity,
  validateOAuthIdentity,
);
router.post(
  "/validate",
  authRateLimiter,
  requireCaptcha,
  authenticate,
  validateAuthentication,
);
router.post(
  "/google-result",
  authRateLimiter,
  authenticate,
  requireGoogleIdentity,
  finalizeGoogleAuthentication,
);
router.get("/me", authRateLimiter, authenticate, getCurrentUser);
router.post(
  "/registration/activate",
  authRateLimiter,
  authenticate,
  activateRegistration,
);
router.post(
  "/register/student",
  authRateLimiter,
  requireCaptcha,
  authenticate,
  registerStudent,
);
router.post(
  "/register/teacher",
  authRateLimiter,
  requireCaptcha,
  authenticate,
  registerTeacher,
);
router.post("/logout", authRateLimiter, logout);

export default router;
