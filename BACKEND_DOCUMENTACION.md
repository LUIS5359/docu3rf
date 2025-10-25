# Documentación del Backend de Gestión RRHH

## 1. Descripción general
Este backend está construido con [Node.js](https://nodejs.org/) y [Express](https://expressjs.com/) y expone una API REST para gestionar empleados, usuarios, roles, asistencias, contratos, expedientes documentales, auditorías y solicitudes relacionadas con recursos humanos. El punto de entrada es `app.js`, donde se inicializa Express, se cargan variables de entorno y se registran middlewares globales (JSON, CORS, morgan y helmet) antes de montar todas las rutas de la API.【F:app.js†L1-L27】

La conexión a la base de datos se realiza mediante `mysql2/promise` con un `pool` compartido definido en `src/config/db.js`. El módulo crea el pool a partir de variables de entorno, expone un helper para transacciones (`withTransaction`) y ejecuta una prueba de conexión al iniciar la aplicación (salvo en entorno de pruebas).【F:src/config/db.js†L1-L44】

## 2. Configuración y variables de entorno
Crea un archivo `.env` en la raíz con, al menos, las siguientes variables:

- `PORT`: Puerto HTTP (por defecto `5000`).【F:app.js†L23-L27】
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_CONN_LIMIT`: Credenciales y parámetros del pool MySQL.【F:src/config/db.js†L5-L15】
- `JWT_SECRET`: Clave para firmar y verificar los tokens JWT utilizados en autenticación.【F:src/controllers/authController.js†L24-L32】【F:src/middleware/authMiddleware.js†L1-L13】
- `NODE_ENV`: Se usa para omitir la prueba de conexión en modo test.【F:src/config/db.js†L40-L44】
- `RAILWAY_ENVIRONMENT`: Evita terminar el proceso cuando la conexión falla en Railway.【F:src/config/db.js†L34-L39】

Instala dependencias con `npm install` y arranca el servidor con `npm start`.

## 3. Estructura de carpetas
```
app.js                   # Punto de entrada
src/
  config/db.js           # Pool de conexión MySQL
  controllers/           # Lógica de negocio por recurso
  middleware/            # Middlewares de autenticación, auditoría y errores
  routes/                # Definición de rutas Express por recurso
  utils/audit.js         # Utilidad centralizada para registrar auditorías
```

## 4. Middlewares clave

| Middleware | Ubicación | Descripción |
|------------|-----------|-------------|
| `verifyToken` | `src/middleware/authMiddleware.js` | Valida el encabezado `Authorization`, verifica el JWT y adjunta `req.user`. Devuelve `401` si falta o es inválido.【F:src/middleware/authMiddleware.js†L1-L13】 |
| `verifyRole` | `src/middleware/roleMiddleware.js` | Confirma que el rol del usuario autenticado (`rol_id`) esté en la lista permitida, respondiendo `403` en caso contrario.【F:src/middleware/roleMiddleware.js†L1-L6】 |
| `audit` | `src/middleware/auditMiddleware.js` | Registra automáticamente acciones exitosas (`2xx`) en la tabla `auditorias` utilizando la utilidad `audit.log`, incluyendo usuario, acción, tabla y detalles del request.【F:src/middleware/auditMiddleware.js†L1-L17】 |
| `errorHandler` | `src/middleware/errorHandler.js` | Captura errores no controlados, registra en consola y responde con un JSON estructurado (`code`, `message`).【F:src/middleware/errorHandler.js†L1-L5】 |

## 5. Utilidades

- `src/utils/audit.js`: Implementa `audit.log`, que inserta registros en `auditorias` con detalles en JSON serializado. Se usa desde el middleware de auditoría para centralizar la persistencia.【F:src/utils/audit.js†L1-L9】

## 6. Autenticación y autorización

- **Login (`POST /auth/login`)**: Recibe `username` y `password`, busca al usuario en la tabla `usuarios`, valida la contraseña con `bcrypt` y devuelve un JWT válido por 8 horas junto con la identidad mínima del usuario.【F:src/controllers/authController.js†L1-L37】【F:src/routes/auth.js†L1-L5】
- **Protección de rutas**: Todas las rutas protegidas incluyen `verifyToken` y, en la mayoría de los casos, `verifyRole` para filtrar por `rol_id`. Los identificadores de rol usados habitualmente son: `1` (Administrador), `2` (Control de asistencias), `3` (Empleado) y otros específicos por módulo según lo descrito más adelante.

## 7. Recursos y endpoints

### 7.1 Empleados (`/empleados`)
- `GET /empleados`: Admin, Control de asistencias y Empleados autenticados pueden listar todos los empleados.【F:src/routes/empleados.js†L11-L17】
- `GET /empleados/:id`: Recupera un empleado por ID con las mismas restricciones de rol.【F:src/routes/empleados.js†L19-L21】
- `POST /empleados`: Solo Admin crea registros; se audita la operación y admite campos opcionales (segundos nombres, correo, teléfono).【F:src/routes/empleados.js†L26-L33】【F:src/controllers/empleadosController.js†L15-L47】
- `PUT /empleados/:id`: Solo Admin actualiza; audita y valida presencia del recurso antes de modificarlo.【F:src/routes/empleados.js†L35-L42】【F:src/controllers/empleadosController.js†L49-L78】
- `DELETE /empleados/:id`: Solo Admin elimina; audita y devuelve 404 si no existe.【F:src/routes/empleados.js†L44-L52】【F:src/controllers/empleadosController.js†L80-L88】

### 7.2 Usuarios del sistema (`/usuarios`)
- `GET /usuarios`: Solo Admin lista usuarios incluyendo nombres completos de empleados y roles asociados.【F:src/routes/usuarios.js†L10-L17】【F:src/controllers/usuariosController.js†L8-L36】
- `GET /usuarios/:id`: Solo Admin obtiene detalle (incluye fechas de creación/actualización y descripción del rol).【F:src/routes/usuarios.js†L19-L23】【F:src/controllers/usuariosController.js†L38-L75】
- `POST /usuarios`: Solo Admin crea usuarios. Incluye validaciones con `express-validator`, verificaciones de existencia de empleado, unicidad de username, un usuario por empleado y hash del password antes de insertar. Audita la operación.【F:src/routes/usuarios.js†L25-L40】【F:src/controllers/usuariosController.js†L77-L147】
- `PUT /usuarios/:id`: Solo Admin actualiza rol, username y contraseña (si se envía). Revalida unicidad y re-hashea cuando corresponde, devolviendo el usuario actualizado con nombres.【F:src/routes/usuarios.js†L42-L45】【F:src/controllers/usuariosController.js†L149-L217】
- `DELETE /usuarios/:id`: Solo Admin elimina tras confirmar existencia.【F:src/routes/usuarios.js†L47-L50】【F:src/controllers/usuariosController.js†L219-L243】

### 7.3 Roles (`/roles`)
- `GET /roles`: Retorna todos los roles disponibles; requiere autenticación, sin filtrar por rol específico.【F:src/routes/rolesRoutes.js†L11-L19】【F:src/controllers/rolesController.js†L15-L38】
- `GET /roles/:id`: Devuelve un rol por identificador o `404` si no existe.【F:src/routes/rolesRoutes.js†L21-L24】【F:src/controllers/rolesController.js†L40-L61】

### 7.4 Asistencias (`/asistencias`)
- `GET /asistencias`: Admin y Control de asistencias obtienen todas las asistencias con paginación (`limit` y `offset`) y conteo total.【F:src/routes/asistencia.js†L58-L63】【F:src/controllers/asistenciaController.js†L68-L123】
- `GET /asistencias/:id`: Disponible para Admin, Control y Empleado; incluye datos básicos del empleado asociado.【F:src/routes/asistencia.js†L81-L87】【F:src/controllers/asistenciaController.js†L125-L157】
- `GET /asistencias/mias`: Empleado autenticado consulta sus propias asistencias opcionalmente filtradas por fecha.【F:src/routes/asistencia.js†L12-L18】【F:src/controllers/asistenciaController.js†L193-L230】
- `GET /asistencias/empleado/buscar`: Consulta asistencias por `empleado_id` y rango de fechas para roles autorizados.【F:src/routes/asistencia.js†L20-L26】【F:src/controllers/asistenciaController.js†L159-L189】
- `POST /asistencias/marcar`: Cualquier rol autenticado marca su asistencia; vincula usuario→empleado y maneja claves foráneas o duplicados.【F:src/routes/asistencia.js†L36-L48】【F:src/controllers/asistenciaController.js†L7-L37】
- `POST /asistencias/marcar-empleado`: Admin y Control registran asistencia para cualquier empleado tras validar existencia.【F:src/routes/asistencia.js†L50-L56】【F:src/controllers/asistenciaController.js†L39-L67】
- `PATCH /asistencias/salida`: Actualiza solo la hora de salida con validación de formato HH:MM.【F:src/routes/asistencia.js†L28-L34】【F:src/controllers/asistenciaController.js†L41-L66】
- `PUT /asistencias/:id`: Admin y Control actualizan todos los campos obligatorios y opcionales, validando existencia previa.【F:src/routes/asistencia.js†L89-L100】【F:src/controllers/asistenciaController.js†L201-L232】
- `DELETE /asistencias/:id`: Solo Admin elimina registros.【F:src/routes/asistencia.js†L102-L106】【F:src/controllers/asistenciaController.js†L234-L246】

### 7.5 Direcciones (`/direcciones`)
- `POST /direcciones`: Solo Admin crea direcciones asociadas a empleados.【F:src/routes/directorio.js†L7-L13】【F:src/controllers/direccionesController.js†L1-L18】
- `GET /direcciones`: Roles 1, 2 y 3 consultan todas las direcciones.【F:src/routes/directorio.js†L7-L13】【F:src/controllers/direccionesController.js†L20-L28】
- `GET /direcciones/:empleado_id`: Mismos roles consultan direcciones por empleado.【F:src/routes/directorio.js†L9-L13】【F:src/controllers/direccionesController.js†L30-L45】
- `PUT /direcciones/:direccion_id` y `DELETE /direcciones/:direccion_id`: Solo Admin actualiza o elimina, devolviendo 404 cuando el recurso no existe.【F:src/routes/directorio.js†L10-L13】【F:src/controllers/direccionesController.js†L47-L72】

### 7.6 Auditorías (`/auditorias`)
- `GET /auditorias`: Solo Admin puede consultar registros de auditoría con filtros opcionales `from`, `to`, `page` y `limit`. Los resultados se ordenan por fecha descendente.【F:src/routes/auditorias.js†L1-L12】【F:src/controllers/auditoriaController.js†L1-L17】

### 7.7 Expedientes y documentos (`/expedientes`, `/documentos`)
- `GET /expedientes/:id`: Solo Admin obtiene el expediente, documentos asociados y estado de completitud de un empleado.【F:src/routes/expedientes.js†L1-L12】【F:src/controllers/expedientesController.js†L1-L26】
- `POST /expedientes/:id/documentos`: Solo Admin sube un documento lógico al expediente, recalculando el estado según documentos obligatorios (DPI, Antecedentes, Contrato).【F:src/routes/expedientes.js†L14-L18】【F:src/controllers/expedientesController.js†L28-L53】
- `GET /expedientes/:id/faltantes`: Solo Admin consulta los documentos faltantes en el expediente.【F:src/routes/expedientes.js†L20-L24】【F:src/controllers/expedientesController.js†L55-L72】
- `POST /documentos/upload`: Solo Admin sube archivos físicos mediante `multer`, vinculándolos a expedientes existentes.【F:src/routes/documentos.js†L1-L12】【F:src/controllers/documentosController.js†L1-L33】

### 7.8 Contratos (`/contratos`)
- `POST /contratos`: Solo Admin crea contratos asegurando unicidad del número e insertando fechas y archivos opcionales.【F:src/routes/contratos.js†L1-L12】【F:src/controllers/contratosController.js†L1-L23】
- `GET /contratos/:id`: Solo Admin obtiene un contrato por ID.【F:src/routes/contratos.js†L13-L18】【F:src/controllers/contratosController.js†L25-L36】
- `GET /contratos/vencimiento/:id`: Solo Admin consulta si el contrato vence en ≤30 días, retornando mensajes informativos.【F:src/routes/contratos.js†L25-L30】【F:src/controllers/contratosController.js†L38-L57】
- `PUT /contratos/:id` y `DELETE /contratos/:id`: Solo Admin actualiza o elimina contratos existentes.【F:src/routes/contratos.js†L19-L24】【F:src/controllers/contratosController.js†L59-L92】

### 7.9 Solicitudes (`/solicitudes`)
- `POST /solicitudes`: Roles Admin y Control registran solicitudes de permisos o vacaciones. Se valida anticipación mínima de 7 días y antigüedad ≥1 año para vacaciones.【F:src/routes/solicitudes.js†L1-L12】【F:src/controllers/solicitudesController.js†L1-L36】
- `PUT /solicitudes/:solicitud_id`: Roles 1, 3 y 4 pueden aprobar o rechazar solicitudes, registrando la acción en bitácora.【F:src/routes/solicitudes.js†L13-L18】【F:src/controllers/solicitudesController.js†L38-L58】
- `GET /solicitudes/empleado/:empleado_id`: Roles 1 y 2 consultan el historial de solicitudes de un empleado.【F:src/routes/solicitudes.js†L19-L24】【F:src/controllers/solicitudesController.js†L60-L67】

## 8. Auditoría y trazabilidad
Cada ruta que invoca el middleware `audit` registra automáticamente la acción en la tabla `auditorias`, capturando usuario, acción (`CREATE`, `UPDATE`, `DELETE`), tabla afectada, ID del registro (si aplica) y un JSON con detalles relevantes del request. La utilidad `audit.log` centraliza la inserción en base de datos.【F:src/middleware/auditMiddleware.js†L1-L17】【F:src/utils/audit.js†L1-L9】

## 9. Manejo de errores y respuestas
Los controladores devuelven códigos HTTP semánticos (`401` por credenciales inválidas, `404` para recursos inexistentes, `409` por conflictos como duplicados) y mensajes estructurados (`code`, `message`). El `errorHandler` global captura errores no controlados para evitar fugas de información y mantener un formato de respuesta uniforme.【F:src/controllers/authController.js†L17-L32】【F:src/controllers/asistenciaController.js†L23-L124】【F:src/middleware/errorHandler.js†L1-L5】

## 10. Buenas prácticas adicionales
- Validaciones con `express-validator` en rutas de asistencias y usuarios garantizan formatos de fecha/hora y contraseñas seguras.【F:src/routes/asistencia.js†L28-L101】【F:src/routes/usuarios.js†L25-L39】
- `helmet` y `cors` están habilitados globalmente en `app.js` para reforzar seguridad HTTP y permitir acceso desde frontends autorizados.【F:app.js†L1-L15】
- `morgan('dev')` facilita monitoreo de solicitudes durante el desarrollo.【F:app.js†L1-L15】

Esta documentación cubre todos los módulos y rutas expuestas por el backend, detallando responsabilidades, restricciones de acceso y validaciones aplicadas en cada punto.
