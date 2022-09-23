const AJV = require("ajv").default;
const addFormats = require("ajv-formats").default;
const ajv = new AJV();
addFormats(ajv);
const { errorId, responseId, callNotValid } = require("./helper");
const MeterValuesSchema = require("../schema/MeterValues.json");
const {
  createMeterValue,
  getActiveMeterValueById,
  updateMeterValue,
  getActiveTransaction,
} = require("../database/models/chargingStation");

meterValueCallResult = async (cpid, decodedMessage) => {
  const valid = ajv.validate(MeterValuesSchema, decodedMessage[3]);

  const connectorId = decodedMessage[3].connectorId;

  if (!valid) {
    return `[${errorId},"${decodedMessage[1]}", {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
  }

  const activeSession = await getActiveTransaction(cpid, connectorId);

  const activeSessionId = activeSession ? activeSession.id : 0;

  let activeTransctionID = decodedMessage[3].transactionId
    ? decodedMessage[3].transactionId
    : activeSessionId;

  if (activeTransctionID && activeTransctionID != 0) {
    let metervalue = await getActiveMeterValueById(activeTransctionID);

    if (metervalue) {
      let meterData = [...JSON.parse(metervalue.meter_data)];
      meterData.push(decodedMessage[3].meterValue[0]);
      const payload = {
        meter_data: JSON.stringify(meterData),
      };
      await updateMeterValue(payload, activeTransctionID);
    } else {
      let createData = [];
      createData.push(decodedMessage[3].meterValue[0]);
      const payload = {
        meter_data: JSON.stringify(createData),
        transaction_id: activeTransctionID,
      };
      await createMeterValue(payload);
    }
  }

  return `[${responseId},"${decodedMessage[1]}",{}]`;
};

module.exports = { meterValueCallResult };
