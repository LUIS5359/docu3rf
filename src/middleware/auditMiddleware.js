const audit = require('../utils/audit');
exports.audit = (accion, tabla, getRegistroId = (req) => null, getDetalle = (req) => ({})) =>
  async (req, res, next) => {
    res.on('finish', async () => {
      if (String(res.statusCode).startsWith('2') && req.user?.usuario_id) {
        try {
          await audit.log({
            usuario_id: req.user.usuario_id,
            accion, tabla_afectada: tabla,
            registro_id: getRegistroId(req),
            detalle_json: getDetalle(req)
          });
        } catch (e) { console.error('AUDIT ERR', e); }
      }
    });
    next();
  };
