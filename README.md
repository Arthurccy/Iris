# IRIS X3 Query Finder

Application web SvelteKit en lecture seule pour aider les équipes à :

- traduire les codes techniques Sage X3 en labels métiers
- sélectionner des champs par domaine métier
- retrouver les requêtes SQL existantes qui couvrent un besoin de consultation
- déclencher un fallback mail "3636" quand aucune requête ne matche

## Démarrage

```bash
npm.cmd install
npm.cmd run dev
```

## Données

- Dictionnaire des champs : `src/lib/data/fieldDictionary.json`
- Catalogue des requêtes : `src/lib/data/queriesCatalog.json`
- Métadonnées d'interface : `src/lib/data/categoryMeta.ts`

## Extraction du classeur Excel fourni

Le fichier `MatriceTransco.xlsx` fourni dans le dépôt ne contient pas la transco des champs Sage X3 demandée pour l'écran principal. Il contient surtout des matrices d'habilitation et de codes d'accès.

Pour en sortir un aperçu JSON sans dépendance externe :

```bash
python scripts/extract_xlsx_preview.py MatriceTransco.xlsx
```

Ce script lit le `.xlsx` via le format ZIP/XML standard afin d'éviter la dépendance à `openpyxl`.
