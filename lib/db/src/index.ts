import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

// Load environment variables from .env file
config({ path: "../../.env" });

const { Pool } = pg;

// Check for Supabase database URL first, then fall back to regular DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DB_URL must be set. Please add your Supabase database connection string to the environment variables.",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

// Export Supabase client for API operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export * from "./schema";
