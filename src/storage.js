const fs = require("fs");
const path = require("path");
const { storageFilePath } = require("./config");

function ensureStorageFile() {
  const dir = path.dirname(storageFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(storageFilePath)) {
    fs.writeFileSync(storageFilePath, "[]", "utf8");
  }
}

function loadBirthdays() {
  ensureStorageFile();
  const raw = fs.readFileSync(storageFilePath, "utf8");
  return JSON.parse(raw);
}

function saveBirthdays(items) {
  ensureStorageFile();
  fs.writeFileSync(storageFilePath, JSON.stringify(items, null, 2), "utf8");
}

function addBirthday(item) {
  const list = loadBirthdays();
  list.push(item);
  saveBirthdays(list);
}

module.exports = {
  loadBirthdays,
  saveBirthdays,
  addBirthday,
};
