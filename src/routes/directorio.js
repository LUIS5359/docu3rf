const router = require('express').Router();
const direccionesController = require('../controllers/direccionesController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');

// Rutas protegidas por rol
router.post('/', verifyToken, verifyRole([1]), direccionesController.create);  // Solo Admin puede crear
router.get('/', verifyToken, verifyRole([1, 2, 3]), direccionesController.getAll);  // Cualquier usuario puede leer
router.get('/:empleado_id', verifyToken, verifyRole([1, 2, 3]), direccionesController.getByEmpleadoId);  // Solo Admin, ControlAsistencia, o el propio empleado
router.put('/:direccion_id', verifyToken, verifyRole([1]), direccionesController.update);  // Solo Admin puede actualizar
router.delete('/:direccion_id', verifyToken, verifyRole([1]), direccionesController.delete);  // Solo Admin puede eliminar

module.exports = router;
