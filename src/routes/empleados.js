// ============================================================================
// RUTAS: Empleados (CORREGIDO - Agregado rol Control Asistencia ID: 2)
// ============================================================================
const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');
const { audit } = require('../middleware/auditMiddleware');
const ctrl = require('../controllers/empleadosController');

// ============================================================================
// RUTAS DE CONSULTA
// ============================================================================
// Admin (1), ControlAsistencia (2) y Empleado (3) pueden ver empleados
// ✅ CORREGIDO: Agregado rol 2 (ControlAsistencia)
router.get('/', verifyToken, verifyRole([1, 2, 3]), ctrl.list);

// Ver empleado por ID
// ✅ CORREGIDO: Agregado rol 2 (ControlAsistencia)
router.get('/:id', verifyToken, verifyRole([1, 2, 3]), ctrl.getById);

// ============================================================================
// RUTAS ADMINISTRATIVAS (solo Admin)
// ============================================================================
// Crear empleado - Solo Admin
router.post('/',
  verifyToken,
  verifyRole([1]),
  audit('CREATE', 'empleados', (req) => null, (req) => ({ body: req.body })),
  ctrl.create
);

// Actualizar empleado - Solo Admin
router.put('/:id',
  verifyToken,
  verifyRole([1]),
  audit('UPDATE', 'empleados', (req) => Number(req.params.id), (req) => ({ body: req.body })),
  ctrl.update
);

// Eliminar empleado - Solo Admin
router.delete('/:id',
  verifyToken,
  verifyRole([1]),
  audit('DELETE', 'empleados', (req) => Number(req.params.id)),
  ctrl.remove
);

module.exports = router;