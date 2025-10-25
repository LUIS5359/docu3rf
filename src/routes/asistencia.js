// ============================================================================
// ARCHIVO: routes/asistencia.js
// ============================================================================
const router = require('express').Router();
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');
const { audit } = require('../middleware/auditMiddleware');
const ctrl = require('../controllers/asistenciaController');

// ============================================================================
// RUTAS ESPECÍFICAS (DEBEN IR PRIMERO)
// ============================================================================

// Obtener mis asistencias (empleado autenticado)
router.get('/mias',
  verifyToken,
  verifyRole([1, 2, 3]),
  ctrl.misAsistencias
);

// Buscar asistencias por empleado (admin/control)
router.get('/empleado/buscar',
  verifyToken,
  verifyRole([1, 2, 3]),
  ctrl.obtenerAsistenciasPorEmpleado
);

// Registrar solo hora de salida
router.patch('/salida',
  verifyToken,
  verifyRole([1, 2, 3]),
  body('asistencia_id').isInt({ gt: 0 }).withMessage('asistencia_id inválido'),
  body('hora_salida').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_salida inválida'),
  audit('UPDATE', 'asistencias', (req) => req.body.asistencia_id, (req) => ({ hora_salida: req.body.hora_salida })),
  ctrl.registrarSalida
);

// Marcar asistencia propia (empleado autenticado)
router.post('/marcar',
  verifyToken,
  verifyRole([1, 2, 3]),
  body('fecha').isDate().withMessage('fecha inválida'),
  body('hora_entrada').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_entrada inválida'),
  body('hora_salida').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_salida inválida'),
  body('hora_almuerzo').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_almuerzo inválida'),
  body('hora_regreso').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_regreso inválida'),
  audit('CREATE', 'asistencias', () => null, (req) => ({
    empleado_id: req.user?.empleado_id ?? null,
    fecha: req.body.fecha
  })),
  ctrl.marcarAsistencia
);

// ✅ IMPORTANTE: Marcar asistencia de un empleado específico (admin/control de asistencias)
// DEBE IR ANTES DE LAS RUTAS PARAMÉTRICAS
router.post('/marcar-empleado',
  verifyToken,
  verifyRole([1, 2]), // Solo admin y control de asistencias
  body('empleado_id').isInt({ gt: 0 }).withMessage('empleado_id inválido'),
  body('fecha').isDate().withMessage('fecha inválida'),
  body('hora_entrada').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_entrada inválida'),
  body('hora_salida').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_salida inválida'),
  body('hora_almuerzo').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_almuerzo inválida'),
  body('hora_regreso').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('hora_regreso inválida'),
  audit('CREATE', 'asistencias', () => null, (req) => ({
    empleado_id: req.body.empleado_id,
    fecha: req.body.fecha
  })),
  ctrl.marcarAsistenciaEmpleado
);

// Obtener todas las asistencias (admin/control)
router.get('/',
  verifyToken,
  verifyRole([1, 2]),
  ctrl.obtenerTodasAsistencias
);

// ============================================================================
// VALIDADOR PARA PARÁMETROS NUMÉRICOS
// ============================================================================
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  next();
});

// ============================================================================
// RUTAS PARAMÉTRICAS (DEBEN IR AL FINAL)
// ============================================================================

// Obtener asistencia por ID
router.get('/:id',
  verifyToken,
  verifyRole([1, 2, 3]),
  ctrl.obtenerAsistenciaPorId
);

// Actualizar asistencia
router.put('/:id',
  verifyToken,
  verifyRole([1, 2]),
  body('fecha').isDate().withMessage('fecha inválida'),
  body('hora_entrada').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora_entrada inválida'),
  body('hora_salida').optional({ values: 'falsy' }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora_salida inválida'),
  body('hora_almuerzo').optional({ values: 'falsy' }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora_almuerzo inválida'),
  body('hora_regreso').optional({ values: 'falsy' }).matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora_regreso inválida'),
  audit('UPDATE', 'asistencias', (req) => req.params.id, (req) => req.body),
  ctrl.actualizarAsistencia
);

// Eliminar asistencia
router.delete('/:id',
  verifyToken,
  verifyRole([1]),
  audit('DELETE', 'asistencias', (req) => req.params.id, () => ({})),
  ctrl.eliminarAsistencia
);

module.exports = router;