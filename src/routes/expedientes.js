const router = require('express').Router();
const expedienteController = require('../controllers/expedientesController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');

// Consultar expediente de un empleado
router.get('/:id', 
  verifyToken, 
  verifyRole([1]), 
  expedienteController.getExpediente
);

// Subir documento a expediente
router.post('/:id/documentos', 
  verifyToken, 
  verifyRole([1]), 
  expedienteController.uploadDocumentos
);

// Obtener documentos faltantes
router.get('/:id/faltantes', 
  verifyToken, 
  verifyRole([1]), 
  expedienteController.getFaltantes
);

module.exports = router;
