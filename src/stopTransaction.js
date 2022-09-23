const AJV = require('ajv').default;
const addFormats = require('ajv-formats').default;
const ajv = new AJV();
addFormats(ajv);
const {errorId, responseId, callNotValid} = require('./helper');
const stopTransactionSchema = require('../schema/StopTransaction.json');
const {
    updateTranscation,
    getActiveTranscationById,
    getActiveMeterValueById
}                              = require('../database/models/chargingStation');
const { DateTime } = require('luxon');

    stoptTransactionCallResult = async (cpid, decodedMessage) => {
       const valid = ajv.validate(stopTransactionSchema, decodedMessage[3]);
       const meterStop = decodedMessage[3].meterStop;
       const transactionId = decodedMessage[3].transactionId;
       const now = (decodedMessage[3].timestamp ? DateTime.fromISO(decodedMessage[3].timestamp) : DateTime.now()).toUTC();
       const transactionTime = now.toFormat("yyyy-MM-dd HH':'mm':'ss");

       if(!valid){
        return `[${errorId},"${decodedMessage[1]}", {errorCode":"GenericError", "errorDescription":"${callNotValid}"}]`;
       }

       const transaction = await getActiveTranscationById(transactionId);

       if (!transaction){
        return `[${responseId},"${decodedMessage[1]}",{"idTagInfo":{"status":"Invalid"}}]`;
       }

       let metervalue = await getActiveMeterValueById(transactionId);

       let averageVoltage = 0;
       let maxVoltage = 0;
       let socStart = 0;
       let socEnd = 0;
       let averagePower = 0;
       let maxPower = 0;

       if (metervalue) {
            const meterValueData = JSON.parse(metervalue.meter_data);
            const allSampledValues = meterValueData
            .map(({ sampledValue }) => sampledValue)
            .reduce((acc, sampledValue) => acc.concat(sampledValue), []);

            const allVoltageValues = allSampledValues
            .filter(({ measurand }) => 'Voltage' === measurand)
            .map(({ value }) => parseInt(value));
            
            const allPowerValues = allSampledValues
            .filter(({ measurand }) => 'Power.Active.Import' === measurand)
            .map(({ value }) => parseInt(value));
            
            if (allPowerValues.length) {
                averagePower = allPowerValues.reduce((acc, value) => acc + value, 0) / allPowerValues.length;
                maxPower = Math.max(...allPowerValues);
              }

            if (allVoltageValues.length) {
                averageVoltage = allVoltageValues.reduce((acc, value) => acc + value, 0) / allVoltageValues.length;
                maxVoltage = Math.max(...allVoltageValues);
              }

            const allSocValues = allSampledValues
            .filter(({ measurand }) => 'SoC' === measurand)
            .map(({ value }) => parseInt(value));

            socStart = allSocValues.find((value) => value > 0) ?? 0;
            socEnd = allSocValues.slice(-1).shift() ?? 0;
       }

       const dataTransaction = {
            average_power: averagePower,
            max_power: maxPower,
            average_voltage: averageVoltage,
            meter_end: meterStop,
            max_voltage: maxVoltage,
            soc_start: socStart,
            soc_end: socEnd,
            session_end: transactionTime,
            status: 'FINISHED'
        };

        await updateTranscation(dataTransaction, transactionId);

        return `[${responseId},"${decodedMessage[1]}",{"idTagInfo":{"status":"Accepted"}, "transactionId":${transactionId}}]`;
    }

module.exports = {stoptTransactionCallResult};
