const { DiscoveryRepository } = require("../repositories/DiscoveryRepository");

class SchemaService {
  constructor() {
    this.repo = new DiscoveryRepository();
  }

  async listDatabases() {
    return await this.repo.listDatabases();
  }

  async listTables(db) {
    return await this.repo.listTables(db);
  }

  async listColumns(db, table) {
    return await this.repo.listColumns(db, table);
  }
}

module.exports = { SchemaService };

