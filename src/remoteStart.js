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

getRemoteStartCallResult = async (cpid, decodedMessage) => {
  const status = decodedMessage[2].status;
  const action = await getAction(cpid);
  const activeResult = JSON.parse(action.extra_info);

  let id;
  const dataPlugIn = {
    connector_id: 0,
    machine_id: cpid,
    type: "REMOTE_TRANSACTION",
    auth_token: activeResult.idTag ? activeResult.idTag : "",
  };

  if (status == "Accepted") {
    const transaction = await createActiveTransaction(dataPlugIn);
    id = transaction.insertId;
  } else {
    id = 0;
  }

  return JSON.stringify({ transactionId: id });
};

module.exports = { getRemoteStartCallResult };
