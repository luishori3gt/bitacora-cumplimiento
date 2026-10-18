-- ============================================================
-- ACTUALIZACIÓN v2 — Ejecutar en Supabase SQL Editor
-- (después del schema.sql y seed.sql originales)
-- Incluye: severidad ponderada, acciones correctivas, multi-sitio,
-- firmas, permisos de edición de catálogo, trazabilidad.
-- ============================================================

-- 1. SEVERIDAD ponderada por lineamiento
-- Criterio típico de auditorías de inocuidad alimentaria (BRC/PrimusGFS-like):
--   critico : riesgo directo a la inocuidad (higiene, contaminación, plagas)
--   mayor   : condición/infraestructura que puede derivar en riesgo
--   menor   : orden, limpieza y disciplina operativa
alter table public.lineamientos add column if not exists severidad text not null default 'mayor'
  check (severidad in ('critico','mayor','menor'));

update public.lineamientos set severidad = case
  when clasificacion ilike '%lavado de manos%'            then 'critico'
  when clasificacion ilike '%higiene%'                    then 'critico'
  when clasificacion ilike '%contaminaci%'                then 'critico'
  when clasificacion ilike '%plagas%'                     then 'critico'
  when clasificacion ilike '%instalaciones%'              then 'mayor'
  when clasificacion ilike '%orden y limpieza%'           then 'menor'
  else 'mayor' end;

-- 2. ACCIONES CORRECTIVAS
create table if not exists public.acciones (
  id uuid primary key default gen_random_uuid(),
  bitacora_id uuid references public.bitacoras(id) on delete cascade,
  area_id uuid references public.areas(id) on delete cascade,
  lineamiento_id uuid references public.lineamientos(id) on delete set null,
  descripcion text not null,
  severidad text not null default 'mayor',
  responsable text not null default '',
  fecha_limite date,
  estatus text not null default 'abierta' check (estatus in ('abierta','en_proceso','resuelta','cancelada')),
  usuario_email text,
  created_at timestamptz not null default now(),
  cerrada_at timestamptz
);
alter table public.acciones enable row level security;
create policy "acc_select" on public.acciones for select to authenticated using (true);
create policy "acc_insert" on public.acciones for insert to authenticated with check (true);
create policy "acc_update" on public.acciones for update to authenticated using (true);
create policy "acc_delete" on public.acciones for delete to authenticated using (true);

-- 3. MULTI-SITIO + FIRMAS en bitácoras
alter table public.bitacoras add column if not exists sitio text not null default 'Accel-VPC';
alter table public.bitacoras add column if not exists firma_capturista text;
alter table public.bitacoras add column if not exists firma_nombre text;

-- 4. Trazabilidad (por si no se ejecutó antes)
alter table public.bitacoras  add column if not exists usuario_email text;
alter table public.respuestas add column if not exists usuario_email text;
alter table public.fotos      add column if not exists usuario_email text;

-- 5. PERMISOS para editar el catálogo desde la app (Admin)
create policy "admin_insert_areas"        on public.areas        for insert to authenticated with check (true);
create policy "admin_update_areas"        on public.areas        for update to authenticated using (true);
create policy "admin_delete_areas"        on public.areas        for delete to authenticated using (true);
create policy "admin_insert_lineamientos" on public.lineamientos for insert to authenticated with check (true);
create policy "admin_update_lineamientos" on public.lineamientos for update to authenticated using (true);
create policy "admin_delete_lineamientos" on public.lineamientos for delete to authenticated using (true);

-- 6. VISTA de calificaciones CON PONDERACIÓN por severidad
-- % ponderado = suma(peso * resultado) / suma(peso) solo sobre evaluados
-- pesos: critico=1.0, mayor=0.75, menor=0.5
drop view if exists public.v_calificaciones;
create view public.v_calificaciones as
select
  b.id as bitacora_id,
  b.fecha,
  b.estado as estado_bitacora,
  b.sitio,
  a.id as area_id,
  a.nombre as area,
  l.clasificacion,
  count(l.id) as total_lineamientos,
  count(*) filter (where r.estado = 'cumple') as cumple,
  count(*) filter (where r.estado = 'no_cumple') as no_cumple,
  count(*) filter (where r.estado = 'no_revisado' or r.id is null) as no_revisado,
  count(*) filter (where r.estado = 'no_cumple' and l.severidad = 'critico') as criticos_no_cumple,
  round(
    ( sum(case when r.estado = 'cumple' then
        case l.severidad when 'critico' then 1.0 when 'mayor' then 0.75 else 0.5 end
      else 0 end)::numeric
    / nullif(sum(case when r.estado in ('cumple','no_cumple') then
        case l.severidad when 'critico' then 1.0 when 'mayor' then 0.75 else 0.5 end
      else 0 end), 0)) * 100
  , 1) as pct_ponderado,
  round(
    count(*) filter (where r.estado = 'cumple')::numeric
    / nullif(count(*) filter (where r.estado in ('cumple','no_cumple')), 0) * 100
  , 1) as pct_simple,
  (select count(*) from public.fotos f where f.bitacora_id = b.id and f.area_id = a.id) as num_fotos
from public.bitacoras b
cross join public.areas a
join public.lineamientos l on l.area_id = a.id
left join public.respuestas r on r.lineamiento_id = l.id and r.bitacora_id = b.id
group by b.id, b.fecha, b.estado, b.sitio, a.id, a.nombre, l.clasificacion;

-- 7. VISTA de seguimiento por lineamiento CON severidad
drop view if exists public.v_seguimiento_lineamientos;
create view public.v_seguimiento_lineamientos as
select
  a.nombre as area,
  l.clasificacion,
  l.severidad,
  l.texto as lineamiento,
  count(r.id) filter (where r.estado = 'cumple') as cumple,
  count(r.id) filter (where r.estado = 'no_cumple') as no_cumple,
  count(r.id) filter (where r.estado in ('cumple','no_cumple')) as evaluados,
  round(
    count(r.id) filter (where r.estado = 'cumple')::numeric
    / nullif(count(r.id) filter (where r.estado in ('cumple','no_cumple')), 0) * 100
  , 1) as pct_cumplimiento
from public.lineamientos l
join public.areas a on a.id = l.area_id
left join public.respuestas r on r.lineamiento_id = l.id
group by a.nombre, l.clasificacion, l.severidad, l.texto;

-- 8. Vista de acciones correctivas (resumen)
create or replace view public.v_acciones_resumen as
select estatus, count(*) as total
from public.acciones
group by estatus;
