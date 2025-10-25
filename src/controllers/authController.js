const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Log de las credenciales recibidas
  console.log('Credenciales recibidas:', { username, password });

  // Modificación de la consulta SQL para solo obtener los campos necesarios
  const [[user]] = await pool.execute(
    'SELECT usuario_id, rol_id, username, password_hash FROM usuarios WHERE username=?',
    [username]
  );
  
  // Verificar si el usuario existe
  if (!user) return res.status(401).json({ code:'BAD_CREDENTIALS', message:'Usuario/clave inválidos' });

  // Comparar la contraseña
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ code:'BAD_CREDENTIALS', message:'Usuario/clave inválidos' });

  // Crear el token JWT
  const token = jwt.sign({
    usuario_id: user.usuario_id,
    username: user.username,  
    rol_id: user.rol_id
  }, process.env.JWT_SECRET, { expiresIn: '8h' });



  // Enviar la respuesta con el token y los datos del usuario (solo id, username y rol_id)
  res.json({
    token,
    usuario: {
      id: user.usuario_id,  
      username: user.username, 
      rol_id: user.rol_id
    }
  });
};
