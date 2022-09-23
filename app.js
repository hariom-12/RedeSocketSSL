const { createServer } = require("https");
const express = require("express");
const WebSocket = require("ws");
const app = express();
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { DateTime } = require("luxon");
const logger = require("./logger/logger");
const now = DateTime.now().toUTC();
const connection = require("./database/db");
const {
  getCharger,
  createSocketInfo,
  getSocketInfoDis,
  getSocketInfoCon,
  updateSocketInfo,
} = require("./database/models/chargingStation");
const {
  getChargerName,
  parseSocketCall,
  triggerStatusNotification,
} = require("./wsHelper");
const socketHandler = require("./src/socketHandler");

app.use(express.json({ extended: true }));
app.use(cors());
app.options("*", cors());
app.use(require("./routes/getConfigurationRouter"));
app.use(require("./routes/changeConfigurationRouter"));
app.use(require("./routes/resetRouter"));
app.use(require("./routes/remoteStartRouter"));
app.use(require("./routes/remoteStopRouter"));

const port = process.env.PORT || 4444;
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

let newRespons;
let interval;

function heartbeat() {
  this.isAlive = true;
  console.log("Socket Heartbeat");
}

const server = createServer(options, app);

server.listen(port, () => console.info(`Server running on port: ${port}`));

const webSocketServer = new WebSocket.Server({ noServer: true });

webSocketServer.on("connection", async (ws, request) => {
  ws.id = getChargerName(request.url);
  ws.isAlive = true;
  this.pingInterval = 10000;
  this.pingTimeout = 60000;
  this.upgradeTimeout = 30000;
  //autoConnect: true;

  const infoConn = await getSocketInfoCon(ws.id);

  if (infoConn) {
    const payloadCon = {
      charger_id: ws.id,
      connected_at: now.toFormat("yyyy-MM-dd HH':'mm':'ss"),
    };
    await updateSocketInfo(payloadCon, infoConn.id);
  }
  console.log(`A New client connected: ${ws.id}`);
  logger.info(`A New client connected: ${ws.id}`);

  // Trigger Message

  const triggerMessage = await triggerStatusNotification(ws.id);
  ws.send(triggerMessage);

  interval = setInterval(function ping() {
    webSocketServer.clients.forEach(function each(ws) {
      // if (ws.isAlive === false) return ws.terminate();
      //ws.isAlive = false;
      ws.ping();
    });
  }, 300000);

  ws.on(`ping`, function heartbeat() {
    logger.info(`ping`);
  });

  ws.on("pong", function heartbeat() {
    this.isAlive = true;
    logger.info("Pong recieved");
  });

  ws.onerror = (err) => {
    logger.info("Socket encountered error: ", err.message, "Closing socket");
    ws.close();
  };

  app.locals.clients = webSocketServer.clients;

  ws.on("message", async (msg) => {
    const socketMsg = await parseSocketCall(msg);
    const mType = socketMsg[0];
    logger.info(`Request - ${ws.id}: ${msg}`);

    if (2 === mType) {
      const result = await socketHandler.callResponse(ws.id, msg);
      logger.info(`Response - ${ws.id}: ${result}`);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(result.toString());
      }
    }

    if (3 === mType) {
      newRespons = await socketHandler.callWithoutResponse(ws.id, msg);
      app.locals.apiRespons = newRespons;
    }
  });

  // Client Connection Close

  ws.on("close", async () => {
    console.log(`A client disconnected: ${ws.id}`);
    logger.info(`A client disconnected: ${ws.id}`);

    const chargerInfo = await getCharger(ws.id);
    if (chargerInfo) {
      await updateConnectorStatusAll("UNAVAILABLE", chargerInfo.id);
    }

    const info = await getSocketInfoDis(ws.id);
    if (!info) {
      const payload = {
        charger_id: ws.id,
        disconnected_at: now.toFormat("yyyy-MM-dd HH':'mm':'ss"),
      };
      await createSocketInfo(payload);
    }
  });
});

// WebSocket Close

webSocketServer.on("close", function close() {
  clearInterval(interval);
});

// Server Upgrade

server.on("upgrade", async function upgrade(request, socket, head) {
  this.isAlive = true;
  const protocol = request.headers["sec-websocket-protocol"];
  logger.info(`${new Date()} Connection request ${request.url} : ${protocol}`);
  console.log(`${new Date()} Connection request ${request.url} : ${protocol}`);
  if (protocol != "ocpp1.6") {
    logger.info(`${new Date()} Connection rejected due to invalid protocol.`);
    return socket.end("HTTP/1.1 401 Unauthorized\r\n", "ascii");
  }
  const evseId = request.url;
  const charger = await getCharger(getChargerName(evseId));

  if (!charger) {
    logger.info(
      `${new Date()} Connection rejected due to invalid charger ${evseId}`
    );
    console.log(
      `${new Date()} Connection rejected due to invalid charger ${evseId}`
    );
    return socket.end("HTTP/1.1 401 Unauthorized\r\n", "ascii");
  }

  webSocketServer.handleUpgrade(request, socket, head, function done(ws) {
    webSocketServer.emit("connection", ws, request);
  });
});

// Process Errors

process.on("unhandledRejection", (reason, promise) => {
  logger.info(`unhandledRejection --${reason} ---- ${promise}`);
  //process.exit(1);
});
process.on("rejectionHandled", (promise) => {
  logger.info(`rejectionHandled---- ${promise}`);
  //process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.info(`uncaughtException---- ${err}---${err.stack}`);
  //process.exit(1);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  logger.info(`uncaughtExceptionMonitor---- ${err}-------${origin}`);
  //process.exit(1);
});
