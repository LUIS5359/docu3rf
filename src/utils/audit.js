const pool = require('../config/db');

exports.log = async ({ usuario_id, accion, tabla_afectada, registro_id, detalle_json }) => {
  await pool.execute(
    `INSERT INTO auditorias (usuario_id, accion, tabla_afectada, registro_id, detalle_json)
     VALUES (?,?,?,?,?)`,
    [usuario_id, accion, tabla_afectada || null, registro_id || null, JSON.stringify(detalle_json || {})]
  );
};
