const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const dataTransferSchema = require("../schema/DataTransfer.json");
const {
  createDataTransferInfo,
} = require("../database/models/chargingStation");

dataTransferCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(dataTransferSchema, decodedMessage[3]);
  const idTag = decodedMessage[3].idTag;

  if (!valid) {
    return `[${errorId},"${decodedMessage[1]}", {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
  }

  const payload = {
    transaction_id: 0,
    call_data: JSON.stringify(decodedMessage),
  };

  await createDataTransferInfo(payload);

  return `[${responseId},"${decodedMessage[1]}",{"status":"Accepted"}]`;
};

module.exports = { dataTransferCallResult };
