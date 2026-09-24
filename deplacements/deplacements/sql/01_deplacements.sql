-- Déplacements (GCORR) — vue de base de l'application deplacements/.
-- Résout chaque alerte vers une commune du découpage 2025 (admin3_communes) :
--   1. pcode nouveau ; 2. pcode ancien (2022-2023) ; 3. alias explicite ; 4. nom unique ; 5. nom + région.
-- La région affichée est TOUJOURS celle du découpage 2025, déduite de la commune résolue
-- (region_arrivee de la table source est incohérente : ex. Djibo → « Liptako » au lieu de Soum).

create or replace function public.norm_txt(t text) returns text
language sql immutable as $$
  select regexp_replace(lower(translate(coalesce(t,''),
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY')), '[^a-z]', '', 'g')
$$;

-- Alias : orthographes GCORR qui ne correspondent pas au nom admin3 (nom normalisé → pcode).
create table if not exists public.gcorr_commune_alias (
  nom_norm text primary key,
  adm3_pcode text not null references public.admin3_communes(adm3_pcode),
  commentaire text
);
insert into public.gcorr_commune_alias (nom_norm, adm3_pcode, commentaire) values
  ('sabce','BF490107','Sabsé (Koulsé)'),
  ('seguenega','BF540310','Séguénéga (Yaadga)'),
  ('gourcy','BF540403','Goursi (Yaadga)'),
  ('zeguedeguin','BF490208','Zéguédéguin (Koulsé)'),
  ('bondokuy','BF620301','Bondokui (Bankui)'),
  ('matiacoali','BF630104','Matiakoali (Goulmou)'),
  ('thiou','BF540312','Thiou du Yatenga (Yaadga), pas Thiou du Nando')
on conflict (nom_norm) do update set adm3_pcode = excluded.adm3_pcode, commentaire = excluded.commentaire;

alter table public.gcorr_commune_alias enable row level security;
drop policy if exists "anon read" on public.gcorr_commune_alias;
create policy "anon read" on public.gcorr_commune_alias for select to anon, authenticated using (true);

-- Résolution d'une commune : pcode (nouveau ou ancien), alias, nom unique, nom + région.
create or replace function public.gcorr_resolve_commune(p_pcode text, p_nom text, p_region text)
returns text language sql stable as $$
  select coalesce(
    (select adm3_pcode from public.admin3_communes where adm3_pcode = p_pcode limit 1),
    (select adm3_pcode from public.admin3_communes where adm3_pcode_old = p_pcode limit 1),
    (select adm3_pcode from public.gcorr_commune_alias where nom_norm = public.norm_txt(p_nom)),
    (select min(c.adm3_pcode) from public.admin3_communes c
       where public.norm_txt(c.adm3_name) = public.norm_txt(p_nom)
       having count(*) = 1),
    (select min(c.adm3_pcode) from public.admin3_communes c
       join public.admin1_regions r on r.adm1_pcode = c.adm1_pcode
       where public.norm_txt(c.adm3_name) = public.norm_txt(p_nom)
         and public.norm_txt(r.adm1_name) = public.norm_txt(p_region)
       having count(*) = 1)
  )
$$;

create or replace view public.v_deplacements as
with base as (
  select a.*,
    public.gcorr_resolve_commune(a.commune_arrivee_pcode, a.commune_arrivee, a.region_arrivee) as arr_pcode,
    public.gcorr_resolve_commune(a.origine_commune_pcode, a.origine_commune, a.origine_region) as org_pcode
  from public.gcorr_alerts a
)
select
  b.id, b.alerte_id, b.incident_id, b.deplacement_id,
  b.choc_date, b.choc_year as annee, b.choc_month as mois,
  b.date_diffusion, b.date_arrivee, b.created_at,
  b.type_choc, b.severite, b.description, b.besoins_prioritaires,
  -- arrivée (découpage 2025)
  b.arr_pcode,
  coalesce(c.adm3_name, b.commune_arrivee) as arr_commune,
  c.adm2_pcode as arr_adm2_pcode, p.adm2_name as arr_province,
  coalesce(c.adm1_pcode, r0.adm1_pcode) as arr_adm1_pcode,
  coalesce(r.adm1_name, b.region_arrivee) as arr_region,
  c.center_lon as arr_lon, c.center_lat as arr_lat,
  b.villages_arrivee,
  -- origine (découpage 2025)
  b.org_pcode,
  coalesce(co.adm3_name, b.origine_commune) as org_commune,
  po.adm2_name as org_province,
  co.adm1_pcode as org_adm1_pcode, ro.adm1_name as org_region,
  co.center_lon as org_lon, co.center_lat as org_lat,
  b.zone_origine_raw,
  -- effectifs
  b.pdi_menages as menages, b.pdi_personnes as personnes,
  b.hommes, b.femmes, b.garcons, b.filles,
  (co.adm1_pcode is not null and co.adm1_pcode = c.adm1_pcode) as intra_regional,
  (b.arr_pcode = b.org_pcode) as intra_communal,
  -- qualité
  (b.arr_pcode is null) as arr_non_resolue,
  (b.org_pcode is null) as org_non_resolue
from base b
left join public.admin3_communes c  on c.adm3_pcode = b.arr_pcode
left join public.admin2_provinces p on p.adm2_pcode = c.adm2_pcode
left join public.admin1_regions r   on r.adm1_pcode = c.adm1_pcode
left join public.admin1_regions r0  on public.norm_txt(r0.adm1_name) = public.norm_txt(b.region_arrivee)
left join public.admin3_communes co on co.adm3_pcode = b.org_pcode
left join public.admin2_provinces po on po.adm2_pcode = co.adm2_pcode
left join public.admin1_regions ro  on ro.adm1_pcode = co.adm1_pcode;

grant select on public.v_deplacements to anon, authenticated;
grant select on public.gcorr_commune_alias to anon, authenticated;
