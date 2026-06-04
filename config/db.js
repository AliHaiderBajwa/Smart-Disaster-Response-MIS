const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'DisasterMIS',
    user: process.env.DB_USER || 'disasteradmin',
    password: process.env.DB_PASSWORD || 'Admin@123',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('✅ Connected to SQL Server - DisasterMIS database');
        } catch(err) {
            console.log('❌ DB Connection Error:', err.message);
            throw err;
        }
    }
    return pool;
}

module.exports = { getPool, sql };
