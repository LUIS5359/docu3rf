require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

(async () => {
  // 1) Roles
  const roles = ['Administrador', 'ControlAsistencia', 'Empleado', 'Alcalde'];
  for (const nombre of roles) {
    await pool.execute('INSERT IGNORE INTO roles (nombre) VALUES (?)', [nombre]);
  }

  // 2) Empleado admin demo (si no existe)
  let [[emp]] = await pool.execute('SELECT * FROM empleados WHERE dpi=?', ['1000000000000']);
  if (!emp) {
    await pool.execute(
      `INSERT INTO empleados (dpi, primer_nombre, primer_apellido, correo, telefono, fecha_ingreso)
       VALUES (?,?,?,?,?,?)`,
      ['1000000000000', 'Admin', 'RRHH', 'admin@demo.gt', '5555-0000', '2024-01-01']
    );
    [[emp]] = await pool.execute('SELECT * FROM empleados WHERE dpi=?', ['1000000000000']);
  }

  // 3) Usuario admin demo (si no existe)
  const [[rAdmin]] = await pool.execute('SELECT rol_id FROM roles WHERE nombre=?', ['Administrador']);
  const username = 'admin';
  const passHash = await bcrypt.hash('Admin*123', 10);
  const [[u]] = await pool.execute('SELECT * FROM usuarios WHERE username=?', [username]);
  if (!u) {
    await pool.execute(
      `INSERT INTO usuarios (empleado_id, rol_id, username, password_hash)
       VALUES (?,?,?,?)`,
      [emp.empleado_id, rAdmin.rol_id, username, passHash]
    );
  }

  console.log('Seeds OK');
  process.exit(0);
})();
