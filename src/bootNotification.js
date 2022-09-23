const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const { getCurrentDateTimeUTC } = require("../wsHelper");
const bootNotification = require("../schema/BootNotification.json");
const {
  getCharger,
  updateFirstLastBoot,
  updateLastBoot,
} = require("../database/models/chargingStation");

bootNotificationCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(bootNotification, decodedMessage[3]);
  const charger = await getCharger(cpid);
  const dateTimeUtc = await getCurrentDateTimeUTC();

  if (!valid) {
    return `[${errorId},"${decodedMessage[1]}",{errorCode":"GenericError","errorDescription":"${callNotValid}"}]`;
  }

  if (!charger.first_boot_at) {
    await updateFirstLastBoot(
      dateTimeUtc.toFormat("yyyy-MM-dd HH':'mm':'ss"),
      dateTimeUtc.toFormat("yyyy-MM-dd HH':'mm':'ss"),
      cpid
    );
  }

  await updateLastBoot(dateTimeUtc.toFormat("yyyy-MM-dd HH':'mm':'ss"), cpid);

  return `[${responseId},"${
    decodedMessage[1]
  }",{"status":"Accepted","currentTime":"${dateTimeUtc.toISO()}","interval":900 }]`;
};

module.exports = { bootNotificationCallResult };
