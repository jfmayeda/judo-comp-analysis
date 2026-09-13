import { createBrowserClient } from '@supabase/ssr';

export type Database = {
  public: {
    Tables: {
      athletes: {
        Row: {
          id: string;
          first_name: string;
          last_initial: string;
          tokui_waza: string;
          development_areas: string;
          notes: string;
          created_at: string;
          updated_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_initial: string;
          tokui_waza?: string;
          development_areas?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_initial?: string;
          tokui_waza?: string;
          development_areas?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
      };
      opponent_notes: {
        Row: {
          id: string;
          athlete_id: string;
          opponent_label: string;
          club: string | null;
          notes: string;
          tournament: string | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          opponent_label: string;
          club?: string | null;
          notes: string;
          tournament?: string | null;
          created_at?: string;
          created_by?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          opponent_label?: string;
          club?: string | null;
          notes?: string;
          tournament?: string | null;
          created_at?: string;
          created_by?: string;
        };
      };
    };
  };
};

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check .env.local file.');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
