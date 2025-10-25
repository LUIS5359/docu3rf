const pool = require('../config/db');

// Consultar expediente de un empleado
exports.getExpediente = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener expediente del empleado
    const [expediente] = await pool.execute('SELECT * FROM expedientes WHERE empleado_id = ?', [id]);
    if (expediente.length === 0) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    // Obtener los documentos del expediente
    const [documentos] = await pool.execute('SELECT * FROM documentos WHERE expediente_id = ?', [expediente[0].expediente_id]);

    // Obtener el estado de completitud
    const estado = expediente[0].estado_completitud;

    res.json({
      expediente: expediente[0],
      documentos,
      estado
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener expediente' });
  }
};

// Subir documentos a un expediente
exports.uploadDocumentos = async (req, res) => {
  const { id } = req.params;  // El ID del empleado
  const { tipo_documento, archivo_ruta } = req.body;

  try {
    // Obtener el expediente del empleado
    const [expediente] = await pool.execute('SELECT * FROM expedientes WHERE empleado_id = ?', [id]);
    if (expediente.length === 0) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    // Insertar nuevo documento
    await pool.execute(
      'INSERT INTO documentos (expediente_id, tipo_documento, archivo_ruta, fecha_subida) VALUES (?, ?, ?, ?)',
      [expediente[0].expediente_id, tipo_documento, archivo_ruta, new Date()]
    );

    // Verificar si el expediente está completo
    const [faltantes] = await pool.execute('SELECT * FROM documentos WHERE expediente_id = ? AND tipo_documento NOT IN (?)', 
      [expediente[0].expediente_id, ['DPI', 'Antecedentes', 'Contrato']]);

    const estado_completitud = faltantes.length > 0 ? 'incompleto' : 'completo';

    // Actualizar el estado de completitud del expediente
    await pool.execute('UPDATE expedientes SET estado_completitud = ? WHERE expediente_id = ?', [estado_completitud, expediente[0].expediente_id]);

    res.status(201).json({ message: 'Documento subido exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al subir documento' });
  }
};

// Ver documentos faltantes en un expediente
exports.getFaltantes = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener expediente del empleado
    const [expediente] = await pool.execute('SELECT * FROM expedientes WHERE empleado_id = ?', [id]);
    if (expediente.length === 0) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    // Obtener documentos obligatorios y faltantes
    const [documentosFaltantes] = await pool.execute(
      'SELECT * FROM documentos WHERE expediente_id = ? AND tipo_documento NOT IN (?)',
      [expediente[0].expediente_id, ['DPI', 'Antecedentes', 'Contrato']]
    );

    res.json(documentosFaltantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener documentos faltantes' });
  }
};
