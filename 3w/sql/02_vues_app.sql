-- Vues lues par l'application 3w (clé anon, lecture seule). Appliquées à Supabase le 27/09/2026.
-- v_3w_orgs : référentiel des organisations (org_reference dédoublonné, type canonique).
-- v_3w_app : une ligne par période × organisation × cluster × zone ; org = organisation principale OU partenaire de mise en œuvre.
-- v_3w_pairs : couples organisation → partenaire de mise en œuvre, avec bailleurs (fiche organisation).

create or replace view public.v_3w_orgs as  WITH k AS (
         SELECT org_reference.acronym,
            org_reference.nom_complet,
            org_reference.type_organisation,
            lower(regexp_replace(unaccent(org_reference.acronym), '[^a-zA-Z0-9]'::text, ''::text, 'g'::text)) AS org_key,
            row_number() OVER (PARTITION BY (lower(regexp_replace(unaccent(org_reference.acronym), '[^a-zA-Z0-9]'::text, ''::text, 'g'::text))) ORDER BY (length(org_reference.acronym)), org_reference.acronym) AS rn
           FROM org_reference
        ), t AS (
         SELECT org_type.org_key,
            org_type.org_name,
            org_type.type_organisation
           FROM org_type
        )
 SELECT org_key,
    acronym,
    nom_complet,
        CASE
            WHEN (lower(COALESCE(type_organisation, ''::text)) ~~ '%internationale%'::text) THEN 'ONG internationale'::text
            WHEN (lower(COALESCE(type_organisation, ''::text)) ~~ '%nationale%'::text) THEN 'ONG nationale'::text
            WHEN ((lower(COALESCE(type_organisation, ''::text)) ~~ '%nations unies%'::text) OR (lower(COALESCE(type_organisation, ''::text)) ~~ '%agence%'::text)) THEN 'Nations Unies'::text
            WHEN (lower(COALESCE(type_organisation, ''::text)) ~~ 'gouvern%'::text) THEN 'Gouvernement'::text
            WHEN (lower(COALESCE(type_organisation, ''::text)) ~~ '%consortium%'::text) THEN 'Consortium'::text
            WHEN ((lower(COALESCE(type_organisation, ''::text)) ~~ '%croix%'::text) OR (lower(COALESCE(type_organisation, ''::text)) ~~ '%mcr%'::text)) THEN 'Mouvement Croix-Rouge'::text
            WHEN (type_organisation IS NULL) THEN NULL::text
            ELSE 'Autre'::text
        END AS type_org
   FROM k
  WHERE (rn = 1);;

create or replace view public.v_3w_app as  WITH parts AS (
         SELECT p.id,
            p.annee,
            p.bimestre,
            p.cluster_code,
            p.adm1_pcode,
            p.adm2_pcode,
            p.adm3_pcode,
            p.niveau_geo,
            p.communes_citees,
            p.statut,
            p.activite,
            p.personnes,
            p.menages,
            p.bailleur,
            x.role,
            TRIM(BOTH FROM x.org) AS org_brut
           FROM (partners_3w p
             CROSS JOIN LATERAL ( VALUES ('org'::text,p.organisation), ('moe'::text,p.partenaire_moe)) x(role, org))
          WHERE (COALESCE(TRIM(BOTH FROM x.org), ''::text) <> ''::text)
        ), canon AS (
         SELECT pt.id,
            pt.annee,
            pt.bimestre,
            pt.cluster_code,
            pt.adm1_pcode,
            pt.adm2_pcode,
            pt.adm3_pcode,
            pt.niveau_geo,
            pt.communes_citees,
            pt.statut,
            pt.activite,
            pt.personnes,
            pt.menages,
            pt.bailleur,
            pt.role,
            pt.org_brut,
            lower(regexp_replace(unaccent(pt.org_brut), '[^a-zA-Z0-9]'::text, ''::text, 'g'::text)) AS org_key
           FROM parts pt
        )
 SELECT c.annee,
    c.bimestre,
        CASE c.bimestre
            WHEN 'janvier-février'::text THEN 1
            WHEN 'mars-avril'::text THEN 2
            WHEN 'mai-juin'::text THEN 3
            WHEN 'juillet-août'::text THEN 4
            WHEN 'septembre-octobre'::text THEN 5
            WHEN 'novembre-décembre'::text THEN 6
            ELSE NULL::integer
        END AS bimestre_ordre,
    COALESCE(o.acronym, c.org_brut) AS org,
    COALESCE(o.acronym, c.org_brut) AS org_key_disp,
    c.org_key,
    COALESCE(o.type_org, ot.type_canon, 'Non renseigné'::text) AS type_org,
    o.nom_complet,
    c.cluster_code,
    c.adm1_pcode,
    c.adm2_pcode,
    c.adm3_pcode,
    c.niveau_geo,
    bool_or((c.role = 'org'::text)) AS principal,
    bool_or((c.role = 'moe'::text)) AS mise_en_oeuvre,
    count(DISTINCT c.id) AS activites,
    count(DISTINCT c.activite) AS types_activite,
    sum(c.personnes) AS personnes,
    string_agg(DISTINCT c.bailleur, ' | '::text) AS bailleurs,
    array_remove(array_agg(DISTINCT cc.cc), NULL::text) AS communes_citees
   FROM (((canon c
     LEFT JOIN v_3w_orgs o ON ((o.org_key = c.org_key)))
     LEFT JOIN LATERAL ( SELECT
                CASE
                    WHEN (lower(t.type_organisation) ~~ '%internationale%'::text) THEN 'ONG internationale'::text
                    WHEN (lower(t.type_organisation) ~~ '%nationale%'::text) THEN 'ONG nationale'::text
                    WHEN (lower(t.type_organisation) ~~ '%nations unies%'::text) THEN 'Nations Unies'::text
                    WHEN (lower(t.type_organisation) ~~ 'gouvern%'::text) THEN 'Gouvernement'::text
                    WHEN (lower(t.type_organisation) ~~ '%consortium%'::text) THEN 'Consortium'::text
                    WHEN (lower(t.type_organisation) ~~ '%croix%'::text) THEN 'Mouvement Croix-Rouge'::text
                    ELSE 'Autre'::text
                END AS type_canon
           FROM org_type t
          WHERE ((t.org_key = upper(c.org_brut)) OR (lower(regexp_replace(unaccent(t.org_key), '[^a-zA-Z0-9]'::text, ''::text, 'g'::text)) = c.org_key))
         LIMIT 1) ot ON (true))
     LEFT JOIN LATERAL unnest(c.communes_citees) cc(cc) ON (true))
  GROUP BY c.annee, c.bimestre, c.org_key, o.acronym, c.org_brut, o.type_org, ot.type_canon, o.nom_complet, c.cluster_code, c.adm1_pcode, c.adm2_pcode, c.adm3_pcode, c.niveau_geo;;

create or replace view public.v_3w_pairs as  WITH k AS (
         SELECT v_3w_orgs.org_key,
            v_3w_orgs.acronym
           FROM v_3w_orgs
        )
 SELECT p.annee,
        CASE p.bimestre
            WHEN 'janvier-février'::text THEN 1
            WHEN 'mars-avril'::text THEN 2
            WHEN 'mai-juin'::text THEN 3
            WHEN 'juillet-août'::text THEN 4
            WHEN 'septembre-octobre'::text THEN 5
            WHEN 'novembre-décembre'::text THEN 6
            ELSE NULL::integer
        END AS bimestre_ordre,
    COALESCE(ko.acronym, TRIM(BOTH FROM p.organisation)) AS organisation,
    COALESCE(km.acronym, NULLIF(TRIM(BOTH FROM p.partenaire_moe), ''::text)) AS partenaire_moe,
    p.cluster_code,
    string_agg(DISTINCT NULLIF(TRIM(BOTH FROM p.bailleur), ''::text), ' | '::text) AS bailleur,
    count(*) AS activites
   FROM ((partners_3w p
     LEFT JOIN k ko ON ((ko.org_key = lower(regexp_replace(unaccent(TRIM(BOTH FROM p.organisation)), '[^a-zA-Z0-9]'::text, ''::text, 'g'::text)))))
     LEFT JOIN k km ON ((km.org_key = lower(regexp_replace(unaccent(TRIM(BOTH FROM COALESCE(p.partenaire_moe, ''::text))), '[^a-zA-Z0-9]'::text, ''::text, 'g'::text)))))
  GROUP BY p.annee,
        CASE p.bimestre
            WHEN 'janvier-février'::text THEN 1
            WHEN 'mars-avril'::text THEN 2
            WHEN 'mai-juin'::text THEN 3
            WHEN 'juillet-août'::text THEN 4
            WHEN 'septembre-octobre'::text THEN 5
            WHEN 'novembre-décembre'::text THEN 6
            ELSE NULL::integer
        END, COALESCE(ko.acronym, TRIM(BOTH FROM p.organisation)), COALESCE(km.acronym, NULLIF(TRIM(BOTH FROM p.partenaire_moe), ''::text)), p.cluster_code;;

grant select on public.v_3w_orgs, public.v_3w_app, public.v_3w_pairs to anon, authenticated;
