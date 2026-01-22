const express = require("express");

const { discoveryRouter } = require("./schemaDiscoveryRoutes");
const { rulesRouter } = require("./rulesRoutes");

const apiRouter = express.Router();

apiRouter.use(discoveryRouter);
apiRouter.use(rulesRouter);

module.exports = { apiRouter };

