import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vinlandsaga2003@db.jxpuhxepcmztrksnuite.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

try {
  // Disable email confirmation in Supabase Auth config
  await pool.query(`
    UPDATE auth.config
    SET confirm_email = false
    WHERE id = (SELECT id FROM auth.config LIMIT 1);
  `);
  console.log('✓ Email confirmation disabled');

  // Verify
  const { rows } = await pool.query(`SELECT confirm_email FROM auth.config LIMIT 1`);
  console.log(`  confirm_email = ${rows[0].confirm_email}`);

  await pool.end();
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
