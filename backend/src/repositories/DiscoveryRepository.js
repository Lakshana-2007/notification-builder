const { getRootPool } = require("../db/mysql");

class DiscoveryRepository {
  constructor() {
    this.pool = getRootPool();
  }

  async listDatabases() {
    const [rows] = await this.pool.query(
      `
      SELECT schema_name AS name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema','mysql','performance_schema','sys')
      ORDER BY schema_name ASC
      `
    );
    return rows.map((r) => r.name);
  }

  async listTables(database) {
    const [rows] = await this.pool.query(
      `
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = :db AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
      `,
      { db: database }
    );
    return rows.map((r) => r.name);
  }

  async listColumns(database, table) {
    const [rows] = await this.pool.query(
      `
      SELECT
        column_name AS name,
        data_type AS dataType,
        column_type AS columnType,
        is_nullable AS isNullable
      FROM information_schema.columns
      WHERE table_schema = :db AND table_name = :table
      ORDER BY ordinal_position ASC
      `,
      { db: database, table }
    );

    return rows.map((r) => ({
      name: r.name,
      dataType: r.dataType, // e.g. varchar, int, date, datetime
      columnType: r.columnType, // e.g. varchar(120), int(11), enum(...)
      isNullable: r.isNullable === "YES",
    }));
  }
}

module.exports = { DiscoveryRepository };

