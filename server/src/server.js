import "dotenv/config";
import { validateEnv } from "./utils/validateEnv.js";

try {
  validateEnv();

  const [{ default: app }] = await Promise.all([
    import("./app.js"),
    import("./config/supabase.js"),
  ]);
  const port = Number(process.env.PORT) || 5000;

  app.listen(port, () => {
    console.log(`PhinmaHub API listening on port ${port}`);
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
