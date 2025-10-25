const router = require('express').Router();
const solicitudesController = require('../controllers/solicitudesController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');

// Crear solicitud
router.post('/', 
    verifyToken, 
    verifyRole([1, 2]), 
solicitudesController.create
);

// Aprobar o rechazar solicitud
router.put('/:solicitud_id', 
    verifyToken, 
    verifyRole([1, 3, 4]), 
solicitudesController.aprobarRechazar
);

// Obtener solicitudes de un empleado
router.get('/empleado/:empleado_id', 
    verifyToken, 
    verifyRole([1, 2]), 
solicitudesController.getSolicitudesEmpleado
);

module.exports = router;
