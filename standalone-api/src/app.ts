import express, { type Express } from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Simple logger
const logger = {
  info: (msg: any) => console.log(msg),
  error: (msg: any) => console.error(msg),
};

const app: Express = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/players", async (req, res) => {
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

app.post("/api/players", async (req, res) => {
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

export default app;
