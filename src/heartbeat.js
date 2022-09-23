const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const { getCurrentDateTimeUTC } = require("../wsHelper");
const heartbeatSchema = require("../schema/Heartbeat.json");

heartbeatCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(heartbeatSchema, decodedMessage[3]);
  const dateTimeUtc = await getCurrentDateTimeUTC();

  if (!valid) {
    return `[${errorId},"${decodedMessage[1]}",{errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
  }
  return `[${responseId},"${
    decodedMessage[1]
  },{"currentTime":"${dateTimeUtc.toISO()}"}]`;
};

module.exports = { heartbeatCallResult };
