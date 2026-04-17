import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { CreatePlayerBody, GetPlayerParams } from "@workspace/api-zod";
import bcrypt from "bcryptjs"

const router: IRouter = Router();

router.get("/players", async (req, res): Promise<void> => {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, avatar, total_points, weekly_points, games_played, created_at, updated_at')
    .order('id');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(players || []);
});

// Search players by name
router.get("/players/search/:query", async (req, res): Promise<void> => {
  const query = req.params.query;
  if (!query || query.length < 2) {
    res.status(400).json({ error: "Search query must be at least 2 characters" });
    return;
  }

  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, avatar, total_points, weekly_points, games_played, created_at, updated_at')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(players || []);
});

// Login/Register endpoint
router.post("/players/auth", async (req, res): Promise<void> => {
  const { name, password, avatar } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters" });
    return;
  }

  const trimmedName = name.trim();

  // Try to find existing player
  const { data: existingPlayer, error: findError } = await supabase
    .from('players')
    .select('id, name, avatar, password_hash')
    .eq('name', trimmedName)
    .single();

  if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
    res.status(500).json({ error: findError.message });
    return;
  }

  if (existingPlayer) {
    // Verify password
    const isValidPassword = await bcrypt.compare(password, existingPlayer.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    // Return existing player data
    res.json({
      player: {
        id: existingPlayer.id,
        name: existingPlayer.name,
        avatar: existingPlayer.avatar
      },
      isNew: false
    });
    return;
  }

  // Create new player with hashed password
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert({
        name: trimmedName,
        password_hash: hashedPassword,
        avatar: avatar || "🎮"
      })
      .select('id, name, avatar')
      .single();

    if (createError) {
      res.status(500).json({ error: createError.message });
      return;
    }

    res.status(201).json({
      player: newPlayer,
      isNew: true
    });
  } catch (hashError) {
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.post("/players", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert(parsed.data)
    .select('id, name, avatar, total_points, weekly_points, games_played, created_at, updated_at')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(player);
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const params = GetPlayerParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: player, error } = await supabase
    .from('players')
    .select('id, name, avatar, total_points, weekly_points, games_played, created_at, updated_at')
    .eq('id', params.data.id)
    .single();

  if (error || !player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json(player);
});

export default router;
