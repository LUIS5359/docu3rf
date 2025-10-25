const cron = require('node-cron');
const pool = require('../config/db');

// Cron Job para verificar los expedientes incompletos
cron.schedule('0 0 * * *', async () => {
  try {
    const [expedientesIncompletos] = await pool.execute(
      'SELECT e.empleado_id, e.estado_completitud FROM expedientes e WHERE e.estado_completitud = "incompleto"'
    );
    
    expedientesIncompletos.forEach(expediente => {
      console.log(`Alerta: El expediente del empleado ${expediente.empleado_id} está incompleto.`);
      // Aquí puedes agregar la lógica para enviar un correo o crear una notificación en el sistema.
    });
  } catch (err) {
    console.error('Error al verificar expedientes incompletos', err);
  }
});


// Cron Job para verificar vencimiento de contratos
cron.schedule('0 0 * * *', async () => {
  try {
    const [contracts] = await pool.execute(
      'SELECT contrato_id, fecha_fin FROM contratos WHERE fecha_fin <= NOW() + INTERVAL 30 DAY'
    );

    contracts.forEach(contract => {
      console.log(`Alerta: El contrato ID ${contract.contrato_id} vence en 30 días o menos.`);
      // Aquí puedes agregar la lógica para enviar un correo o crear una alerta en el sistema
    });
  } catch (err) {
    console.error('Error al verificar vencimiento de contratos', err);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    const [asistencias] = await pool.execute('SELECT * FROM asistencias WHERE DATE(fecha) = CURDATE()');
    const [justificaciones] = await pool.execute('SELECT * FROM justificaciones WHERE DATE(fecha) = CURDATE()');

    // Lógica para generar reporte o guardar registros de los "libros" históricos
    console.log('Reporte de asistencia generado:', asistencias);
    console.log('Reporte de justificaciones generado:', justificaciones);
  } catch (err) {
    console.error('Error al generar el reporte de asistencias', err);
  }
});