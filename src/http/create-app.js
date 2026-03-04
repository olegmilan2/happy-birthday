const path = require("path");
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health-routes");
const birthdaysRoutes = require("./routes/birthdays-routes");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.resolve(__dirname, "..", "..")));

  app.use(healthRoutes);
  app.use("/api", birthdaysRoutes);

  return app;
}

module.exports = {
  createApp,
};
