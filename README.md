# IRIS X3 Query Finder

Application web SvelteKit en lecture seule pour aider les équipes à :

- traduire les codes techniques Sage X3 en labels métiers
- sélectionner des champs par domaine métier
- retrouver les requêtes SQL existantes qui couvrent un besoin de consultation
- déclencher un fallback mail "3636" quand aucune requête ne matche

## Accès rapide

En local sur la machine :

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée par Vite, en général `http://127.0.0.1:5173/`.

Depuis une autre machine du réseau :

```bash
npm run dev:lan
```

Puis ouvrir l'URL affichée par Vite avec l'IP du serveur, par exemple `http://10.103.6.28:5173/`.

L'URL `http://10.103.6.28/Iris/` est servie par Apache et liste le dossier source. Elle ne lance pas automatiquement l'application SvelteKit.

## Données

- Dictionnaire des champs : `src/lib/data/fieldDictionary.json`
- Catalogue des requêtes : `src/lib/data/queriesCatalog.json`
- Métadonnées d'interface : `src/lib/data/categoryMeta.ts`

## Qualité

```bash
npm run check
npm run build
```

## Extraction du classeur Excel fourni

Le fichier `MatriceTransco.xlsx` fourni dans le dépôt ne contient pas la transco des champs Sage X3 demandée pour l'écran principal. Il contient surtout des matrices d'habilitation et de codes d'accès.

Pour en sortir un aperçu JSON sans dépendance externe :

```bash
python scripts/extract_xlsx_preview.py MatriceTransco.xlsx
```

Ce script lit le `.xlsx` via le format ZIP/XML standard afin d'éviter la dépendance à `openpyxl`.
