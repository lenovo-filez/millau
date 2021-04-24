const express = require("express");
const bodyParser = require("body-parser");
const handlers = require("./libs/handlers/index.js");
const Util = require("./libs/utils/index.js");
const fs = require("fs");
const logger = require("./libs/utils/logger.js");
const cors = require("cors");
require("dotenv").config();

// 路由
const extensionRoute = require("./route/extension");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/extension", extensionRoute);

app.listen(PORT, () => console.warn(`🚀 Server running on port ${PORT}`));

app.post("/hook", (req, res) => {
  console.log("bbbbb");
  const body = req.body;
  const handler = Util.parseHandler(body);
  handlers[handler] &&
    (handler === "pipeline"
      ? new handlers[handler](body)
      : handlers[handler](body));
  res.status(200).end(); // Responding is important
  logger.info(`入口，类型：${handler}`);
});

process.on("uncaughtException", (err, origin) => {
  logger.error(`顶级捕获的异常: ${err}\n 异常的来源: ${origin}`);
});
