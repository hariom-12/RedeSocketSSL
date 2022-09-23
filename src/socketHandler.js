const { authorizeCallResult } = require("./authorize");
const { bootNotificationCallResult } = require("./bootNotification");
const { dataTransferCallResult } = require("./dataTransfer");
const { getConfigurationCallResult } = require("./getConfiguration");
const { changeConfigurationCallResult } = require("./changeConfiguration");

const { heartbeatCallResult } = require("./heartbeat");
const { meterValueCallResult } = require("./meterValue");

const { getRemoteStartCallResult } = require("./remoteStart");
const { getRemoteStopCallResult } = require("./remoteStop");

const { statusNotificationCallResult } = require("./statusNotification");
const { startTransactionCallResult } = require("./startTransaction");
const { stoptTransactionCallResult } = require("./stopTransaction");
const { getResetCallResult } = require("./getReset");
const { errorId, callNotValid } = require("./helper");
const { getAction } = require("../database/models/chargingStation");

class SocketHandler {
  callResponse = async (cpId, message) => {
    const decodedMessage = await this.parseMessage(message);
    const id = decodedMessage[1];
    const action = decodedMessage[2];
    let respons = "";
    if (decodedMessage) {
      switch (action) {
        case "Authorize":
          respons = await authorizeCallResult(cpId, decodedMessage);
          break;
        case "Heartbeat":
          respons = await heartbeatCallResult(cpId, decodedMessage);
          break;
        case "BootNotification":
          respons = await bootNotificationCallResult(cpId, decodedMessage);
          break;
        case "StatusNotification":
          respons = await statusNotificationCallResult(cpId, decodedMessage);
          break;
        case "StartTransaction":
          respons = await startTransactionCallResult(cpId, decodedMessage);
          break;
        case "MeterValues":
          respons = await meterValueCallResult(cpId, decodedMessage);
          break;
        case "StopTransaction":
          respons = await stoptTransactionCallResult(cpId, decodedMessage);
          break;
        case "DataTransfer":
          respons = await dataTransferCallResult(cpId, decodedMessage);
          break;
        default:
          respons = `[${errorId}, ${id}, {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
      }
    } else {
      respons = `[${errorId}, ${id}, {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
    }

    return respons;
  };

  callWithoutResponse = async (cpId, message) => {
    const decodedMessage = await this.parseMessage(message);
    const id = decodedMessage[1];
    const action = await getAction(cpId);
    const newAction = action.action_type;
    let respons;
    if (decodedMessage) {
      switch (newAction) {
        case "GetConfiguration":
          respons = await getConfigurationCallResult(cpId, decodedMessage);
          break;
        case "ChangeConfiguration":
          respons = await changeConfigurationCallResult(cpId, decodedMessage);
          break;
        case "Reset":
          respons = await getResetCallResult(cpId, decodedMessage);
          break;
        case "RemoteStartTransaction":
          respons = await getRemoteStartCallResult(cpId, decodedMessage);
          break;
        case "RemoteStopTransaction":
          respons = await getRemoteStopCallResult(cpId, decodedMessage);
          break;
        default:
          respons = `[${errorId}, ${id}, {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
      }
    }
    return respons;
  };

  parseMessage = async (message) => {
    try {
      const messageData = JSON.parse(message);
      return messageData;
    } catch (error) {
      return false;
    }
  };
}

module.exports = new SocketHandler();
