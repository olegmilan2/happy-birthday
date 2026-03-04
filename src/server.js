const { port } = require("./config");
const { createApp } = require("./http/create-app");
const { checkAndNotify, startScheduler } = require("./scheduler");

const app = createApp();

app.listen(port, async () => {
  console.log(`Web UI: http://localhost:${port}`);
  startScheduler();
  try {
    await checkAndNotify(new Date());
  } catch (error) {
    console.error("Notification bootstrap failed:", error.message);
  }
});
