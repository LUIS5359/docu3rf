const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage }).single('documento'); // Cambiar "documento" por el campo correcto en el formulario

// Subir documentos
exports.uploadDocumento = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ code: 'UPLOAD_ERROR', message: err.message });

    const { expediente_id, tipo_documento } = req.body;
    const archivo_url = `/uploads/${req.file.filename}`;
    try {
      // Verificar si expediente existe
      const [[expediente]] = await pool.execute('SELECT * FROM expedientes WHERE expediente_id=?', [expediente_id]);
      if (!expediente) return res.status(404).json({ code: 'EXPEDIENTE_NOT_FOUND', message: 'Expediente no encontrado' });

      // Guardar documento
      await pool.execute(
        'INSERT INTO documentos (expediente_id, tipo_documento, archivo_url) VALUES (?,?,?)',
        [expediente_id, tipo_documento, archivo_url]
      );

      res.status(201).json({ message: 'Documento subido correctamente' });
    } catch (err) {
      next(err);
    }
  });
};
