import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey?.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  const { data, error } = await supabase.from('players').select('*').limit(1);
  
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Supabase connection successful!');
    console.log('Data:', data);
  }
} catch (err) {
  console.error('Connection failed:', err.message);
}
