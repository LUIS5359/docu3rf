exports.errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ code: err.code || 'INTERNAL_ERROR', message: err.message || 'Error interno' });
};
