exports.verifyRole = (rolesPermitidos = []) => (req, res, next) => {
  if (!req.user?.rol_id || !rolesPermitidos.includes(req.user.rol_id)) {
    return res.status(403).json({ code:'FORBIDDEN', message:'Sin permisos' });
  }
  next();
};
