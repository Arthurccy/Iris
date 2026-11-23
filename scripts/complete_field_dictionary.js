import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translations = {
  "XPOINET": {
    "label": "Poids net article (spécifique)",
    "description": "Poids net unitaire de l'article utilisé pour les calculs logistiques et de pesée.",
    "keywords": ["xpoinet", "itmmaster", "stocks", "poids", "net", "masse"]
  },
  "XPRHFCY": {
    "label": "Site de réception prévu",
    "description": "Site Sage X3 désigné pour la livraison physique de la commande fournisseur.",
    "keywords": ["xprhfcy", "porder", "achats", "site", "reception", "livraison"]
  },
  "XPROVCUST": {
    "label": "Client donneur d'ordre",
    "description": "Code client ou donneur d'ordre propriétaire de l'article ou de la matière confiée.",
    "keywords": ["xprovcust", "itmmaster", "stocks", "client", "donneur", "ordre", "proprietaire"]
  },
  "XREADYPROD": {
    "label": "Prêt pour production",
    "description": "Indicateur confirmant que l'ordre de fabrication a validé ses prérequis et peut être lancé en atelier.",
    "keywords": ["xreadyprod", "mfghead", "production", "ordre", "fabrication", "pret", "lancement"]
  },
  "XREQNUM": {
    "label": "Numéro de demande CQ (QC Order)",
    "description": "Identifiant unique de la demande d'analyse ou de contrôle qualité pour un lot.",
    "keywords": ["xreqnum", "xrequesth", "stocks", "qualite", "demande", "cq", "qc", "order", "analyse"]
  },
  "XSTA": {
    "label": "Statut ligne de commande achat",
    "description": "État d'avancement de la ligne d'achat (en attente, reçue, soldée ou annulée).",
    "keywords": ["xsta", "porderq", "stocks", "achats", "statut", "commande", "ligne"]
  },
  "XSTADAT": {
    "label": "Date de statut de modification",
    "description": "Date d'enregistrement du changement de statut pour la modification article.",
    "keywords": ["xstadat", "xitmmoddet", "transverse", "date", "statut", "modification", "article"]
  },
  "XSTAFORCE": {
    "label": "Forçage statut CQ",
    "description": "Indicateur de décision exceptionnelle ou de forçage du statut qualité lors du contrôle.",
    "keywords": ["xstaforce", "xrequesth", "stocks", "qualite", "forcage", "statut", "derogation"]
  },
  "XSTAT00": {
    "label": "Famille statistique article 1",
    "description": "Premier axe de classification statistique et de reporting pour l'article (ex. statut destruction).",
    "keywords": ["xstat00", "xitmstat", "stocks", "statistique", "famille", "classification"]
  },
  "XSTAT06": {
    "label": "Famille statistique palette",
    "description": "Classification logistique pour la gestion des palettes et la manutention externe.",
    "keywords": ["xstat06", "xitmstat", "stocks", "palette", "statistique", "logistique"]
  },
  "XSTAT12": {
    "label": "Famille statistique valorisation",
    "description": "Classification analytique utilisée pour l'estimation du nombre de palettes et la valorisation du stock.",
    "keywords": ["xstat12", "xitmstat", "stocks", "valorisation", "estimation", "palettes"]
  },
  "XSTATUT": {
    "label": "Statut du contrôle qualité",
    "description": "État de progression de la demande de contrôle (en attente, en cours, conforme, rejeté ou clôturé).",
    "keywords": ["xstatut", "xrequesth", "stocks", "qualite", "statut", "controle", "cq"]
  },
  "XSTKCLASS": {
    "label": "Classe de stockage",
    "description": "Classification de l'emplacement et des règles de stockage associées.",
    "keywords": ["xstkclass", "i", "stocks", "classe", "stockage", "emplacement"]
  },
  "XTAIBATMAX": {
    "label": "Taille de lot maximale",
    "description": "Taille maximale autorisée pour un lot de fabrication sous cette version de formule.",
    "keywords": ["xtaibatmax", "xitmversio", "transverse", "production", "taille", "lot", "maximum", "batch"]
  },
  "XTIMEPT": {
    "label": "Point de temps stabilité",
    "description": "Échéance ou intervalle temporel de test dans l'étude de stabilité d'un produit (ex. T0, T3M, T6M).",
    "keywords": ["xtimept", "xstabetus", "transverse", "qualite", "stabilite", "echeance", "temps"]
  },
  "XTRANSAC": {
    "label": "Type de transaction CQ",
    "description": "Code identifiant le type d'opération de contrôle qualité (réception, déclaration OF, stabilité).",
    "keywords": ["xtransac", "xrequesth", "stocks", "qualite", "transaction", "operation"]
  },
  "XTYPCOUT": {
    "label": "Type de coût version",
    "description": "Méthode de calcul ou type de valorisation du coût associée à la version de fabrication.",
    "keywords": ["xtypcout", "xitmversio", "transverse", "cout", "valorisation", "version"]
  },
  "XVALCQFLG": {
    "label": "Validation CQ globale",
    "description": "Indicateur confirmant l'obtention de l'ensemble des validations qualité.",
    "keywords": ["xvalcqflg", "xrequesth", "stocks", "qualite", "validation", "global", "cq"]
  },
  "XVALCQFLG_1": {
    "label": "Validation étape CQ 1",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 1.",
    "keywords": ["xvalcqflg_1", "xrequesth", "stocks", "qualite", "validation", "palier", "1"]
  },
  "XVALCQFLG_2": {
    "label": "Validation étape CQ 2",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 2.",
    "keywords": ["xvalcqflg_2", "xrequesth", "stocks", "qualite", "validation", "palier", "2"]
  },
  "XVALCQFLG_3": {
    "label": "Validation étape CQ 3",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 3.",
    "keywords": ["xvalcqflg_3", "xrequesth", "stocks", "qualite", "validation", "palier", "3"]
  },
  "XVALCQFLG_4": {
    "label": "Validation étape CQ 4",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 4.",
    "keywords": ["xvalcqflg_4", "xrequesth", "stocks", "qualite", "validation", "palier", "4"]
  },
  "XVALCQFLG_5": {
    "label": "Validation étape CQ 5",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 5.",
    "keywords": ["xvalcqflg_5", "xrequesth", "stocks", "qualite", "validation", "palier", "5"]
  },
  "XVALCQFLG_6": {
    "label": "Validation étape CQ 6",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 6.",
    "keywords": ["xvalcqflg_6", "xrequesth", "stocks", "qualite", "validation", "palier", "6"]
  },
  "XVALCQFLG_7": {
    "label": "Validation étape CQ 7",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 7.",
    "keywords": ["xvalcqflg_7", "xrequesth", "stocks", "qualite", "validation", "palier", "7"]
  },
  "XVALCQFLG_8": {
    "label": "Validation étape CQ 8",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 8.",
    "keywords": ["xvalcqflg_8", "xrequesth", "stocks", "qualite", "validation", "palier", "8"]
  },
  "XVALCQFLG_9": {
    "label": "Validation étape CQ 9",
    "description": "Indicateur de validation qualité pour le poste ou palier d'analyse numéro 9.",
    "keywords": ["xvalcqflg_9", "xrequesth", "stocks", "qualite", "validation", "palier", "9"]
  },
  "XVALCQWST": {
    "label": "Poste de travail CQ principal",
    "description": "Poste de charge ou laboratoire effectuant l'analyse qualité principale.",
    "keywords": ["xvalcqwst", "xrequesth", "stocks", "qualite", "poste", "laboratoire"]
  },
  "XVALCQWST_1": {
    "label": "Poste de travail CQ 1",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 1.",
    "keywords": ["xvalcqwst_1", "xrequesth", "stocks", "qualite", "poste", "banc", "1"]
  },
  "XVALCQWST_2": {
    "label": "Poste de travail CQ 2",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 2.",
    "keywords": ["xvalcqwst_2", "xrequesth", "stocks", "qualite", "poste", "banc", "2"]
  },
  "XVALCQWST_3": {
    "label": "Poste de travail CQ 3",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 3.",
    "keywords": ["xvalcqwst_3", "xrequesth", "stocks", "qualite", "poste", "banc", "3"]
  },
  "XVALCQWST_4": {
    "label": "Poste de travail CQ 4",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 4.",
    "keywords": ["xvalcqwst_4", "xrequesth", "stocks", "qualite", "poste", "banc", "4"]
  },
  "XVALCQWST_5": {
    "label": "Poste de travail CQ 5",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 5.",
    "keywords": ["xvalcqwst_5", "xrequesth", "stocks", "qualite", "poste", "banc", "5"]
  },
  "XVALCQWST_6": {
    "label": "Poste de travail CQ 6",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 6.",
    "keywords": ["xvalcqwst_6", "xrequesth", "stocks", "qualite", "poste", "banc", "6"]
  },
  "XVALCQWST_7": {
    "label": "Poste de travail CQ 7",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 7.",
    "keywords": ["xvalcqwst_7", "xrequesth", "stocks", "qualite", "poste", "banc", "7"]
  },
  "XVALCQWST_8": {
    "label": "Poste de travail CQ 8",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 8.",
    "keywords": ["xvalcqwst_8", "xrequesth", "stocks", "qualite", "poste", "banc", "8"]
  },
  "XVALCQWST_9": {
    "label": "Poste de travail CQ 9",
    "description": "Code du banc d'analyse ou laboratoire assigné à l'étape de contrôle 9.",
    "keywords": ["xvalcqwst_9", "xrequesth", "stocks", "qualite", "poste", "banc", "9"]
  },
  "XVALDAT": {
    "label": "Date de validation CQ",
    "description": "Date officielle à laquelle la décision de conformité qualité a été enregistrée.",
    "keywords": ["xvaldat", "xrequesth", "stocks", "qualite", "date", "validation", "decision"]
  },
  "XVCRLINORI": {
    "label": "Ligne de pièce d'origine CQ",
    "description": "Numéro de ligne du document source (réception, déclaration OF) ayant généré la demande CQ.",
    "keywords": ["xvcarlinori", "xrequesth", "stocks", "qualite", "ligne", "piece", "origine"]
  },
  "XVCRNUMORI": {
    "label": "Pièce d'origine CQ",
    "description": "Numéro de la pièce source (bon de réception, ordre de fabrication) déclenchant le contrôle.",
    "keywords": ["xvcrnumori", "xrequesth", "stocks", "qualite", "piece", "reception", "of"]
  },
  "XVERENDDAT": {
    "label": "Date de fin validité version",
    "description": "Date d'expiration ou de fin d'application de cette version de formule ou procédé.",
    "keywords": ["xverenddat", "xitmversio", "production", "date", "fin", "validite", "version"]
  },
  "XVERSBLOQ": {
    "label": "Version bloquée",
    "description": "Indicateur précisant si l'utilisation de cette version de fabrication est suspendue.",
    "keywords": ["xversbloq", "xitmversio", "production", "bloque", "suspension", "version"]
  },
  "XVERSDES1": {
    "label": "Désignation 1 version article",
    "description": "Libellé descriptif principal caractérisant cette version de formule ou nomenclature.",
    "keywords": ["xversdes1", "xitmversio", "transverse", "designation", "libelle", "version"]
  },
  "XVERSDES2": {
    "label": "Désignation 2 version article",
    "description": "Texte descriptif complémentaire ou commentaire technique sur la version.",
    "keywords": ["xversdes2", "xitmversio", "transverse", "designation", "complementaire", "version"]
  },
  "XVERSION": {
    "label": "Numéro de version article",
    "description": "Indice ou référence de révision industrielle de l'article.",
    "keywords": ["xversion", "xitmversio", "production", "version", "revision", "indice"]
  },
  "XVERSTRDAT": {
    "label": "Date début validité version",
    "description": "Date à partir de laquelle cette version d'article peut être mise en production.",
    "keywords": ["xverstrdat", "xitmversio", "production", "date", "debut", "validite", "version"]
  },
  "YACTCOD": {
    "label": "Code d'activité article",
    "description": "Code régissant les paramètres d'activation ou fonctionnalités spécifiques pour cet article.",
    "keywords": ["yactcod", "itmmaster", "stocks", "activite", "code"]
  },
  "YALIVUSR": {
    "label": "Destinataire livraison (demande achat)",
    "description": "Utilisateur interne à qui le matériel ou service commandé doit être remis.",
    "keywords": ["yalivusr", "prequis", "achats", "destinataire", "livraison", "utilisateur", "demande"]
  },
  "YBPSCERT": {
    "label": "Certification qualité fournisseur",
    "description": "Statut d'agrément, audit ou certification qualité du fournisseur pour cet article.",
    "keywords": ["ybpscert", "itmbps", "achats", "certification", "agrement", "fournisseur", "audit"]
  },
  "YCLEICPE": {
    "label": "Classement ICPE",
    "description": "Rubrique réglementaire relative aux installations classées pour la protection de l'environnement.",
    "keywords": ["ycleicpe", "yitmlegis", "stocks", "icpe", "classement", "environnement", "reglementation"]
  },
  "YCODDNGPHY": {
    "label": "Danger physique (SGH/CLP)",
    "description": "Classification de danger physique pour la matière (inflammable, comburant, explosif).",
    "keywords": ["ycoddngphy", "yitmlegis", "stocks", "danger", "physique", "securite", "clp"]
  },
  "YCODDNGSAN": {
    "label": "Danger santé (SGH/CLP)",
    "description": "Classification de toxicité ou danger pour la santé humaine (toxicité aiguë, irritation).",
    "keywords": ["ycoddngsan", "yitmlegis", "stocks", "danger", "sante", "toxicite", "securite"]
  },
  "YCODENV": {
    "label": "Danger environnement (SGH/CLP)",
    "description": "Classification de danger et écotoxicité pour l'environnement aquatique et terrestre.",
    "keywords": ["ycodenv", "yitmlegis", "stocks", "danger", "environnement", "pollution", "ecotoxicite"]
  },
  "YFABRIQUAN1": {
    "label": "Fabricant agréé 1",
    "description": "Nom ou code du premier site de fabrication qualifié pour cet article fournisseur.",
    "keywords": ["yfabriquan1", "itmbps", "achats", "fabricant", "agrement", "source", "1"]
  },
  "YFABRIQUAN2": {
    "label": "Fabricant agréé 2",
    "description": "Nom ou code du deuxième site de fabrication qualifié pour cet article fournisseur.",
    "keywords": ["yfabriquan2", "itmbps", "achats", "fabricant", "agrement", "source", "2"]
  },
  "YFABRIQUAN3": {
    "label": "Fabricant agréé 3",
    "description": "Nom ou code du troisième site de fabrication qualifié pour cet article fournisseur.",
    "keywords": ["yfabriquan3", "itmbps", "achats", "fabricant", "agrement", "source", "3"]
  },
  "YFABRIQUAN4": {
    "label": "Fabricant agréé 4",
    "description": "Nom ou code du quatrième site de fabrication qualifié pour cet article fournisseur.",
    "keywords": ["yfabriquan4", "itmbps", "achats", "fabricant", "agrement", "source", "4"]
  },
  "YFAMLOT": {
    "label": "Famille de lot article",
    "description": "Typologie ou groupe de numérotation et de traçabilité des lots pour le produit.",
    "keywords": ["yfamlot", "itmmaster", "transverse", "famille", "lot", "tracabilite"]
  },
  "YSTADE": {
    "label": "Stade d'industrialisation",
    "description": "Niveau de maturité du produit (développement, transposition, commercial, fin de vie).",
    "keywords": ["ystade", "itmmaster", "transverse", "stade", "developpement", "maturite"]
  },
  "YVOLUTION": {
    "label": "Indice d'évolution produit",
    "description": "Numéro de révision ou palier technique de la fiche article.",
    "keywords": ["yvolution", "itmmaster", "transverse", "evolution", "revision", "indice"]
  },
  "YWST": {
    "label": "Poste de travail Worksheet",
    "description": "Poste d'impression rattaché à la fiche de suivi de fabrication atelier.",
    "keywords": ["ywst", "ywrkedt", "transverse", "poste", "worksheet", "fabrication"]
  },
  "ZDATE": {
    "label": "Date d'arrêté stock",
    "description": "Date de référence de l'inventaire ou de la photographie historique du stock.",
    "keywords": ["zdate", "zstockdate", "stocks", "date", "arrete", "historique"]
  },
  "ZITMREF": {
    "label": "Référence article (stock à date)",
    "description": "Code unique de l'article dans la table de stock historique à date.",
    "keywords": ["zitmref", "zstockdate", "stocks", "article", "reference", "date"]
  },
  "ZLOTVAL": {
    "label": "Valorisation lot nomenclature",
    "description": "Indicateur d'éligibilité du composant pour le calcul du coût de revient dans la nomenclature.",
    "keywords": ["zlotval", "bom", "production", "lot", "validation", "cout", "nomenclature"]
  },
  "ZNUMEDI": {
    "label": "Numéro d'édition nomenclature",
    "description": "Indice d'impression ou de diffusion officielle de la formule de production.",
    "keywords": ["znumedi", "bom", "production", "edition", "revision", "nomenclature"]
  },
  "ZONE": {
    "label": "Zone traduite ATEXTRA",
    "description": "Nom du champ textuel multilingue stocké dans la table de traduction ATEXTRA.",
    "keywords": ["zone", "atextra", "production", "zone", "traduction", "langue", "libelle"]
  },
  "ZPCOD": {
    "label": "Code convention/projet",
    "description": "Identifiant de rattachement conventionnel ou projet spécifique pour l'article.",
    "keywords": ["zpcod", "itmmaster", "stocks", "code", "projet", "convention"]
  },
  "ZREFINSTR": {
    "label": "Référence instruction fabrication",
    "description": "Numéro du dossier technique, mode opératoire ou instruction de travail associée à l'article.",
    "keywords": ["zrefinstr", "itmmaster", "transverse", "instruction", "dossier", "fabrication", "methode"]
  },
  "ZSTOCK": {
    "label": "Quantité en stock à date",
    "description": "Quantité physique constatée en stock à la date d'arrêté historique.",
    "keywords": ["zstock", "zstockdate", "stocks", "quantite", "stock", "volume"]
  },
  "ZSTOFCY": {
    "label": "Site stockage à date",
    "description": "Établissement ou site de stockage concerné par l'inventaire historique.",
    "keywords": ["zstofcy", "zstockdate", "stocks", "site", "stockage", "etablissement"]
  },
  "ZYIELD": {
    "label": "Rendement formule/nomenclature",
    "description": "Coefficient de rendement ou de perte prévu pour le composant dans la nomenclature.",
    "keywords": ["zyield", "bom", "production", "rendement", "perte", "nomenclature", "composant"]
  }
};

const dictPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'fieldDictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

let updatedCount = 0;
for (const field of dictionary) {
  if (translations[field.code]) {
    const t = translations[field.code];
    field.label = t.label;
    field.description = t.description;
    if (t.keywords) {
      field.keywords = t.keywords;
    }
    updatedCount++;
  }
}

fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2), 'utf8');
console.log(`Mis a jour avec succes : ${updatedCount} champs dans ${dictPath}`);
