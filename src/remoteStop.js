const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const {
  getChargerConnector,
  createActiveTransaction,
  getAction,
} = require("../database/models/chargingStation");

const { DateTime } = require("luxon");

getRemoteStopCallResult = async (cpid, decodedMessage) => {
  const status = decodedMessage[2].status;
  const now = (
    decodedMessage[2].timestamp
      ? DateTime.fromISO(decodedMessage[2].timestamp)
      : DateTime.now()
  ).toUTC();
  const transactionTime = now.toFormat("yyyy-MM-dd HH':'mm':'ss");
  const action = await getAction(cpid);
  const activeResult = JSON.parse(action.extra_info);

  let id;
  const transaction = await getActiveTranscationById(
    activeResult.transactionId
  );
  const dataPlugIn = {
    status: "FINISHED",
  };

  if (status == "Accepted") {
    await updateTranscation(dataPlugIn, activeResult.transactionId);
    id = transaction.id;
  } else {
    id = 0;
  }

  return JSON.stringify({ transactionId: id });
};

module.exports = { getRemoteStopCallResult };
