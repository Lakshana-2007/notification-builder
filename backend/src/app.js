const express = require("express");
const cors = require("cors");

const { apiRouter } = require("./routes");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      credentials: false,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.use("/api", apiRouter);

  // Error handler (last)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = Number(err.status || 500);
    const message =
      status >= 500 ? "Unexpected server error" : err.message || "Bad request";
    res.status(status).json({
      error: {
        message,
        code: err.code || "ERR_GENERIC",
      },
    });
  });

  return app;
}

module.exports = { createApp };

