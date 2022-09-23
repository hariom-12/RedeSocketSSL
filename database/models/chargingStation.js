   const connection = require('../db');

   getCharger = async (chargerId) => new Promise((resolve, reject) => {
      connection.query('select * from charging_stations where ocpp_cbid=? and deleted_at IS NULL limit 1', [chargerId], (err, res) => {
         if (err) {
            return reject(error);
         }
         return resolve(res[0]);
      });
   })

   updateFirstLastBoot = async (firstBoot, lastBoot, chargerId) => {
      return new Promise((resolve, reject) =>{
       connection.query('update charging_stations set first_boot_at = ?,last_boot_at = ? where ocpp_cbid = ? limit 1',[firstBoot, lastBoot, chargerId], (err) => {
           if (err) {
              return reject(error);
           }
           return resolve(1);
        });
      });
     }

     updateLastBoot = async (lastBoot, chargerId) => {
      return new Promise((resolve, reject)=>{
       connection.query('update charging_stations set last_boot_at = ? where ocpp_cbid = ? limit 1',[lastBoot, chargerId], (err) => {
           if (err) {
              return reject(error);
           }
           return resolve(1);
        });
      });
     }

     getChargerConnector = async (chargerId, cid) => {
      return new Promise((resolve, reject)=>{
      connection.query('select cp.id as cpid, cs.id as cid from charging_stations cp inner join connectors cs on cp.id = cs.charging_station_id and cp.ocpp_cbid = ? and cs.sequence_number = ? and cp.deleted_at IS NULL limit 1',[chargerId, cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     updateConnectorStatus = async (status, cid) => {
      return new Promise((resolve, reject)=>{
       connection.query('UPDATE connectors SET status = ? WHERE id = ? limit 1',[status, cid], (err) => {
           if (err) {
              return reject(error);
           }
           return resolve(1);
        });
      });
     }

     getActiveTransaction = async (cpid, cid) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT t.* FROM transactions t INNER JOIN connectors c ON t.connector_id = c.id INNER JOIN charging_stations cs ON c.charging_station_id = cs.id AND cs.ocpp_cbid = ? AND c.sequence_number = ? AND t.status = "ACTIVE" ORDER BY t.created_at DESC LIMIT 1',[cpid, cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     getActiveTransactionFailed = async (cpid, cid) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT t.* FROM transactions t INNER JOIN connectors c ON t.connector_id = c.id INNER JOIN charging_stations cs ON c.charging_station_id = cs.id AND cs.ocpp_cbid = ? AND c.sequence_number = ? AND t.status = "FAILED" AND t.notification_status=1 ORDER BY t.created_at DESC LIMIT 1',[cpid, cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     getPlugOutIsNullTransaction = async (cpid, cid) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT t.* FROM transactions t INNER JOIN connectors c ON t.connector_id = c.id INNER JOIN charging_stations cs ON c.charging_station_id = cs.id AND cs.ocpp_cbid = ? AND c.sequence_number = ? AND t.plug_out IS NULL ORDER BY t.updated_at DESC LIMIT 1',[cpid, cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     createActiveTransaction = async (payload) => {
      return new Promise((resolve, reject)=>{
      connection.query('INSERT INTO transactions SET ?', payload, (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     updateTranscation = async (payload, id) => {
      return new Promise((resolve, reject)=>{
       connection.query('UPDATE transactions SET ? WHERE id = ? LIMIT 1', [payload, id], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     getActiveTranscationById = async (id) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT id FROM transactions WHERE id = ? LIMIT 1', [id], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     getActiveMeterValueById = async (id) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT id, transaction_id, meter_data FROM meter_values WHERE transaction_id = ? LIMIT 1', [id], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     updateMeterValue = async (payload, id) => {
      return new Promise((resolve, reject)=>{
      connection.query('UPDATE meter_values SET ? WHERE transaction_id = ? LIMIT 1', [payload, id], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     createMeterValue = async (payload) => {
      return new Promise((resolve, reject)=>{
      connection.query('INSERT INTO meter_values SET ?',[payload], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     getConfigData = async (cid) => {
      return new Promise((resolve, reject)=>{
         connection.query('SELECT id,status FROM configurations WHERE charger_id = ? LIMIT 1', [cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }


     createConfigValue = async (payload) => {
      return new Promise((resolve, reject)=>{
      connection.query('INSERT INTO configurations SET ?',[payload], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     updateConfigValue = async (payload, cid) => {
      return new Promise((resolve, reject)=>{
       connection.query('UPDATE configurations SET ? WHERE charger_id = ? LIMIT 1', [payload, cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     getAction = async (cid) => {
      return new Promise((resolve, reject)=>{
         connection.query('SELECT * FROM charger_actions WHERE charger_id = ? LIMIT 1', [cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }


     createAction = async (payload) => {
      return new Promise((resolve, reject)=>{
      connection.query('INSERT INTO charger_actions SET ?',[payload], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     updateAction = async (payload, cid) => {
      return new Promise((resolve, reject)=>{
       connection.query('UPDATE charger_actions SET ? WHERE charger_id = ? LIMIT 1', [payload, cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res);
        });
      });
     }

     getActiveTransactionRemote = async (cpid) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT t.* FROM transactions t WHERE t.status = "ACTIVE" AND machine_id = ?  ORDER BY t.id DESC LIMIT 1', [cpid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }


     getConnetorRemote = async (cid, conid) => {
      return new Promise((resolve, reject)=>{
      connection.query('SELECT c.id FROM charging_stations cs  INNER JOIN connectors c ON cs.id = c.charging_station_id AND cs.ocpp_cbid = ? AND c.sequence_number = ?  LIMIT 1', [cid, conid], 	(err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }
     
    getIdTagDetails = async (idTag) => {
      return new Promise((resolve, reject)=>{
     connection.query('SELECT id, name, token, type, site_id, charging_station_id  FROM rfid_details WHERE token = ? AND deleted_at IS NULL LIMIT 1', [idTag], 	(err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }
     
     getSocketInfoDis = async (cid) => {
      return new Promise((resolve, reject)=>{
       connection.query('SELECT * FROM charger_informations WHERE charger_id = ? AND disconnected_at IS NULL AND connected_at IS NULL LIMIT 1', [cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }
     
     getSocketInfoCon = async (cid) => {
      return new Promise((resolve, reject)=>{
         connection.query('SELECT * FROM charger_informations WHERE charger_id = ? AND connected_at IS NULL ORDER BY id ASC LIMIT 1', [cid], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     createSocketInfo = async (payload) => {
      return new Promise((resolve, reject)=>{
      connection.query('INSERT INTO charger_informations SET ?',[payload], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     updateSocketInfo = async (payload, id) => {
      return new Promise((resolve, reject)=>{
         connection.query('UPDATE charger_informations SET ? WHERE id = ? LIMIT 1', [payload, id], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
       
      });
     }

     createDataTransferInfo = async (payload) => {
      return new Promise((resolve, reject)=>{
      connection.query('INSERT INTO datatransfers SET ?',[payload], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }
     
     ///// Update all status updates
     
     getChargerConnectorAll = async (chargerId) => {
      return new Promise((resolve, reject)=>{
      connection.query('select cp.id as cpid, cs.id as cid from charging_stations cp inner join connectors cs on cp.id = cs.charging_station_id and cp.ocpp_cbid = ? and cp.deleted_at IS NULL limit 1',[chargerId], (err, res) => {
           if (err) {
              return reject(error);
           }
           return resolve(res[0]);
        });
      });
     }

     updateConnectorStatusAll = async (status, cpid) => {
      return new Promise((resolve, reject)=>{
      connection.query('UPDATE connectors SET status = ? WHERE charging_station_id = ? ',[status, cpid], (err) => {
           if (err) {
              return reject(error);
           }
           return resolve(1);
        });
      });
     }

     ///// Update all status updates





module.exports = {
   getCharger,
   updateFirstLastBoot,
   updateLastBoot,
   getChargerConnectorAll,
   updateConnectorStatusAll,
   getChargerConnector,
   updateConnectorStatus,
   getActiveTransaction,
   createActiveTransaction,
   getPlugOutIsNullTransaction,
   updateTranscation,
   getActiveTranscationById,
   getActiveMeterValueById,
   createMeterValue,
   updateMeterValue,
   getConfigData,
   createConfigValue,
   updateConfigValue,
   getAction,
   createAction,
   updateAction,
   getActiveTransactionRemote,
   getConnetorRemote,
   getIdTagDetails,
   getSocketInfoDis,
   getSocketInfoCon,
   createSocketInfo,
   updateSocketInfo,
   getActiveTransactionFailed,
   createDataTransferInfo
};
