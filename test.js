const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("test.db", (err) => {
  if (err) console.error(err.message);
  else console.log("SQLite connected successfully");
});
