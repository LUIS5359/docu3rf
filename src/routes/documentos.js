const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/documentosController');

// Subir documentos
router.post('/upload', 
  verifyToken, 
  verifyRole([1]), 
  ctrl.uploadDocumento
);

module.exports = router;
