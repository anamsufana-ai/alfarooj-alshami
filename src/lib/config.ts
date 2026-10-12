export type ServiceState = "not_configured" | "test_configured" | "production_configured" | "invalid" | "key_present_unverified";

export type IntegrationReport = {
  database: "external" | "embedded" | "missing";
  stripe: ServiceState;
  stripeWebhook: "not_configured" | "secret_present_unverified";
  maps: ServiceState;
  email: "not_configured" | "credentials_present_not_sending";
  sms: "not_configured" | "credentials_present_not_sending";
  storage: "not_configured" | "credentials_present_not_used";
  authSecret: "missing" | "set";
};

export function integrationReport(database: IntegrationReport["database"]): IntegrationReport {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  let stripe: ServiceState = "not_configured";
  if (stripeKey.startsWith("sk_test_")) stripe = "test_configured";
  else if (stripeKey.startsWith("sk_live_")) stripe = "production_configured";
  else if (stripeKey) stripe = "invalid";

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim() ?? "";
  const emailReady = Boolean(process.env.EMAIL_PROVIDER && process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
  const smsReady = Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY && process.env.SMS_FROM);
  const storageReady = Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

  return {
    database,
    stripe,
    stripeWebhook: process.env.STRIPE_WEBHOOK_SECRET?.trim() ? "secret_present_unverified" : "not_configured",
    maps: mapsKey ? "key_present_unverified" : "not_configured",
    email: emailReady ? "credentials_present_not_sending" : "not_configured",
    sms: smsReady ? "credentials_present_not_sending" : "not_configured",
    storage: storageReady ? "credentials_present_not_used" : "not_configured",
    authSecret: process.env.AUTH_SECRET?.trim() ? "set" : "missing",
  };
}

export function appBaseUrl(): string {
  return (process.env.APP_BASE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

export function locationRetentionDays(): number {
  const parsed = Number(process.env.LOCATION_RETENTION_DAYS ?? "7");
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) return 7;
  return parsed;
}

export function stripeReady(): boolean {
  const report = integrationReport("embedded");
  return report.stripe === "test_configured" || report.stripe === "production_configured";
}
