const router = require('express').Router();
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');
const { audit } = require('../middleware/auditMiddleware');
const ctrl = require('../controllers/usuariosController');

// ============================================================================
// RUTAS DE USUARIOS
// ============================================================================

// GET /api/usuarios - Obtener todos los usuarios (CON NOMBRES)
router.get('/', 
  verifyToken, 
  verifyRole([1]), 
  ctrl.getAll  // ← CAMBIADO: ahora usa ctrl.getAll
);

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', 
  verifyToken, 
  verifyRole([1]), 
  ctrl.getById
);

// POST /api/usuarios - Crear nuevo usuario
router.post('/',
  verifyToken,
  verifyRole([1]),
  // Validaciones
  body('empleado_id').isInt({ gt: 0 }).withMessage('empleado_id inválido'),
  body('rol_id').isInt({ gt: 0 }).withMessage('rol_id inválido'),
  body('username').isString().trim().isLength({ min: 4 }).withMessage('username mínimo 4 caracteres'),
  body('password')
    .isString()
    .isLength({ min: 8 }).withMessage('password mínimo 8 caracteres')
    .matches(/[a-z]/).withMessage('password debe incluir minúsculas')
    .matches(/[A-Z]/).withMessage('password debe incluir mayúsculas')
    .matches(/\d/).withMessage('password debe incluir números'),
  audit('CREATE', 'usuarios', () => null, (req) => ({ 
    empleado_id: req.body.empleado_id, 
    username: req.body.username 
  })),
  ctrl.create
);

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', 
  verifyToken, 
  verifyRole([1]), 
  ctrl.update
);

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', 
  verifyToken, 
  verifyRole([1]), 
  ctrl.delete
);

module.exports = router;