import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBatch(ai, fieldsBatch, retries = 3) {
    const prompt = `
Tu es un expert fonctionnel et technique sur l'ERP Sage X3.
Voici une liste de champs techniques provenant de tables Sage X3. Pour chacun, fournis :
1. "label" : Le libellé métier usuel en français (ex: "Référence article", "Fournisseur", "Date de facture").
2. "description" : Une explication très simple en français d'une phrase expliquant ce que représente ce champ pour un utilisateur métier.

Voici les champs :
${fieldsBatch.map(f => `- Code: "${f.code}", Table: "${f.table}", Domaine: "${f.category}"`).join('\n')}

Tu dois OBLIGATOIREMENT répondre avec un objet JSON dont les clés sont les codes des champs.
Exemple attendu :
{
  "ITMREF": {
    "label": "Référence article",
    "description": "Code unique identifiant un article dans le catalogue produit."
  }
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text.trim();
        return JSON.parse(text);
    } catch (error) {
        const isTransient = error.status === 429 || error.status === 503 || (error.error && error.error.code === 503);
        if (isTransient && retries > 0) {
            const waitMs = (error.status === 429) ? 60000 : 15000;
            console.log(` [Serveur saturé / Quota (${error.status || '503'}), nouvelle tentative dans ${waitMs/1000}s...]`);
            await delay(waitMs);
            return processBatch(ai, fieldsBatch, retries - 1);
        }
        console.error(`\nErreur lors du traitement du lot: ${error.message}`);
        return null;
    }
}

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Erreur : La variable d'environnement GEMINI_API_KEY n'est pas définie.");
        process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const dictPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'fieldDictionary.json');
    if (!fs.existsSync(dictPath)) {
        console.error(`Erreur: Le fichier ${dictPath} est introuvable.`);
        process.exit(1);
    }

    console.log("Chargement du dictionnaire des champs...");
    const rawData = fs.readFileSync(dictPath, 'utf-8');
    const dictionary = JSON.parse(rawData);

    // On ne traite que les champs avec description générique
    const pendingFields = dictionary.filter(f => !f.description || f.description.startsWith("Champ détecté automatiquement"));
    
    console.log(`${pendingFields.length} champs restants à documenter sur ${dictionary.length}.`);
    console.log("Traitement par lots de 35 pour optimiser le quota...\n");

    const BATCH_SIZE = 35;
    let modificationsCount = 0;

    for (let i = 0; i < pendingFields.length; i += BATCH_SIZE) {
        const batch = pendingFields.slice(i, i + BATCH_SIZE);
        const lotNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalLots = Math.ceil(pendingFields.length / BATCH_SIZE);
        
        process.stdout.write(`Traitement du lot ${lotNumber}/${totalLots} (Champs ${i + 1} à ${Math.min(i + BATCH_SIZE, pendingFields.length)})...`);
        
        const results = await processBatch(ai, batch);
        
        if (results) {
            let batchModifs = 0;
            for (const field of batch) {
                const info = results[field.code];
                if (info && (info.label || info.description)) {
                    if (info.label) field.label = info.label;
                    if (info.description) field.description = info.description;
                    
                    // Ajout des nouveaux mots-clés pour améliorer la recherche
                    if (info.label) {
                        const newWords = info.label.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                        field.keywords = Array.from(new Set([...(field.keywords || []), ...newWords]));
                    }
                    
                    batchModifs++;
                    modificationsCount++;
                }
            }
            // Sauvegarde progressive
            fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2) + '\n', 'utf-8');
            console.log(` Fait ! (${batchModifs} champs traduits)`);
        } else {
            console.log(" Échec du lot, on continue...");
        }
        
        await delay(5000);
    }

    console.log(`\nTerminé ! ${modificationsCount} champs ont été traduits et documentés avec succès.`);
}

main().catch(console.error);
