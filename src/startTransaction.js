const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const startTransactionSchema = require("../schema/StartTransaction.json");
const {
  getChargerConnector,
  getActiveTransaction,
  createActiveTransaction,
  updateTranscation,
  getActiveTransactionRemote,
  getConnetorRemote,
} = require("../database/models/chargingStation");

const { DateTime } = require("luxon");

startTransactionCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(startTransactionSchema, decodedMessage[3]);
  const connectorId = decodedMessage[3].connectorId;
  const idTag = decodedMessage[3].idTag;
  const meterStart = decodedMessage[3].meterStart;
  const now = (
    decodedMessage[3].timestamp
      ? DateTime.fromISO(decodedMessage[3].timestamp)
      : DateTime.now()
  ).toUTC();
  const transactionTime = now.toFormat("yyyy-MM-dd HH':'mm':'ss");

  if (!valid) {
    return `[${errorId},"${decodedMessage[1]}", {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
  }

  const connector = await getChargerConnector(
    cpid,
    decodedMessage[3].connectorId
  );

  if (!connector) {
    return `[${responseId},"${
      decodedMessage[1]
    }",{"idTagInfo":{"expiryDate":"${now.toISO()}","parentIdTag":"${idTag}","status":"Blocked"}, "transactionId":0}]`;
  }

  let transactionId;
  const transaction = await getActiveTransactionRemote(cpid);

  if (
    transaction &&
    transaction.type == "REMOTE_TRANSACTION" &&
    transaction.auth_token == idTag
  ) {
    const connectorUpdate = await getConnetorRemote(cpid, connectorId);
    const dataTransaction = {
      connector_id: connectorUpdate.id,
      auth_token: idTag,
      meter_start: meterStart,
      session_start: transactionTime,
    };
    await updateTranscation(dataTransaction, transaction.id);
    transactionId = transaction.id;
  } else {
    const connectorCreate = await getConnetorRemote(cpid, connectorId);
    const dataTransactionIn = {
      connector_id: connectorCreate.id,
      auth_token: idTag,
      meter_start: meterStart,
      machine_id: cpid,
      session_start: transactionTime,
    };
    const newSession = await createActiveTransaction(dataTransactionIn);
    transactionId = newSession.insertId;
  }

  return `[${responseId},"${
    decodedMessage[1]
  }",{"idTagInfo":{"expiryDate":"${now.toISO()}","parentIdTag":"${idTag}","status":"Accepted"}, "transactionId":${transactionId}}]`;
};

module.exports = { startTransactionCallResult };
