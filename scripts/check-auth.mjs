import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vinlandsaga2003@34.117.176.22:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query(`SELECT 1 AS ok`);
  console.log('Connected!', rows[0]);

  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'auth' ORDER BY table_name
  `);
  console.log('Auth tables:', tables.rows.map(r => r.table_name).join(', '));

  const cols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'config'
  `);
  console.log('auth.config columns:', cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  await pool.end();
} catch (err) {
  console.error('Failed:', err.message);
  if (err.cause) console.error('Cause:', err.cause);
  process.exit(1);
}
