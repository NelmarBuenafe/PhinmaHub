const REQUIRED_ENVIRONMENT_VARIABLES = [
  "CLIENT_URL",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "CAPTCHA_SECRET",
];

export function validateEnv(
  requiredVariables = REQUIRED_ENVIRONMENT_VARIABLES,
) {
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }

  if (
    requiredVariables === REQUIRED_ENVIRONMENT_VARIABLES &&
    !process.env.PHINMA_ALLOWED_EMAIL_DOMAINS?.trim() &&
    !process.env.ALLOWED_GOOGLE_DOMAIN?.trim()
  ) {
    throw new Error(
      "Missing required environment variable: PHINMA_ALLOWED_EMAIL_DOMAINS",
    );
  }
}
