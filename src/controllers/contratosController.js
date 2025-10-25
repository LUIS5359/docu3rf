const pool = require('../config/db');

// Crear contrato
exports.create = async (req, res) => {
  const { empleado_id, tipo_contrato, numero_contrato, fecha_inicio, fecha_fin, archivo_ruta } = req.body;

  try {
    // Verificar que el número de contrato sea único
    const [existingContract] = await pool.execute('SELECT * FROM contratos WHERE numero_contrato = ?', [numero_contrato]);
    if (existingContract.length > 0) {
      return res.status(400).json({ message: 'Número de contrato ya existe' });
    }

    // Insertar nuevo contrato
    await pool.execute(
      'INSERT INTO contratos (empleado_id, tipo_contrato, numero_contrato, fecha_inicio, fecha_fin, archivo_ruta) VALUES (?, ?, ?, ?, ?, ?)',
      [empleado_id, tipo_contrato, numero_contrato, fecha_inicio, fecha_fin || null, archivo_ruta || null]
    );

    res.status(201).json({ message: 'Contrato creado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear contrato' });
  }
};

// Obtener contrato por ID
exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const [contract] = await pool.execute('SELECT * FROM contratos WHERE contrato_id = ?', [id]);
    if (contract.length === 0) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json(contract[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener contrato' });
  }
};

// Verificar vencimiento del contrato (alerta 30 días antes)
exports.checkExpiry = async (req, res) => {
  const { id } = req.params;

  try {
    const [contract] = await pool.execute('SELECT fecha_fin FROM contratos WHERE contrato_id = ?', [id]);
    if (contract.length === 0) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    const fechaFin = contract[0].fecha_fin;
    const today = new Date();
    const diffTime = new Date(fechaFin) - today;
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays <= 30) {
      return res.status(200).json({ message: `El contrato vence en ${Math.ceil(diffDays)} días` });
    }

    res.status(200).json({ message: 'El contrato no está próximo a vencer' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al verificar vencimiento de contrato' });
  }
};

// Actualizar contrato
exports.update = async (req, res) => {
  const { id } = req.params;
  const { tipo_contrato, numero_contrato, fecha_inicio, fecha_fin, archivo_ruta } = req.body;

  try {
    const [result] = await pool.execute(
      'UPDATE contratos SET tipo_contrato=?, numero_contrato=?, fecha_inicio=?, fecha_fin=?, archivo_ruta=? WHERE contrato_id=?',
      [tipo_contrato, numero_contrato, fecha_inicio, fecha_fin || null, archivo_ruta || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json({ message: 'Contrato actualizado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar contrato' });
  }
};

// Eliminar contrato
exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM contratos WHERE contrato_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json({ message: 'Contrato eliminado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar contrato' });
  }
};
