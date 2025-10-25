const pool = require('../config/db');

exports.list = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM empleados ORDER BY empleado_id DESC');
  res.json(rows);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const [[row]] = await pool.execute('SELECT * FROM empleados WHERE empleado_id=?', [id]);
  if (!row) return res.status(404).json({ code:'NOT_FOUND', message:'Empleado no encontrado' });
  res.json(row);
};

exports.create = async (req, res) => {
  const {
    dpi,
    primer_nombre,
    segundo_nombre,
    tercer_nombre,
    primer_apellido,
    segundo_apellido,
    tercer_apellido,
    correo,
    telefono,
    fecha_ingreso
  } = req.body;

  try {
    await pool.execute(
      `INSERT INTO empleados (
        dpi, primer_nombre, segundo_nombre, tercer_nombre, primer_apellido, segundo_apellido, tercer_apellido, correo, telefono, fecha_ingreso
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        dpi,
        primer_nombre,
        segundo_nombre || null,
        tercer_nombre || null,
        primer_apellido,
        segundo_apellido || null,
        tercer_apellido || null,
        correo || null,
        telefono || null,
        fecha_ingreso || null
      ]
    );

    res.status(201).json({ message: 'Empleado creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el empleado' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    primer_nombre,
    segundo_nombre,
    tercer_nombre,
    primer_apellido,
    segundo_apellido,
    tercer_apellido,
    correo,
    telefono,
    fecha_ingreso
  } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE empleados SET 
        primer_nombre=?, segundo_nombre=?, tercer_nombre=?, primer_apellido=?, segundo_apellido=?, tercer_apellido=?, correo=?, telefono=?, fecha_ingreso=?
      WHERE empleado_id=?`,
      [
        primer_nombre,
        segundo_nombre || null,
        tercer_nombre || null,
        primer_apellido,
        segundo_apellido || null,
        tercer_apellido || null,
        correo || null,
        telefono || null,
        fecha_ingreso || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.json({ message: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el empleado' });
  }
};


exports.remove = async (req, res) => {
  const { id } = req.params;
  const [r] = await pool.execute('DELETE FROM empleados WHERE empleado_id=?', [id]);
  if (r.affectedRows === 0) return res.status(404).json({ code:'NOT_FOUND', message:'Empleado no encontrado' });
  res.json({ message: 'Empleado eliminado' });
};
