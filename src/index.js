const {
  printUsage,
  handleAdd,
  handleList,
  handleRun,
  handleTelegramChatId,
  handleTelegramTest,
} = require("./cli/commands");

async function main() {
  const [, , command, ...args] = process.argv;

  if (command === "add") {
    const [name, date] = args;
    await handleAdd(name, date);
    return;
  }

  if (command === "list") {
    await handleList();
    return;
  }

  if (command === "run") {
    await handleRun();
    return;
  }

  if (command === "telegram:chat-id") {
    await handleTelegramChatId();
    return;
  }

  if (command === "telegram:test") {
    await handleTelegramTest();
    return;
  }

  printUsage();
}

main().catch((error) => {
  console.error("Ошибка:", error.message);
  process.exit(1);
});
