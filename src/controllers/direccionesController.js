const pool = require('../config/db');

// Crear dirección
exports.create = async (req, res) => {
  const { empleado_id, calle, numero, zona, municipio, departamento, codigo_postal } = req.body;

  try {
    await pool.execute(
      'INSERT INTO direcciones (empleado_id, calle, numero, zona, municipio, departamento, codigo_postal) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [empleado_id, calle, numero, zona, municipio, departamento, codigo_postal]
    );
    res.status(201).json({ message: 'Dirección creada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear dirección' });
  }
};

// Obtener todas las direcciones
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM direcciones');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener direcciones' });
  }
};

// Obtener dirección por empleado
exports.getByEmpleadoId = async (req, res) => {
  const { empleado_id } = req.params;

  try {
    const [rows] = await pool.execute('SELECT * FROM direcciones WHERE empleado_id = ?', [empleado_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener dirección' });
  }
};

// Actualizar dirección
exports.update = async (req, res) => {
  const { direccion_id } = req.params;
  const { calle, numero, zona, municipio, departamento, codigo_postal } = req.body;

  try {
    const [result] = await pool.execute(
      'UPDATE direcciones SET calle = ?, numero = ?, zona = ?, municipio = ?, departamento = ?, codigo_postal = ? WHERE direccion_id = ?',
      [calle, numero, zona, municipio, departamento, codigo_postal, direccion_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ message: 'Dirección actualizada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar dirección' });
  }
};

// Eliminar dirección
exports.delete = async (req, res) => {
  const { direccion_id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM direcciones WHERE direccion_id = ?', [direccion_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ message: 'Dirección eliminada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar dirección' });
  }
};
