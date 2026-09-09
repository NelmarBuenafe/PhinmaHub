import {
  CAPTCHA_COOKIE_NAME,
  verifyCaptchaVerificationToken,
} from "../utils/captcha.js";

export function requireCaptcha(request, response, next) {
  const verificationToken = request.cookies?.[CAPTCHA_COOKIE_NAME];

  if (
    !verifyCaptchaVerificationToken(
      verificationToken,
      process.env.CAPTCHA_SECRET,
    )
  ) {
    return response.status(403).json({
      success: false,
      code: "CAPTCHA_REQUIRED",
      message: "Please complete the CAPTCHA before signing in.",
    });
  }

  return next();
}
