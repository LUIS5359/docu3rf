// ============================================================================
// CONTROLADOR: Asistencias (COMPLETO Y CORREGIDO)
// ============================================================================
const pool = require('../config/db');
const { validationResult } = require('express-validator');

// CREATE - Registrar entrada/salida (empleado se obtiene desde el token → usuario_id → empleado_id)
exports.marcarAsistencia = async (req, res) => {
  const { fecha, hora_entrada, hora_salida, hora_almuerzo, hora_regreso, observaciones } = req.body;
  const usuario_id = req.user?.usuario_id;
  if (!usuario_id) return res.status(401).json({ code: 'NO_USER_IN_TOKEN', message: 'Token sin usuario_id' });

  try {
    // usuario -> empleado
    const [[u]] = await pool.execute('SELECT empleado_id FROM usuarios WHERE usuario_id = ?', [usuario_id]);
    if (!u || !u.empleado_id) {
      return res.status(400).json({ code: 'USER_WITHOUT_EMP', message: 'El usuario no está vinculado a un empleado' });
    }

    const empleado_id = u.empleado_id;

    const [result] = await pool.execute(
      `INSERT INTO asistencias
       (empleado_id, fecha, hora_entrada, hora_salida, hora_almuerzo, hora_regreso, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [empleado_id, fecha, hora_entrada || null, hora_salida || null, hora_almuerzo || null, hora_regreso || null, observaciones || null]
    );

    res.status(201).json({ message: 'Asistencia registrada', asistencia_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(409).json({ code: 'FK_EMP_NOT_FOUND', message: 'Empleado inexistente (revisa la vinculación usuario-empleado)' });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ code: 'DUP_ASISTENCIA', message: 'Ya existe una asistencia para ese empleado y fecha' });
    }
    res.status(500).json({ message: 'Error al registrar asistencia', error: err.message });
  }
};

// ✅ NUEVO - Marcar asistencia de un empleado específico (para Control de Asistencias)
exports.marcarAsistenciaEmpleado = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Errores de validación', errors: errors.array() });
  }

  const { empleado_id, fecha, hora_entrada, hora_salida, hora_almuerzo, hora_regreso, observaciones } = req.body;

  try {
    // Verificar que el empleado existe
    const [empleado] = await pool.execute(
      'SELECT empleado_id FROM empleados WHERE empleado_id = ?',
      [empleado_id]
    );

    if (empleado.length === 0) {
      return res.status(404).json({ 
        code: 'EMP_NOT_FOUND', 
        message: 'El empleado especificado no existe' 
      });
    }

    // Insertar la asistencia
    const [result] = await pool.execute(
      `INSERT INTO asistencias
       (empleado_id, fecha, hora_entrada, hora_salida, hora_almuerzo, hora_regreso, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        empleado_id, 
        fecha, 
        hora_entrada, 
        hora_salida || null, 
        hora_almuerzo || null, 
        hora_regreso || null, 
        observaciones || null
      ]
    );

    res.status(201).json({ 
      message: 'Asistencia registrada exitosamente', 
      asistencia_id: result.insertId 
    });
  } catch (err) {
    console.error('Error al registrar asistencia:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        code: 'DUP_ASISTENCIA', 
        message: 'Ya existe una asistencia para ese empleado y fecha' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al registrar asistencia', 
      error: err.message 
    });
  }
};

// BONUS - Registrar solo hora de salida
exports.registrarSalida = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Errores de validación', errors: errors.array() });
  }

  const { asistencia_id, hora_salida } = req.body;

  try {
    const [result] = await pool.execute(
      'UPDATE asistencias SET hora_salida = ? WHERE asistencia_id = ?',
      [hora_salida, asistencia_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Asistencia no encontrada' });

    res.json({ message: 'Hora de salida registrada exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar hora de salida' });
  }
};

// READ - Obtener TODAS las asistencias (admin / rrhh)
// ✅ CORREGIDO: Usando interpolación directa para LIMIT/OFFSET
exports.obtenerTodasAsistencias = async (req, res) => {
  // Convertir a número inmediatamente y validar
  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);

  // Valores por defecto y validación
  if (isNaN(limit) || limit < 1) limit = 100;
  if (isNaN(offset) || offset < 0) offset = 0;

  // Limitar valores máximos para evitar sobrecarga
  if (limit > 10000) limit = 10000;

  try {
    // Usar interpolación directa para LIMIT/OFFSET (seguro porque ya están validados como números)
    const [rows] = await pool.execute(
      `SELECT a.*,
              e.primer_nombre   AS nombre,
              e.primer_apellido AS apellido,
              e.dpi             AS documento
       FROM asistencias a
       INNER JOIN empleados e ON a.empleado_id = e.empleado_id
       ORDER BY a.fecha DESC, a.hora_entrada DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    const [[countResult]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM asistencias'
    );

    res.json({
      data: rows,
      total: countResult.total,
      limit: limit,
      offset: offset
    });
  } catch (err) {
    console.error('Error al obtener asistencias:', err);
    res.status(500).json({ 
      message: 'Error al obtener asistencias', 
      error: err.message 
    });
  }
};

// READ - Obtener asistencia POR ID
// ✅ CORREGIDO: Eliminado el campo 'cargo'
exports.obtenerAsistenciaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT a.*,
              e.primer_nombre   AS nombre,
              e.primer_apellido AS apellido,
              e.dpi             AS documento
       FROM asistencias a
       INNER JOIN empleados e ON a.empleado_id = e.empleado_id
       WHERE a.asistencia_id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Asistencia no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener asistencia:', err);
    res.status(500).json({ message: 'Error al obtener asistencia', error: err.message });
  }
};

// READ - Obtener asistencias de un empleado por rango de fechas (para vistas administrativas)
exports.obtenerAsistenciasPorEmpleado = async (req, res) => {
  const { empleado_id, fecha_inicio, fecha_fin } = req.query;
  if (!empleado_id) return res.status(400).json({ message: 'Empleado ID es requerido' });

  try {
    let query = 'SELECT * FROM asistencias WHERE empleado_id = ?';
    const params = [empleado_id];

    if (fecha_inicio && fecha_fin) {
      query += ' AND fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      query += ' AND fecha >= ?';
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      query += ' AND fecha <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY fecha DESC, hora_entrada DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener asistencias' });
  }
};

// UPDATE - Actualizar asistencia
exports.actualizarAsistencia = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Errores de validación', errors: errors.array() });
  }

  const { id } = req.params;
  const { fecha, hora_entrada, hora_salida, hora_almuerzo, hora_regreso, observaciones } = req.body;

  // Validar campos obligatorios
  if (!fecha || !hora_entrada) {
    return res.status(400).json({ 
      message: 'Campos obligatorios faltantes', 
      required: ['fecha', 'hora_entrada'] 
    });
  }

  try {
    const [exists] = await pool.execute('SELECT asistencia_id FROM asistencias WHERE asistencia_id = ?', [id]);
    if (exists.length === 0) return res.status(404).json({ message: 'Asistencia no encontrada' });

    await pool.execute(
      `UPDATE asistencias 
       SET fecha = ?, hora_entrada = ?, hora_salida = ?, hora_almuerzo = ?, hora_regreso = ?, observaciones = ?
       WHERE asistencia_id = ?`,
      [fecha, hora_entrada, hora_salida || null, hora_almuerzo || null, hora_regreso || null, observaciones || null, id]
    );

    res.json({ message: 'Asistencia actualizada exitosamente' });
  } catch (err) {
    console.error('Error al actualizar asistencia:', err);
    res.status(500).json({ message: 'Error al actualizar asistencia', error: err.message });
  }
};

// DELETE - Eliminar asistencia
exports.eliminarAsistencia = async (req, res) => {
  const { id } = req.params;

  try {
    const [exists] = await pool.execute('SELECT asistencia_id FROM asistencias WHERE asistencia_id = ?', [id]);
    if (exists.length === 0) return res.status(404).json({ message: 'Asistencia no encontrada' });

    await pool.execute('DELETE FROM asistencias WHERE asistencia_id = ?', [id]);
    res.json({ message: 'Asistencia eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar asistencia' });
  }
};

// NUEVO - Mis asistencias (empleado autenticado, usando token)
exports.misAsistencias = async (req, res) => {
  const usuario_id = req.user?.usuario_id;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!usuario_id) return res.status(401).json({ code: 'NO_USER_IN_TOKEN', message: 'Token sin usuario_id' });

  try {
    const [[u]] = await pool.execute('SELECT empleado_id FROM usuarios WHERE usuario_id = ?', [usuario_id]);
    if (!u || !u.empleado_id) {
      return res.status(400).json({ code: 'USER_WITHOUT_EMP', message: 'El usuario no está vinculado a un empleado' });
    }

    const empleado_id = u.empleado_id;

    let query = `SELECT a.*
                 FROM asistencias a
                 WHERE a.empleado_id = ?`;
    const params = [empleado_id];

    if (fecha_inicio && fecha_fin) {
      query += ' AND a.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      query += ' AND a.fecha >= ?';
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      query += ' AND a.fecha <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY a.fecha DESC, a.hora_entrada DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener asistencias' });
  }
};