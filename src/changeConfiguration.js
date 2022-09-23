const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const {
  getConfigData,
  createConfigValue,
  updateConfigValue,
} = require("../database/models/chargingStation");

changeConfigurationCallResult = async (cpid, decodedMessage) => {
  let respons = decodedMessage[2] ? decodedMessage[2] : 0;
  return JSON.stringify(respons);
};

module.exports = { changeConfigurationCallResult };
