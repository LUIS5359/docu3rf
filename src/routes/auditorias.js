const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/auditoriaController');

router.get('/',
  verifyToken,
  verifyRole([1]),          // Solo Administrador
  ctrl.list
);

module.exports = router;
