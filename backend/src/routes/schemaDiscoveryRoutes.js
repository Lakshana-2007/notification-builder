const express = require("express");
const { DiscoveryController } = require("../controllers/DiscoveryController");
const { asyncHandler } = require("../utils/asyncHandler");

const discoveryRouter = express.Router();
const controller = new DiscoveryController();

discoveryRouter.get(
  "/databases",
  asyncHandler((req, res) => controller.listDatabases(req, res))
);

discoveryRouter.get(
  "/databases/:db/tables",
  asyncHandler((req, res) => controller.listTables(req, res))
);

discoveryRouter.get(
  "/databases/:db/tables/:table/columns",
  asyncHandler((req, res) => controller.listColumns(req, res))
);

module.exports = { discoveryRouter };

