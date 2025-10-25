// ============================================================================
// ROLES CONTROLLER
// Controlador para gestionar operaciones relacionadas con roles
// ============================================================================

const pool = require('../config/db');

/**
 * Obtiene todos los roles disponibles en el sistema
 * @route GET /api/roles
 * @access Private (requiere autenticación)
 */

const getRoles = async (req, res) => {
  try {
    const query = `
      SELECT 
        rol_id as id,
        nombre,
        nombre as descripcion
      FROM roles
      ORDER BY rol_id ASC
    `;
    
    const result = await pool.query(query);
    
    // Para MySQL, los datos están en result[0]
    const rows = result[0] || [];
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Error al obtener los roles'
    });
  }
};

const getRolById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        rol_id as id,
        nombre,
        nombre as descripcion
      FROM roles
      WHERE rol_id = ?
    `;
    
    const result = await pool.query(query, [id]);
    const rows = result[0] || [];
    
    if (rows.length === 0) {
      return res.status(404).json({
        code: 'ROL_NOT_FOUND',
        message: 'Rol no encontrado'
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Error al obtener el rol'
    });
  }
};

module.exports = {
  getRoles,
  getRolById
};
















