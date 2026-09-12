const REQUIRED_ENVIRONMENT_VARIABLES = [
  "CLIENT_URL",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "CAPTCHA_SECRET",
];

export function validateEnv(
  requiredVariables = REQUIRED_ENVIRONMENT_VARIABLES,
  environment = process.env,
) {
  const missingVariables = requiredVariables.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }

  if (
    requiredVariables === REQUIRED_ENVIRONMENT_VARIABLES &&
    !environment.PHINMA_ALLOWED_EMAIL_DOMAINS?.trim() &&
    !environment.ALLOWED_GOOGLE_DOMAIN?.trim()
  ) {
    throw new Error(
      "Missing required environment variable: PHINMA_ALLOWED_EMAIL_DOMAINS",
    );
  }

  if (environment.NODE_ENV === "production") {
    let clientUrl;
    try {
      clientUrl = new URL(environment.CLIENT_URL);
    } catch {
      throw new Error("CLIENT_URL must be a valid HTTPS frontend origin.");
    }

    const normalizedClientUrl = environment.CLIENT_URL.trim().replace(/\/$/, "");
    if (
      clientUrl.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "::1"].includes(clientUrl.hostname) ||
      clientUrl.origin !== normalizedClientUrl
    ) {
      throw new Error(
        "CLIENT_URL must be the exact deployed HTTPS frontend origin.",
      );
    }

    if (environment.CAPTCHA_SECRET.trim().length < 32) {
      throw new Error("CAPTCHA_SECRET must contain at least 32 characters.");
    }
  }
}
