# Déplacements (GCORR) — Burkina Faso (OCHA)

Application web statique servie par GitHub Pages à `assefay.github.io/bfa-humanbase/deplacements/`,
données lues dans Supabase (projet bfa-humanbase, clé anon + RLS, PostgREST).
Même structure et mêmes conventions que `../bilan/` (feuilles A4 paysage = pages imprimées).

## Produit
- 3 vues : **National** (1 feuille), **Région** (1 feuille par région, sélecteur), **Alertes** (liste, feuille haute).
  « Imprimer cette vue » = la vue affichée ; « Tout imprimer » = national + une feuille par région ayant enregistré
  des déplacements sur la période (ordre décroissant) + alertes.
- Filtres : période (préréglages Depuis le début de l'année · Mois en cours · Personnalisé, dates du/au),
  comparaison avec la même période N-1 (case à cocher), région. La période porte sur `choc_date`.
  L'état est dans l'URL (`#du=…&au=…&cmp=1&vue=region&region=BF61`) : un lien reproduit une vue.
- Cumul de la période = ce que les gens regardent ; comparaison par mois et par région avec N-1 sur la même feuille.
- Graphiques mois / régions : une ligne par mois ou région, deux barres fines, valeurs en colonnes à droite (période | N-1) ;
  la hauteur de ligne se réduit automatiquement (fitCols) pour que 12 mois + 17 régions tiennent sur la feuille.
- Couleurs : période courante bleu foncé #0074B7, période précédente bleu clair #64BDEA (charte OCHA, ne pas inverser) ;
  choroplèthe communes en bleus (1–5 000 #64BDEA, 5 001–10 000 #009EDB, > 10 000 #0074B7), aucun = blanc ;
  régions sans déplacement sur la période grisées #E6E6E6 ; flux et communes de choc en rouge #ED1847.
- Cartes en SVG inline (`data/geo_bfa.js` : admin0–3 du découpage 2025, même projection que le bilan
  x = (lon − X0) × S, y = (Y1 − lat) × S, 600 × 429,4). Feuille région : fenêtre = région + communes d'origine
  hors région (≤ 40 %), flèches origine → accueil, boucle = déplacement interne à la commune, point = commune de choc.
- Police Roboto / Roboto Condensed. Français, nombres fr-FR.

## Données (Supabase)
- Source : `gcorr_alerts` (508 alertes 2022 → 2026, chargée par ailleurs). Ne pas la modifier depuis l'app.
- Vue de l'app : `v_deplacements` (sql/01_deplacements.sql). Elle résout chaque commune d'accueil et d'origine vers
  `admin3_communes` (découpage 2025) : pcode nouveau → pcode ancien (lignes 2022-2023) → alias (`gcorr_commune_alias`)
  → nom unique → nom + région.
- **Règles de calcul alignées sur le site officiel GCORR** (unocha.my.site.com/BFARR, vérifié le 24/09/2026 : 2026 = 41 alertes,
  92 074 PDI, Sourou 25 140, Yaadga 28 445, Sirba 15 285, Bankui 11 251, Koulsé 6 384, Nakambé 4 069, Guiriko 1 500) :
  - une alerte = un `alerte_id` distinct (une alerte peut compter plusieurs communes d'accueil = plusieurs lignes ;
    les lignes 2022 n'ont pas d'alerte_id → une ligne = une alerte) ;
  - les personnes sont rattachées à la **région du choc** (`org_adm1_pcode`, découpage 2025) ; à défaut d'origine
    (4 alertes 2024), région d'accueil. `region_arrivee` de la source n'est pas utilisée (incohérente, ex. Djibo → Liptako).
  - Feuille région : toutes les alertes dont le choc est dans la région ; la carte colore aussi les communes d'accueil
    situées hors de la région (ex. Toéni → Dédougou pour le Sourou) et élargit la fenêtre pour les montrer.
- Toutes les 508 alertes ont une commune d'accueil résolue ; 4 alertes de 2024 n'ont pas de commune d'origine.
  Nouvelle orthographe GCORR non reconnue → ajouter une ligne dans `gcorr_commune_alias`, pas dans l'app.
- Noms de régions : `admin1_regions.adm1_name` est sans accents ; l'app affiche les noms de `GEO.R` (accentués), par pcode.
- L'app charge toute la vue (≈ 500 lignes) au démarrage et agrège côté client ; pas d'agrégat SQL par période.

## Structure du dossier
index.html · app.js · style.css · data/geo_bfa.js (frontières 2025, généré depuis bfa_admin_ocha_v6.gpkg) · sql/*.sql

## À faire (accord du 24/09/2026)
- v2 : mode Présentation (diaporama plein écran reprenant le PPTX « Rapport Déplacements PDI ») + export PPTX (PptxGenJS).
- Icônes OCHA (IDP, Location) depuis la boîte à outils au lieu des glyphes inline.

## Façon de travailler
- Petites étapes, une feuille ou un bloc à la fois ; montrer le résultat (capture Playwright) avant de passer au suivant.
- Vérifier chaque chiffre contre le site GCORR (tableau « Répartition par région », tous les mois sélectionnés)
  et contre SQL : 2026 au 15/09 = 92 074 PDI, 14 199 ménages, 41 alertes ; 2025 même période = 314 040.
