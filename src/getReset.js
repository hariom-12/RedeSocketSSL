const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);

getResetCallResult = async (cpid, decodedMessage) => {
  return JSON.stringify(decodedMessage[2]);
};

module.exports = { getResetCallResult };
