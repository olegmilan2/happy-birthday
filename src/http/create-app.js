const path = require("path");
const express = require("express");
const healthRoutes = require("./routes/health-routes");
const birthdaysRoutes = require("./routes/birthdays-routes");

function createCorsMiddleware() {
  try {
    const cors = require("cors");
    return cors();
  } catch (_error) {
    return (_req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      if (_req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    };
  }
}

function createApp() {
  const app = express();

  app.use(createCorsMiddleware());
  app.use(express.json());
  app.use(express.static(path.resolve(__dirname, "..", "..")));

  app.use(healthRoutes);
  app.use("/api", birthdaysRoutes);

  return app;
}

module.exports = {
  createApp,
};
