const express = require('express');
const cors = require('cors'); const morgan = require('morgan'); const helmet = require('helmet');
const app = express();
require('dotenv').config();
require('./src/config/db'); // inicializa pool

app.use(express.json()); app.use(cors()); app.use(morgan('dev')); app.use(helmet());

// Rutas
app.use('/auth', require('./src/routes/auth'));
app.use('/empleados', require('./src/routes/empleados'));
app.use('/direcciones', require('./src/routes/directorio'));
app.use('/auditorias', require('./src/routes/auditorias'));
app.use('/usuarios', require('./src/routes/usuarios'));
app.use('/expedientes', require('./src/routes/expedientes'));
app.use('/roles', require('./src/routes/rolesRoutes'));
app.use('/documentos', require('./src/routes/documentos'));
app.use('/contratos', require('./src/routes/contratos'));
app.use('/asistencias', require('./src/routes/asistencia'));

app.get('/', (req, res) => res.send('Backend de Gestión RRHH'));

const { errorHandler } = require('./src/middleware/errorHandler');
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
