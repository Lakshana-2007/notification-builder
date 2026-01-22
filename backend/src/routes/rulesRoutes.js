const express = require("express");
const { RulesController } = require("../controllers/RulesController");
const { asyncHandler } = require("../utils/asyncHandler");

const rulesRouter = express.Router();
const controller = new RulesController();

rulesRouter.get(
  "/rules",
  asyncHandler((req, res) => controller.listRules(req, res))
);

rulesRouter.post(
  "/rules",
  asyncHandler((req, res) => controller.createRule(req, res))
);

rulesRouter.post(
  "/rules/test",
  asyncHandler((req, res) => controller.testRule(req, res))
);

rulesRouter.get(
  "/rules/:id/logs",
  asyncHandler((req, res) => controller.listRuleLogs(req, res))
);

module.exports = { rulesRouter };

