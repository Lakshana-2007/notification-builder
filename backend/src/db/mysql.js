const mysql = require("mysql2/promise");

function requireEnv(name, fallback = undefined) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === null || v === "") {
    throw Object.assign(new Error(`Missing required env var: ${name}`), {
      status: 500,
      code: "ERR_ENV",
    });
  }
  return v;
}

function baseConfig() {
  return {
    host: requireEnv("MYSQL_HOST", "localhost"),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: requireEnv("MYSQL_USER", "root"),
    password: process.env.MYSQL_PASSWORD || "Mano@2006",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    decimalNumbers: true,
  };
}

let rootPool;
const dbPools = new Map();

function getRootPool() {
  if (!rootPool) rootPool = mysql.createPool(baseConfig());
  return rootPool;
}

function getDbPool(database) {
  if (!database) throw new Error("database is required");
  if (dbPools.has(database)) return dbPools.get(database);

  const pool = mysql.createPool({ ...baseConfig(), database });
  dbPools.set(database, pool);
  return pool;
}

module.exports = { getRootPool, getDbPool };

