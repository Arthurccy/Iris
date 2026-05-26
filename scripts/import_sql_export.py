from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from zipfile import ZipFile

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

FIELD_RE = re.compile(r"\b([A-Z][A-Z0-9]{0,20})\.([A-Z][A-Z0-9_]{1,40})\b")
TABLE_ALIAS_RE = re.compile(
    r"\b(?:FROM|JOIN|UPDATE|INTO)\s+([A-Z][A-Z0-9_]{1,40})(?:\s+(?:AS\s+)?([A-Z][A-Z0-9]{0,20}))?",
    re.IGNORECASE,
)

NOISE_RE = re.compile(r"\b(TEST|ESSAI|ZTEST|TESTOMD|TESTODD)\b", re.IGNORECASE)


def read_xlsx_rows(path: Path) -> list[list[str]]:
    with ZipFile(path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("a:si", NS):
                shared_strings.append("".join(text.text or "" for text in item.findall(".//a:t", NS)))

        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))

        def column_index(cell_ref: str) -> int:
            letters = "".join(char for char in cell_ref if char.isalpha())
            value = 0
            for char in letters:
                value = value * 26 + ord(char.upper()) - 64
            return value - 1

        def cell_value(cell: ET.Element) -> str:
            cell_type = cell.attrib.get("t")
            if cell_type == "inlineStr":
                return "".join(text.text or "" for text in cell.findall(".//a:t", NS)).strip()

            value = cell.find("a:v", NS)
            if value is None:
                return ""

            raw_value = value.text or ""
            if cell_type == "s" and raw_value.isdigit():
                return shared_strings[int(raw_value)].strip()
            return raw_value.strip()

        rows: list[list[str]] = []
        for row in sheet.findall("a:sheetData/a:row", NS):
            values: list[str] = []
            for cell in row.findall("a:c", NS):
                index = column_index(cell.attrib.get("r", "A1"))
                while len(values) < index:
                    values.append("")
                values.append(cell_value(cell))
            rows.append(values)

    return rows


def normalize_field_code(field: str) -> str:
    return field[:-2] if field.endswith("_0") else field


def normalize_date(value: str) -> str:
    if not value:
        return ""
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    return value[:10]


def table_aliases(sql: str) -> dict[str, str]:
    aliases: dict[str, str] = {}
    for table, alias in TABLE_ALIAS_RE.findall(sql):
        table = table.upper()
        alias = (alias or table).upper()
        if alias in {"ON", "WHERE", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "ORDER", "GROUP"}:
            alias = table
        aliases[alias] = table
        aliases[table] = table
    return aliases


def infer_domain(code: str, title: str, tables: set[str]) -> str:
    haystack = f"{code} {title} {' '.join(tables)}".upper()
    if any(token in haystack for token in ("STO", "STOCK", "LOT", "INVENT", "INV")):
        return "Stocks"
    if any(token in haystack for token in ("QC", "QLT", "QUAL", "LABO", "QCR", "AQ")):
        return "Qualité"
    if any(token in haystack for token in ("MFG", "BOM", "OF", "ROU", "PROD")):
        return "Production"
    if any(token in haystack for token in ("VEN", "SORDER", "BPC", "CLIENT", "COMMANDE")):
        return "Ventes"
    if any(token in haystack for token in ("ACH", "PORDER", "BPS", "FOURN", "RECEP")):
        return "Achats"
    if any(token in haystack for token in ("ACCES", "AUT", "AFC", "AUS", "PROFIL")):
        return "Administration"
    return "Transverse"


def build_catalog(rows: list[list[str]]) -> tuple[list[dict], list[dict]]:
    header = rows[0]
    records = [dict(zip(header, row + [""] * (len(header) - len(row)))) for row in rows[1:]]
    catalog: list[dict] = []
    field_sources: dict[str, Counter[str]] = defaultdict(Counter)
    field_domains: dict[str, Counter[str]] = defaultdict(Counter)

    for record in records:
        code = record.get("IDENT1_0", "").strip()
        title = record.get("NAMBLB_0", "").strip() or code
        sql = record.get("CLOB_0", "").strip()
        if not code or not sql:
            continue

        aliases = table_aliases(sql.upper())
        fields: set[str] = set()
        tables: set[str] = set()
        for alias, raw_field in FIELD_RE.findall(sql.upper()):
            table = aliases.get(alias.upper(), alias.upper())
            field = normalize_field_code(raw_field.upper())
            fields.add(field)
            tables.add(table)
            field_sources[field][table] += 1

        domain = infer_domain(code, title, tables)
        for field in fields:
            field_domains[field][domain] += 1

        catalog.append(
            {
                "id": code.lower(),
                "title": title,
                "domain": domain,
                "system": "Sage X3",
                "description": "Requête importée automatiquement depuis l'export SQL Sage X3.",
                "fields": sorted(fields),
                "sql": sql,
                "owner": record.get("CREUSR_0", "").strip() or "Non renseigné",
                "lastUpdated": normalize_date(record.get("CREDAT_0", "")),
                "sourceCode": code,
                "status": "à valider" if NOISE_RE.search(f"{code} {title}") else "importé"
            }
        )

    dictionary = []
    for field, sources in sorted(field_sources.items()):
        table = sources.most_common(1)[0][0]
        domain = field_domains[field].most_common(1)[0][0] if field_domains[field] else "Transverse"
        dictionary.append(
            {
                "code": field,
                "label": field,
                "category": domain,
                "group": table,
                "table": table,
                "description": "Champ détecté automatiquement dans les requêtes SQL Sage X3.",
                "keywords": [field.lower(), table.lower(), domain.lower()]
            }
        )

    return catalog, dictionary


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/import_sql_export.py <export.xlsx>")
        return 1

    source = Path(sys.argv[1])
    rows = read_xlsx_rows(source)
    catalog, dictionary = build_catalog(rows)

    Path("src/lib/data/queriesCatalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    Path("src/lib/data/fieldDictionary.json").write_text(
        json.dumps(dictionary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"{len(catalog)} requêtes importées")
    print(f"{len(dictionary)} champs détectés")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
