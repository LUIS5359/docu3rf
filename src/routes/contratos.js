const router = require('express').Router();
const contratosController = require('../controllers/contratosController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole } = require('../middleware/roleMiddleware');

// Solo Admin puede crear, leer, actualizar o eliminar contratos
router.post('/', 
  verifyToken,
   verifyRole([1]),
    contratosController.create
  );

router.get('/:id', 
  verifyToken,
   verifyRole([1]),
    contratosController.getById
  );

router.put('/:id', 
  verifyToken,
   verifyRole([1]),
    contratosController.update
  );

router.delete('/:id', 
  verifyToken,
   verifyRole([1]),
    contratosController.remove
  );

router.get('/vencimiento/:id', 
  verifyToken,
   verifyRole([1]),
    contratosController.checkExpiry
  );

module.exports = router;
