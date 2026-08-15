// Fail fast if critical secrets are missing, so we never boot half-configured.
function checkEnv() {
  const required = ["MONGO_URI", "JWT_SECRET", "LINK_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(
      `Missing required env vars: ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill them in.`
    );
    process.exit(1);
  }
  const weak = ["JWT_SECRET", "LINK_SECRET"].filter(
    (k) => (process.env[k] || "").length < 16
  );
  if (weak.length && process.env.NODE_ENV === "production") {
    console.error(`These secrets are too short for production: ${weak.join(", ")}`);
    process.exit(1);
  }
}

module.exports = checkEnv;
