const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');


// ============================================================================
// OBTENER TODOS LOS USUARIOS (con nombres de empleado y rol)
// ============================================================================
exports.getAll = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.usuario_id AS id,
        u.empleado_id,
        u.rol_id,
        u.username,
        CONCAT(
          e.primer_nombre, 
          ' ',
          COALESCE(e.segundo_nombre, ''),
          ' ',
          e.primer_apellido,
          ' ',
          COALESCE(e.segundo_apellido, '')
        ) AS empleado_nombre,
        r.nombre AS rol_nombre
      FROM usuarios u
      LEFT JOIN empleados e ON u.empleado_id = e.empleado_id
      LEFT JOIN roles r ON u.rol_id = r.rol_id
      ORDER BY u.usuario_id DESC
    `;
    
    const [usuarios] = await pool.execute(query);
    res.status(200).json(usuarios);
    
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    next(err);
  }
};

// ============================================================================
// OBTENER UN USUARIO POR ID (con nombres de empleado y rol)
// ============================================================================
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        u.usuario_id AS id,
        u.empleado_id,
        u.rol_id,
        u.username,
        u.created_at,
        u.updated_at,
        CONCAT(
          e.primer_nombre, 
          ' ',
          COALESCE(e.segundo_nombre, ''),
          ' ',
          e.primer_apellido,
          ' ',
          COALESCE(e.segundo_apellido, '')
        ) AS empleado_nombre,
        r.nombre AS rol_nombre,
        r.descripcion AS rol_descripcion
      FROM usuarios u
      LEFT JOIN empleados e ON u.empleado_id = e.empleado_id
      LEFT JOIN roles r ON u.rol_id = r.rol_id
      WHERE u.usuario_id = ?
    `;
    
    const [[usuario]] = await pool.execute(query, [id]);

    if (!usuario) {
      return res.status(404).json({ 
        code: 'USER_NOT_FOUND', 
        message: 'Usuario no encontrado' 
      });
    }

    res.status(200).json(usuario);
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// CREAR USUARIO
// ============================================================================
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        errors: errors.array() 
      });
    }

    const { empleado_id, rol_id, username, password } = req.body;

    // 1) Verificar que el empleado existe
    const [[emp]] = await pool.execute(
      'SELECT empleado_id FROM empleados WHERE empleado_id = ?',
      [empleado_id]
    );
    
    if (!emp) {
      return res.status(404).json({ 
        code: 'EMP_NOT_FOUND', 
        message: 'Empleado no existe' 
      });
    }

    // 2) Evitar duplicados (por username)
    const [[uByUser]] = await pool.execute(
      'SELECT usuario_id FROM usuarios WHERE username = ?',
      [username]
    );
    
    if (uByUser) {
      return res.status(409).json({ 
        code: 'USERNAME_TAKEN', 
        message: 'Username en uso' 
      });
    }

    // 3) Verificar que el empleado no tenga ya un usuario
    const [[uByEmp]] = await pool.execute(
      'SELECT usuario_id FROM usuarios WHERE empleado_id = ?',
      [empleado_id]
    );
    
    if (uByEmp) {
      return res.status(409).json({ 
        code: 'USER_ALREADY_EXISTS', 
        message: 'Empleado ya tiene usuario' 
      });
    }

    // 4) Hash de contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 5) Insertar usuario
    const [result] = await pool.execute(
      `INSERT INTO usuarios (empleado_id, rol_id, username, password_hash)
       VALUES (?, ?, ?, ?)`,
      [empleado_id, rol_id, username, password_hash]
    );

    // 6) Obtener el usuario recién creado con los nombres
    const query = `
      SELECT 
        u.usuario_id AS id,
        u.empleado_id,
        u.rol_id,
        u.username,
        CONCAT(
          e.primer_nombre, 
          ' ',
          COALESCE(e.segundo_nombre, ''),
          ' ',
          e.primer_apellido,
          ' ',
          COALESCE(e.segundo_apellido, '')
        ) AS empleado_nombre,
        r.nombre AS rol_nombre
      FROM usuarios u
      LEFT JOIN empleados e ON u.empleado_id = e.empleado_id
      LEFT JOIN roles r ON u.rol_id = r.rol_id
      WHERE u.usuario_id = ?
    `;
    
    const [[usuario]] = await pool.execute(query, [result.insertId]);

    res.status(201).json({ 
      message: 'Usuario creado',
      usuario: usuario
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// ACTUALIZAR USUARIO
// ============================================================================
exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { rol_id, username, password } = req.body;

    // 1) Verificar que el usuario existe
    const [[usuario]] = await pool.execute(
      'SELECT * FROM usuarios WHERE usuario_id = ?', 
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ 
        code: 'USER_NOT_FOUND', 
        message: 'Usuario no encontrado' 
      });
    }

    // 2) Verificar que el username esté disponible (excepto para el usuario actual)
    const [[existingUsername]] = await pool.execute(
      'SELECT usuario_id FROM usuarios WHERE username = ? AND usuario_id != ?',
      [username, id]
    );
    
    if (existingUsername) {
      return res.status(409).json({ 
        code: 'USERNAME_TAKEN', 
        message: 'Username en uso' 
      });
    }

    // 3) Si hay un nuevo password, lo hasheamos
    let password_hash = usuario.password_hash;
    if (password && password.trim() !== '') {
      password_hash = await bcrypt.hash(password, 10);
    }

    // 4) Actualizar usuario
    await pool.execute(
      'UPDATE usuarios SET rol_id = ?, username = ?, password_hash = ? WHERE usuario_id = ?',
      [rol_id, username, password_hash, id]
    );

    // 5) Obtener el usuario actualizado con los nombres
    const query = `
      SELECT 
        u.usuario_id AS id,
        u.empleado_id,
        u.rol_id,
        u.username,
        CONCAT(
          e.primer_nombre, 
          ' ',
          COALESCE(e.segundo_nombre, ''),
          ' ',
          e.primer_apellido,
          ' ',
          COALESCE(e.segundo_apellido, '')
        ) AS empleado_nombre,
        r.nombre AS rol_nombre
      FROM usuarios u
      LEFT JOIN empleados e ON u.empleado_id = e.empleado_id
      LEFT JOIN roles r ON u.rol_id = r.rol_id
      WHERE u.usuario_id = ?
    `;
    
    const [[usuarioActualizado]] = await pool.execute(query, [id]);

    res.status(200).json({ 
      message: 'Usuario actualizado',
      usuario: usuarioActualizado
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// ELIMINAR USUARIO
// ============================================================================
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[usuario]] = await pool.execute(
      'SELECT * FROM usuarios WHERE usuario_id = ?', 
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ 
        code: 'USER_NOT_FOUND', 
        message: 'Usuario no encontrado' 
      });
    }

    await pool.execute('DELETE FROM usuarios WHERE usuario_id = ?', [id]);

    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
};