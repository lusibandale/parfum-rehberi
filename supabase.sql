-- 1) TABLOLAR
create table categories (id uuid primary key default gen_random_uuid(), name text not null, position int default 0);
create table options (id uuid primary key default gen_random_uuid(), category_id uuid references categories(id) on delete cascade, label text not null, position int default 0);
create table perfumes (id uuid primary key default gen_random_uuid(), name text not null, brand text, description text, image_url text, notes text[] default '{}', created_at timestamptz default now());
create table perfume_options (perfume_id uuid references perfumes(id) on delete cascade, option_id uuid references options(id) on delete cascade, primary key (perfume_id, option_id));

-- 2) GÜVENLİK: herkes okur, sadece giriş yapmış admin yazar
alter table categories enable row level security;
alter table options enable row level security;
alter table perfumes enable row level security;
alter table perfume_options enable row level security;
create policy "oku" on categories for select using (true);
create policy "oku" on options for select using (true);
create policy "oku" on perfumes for select using (true);
create policy "oku" on perfume_options for select using (true);
create policy "yaz" on categories for all to authenticated using (true) with check (true);
create policy "yaz" on options for all to authenticated using (true) with check (true);
create policy "yaz" on perfumes for all to authenticated using (true) with check (true);
create policy "yaz" on perfume_options for all to authenticated using (true) with check (true);

-- 3) VARSAYILAN VERİ
do $$ declare r record; cid uuid; pos int := 0;
begin
for r in select * from (values
 ('Cinsiyet', array['Kadın','Erkek','Unisex']),
 ('Yaş Aralığı', array['18–24','25–34','35–44','45+']),
 ('Mevsim / Hava', array['Yazlık','Kışlık','4 Mevsim']),
 ('Kullanım Yeri', array['Work (Ofis/okul)','Everyday (Günlük/rahat)','Formal (Özel davet)','Night Out (Gece dışarı/parti)']),
 ('Ana Akordlar', array['Fresh','Çiçeksi','Tatlı','Baharatlı','Odunsu','Meyveli','Yeşil','Amber/Oryantal','Deri & Tütün','Aromatik'])
) as t(name, opts) loop
  pos := pos + 1;
  insert into categories(name, position) values (r.name, pos) returning id into cid;
  insert into options(category_id, label, position) select cid, o, n from unnest(r.opts) with ordinality as u(o, n);
end loop; end $$;
