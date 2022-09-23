const router = require("express").Router();
const { broadcast, clientFitler, sleepRespons } = require("../wsHelper");
const { v4: uuidv4 } = require("uuid");
const connection = require("../database/db");
const {
  getAction,
  createAction,
  updateAction,
} = require("../database/models/chargingStation");

router.post("/changeconfiguration", async (req, res) => {
  const charger = req.body.ocpp_cbid ? req.body.ocpp_cbid : null;
  const key = uuidv4();
  const client = await clientFitler(req.app.locals.clients, charger);

  if (!client) {
    return res.status(400).json({ result: "EVSE not found." });
  }
  const action = await getAction(charger);

  if (!charger) {
    return res.status(400).json({ result: "EVSE not found." });
  }

  if (action) {
    const upPayload = {
      key_id: key,
      action_type: "ChangeConfiguration",
    };
    await updateAction(upPayload, charger);
  } else {
    const payload = {
      charger_id: charger,
      key_id: key,
      action_type: "ChangeConfiguration",
    };
    await createAction(payload);
  }

  const callMessage = `[2,"${key}","ChangeConfiguration",${keyValues}]`;
  const newResopnsFromSocket = broadcast(
    charger,
    req.app.locals.clients,
    callMessage
  );
  await sleepRespons(10000);

  let newRespons = req.app.locals.apiRespons
    ? req.app.locals.apiRespons
    : newResopnsFromSocket;
  logger.info(`Response - ${charger}: ${newRespons}`);
  console.log(`Response - ${charger}: ${newRespons}`);
  return res.status(200).json({ result: newRespons });
});

module.exports = router;
