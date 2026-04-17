import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check
app.get('/api/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// Players endpoints
app.get('/api/players', async (req, res) => {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('id');
    
    if (error) throw error;
    res.json(players || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { name, avatar = '??' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const { data: player, error } = await supabase
      .from('players')
      .insert([{ name, avatar, total_points: 0, weekly_points: 0, games_played: 0 }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
