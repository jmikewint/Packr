require("dotenv").config();

const express = require("express");
const authRouter = require("./src/routes/auth");

const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET"];
const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ service: "auth-service", status: "running" });
});

app.use(authRouter);

// Fallback error handler.
app.use((err, req, res, next) => {
  // Body-parser and similar middleware set err.status for client errors (e.g. malformed JSON).
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`);
});

module.exports = app;
