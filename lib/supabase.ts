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
          stance: 'left' | 'right' | 'unknown' | null;
          kumi_kata: string;
          ne_waza: string;
          weight_class: string;
          age_division: string;
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
          stance?: 'left' | 'right' | 'unknown' | null;
          kumi_kata?: string;
          ne_waza?: string;
          weight_class?: string;
          age_division?: string;
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
          stance?: 'left' | 'right' | 'unknown' | null;
          kumi_kata?: string;
          ne_waza?: string;
          weight_class?: string;
          age_division?: string;
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
          stance: 'left' | 'right' | 'unknown' | null;
          kumi_kata: string;
          ne_waza: string;
          common_counters: string;
          weight_class: string;
          age_division: string;
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
          stance?: 'left' | 'right' | 'unknown' | null;
          kumi_kata?: string;
          ne_waza?: string;
          common_counters?: string;
          weight_class?: string;
          age_division?: string;
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
          stance?: 'left' | 'right' | 'unknown' | null;
          kumi_kata?: string;
          ne_waza?: string;
          common_counters?: string;
          weight_class?: string;
          age_division?: string;
          created_at?: string;
          created_by?: string;
        };
      };
      coach_allowlist: {
        Row: {
          id: string;
          email: string;
          invited_by: string | null;
          invited_at: string;
          is_admin: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          invited_by?: string | null;
          invited_at?: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          invited_by?: string | null;
          invited_at?: string;
          is_admin?: boolean;
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
