const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const statusNotificationSchema = require("../schema/StatusNotification.json");
const {
  getChargerConnector,
  updateConnectorStatusAll,
  updateConnectorStatus,
  getActiveTransaction,
  createActiveTransaction,
  getPlugOutIsNullTransaction,
  updateTranscation,
  getActiveTransactionFailed,
} = require("../database/models/chargingStation");

const { DateTime } = require("luxon");

statusNotificationCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(statusNotificationSchema, decodedMessage[3]);
  const connectorId = decodedMessage[3].connectorId;
  const status = decodedMessage[3].status;
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
    return `[${responseId},"${decodedMessage[1]}",{}]`;
  }

  if (0 === connectorId && connector && "Available" === status) {
    const updateAll = await updateConnectorStatusAll(
      status.toUpperCase(),
      connector.cpid
    );
    return `[${responseId},"${decodedMessage[1]}",{}]`;
  }

  await updateConnectorStatus(status.toUpperCase(), connector.cid);

  if ("Available" === status) {
    const transactionPlugOut = await getPlugOutIsNullTransaction(
      cpid,
      connectorId
    );

    if (transactionPlugOut) {
      const dataPlugOut = {
        plug_out: transactionTime,
      };
      await updateTranscation(dataPlugOut, transactionPlugOut.id);
    }
  } else if ("Preparing" === status) {
    const transaction = await getActiveTransactionRemote(cpid);

    if (transaction) {
      const connectorUpdate = await getConnetorRemote(cpid, connectorId);
      const dataPlugUp = {
        connector_id: connectorUpdate.id,
        plug_in: transactionTime,
      };
      await updateTranscation(dataPlugUp, transaction.id);
    } else {
      const connectorCreate = await getConnetorRemote(cpid, connectorId);
      const dataPlugIn = {
        connector_id: connectorCreate.id,
        plug_in: transactionTime,
        machine_id: cpid,
      };
      await createActiveTransaction(dataPlugIn);
    }
  } else if ("SuspendedEVSE" == status || "SuspendedEV" == status) {
    const upTransaction = await getActiveTransaction(cpid, connectorId);
    if (upTransaction) {
      const dataTransactionStatus = {
        status: "FAILED",
        notification_status: 1,
      };

      await updateTranscation(dataTransactionStatus, upTransaction.id);
    }
  } else if ("Charging" == status) {
    /// Newly Added condition ///

    const upTransactionC = await getActiveTransactionFailed(cpid, connectorId);
    if (upTransactionC) {
      const dataTransactionStatusC = {
        status: "ACTIVE",
        notification_status: 0,
      };

      await updateTranscation(dataTransactionStatusC, upTransactionC.id);
    }
  }

  return `[${responseId},"${decodedMessage[1]}",{}]`;
};

module.exports = { statusNotificationCallResult };
