import { db, pool } from './lib/db/src/index.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('📊 Database info:', result.rows[0]);
    
    client.release();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
