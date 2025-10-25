const pool = require('../config/db');

// Crear solicitud de permiso o vacaciones
exports.create = async (req, res) => {
  const { empleado_id, tipo_solicitud, fecha_solicitud } = req.body;

  try {
    // Validar que el tipo de solicitud sea correcto
    if (!['permiso', 'vacaciones'].includes(tipo_solicitud)) {
      return res.status(400).json({ message: 'Tipo de solicitud inválido' });
    }

    // Validar fecha de solicitud (mínimo 1 semana de anticipación)
    const today = new Date();
    const solicitudDate = new Date(fecha_solicitud);
    const diffTime = solicitudDate - today;
    const diffDays = diffTime / (1000 * 3600 * 24);
    if (diffDays < 7) {
      return res.status(400).json({ message: 'La solicitud debe hacerse con al menos 7 días de anticipación' });
    }

    // Validar antigüedad para vacaciones (mínimo 1 año de trabajo)
    if (tipo_solicitud === 'vacaciones') {
      const [empleado] = await pool.execute('SELECT * FROM empleados WHERE empleado_id = ?', [empleado_id]);
      if (empleado.length === 0) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }
      const fechaIngreso = new Date(empleado[0].fecha_ingreso);
      const diffTime = today - fechaIngreso;
      const diffYears = diffTime / (1000 * 3600 * 24 * 365);
      if (diffYears < 1) {
        return res.status(400).json({ message: 'El empleado debe tener al menos 1 año de trabajo para solicitar vacaciones' });
      }
    }

    // Insertar solicitud en la base de datos
    await pool.execute(
      'INSERT INTO solicitudes (empleado_id, tipo_solicitud, fecha_solicitud, estado) VALUES (?, ?, ?, ?)',
      [empleado_id, tipo_solicitud, fecha_solicitud, 'pendiente']
    );

    res.status(201).json({ message: 'Solicitud creada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear solicitud' });
  }
};

// Aprobar o rechazar solicitud
exports.aprobarRechazar = async (req, res) => {
  const { solicitud_id } = req.params;
  const { accion, comentario, aprobador_id } = req.body;

  try {
    // Validar acción (aprobada, rechazada)
    if (!['aprobada', 'rechazada'].includes(accion)) {
      return res.status(400).json({ message: 'Acción inválida' });
    }

    // Actualizar estado de la solicitud
    await pool.execute('UPDATE solicitudes SET estado = ? WHERE solicitud_id = ?', [accion, solicitud_id]);

    // Registrar en la bitácora
    await pool.execute(
      'INSERT INTO bitacora (solicitud_id, aprobador_id, accion, comentario) VALUES (?, ?, ?, ?)',
      [solicitud_id, aprobador_id, accion, comentario || null]
    );

    res.status(200).json({ message: `Solicitud ${accion} correctamente` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al aprobar/rechazar solicitud' });
  }
};

// Consultar las solicitudes de un empleado
exports.getSolicitudesEmpleado = async (req, res) => {
  const { empleado_id } = req.params;

  try {
    const [rows] = await pool.execute('SELECT * FROM solicitudes WHERE empleado_id = ?', [empleado_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
};
