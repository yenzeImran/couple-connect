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

// Leaderboard endpoints
app.get("/api/leaderboard", async (req, res) => {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('total_points', { ascending: false });
    
    if (error) throw error;
    res.json(players || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leaderboard/stats", async (req, res) => {
  try {
    const { data: players } = await supabase.from('players').select('games_played');
    const totalGamesPlayed = players?.reduce((sum, p) => sum + p.games_played, 0) || 0;

    const { data: allPredictions } = await supabase.from('predictions').select('status');
    const predictionsWon = allPredictions?.filter(p => p.status === "correct").length || 0;
    const predictionsTotal = allPredictions?.filter(p => p.status !== "pending").length || 0;

    const { data: scores } = await supabase.from('shadow_duel_scores').select('score').order('score', { ascending: false });
    const shadowDuelTopScore = scores?.[0]?.score || 0;

    const { data: syncSessions } = await supabase.from('sync_up_sessions').select('*').eq('status', 'completed');
    const syncUpSessionsPlayed = syncSessions?.length || 0;

    res.json({
      totalGamesPlayed,
      predictionsWon,
      predictionsTotal,
      shadowDuelTopScore,
      syncUpSessionsPlayed,
      currentStreak: Math.floor(Math.random() * 7) + 1,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leaderboard/relationship", async (req, res) => {
  try {
    const { data: players } = await supabase.from('players').select('total_points');
    const totalXp = players?.reduce((sum, p) => sum + p.total_points, 0) || 0;
    
    // Simple relationship level calculation
    const getRelationshipLevel = (xp) => {
      if (xp < 100) return { level: 1, title: "New Couple", color: "#10b981" };
      if (xp < 500) return { level: 2, title: "Growing Together", color: "#3b82f6" };
      if (xp < 1000) return { level: 3, title: "Perfect Match", color: "#8b5cf6" };
      if (xp < 2000) return { level: 4, title: "Soulmates", color: "#ec4899" };
      return { level: 5, title: "Legendary Love", color: "#f59e0b" };
    };
    
    res.json(getRelationshipLevel(totalXp));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth endpoint
app.post("/api/players/auth", async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Find player by name
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Simple auth - just return the player (you can add password logic later)
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
