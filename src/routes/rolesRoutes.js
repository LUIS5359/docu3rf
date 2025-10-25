// ============================================================================
// ROLES ROUTES
// Rutas para gestionar roles de usuario
// ============================================================================

const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/rolesController');

/**
 * @route   GET /api/roles
 * @desc    Obtiene todos los roles
 * @access  Private (requiere autenticación)
 */
router.get('/', verifyToken, ctrl.getRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtiene un rol por ID
 * @access  Private (requiere autenticación)
 */
router.get('/:id', verifyToken, ctrl.getRolById);

module.exports = router;