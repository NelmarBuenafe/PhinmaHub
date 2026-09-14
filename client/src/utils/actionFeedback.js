export function actionErrorMessage(error, fallback = "We couldn't complete that action. Please try again.") {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || error?.message || "").trim();
  if (!error?.response && message) return "Unable to connect. Please check your connection and try again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested item could not be found.";
  if (message.includes("Unsupported file type")) return "This file type is not supported.";
  if (message.includes("exceeds the")) return "File exceeds the allowed size.";
  if (/postgres|supabase|storage_path|stack|relation .* does not exist/i.test(message)) return fallback;
  return message || fallback;
}
