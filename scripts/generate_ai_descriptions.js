import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBatch(ai, queriesBatch, retries = 3) {
    const prompt = `
Tu es un expert métier et technique sur l'ERP Sage X3.
Voici une liste de requêtes SQL. Pour chacune, génère une description très courte (1 à 2 phrases) en français qui explique simplement à quoi sert cette extraction de données pour un utilisateur métier.

Voici les requêtes :
${queriesBatch.map(q => `ID: ${q.id} | Titre: ${q.title} | Domaine: ${q.domain} | Tables: ${(q.fields||[]).join(', ')}\nSQL: ${q.sql}`).join('\n\n')}

Tu dois OBLIGATOIREMENT répondre avec un objet JSON dont les clés sont les ID des requêtes et les valeurs sont les descriptions générées.
Exemple attendue : {"id1": "Description 1", "id2": "Description 2"}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash', // On repasse sur le modèle officiel
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
            return processBatch(ai, queriesBatch, retries - 1);
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
    
    const catalogPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'queriesCatalog.json');
    if (!fs.existsSync(catalogPath)) {
        console.error(`Erreur: Le fichier ${catalogPath} est introuvable.`);
        process.exit(1);
    }

    console.log("Chargement du catalogue des requêtes...");
    const rawData = fs.readFileSync(catalogPath, 'utf-8');
    const catalog = JSON.parse(rawData);

    // On isole uniquement les requêtes qui n'ont pas encore de description personnalisée
    const pendingQueries = catalog.filter(q => q.description && q.description.startsWith("Extraction de données basée sur les tables"));
    
    console.log(`${pendingQueries.length} requêtes restantes à traiter.`);
    console.log("Pour contourner la limite de 20 requêtes/jour de Google, on va les traiter par lots de 15 !\n");

    const BATCH_SIZE = 15;
    let modificationsCount = 0;

    for (let i = 0; i < pendingQueries.length; i += BATCH_SIZE) {
        const batch = pendingQueries.slice(i, i + BATCH_SIZE);
        process.stdout.write(`Traitement du lot ${Math.floor(i / BATCH_SIZE) + 1} (Requêtes ${i + 1} à ${Math.min(i + BATCH_SIZE, pendingQueries.length)})...`);
        
        const results = await processBatch(ai, batch);
        
        if (results) {
            let batchModifs = 0;
            for (const query of catalog) {
                if (results[query.id]) {
                    query.description = results[query.id];
                    batchModifs++;
                    modificationsCount++;
                }
            }
            // SAUVEGARDE PROGRESSIVE
            fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');
            console.log(` Fait ! (${batchModifs} descriptions ajoutées)`);
        } else {
            console.log(" Échec de ce lot, on continue avec le suivant...");
        }
        
        // Petite pause de politesse
        await delay(5000);
    }

    console.log(`\nTerminé ! ${modificationsCount} nouvelles descriptions générées.`);
}

main().catch(console.error);
