-- ============================================================
-- BITÁCORA DE CUMPLIMIENTO · Esquema Supabase (Postgres)
-- Ejecutar completo en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. CATÁLOGO (seed desde catalogo_lineamientos.json)
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

create table if not exists public.lineamientos (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete cascade,
  clasificacion text not null,
  texto text not null,
  orden int not null default 0,
  unique (area_id, clasificacion, texto)
);

create index if not exists idx_lineamientos_area on public.lineamientos(area_id);

-- 2. BITÁCORAS (una por día, fecha automática al iniciar)
create table if not exists public.bitacoras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date unique,
  estado text not null default 'abierta' check (estado in ('abierta','cerrada')),
  iniciada_por uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  cerrada_at timestamptz
);

-- 3. RESPUESTAS por lineamiento
create table if not exists public.respuestas (
  id uuid primary key default gen_random_uuid(),
  bitacora_id uuid not null references public.bitacoras(id) on delete cascade,
  lineamiento_id uuid not null references public.lineamientos(id) on delete cascade,
  estado text not null default 'no_revisado' check (estado in ('cumple','no_cumple','no_revisado')),
  comentario text not null default '',
  actualizado_por uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (bitacora_id, lineamiento_id)
);

-- 4. FOTOS (Cloudinary) — regla: mínimo 2 por área por bitácora
-- lineamiento_id: NULL = foto general del área; si viene, la foto pertenece a ese punto específico
create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  bitacora_id uuid not null references public.bitacoras(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  lineamiento_id uuid references public.lineamientos(id) on delete cascade,
  url text not null,
  public_id text not null,
  comentario text not null default '',
  subido_por uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- Para bases de datos ya creadas antes de este cambio:
alter table public.fotos add column if not exists lineamiento_id uuid references public.lineamientos(id) on delete cascade;
create index if not exists idx_fotos_lineamiento on public.fotos(lineamiento_id);

create index if not exists idx_fotos_bitacora_area on public.fotos(bitacora_id, area_id);

-- Trazabilidad: quién hizo cada registro (compatible con bases ya creadas)
alter table public.bitacoras  add column if not exists usuario_email text;
alter table public.respuestas add column if not exists usuario_email text;
alter table public.fotos      add column if not exists usuario_email text;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.areas        enable row level security;
alter table public.lineamientos enable row level security;
alter table public.bitacoras    enable row level security;
alter table public.respuestas   enable row level security;
alter table public.fotos        enable row level security;

-- Cualquier usuario autenticado puede leer catálogo y registros
create policy "lectura_auth_areas"        on public.areas        for select to authenticated using (true);
create policy "lectura_auth_lineamientos" on public.lineamientos for select to authenticated using (true);
create policy "lectura_auth_bitacoras"    on public.bitacoras    for select to authenticated using (true);
create policy "lectura_auth_respuestas"   on public.respuestas   for select to authenticated using (true);
create policy "lectura_auth_fotos"        on public.fotos        for select to authenticated using (true);

-- Escritura solo para autenticados (afina por rol si usas perfiles)
create policy "insert_bitacoras"  on public.bitacoras  for insert to authenticated with check (true);
create policy "update_bitacoras"  on public.bitacoras  for update to authenticated using (true);
create policy "insert_respuestas" on public.respuestas for insert to authenticated with check (true);
create policy "update_respuestas" on public.respuestas for update to authenticated using (true);
create policy "insert_fotos"      on public.fotos      for insert to authenticated with check (true);
create policy "delete_fotos"      on public.fotos      for delete to authenticated using (true);

-- ============================================================
-- VISTA de calificaciones por bitácora / área / clasificación
-- ============================================================
create or replace view public.v_calificaciones as
select
  b.id                      as bitacora_id,
  b.fecha,
  b.estado                  as estado_bitacora,
  a.id                      as area_id,
  a.nombre                  as area,
  l.clasificacion,
  count(l.id)                                            as total_lineamientos,
  count(*) filter (where r.estado = 'cumple')             as cumple,
  count(*) filter (where r.estado = 'no_cumple')          as no_cumple,
  count(*) filter (where r.estado = 'no_revisado'
                    or r.id is null)                      as no_revisado,
  round(
    count(*) filter (where r.estado = 'cumple')::numeric
    / nullif(count(*) filter (where r.estado <> 'no_revisado' or r.id is null), 0) * 100
  , 1)                                                    as pct_cumplimiento,
  (select count(*) from public.fotos f
    where f.bitacora_id = b.id and f.area_id = a.id)       as num_fotos
from public.bitacoras b
cross join public.areas a
join public.lineamientos l on l.area_id = a.id
left join public.respuestas r
       on r.lineamiento_id = l.id and r.bitacora_id = b.id
group by b.id, b.fecha, b.estado, a.id, a.nombre, l.clasificacion;

-- ============================================================
-- VISTA de seguimiento por LINEAMIENTO (histórico completo)
-- Para graficar: puntos con menor cumplimiento, etc.
-- ============================================================
create or replace view public.v_seguimiento_lineamientos as
select
  a.nombre                          as area,
  l.clasificacion,
  l.texto                           as lineamiento,
  count(r.id) filter (where r.estado = 'cumple')    as cumple,
  count(r.id) filter (where r.estado = 'no_cumple') as no_cumple,
  count(r.id) filter (where r.estado = 'cumple' or r.estado = 'no_cumple') as evaluados,
  round(
    count(r.id) filter (where r.estado = 'cumple')::numeric
    / nullif(count(r.id) filter (where r.estado = 'cumple' or r.estado = 'no_cumple'), 0) * 100
  , 1)                              as pct_cumplimiento
from public.lineamientos l
join public.areas a on a.id = l.area_id
left join public.respuestas r on r.lineamiento_id = l.id
group by a.nombre, l.clasificacion, l.texto;

-- ============================================================
-- FUNCIÓN: cerrar bitácora (bloquea si un área tiene < 2 fotos
-- o lineamientos sin evaluar)
-- ============================================================
create or replace function public.cerrar_bitacora(p_bitacora uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  for r in
    select a.nombre,
           (select count(*) from fotos f where f.bitacora_id = p_bitacora and f.area_id = a.id) as fotos,
           (select count(*) from respuestas x join lineamientos l on l.id = x.lineamiento_id
             where x.bitacora_id = p_bitacora and l.area_id = a.id and x.estado = 'no_revisado') as sin_evaluar,
           (select count(*) from lineamientos l where l.area_id = a.id) as total
    from areas a
  loop
    if r.fotos < 2 then
      return 'ERROR: El área "' || r.nombre || '" tiene ' || r.fotos || ' foto(s). Se requieren mínimo 2.';
    end if;
    if r.sin_evaluar > 0 then
      return 'ERROR: El área "' || r.nombre || '" tiene ' || r.sin_evaluar || ' lineamiento(s) sin evaluar.';
    end if;
  end loop;
  update bitacoras set estado = 'cerrada', cerrada_at = now() where id = p_bitacora;
  return 'OK';
end $$;
