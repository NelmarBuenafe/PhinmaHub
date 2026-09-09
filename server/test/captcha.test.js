import assert from "node:assert/strict";
import test from "node:test";
import {
  CAPTCHA_LIFETIME_MS,
  createCaptchaChallenge,
  verifyCaptchaChallenge,
} from "../src/utils/captcha.js";

const secret = "test-secret-that-is-long-enough-for-hmac-validation";

function answerFromQuestion(question) {
  const match = question.match(/^(\d+) \+ (\d+) = \?$/);
  assert.ok(match);
  const left = Number(match[1]);
  const right = Number(match[2]);
  return left + right;
}

test("accepts a correct CAPTCHA answer", () => {
  const now = 1_000_000;
  const challenge = createCaptchaChallenge(secret, now);
  const result = verifyCaptchaChallenge({
    token: challenge.token,
    answer: answerFromQuestion(challenge.question),
    secret,
    now: now + 1,
  });

  assert.deepEqual(result, { valid: true });
});

test("rejects an incorrect CAPTCHA answer", () => {
  const challenge = createCaptchaChallenge(secret, 1_000_000);
  const correctAnswer = answerFromQuestion(challenge.question);
  const result = verifyCaptchaChallenge({
    token: challenge.token,
    answer: correctAnswer + 1,
    secret,
    now: 1_000_001,
  });

  assert.deepEqual(result, { valid: false, reason: "incorrect" });
});

test("rejects an expired CAPTCHA challenge", () => {
  const now = 1_000_000;
  const challenge = createCaptchaChallenge(secret, now);
  const result = verifyCaptchaChallenge({
    token: challenge.token,
    answer: answerFromQuestion(challenge.question),
    secret,
    now: now + CAPTCHA_LIFETIME_MS,
  });

  assert.deepEqual(result, { valid: false, reason: "expired" });
});

test("rejects a token with a modified signature", () => {
  const challenge = createCaptchaChallenge(secret, 1_000_000);
  const [payload, signature] = challenge.token.split(".");
  const tamperedToken = `${payload.slice(0, -1)}A.${signature}`;
  const result = verifyCaptchaChallenge({
    token: tamperedToken,
    answer: answerFromQuestion(challenge.question),
    secret,
    now: 1_000_001,
  });

  assert.equal(result.valid, false);
});

test("challenges use addition with operands from 1 through 20", () => {
  for (let index = 0; index < 100; index += 1) {
    const challenge = createCaptchaChallenge(secret);
    const match = challenge.question.match(/^(\d+) \+ (\d+) = \?$/);
    assert.ok(match);
    assert.ok(Number(match[1]) >= 1 && Number(match[1]) <= 20);
    assert.ok(Number(match[2]) >= 1 && Number(match[2]) <= 20);
  }
});
