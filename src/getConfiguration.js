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

getConfigurationCallResult = async (cpid, decodedMessage) => {
  const configData = await getConfigData(cpid);

  if (!configData) {
    let configDataInsert = [];
    configDataInsert.push(decodedMessage[2]);
    const payload = {
      charger_id: cpid,
      config_data: JSON.stringify(configDataInsert),
      status: 1,
    };
    await createConfigValue(payload);
  } else {
    let configDataUpdate = [];
    configDataUpdate.push(decodedMessage[2]);
    const upPayload = {
      config_data: JSON.stringify(configDataUpdate),
      status: 1,
    };
    await updateConfigValue(upPayload, cpid);
  }

  return JSON.stringify(decodedMessage[2]);
};

module.exports = { getConfigurationCallResult };
