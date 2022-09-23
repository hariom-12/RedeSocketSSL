const WebSocket = require("ws");
const logger = require("./logger/logger");
const { v4: uuidv4 } = require("uuid");
const { DateTime } = require("luxon");

broadcast = (clientId, clients, message) => {
  let apiCount = 0;
  let newResopnsFromSocket = 0;
  console.log(`${message} : API Call`);
  logger.info(`Request API Call - ${clientId}: ${message}`);
  clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.id === clientId &&
      apiCount === 0
    ) {
      console.log(`${message} : Socket Call`);
      logger.info(`Request Socket Call - ${clientId}: ${message}`);
      newResopnsFromSocket = 1;
      client.send(message);
      apiCount++;
    }
  });

  return newResopnsFromSocket;
};

makeId = (length) => {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

getChargerName = (url) => {
  const urlString = url.split("/");
  return urlString[urlString.length - 1];
};

parseSocketCall = async (message) => {
  try {
    const messageData = JSON.parse(message);
    return messageData;
  } catch (error) {
    return false;
  }
};

triggerStatusNotification = async (evseId) => {
  const triggerKey = uuidv4();
  const triggerMessage = `[2,"${triggerKey}","TriggerMessage",{"requestedMessage":"StatusNotification","connectorId":0,"errorCode":"NoError","status":"Available"}]`;
  logger.info(`Request - ${evseId}: ${triggerMessage}`);
  return triggerMessage;
};

clientFitler = async (clients, clientId) => {
  let result = false;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.id === clientId) {
      result = true;
    }
  });
  return result;
};

sleepRespons = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

getCurrentDateTimeUTC = async () => {
  return DateTime.now().toUTC();
};

module.exports = {
  broadcast,
  makeId,
  getChargerName,
  parseSocketCall,
  triggerStatusNotification,
  clientFitler,
  sleepRespons,
  getCurrentDateTimeUTC,
};
