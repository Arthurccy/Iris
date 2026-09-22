import json
import os
import sys
import time
from pathlib import Path

try:
    from google import genai
except ImportError:
    print("Veuillez installer le package google-genai : pip install google-genai")
    sys.exit(1)

def generate_description(client: genai.Client, query: dict) -> str:
    prompt = f"""
Tu es un expert métier et technique sur l'ERP Sage X3.
Voici une requête SQL extraite de l'ERP. 
Titre de la requête : {query.get('title')}
Domaine métier : {query.get('domain')}
Tables utilisées : {", ".join(query.get('fields', []))}
Code SQL : 
{query.get('sql')}

Génère une description très courte (1 à 2 phrases maximum) en français qui explique simplement à quoi sert cette extraction de données. L'explication doit être compréhensible par un utilisateur métier.
Ne donne QUE la description finale, aucune introduction ni conclusion.
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"\nErreur pour la requête {query.get('id')}: {e}")
        return ""

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Erreur : La variable d'environnement GEMINI_API_KEY n'est pas définie.")
        print("Pour la définir sous PowerShell :")
        print("$env:GEMINI_API_KEY=\"votre_cle_api\"")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    
    catalog_path = Path("src/lib/data/queriesCatalog.json")
    if not catalog_path.exists():
        print(f"Erreur: Le fichier {catalog_path} est introuvable. Lancez le script depuis la racine du projet.")
        sys.exit(1)

    print("Chargement du catalogue des requêtes...")
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    total = len(catalog)
    print(f"{total} requêtes trouvées. Début de la génération...\n")

    modifications_count = 0

    for i, query in enumerate(catalog):
        print(f"[{i+1}/{total}] Traitement de '{query.get('title')}' ({query.get('id')})...", end="", flush=True)
        
        # On ne traite que les descriptions par défaut
        if query.get("description", "").startswith("Extraction de données basée sur les tables"):
            new_desc = generate_description(client, query)
            if new_desc:
                query["description"] = new_desc
                modifications_count += 1
                print(" Fait.")
            else:
                print(" Échoué.")
            
            # Petite pause pour éviter de saturer l'API (Rate limiting)
            time.sleep(2)
        else:
            print(" Déjà décrit, ignoré.")

    print(f"\nSauvegarde de {modifications_count} nouvelles descriptions...")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        # Ajouter le saut de ligne final conventionnel
        f.write("\n")

    print("Génération terminée avec succès !")

if __name__ == "__main__":
    main()
