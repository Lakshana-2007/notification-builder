const { SchemaService } = require("../services/SchemaService");
const { httpError } = require("../utils/httpError");

class DiscoveryController {
  constructor() {
    this.service = new SchemaService();
  }

  async listDatabases(req, res) {
    const databases = await this.service.listDatabases();
    res.json({ databases });
  }

  async listTables(req, res) {
    const db = req.params.db;
    if (!db) throw httpError(400, "db is required", "ERR_VALIDATION");
    const tables = await this.service.listTables(db);
    res.json({ database: db, tables });
  }

  async listColumns(req, res) {
    const db = req.params.db;
    const table = req.params.table;
    if (!db || !table)
      throw httpError(400, "db and table are required", "ERR_VALIDATION");
    const columns = await this.service.listColumns(db, table);
    res.json({ database: db, table, columns });
  }
}

module.exports = { DiscoveryController };

