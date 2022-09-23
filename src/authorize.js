const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const { getCurrentDateTimeUTC } = require("../wsHelper");
const authorizeSchema = require("../schema/Authorize.json");
const {
  getCharger,
  getIdTagDetails,
} = require("../database/models/chargingStation");

authorizeCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(authorizeSchema, decodedMessage[3]);
  const idTag = decodedMessage[3].idTag;
  const dateTimeUtc = await getCurrentDateTimeUTC();

  if (!valid) {
    return `[${errorId},"${decodedMessage[1]}", {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
  }

  const resCharger = await getCharger(cpid);
  const tagRes = await getIdTagDetails(idTag);
  let validId;
  let validChargerId;

  if (tagRes && resCharger) {
    if (tagRes.site_id) {
      validId = tagRes.site_id;
      validChargerId = resCharger.site_id;
    }
    if (tagRes.charging_station_id) {
      validId = tagRes.charging_station_id;
      validChargerId = resCharger.id;
    }

    if (validId == validChargerId) {
      return `[${responseId},"${
        decodedMessage[1]
      }",{"idTagInfo":{"expiryDate":"${dateTimeUtc.toISO()}","parentIdTag":"${idTag}","status":"Accepted"}}]`;
    } else {
      return `[${responseId},"${
        decodedMessage[1]
      }",{"idTagInfo":{"expiryDate":"${dateTimeUtc.toISO()}","parentIdTag":"${idTag}","status":"Invalid"}}]`;
    }
  } else {
    return `[${responseId},"${
      decodedMessage[1]
    }",{"idTagInfo":{"expiryDate":"${dateTimeUtc.toISO()}","parentIdTag":"${idTag}","status":"Invalid"}}]`;
  }
};

module.exports = { authorizeCallResult };
