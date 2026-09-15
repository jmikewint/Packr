require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cardsRouter = require("./src/routes/cards");

const app = express();
const PORT = process.env.PORT || 4001;

// The frontend calls this service directly from the browser (not server-side),
// so it needs CORS enabled - default to the frontend's local dev origin.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({ origin: FRONTEND_ORIGIN }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ service: "catalog-service", status: "running" });
});

app.use("/cards", cardsRouter);

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
  console.log(`Catalog service running on http://localhost:${PORT}`);
});

module.exports = app;
