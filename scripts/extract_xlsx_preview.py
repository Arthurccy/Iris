from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS_MAIN = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
REL_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for si in root.findall("a:si", NS_MAIN):
        plain = si.find("a:t", NS_MAIN)
        if plain is not None:
            strings.append(plain.text or "")
            continue

        parts = []
        for run in si.findall("a:r", NS_MAIN):
            text = run.find("a:t", NS_MAIN)
            parts.append(text.text if text is not None and text.text else "")
        strings.append("".join(parts))
    return strings


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str | None:
    value_node = cell.find("a:v", NS_MAIN)
    if value_node is None:
        return None

    raw_value = value_node.text or ""
    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw_value)]
    return raw_value


def preview_workbook(path: Path, row_limit: int = 5) -> dict[str, list[list[str | None]]]:
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relations = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        relation_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in relations.findall("r:Relationship", NS_REL)}

        previews: dict[str, list[list[str | None]]] = {}
        sheets = workbook.find("a:sheets", NS_MAIN)
        if sheets is None:
            return previews

        for sheet in sheets:
            target = "xl/" + relation_map[sheet.attrib[REL_ID]]
            root = ET.fromstring(archive.read(target))
            rows: list[list[str | None]] = []
            for row in root.findall(".//a:sheetData/a:row", NS_MAIN)[:row_limit]:
                rows.append([cell_value(cell, shared_strings) for cell in row.findall("a:c", NS_MAIN)])
            previews[sheet.attrib["name"]] = rows

        return previews


if __name__ == "__main__":
    workbook_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("MatriceTransco.xlsx")
    preview = preview_workbook(workbook_path)
    print(json.dumps(preview, ensure_ascii=False, indent=2))
