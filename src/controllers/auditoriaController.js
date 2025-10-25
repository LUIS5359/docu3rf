const pool = require('../config/db');

exports.list = async (req, res) => {
  const { from, to, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = 'WHERE 1=1';
  if (from) { where += ' AND fecha_hora >= ?'; params.push(from); }
  if (to)   { where += ' AND fecha_hora < ?';   params.push(to); }
  const [rows] = await pool.execute(
    `SELECT auditoria_id, usuario_id, accion, tabla_afectada, registro_id, fecha_hora
     FROM auditorias ${where}
     ORDER BY fecha_hora DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  res.json({ page: Number(page), limit: Number(limit), data: rows });
};
