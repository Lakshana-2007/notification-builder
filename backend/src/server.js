const http = require("http");
const dotenv = require("dotenv");

dotenv.config();

const { createApp } = require("./app");

const PORT = Number(process.env.PORT || 4000);

const app = createApp();
const server = http.createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${PORT}`);
});

