-- Controlled technique lists for tokui-waza and opponent notes
-- Kodokan standard classification with gokyo + recognized waza

-- Techniques reference table
create table if not exists public.techniques (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('Tachi-waza', 'Ne-waza')),
  subcategory text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS (read-only for authenticated users)
alter table public.techniques enable row level security;

create policy "Authenticated users can view techniques"
  on public.techniques for select
  using (auth.role() = 'authenticated');

-- Seed Kodokan techniques (gokyo + recognized waza)
-- Category: Tachi-waza (standing techniques)

-- Subcategory: Te-waza (hand techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Seoi-nage', 'Tachi-waza', 'Te-waza', 1),
  ('Ippon-seoi-nage', 'Tachi-waza', 'Te-waza', 2),
  ('Morote-seoi-nage', 'Tachi-waza', 'Te-waza', 3),
  ('Kata-guruma', 'Tachi-waza', 'Te-waza', 4),
  ('Sukui-nage', 'Tachi-waza', 'Te-waza', 5),
  ('Tai-otoshi', 'Tachi-waza', 'Te-waza', 6),
  ('Obi-otoshi', 'Tachi-waza', 'Te-waza', 7),
  ('Seoi-otoshi', 'Tachi-waza', 'Te-waza', 8),
  ('Sumi-otoshi', 'Tachi-waza', 'Te-waza', 9),
  ('Yama-arashi', 'Tachi-waza', 'Te-waza', 10),
  ('Uki-otoshi', 'Tachi-waza', 'Te-waza', 11),
  ('Kouchi-makikomi', 'Tachi-waza', 'Te-waza', 12)
on conflict (name) do nothing;

-- Subcategory: Koshi-waza (hip techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Uki-goshi', 'Tachi-waza', 'Koshi-waza', 20),
  ('O-goshi', 'Tachi-waza', 'Koshi-waza', 21),
  ('Koshi-guruma', 'Tachi-waza', 'Koshi-waza', 22),
  ('Tsuri-komi-goshi', 'Tachi-waza', 'Koshi-waza', 23),
  ('Harai-goshi', 'Tachi-waza', 'Koshi-waza', 24),
  ('Hane-goshi', 'Tachi-waza', 'Koshi-waza', 25),
  ('Ushiro-goshi', 'Tachi-waza', 'Koshi-waza', 26),
  ('Utsuri-goshi', 'Tachi-waza', 'Koshi-waza', 27),
  ('Sode-tsurikomi-goshi', 'Tachi-waza', 'Koshi-waza', 28),
  ('Tsuri-goshi', 'Tachi-waza', 'Koshi-waza', 29)
on conflict (name) do nothing;

-- Subcategory: Ashi-waza (foot/leg techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('De-ashi-barai', 'Tachi-waza', 'Ashi-waza', 40),
  ('Hiza-guruma', 'Tachi-waza', 'Ashi-waza', 41),
  ('Sasae-tsurikomi-ashi', 'Tachi-waza', 'Ashi-waza', 42),
  ('O-soto-gari', 'Tachi-waza', 'Ashi-waza', 43),
  ('O-soto-guruma', 'Tachi-waza', 'Ashi-waza', 44),
  ('O-soto-otoshi', 'Tachi-waza', 'Ashi-waza', 45),
  ('O-uchi-gari', 'Tachi-waza', 'Ashi-waza', 46),
  ('Ko-soto-gari', 'Tachi-waza', 'Ashi-waza', 47),
  ('Ko-soto-gake', 'Tachi-waza', 'Ashi-waza', 48),
  ('Ko-uchi-gari', 'Tachi-waza', 'Ashi-waza', 49),
  ('Ashi-guruma', 'Tachi-waza', 'Ashi-waza', 50),
  ('Harai-tsurikomi-ashi', 'Tachi-waza', 'Ashi-waza', 51),
  ('Okuri-ashi-barai', 'Tachi-waza', 'Ashi-waza', 52),
  ('Uchi-mata', 'Tachi-waza', 'Ashi-waza', 53),
  ('Kosoto-gake', 'Tachi-waza', 'Ashi-waza', 54),
  ('Ouchi-barai', 'Tachi-waza', 'Ashi-waza', 55),
  ('Hane-goshi-gaeshi', 'Tachi-waza', 'Ashi-waza', 56),
  ('Harai-goshi-gaeshi', 'Tachi-waza', 'Ashi-waza', 57),
  ('Uchi-mata-gaeshi', 'Tachi-waza', 'Ashi-waza', 58),
  ('O-soto-gaeshi', 'Tachi-waza', 'Ashi-waza', 59),
  ('O-uchi-gaeshi', 'Tachi-waza', 'Ashi-waza', 60),
  ('Tsubame-gaeshi', 'Tachi-waza', 'Ashi-waza', 61),
  ('Obi-tori-gaeshi', 'Tachi-waza', 'Ashi-waza', 62)
on conflict (name) do nothing;

-- Subcategory: Ma-sutemi-waza (rear sacrifice techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Tomoe-nage', 'Tachi-waza', 'Ma-sutemi-waza', 80),
  ('Sumi-gaeshi', 'Tachi-waza', 'Ma-sutemi-waza', 81),
  ('Hikkomi-gaeshi', 'Tachi-waza', 'Ma-sutemi-waza', 82),
  ('Tawara-gaeshi', 'Tachi-waza', 'Ma-sutemi-waza', 83),
  ('Ura-nage', 'Tachi-waza', 'Ma-sutemi-waza', 84)
on conflict (name) do nothing;

-- Subcategory: Yoko-sutemi-waza (side sacrifice techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Yoko-otoshi', 'Tachi-waza', 'Yoko-sutemi-waza', 100),
  ('Yoko-gake', 'Tachi-waza', 'Yoko-sutemi-waza', 101),
  ('Yoko-guruma', 'Tachi-waza', 'Yoko-sutemi-waza', 102),
  ('Uki-waza', 'Tachi-waza', 'Yoko-sutemi-waza', 103),
  ('Tani-otoshi', 'Tachi-waza', 'Yoko-sutemi-waza', 104),
  ('Hane-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 105),
  ('Sukui-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 106),
  ('Uchi-mata-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 107),
  ('Harai-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 108),
  ('O-soto-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 109),
  ('Soto-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 110),
  ('Uchi-makikomi', 'Tachi-waza', 'Yoko-sutemi-waza', 111),
  ('Daki-wakare', 'Tachi-waza', 'Yoko-sutemi-waza', 112)
on conflict (name) do nothing;

-- Category: Ne-waza (ground techniques)

-- Subcategory: Osaekomi-waza (holding/pinning techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Kesa-gatame', 'Ne-waza', 'Osaekomi-waza', 200),
  ('Kuzure-kesa-gatame', 'Ne-waza', 'Osaekomi-waza', 201),
  ('Kata-gatame', 'Ne-waza', 'Osaekomi-waza', 202),
  ('Kami-shiho-gatame', 'Ne-waza', 'Osaekomi-waza', 203),
  ('Kuzure-kami-shiho-gatame', 'Ne-waza', 'Osaekomi-waza', 204),
  ('Yoko-shiho-gatame', 'Ne-waza', 'Osaekomi-waza', 205),
  ('Tate-shiho-gatame', 'Ne-waza', 'Osaekomi-waza', 206),
  ('Ura-gatame', 'Ne-waza', 'Osaekomi-waza', 207),
  ('Ushiro-kesa-gatame', 'Ne-waza', 'Osaekomi-waza', 208),
  ('Makura-kesa-gatame', 'Ne-waza', 'Osaekomi-waza', 209)
on conflict (name) do nothing;

-- Subcategory: Shime-waza (choking/strangling techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Nami-juji-jime', 'Ne-waza', 'Shime-waza', 220),
  ('Gyaku-juji-jime', 'Ne-waza', 'Shime-waza', 221),
  ('Kata-juji-jime', 'Ne-waza', 'Shime-waza', 222),
  ('Hadaka-jime', 'Ne-waza', 'Shime-waza', 223),
  ('Okuri-eri-jime', 'Ne-waza', 'Shime-waza', 224),
  ('Kata-ha-jime', 'Ne-waza', 'Shime-waza', 225),
  ('Sankaku-jime', 'Ne-waza', 'Shime-waza', 226),
  ('Sode-guruma-jime', 'Ne-waza', 'Shime-waza', 227),
  ('Kata-te-jime', 'Ne-waza', 'Shime-waza', 228),
  ('Ryo-te-jime', 'Ne-waza', 'Shime-waza', 229),
  ('Tsukkomi-jime', 'Ne-waza', 'Shime-waza', 230),
  ('Ryote-jime', 'Ne-waza', 'Shime-waza', 231)
on conflict (name) do nothing;

-- Subcategory: Kansetsu-waza (joint locking techniques)
insert into public.techniques (name, category, subcategory, display_order) values
  ('Ude-garami', 'Ne-waza', 'Kansetsu-waza', 240),
  ('Ude-hishigi-juji-gatame', 'Ne-waza', 'Kansetsu-waza', 241),
  ('Ude-hishigi-ude-gatame', 'Ne-waza', 'Kansetsu-waza', 242),
  ('Ude-hishigi-hiza-gatame', 'Ne-waza', 'Kansetsu-waza', 243),
  ('Ude-hishigi-waki-gatame', 'Ne-waza', 'Kansetsu-waza', 244),
  ('Ude-hishigi-hara-gatame', 'Ne-waza', 'Kansetsu-waza', 245),
  ('Ashi-garami', 'Ne-waza', 'Kansetsu-waza', 246),
  ('Ude-hishigi-te-gatame', 'Ne-waza', 'Kansetsu-waza', 247),
  ('Ude-hishigi-ashi-gatame', 'Ne-waza', 'Kansetsu-waza', 248)
on conflict (name) do nothing;

-- Index for fast lookups
create index if not exists techniques_category_subcategory_idx on public.techniques(category, subcategory);
create index if not exists techniques_name_idx on public.techniques(name);

-- Add technique_ids column to athletes for tokui-waza multi-select
alter table public.athletes add column if not exists technique_ids uuid[] default '{}';

-- Add technique_ids column to opponent_notes for technique tracking
alter table public.opponent_notes add column if not exists technique_ids uuid[] default '{}';

-- Add technique_ids column to opponents for their tokui-waza
alter table public.opponents add column if not exists technique_ids uuid[] default '{}';

-- Comments for documentation
comment on table public.techniques is 'Kodokan standard judo techniques reference (gokyo + recognized waza)';
comment on column public.athletes.technique_ids is 'Array of technique UUIDs for tokui-waza multi-select';
comment on column public.opponent_notes.technique_ids is 'Array of technique UUIDs for opponent technique notes';
comment on column public.opponents.technique_ids is 'Array of technique UUIDs for opponent tokui-waza';
