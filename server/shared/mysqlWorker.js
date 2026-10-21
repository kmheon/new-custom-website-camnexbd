const { parentPort, workerData } = require('worker_threads');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: workerData.host,
  port: workerData.port,
  user: workerData.user,
  password: workerData.password,
  database: workerData.database,
  waitForConnections: true,
  connectionLimit: workerData.connectionLimit || 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  timezone: '+06:00',
  decimalNumbers: true
});

let txConnection = null;

parentPort.on('message', async ({ port, signal, action, sql, params }) => {
  let result = null;
  let error = null;

  try {
    const conn = txConnection || pool;
    if (action === 'query') {
      const [rows] = await conn.query(sql, params || []);
      result = rows;
    } else if (action === 'execute') {
      const [res] = await conn.execute(sql, params || []);
      result = {
        changes: Number(res.affectedRows || 0),
        lastInsertRowid: res.insertId || 0
      };
    } else if (action === 'beginTransaction') {
      if (!txConnection) {
        txConnection = await pool.getConnection();
        await txConnection.beginTransaction();
      }
      result = true;
    } else if (action === 'commit') {
      if (txConnection) {
        await txConnection.commit();
        txConnection.release();
        txConnection = null;
      }
      result = true;
    } else if (action === 'rollback') {
      if (txConnection) {
        try { await txConnection.rollback(); } catch (_) {}
        txConnection.release();
        txConnection = null;
      }
      result = true;
    } else if (action === 'ping') {
      await pool.query('SELECT 1');
      result = true;
    } else if (action === 'close') {
      if (txConnection) {
        try { txConnection.release(); } catch (_) {}
        txConnection = null;
      }
      await pool.end();
      result = true;
    }
  } catch (err) {
    error = {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    };
  }

  port.postMessage({ error, result });
  Atomics.store(signal, 0, 1);
  Atomics.notify(signal, 0);
});

