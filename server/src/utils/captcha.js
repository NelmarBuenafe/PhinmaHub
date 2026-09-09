import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export const CAPTCHA_LIFETIME_MS = 5 * 60 * 1000;
export const CAPTCHA_COOKIE_NAME = "phinmahub_captcha_verified";

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(encodedPayload, secret) {
  return createHmac("sha256", secret).update(encodedPayload).digest();
}

function createSignedToken(payload, secret) {
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${sign(encodedPayload, secret).toString("base64url")}`;
}

function readSignedToken(token, secret) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const [encodedPayload, encodedSignature] = parts;
    const receivedSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = sign(encodedPayload, secret);

    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return null;
    }

    return JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }
}

function parseAnswer(answer) {
  if (typeof answer === "number" && Number.isInteger(answer)) return answer;
  if (typeof answer !== "string" || !/^-?\d+$/.test(answer.trim())) return null;
  return Number(answer.trim());
}

export function createCaptchaChallenge(secret, now = Date.now()) {
  const left = randomInt(1, 21);
  const right = randomInt(1, 21);

  const payload = {
    purpose: "captcha_challenge",
    left,
    right,
    operation: "+",
    issuedAt: now,
    expiresAt: now + CAPTCHA_LIFETIME_MS,
    nonce: randomBytes(16).toString("base64url"),
  };

  return {
    question: `${left} + ${right} = ?`,
    token: createSignedToken(payload, secret),
  };
}

export function verifyCaptchaChallenge({
  token,
  answer,
  secret,
  now = Date.now(),
}) {
  const payload = readSignedToken(token, secret);

  if (!payload || payload.purpose !== "captcha_challenge") {
    return { valid: false, reason: "invalid" };
  }

  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= now) {
    return { valid: false, reason: "expired" };
  }

  const submittedAnswer = parseAnswer(answer);
  const correctAnswer =
    payload.operation === "+"
      ? payload.left + payload.right
      : payload.left - payload.right;

  if (submittedAnswer === null || submittedAnswer !== correctAnswer) {
    return { valid: false, reason: "incorrect" };
  }

  return { valid: true };
}

export function createCaptchaVerificationToken(secret, now = Date.now()) {
  return createSignedToken(
    {
      purpose: "captcha_verified",
      issuedAt: now,
      expiresAt: now + CAPTCHA_LIFETIME_MS,
      nonce: randomBytes(16).toString("base64url"),
    },
    secret,
  );
}

export function verifyCaptchaVerificationToken(
  token,
  secret,
  now = Date.now(),
) {
  const payload = readSignedToken(token, secret);
  return Boolean(
    payload &&
      payload.purpose === "captcha_verified" &&
      Number.isFinite(payload.expiresAt) &&
      payload.expiresAt > now,
  );
}

export function captchaCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CAPTCHA_LIFETIME_MS,
    path: "/api/auth",
  };
}

export function captchaClearCookieOptions() {
  const { maxAge: _maxAge, ...options } = captchaCookieOptions();
  return options;
}
