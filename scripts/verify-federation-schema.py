#!/usr/bin/env python3
"""Verify the localized exhibition JSON-LD and canonical VIPACH identity."""
import json
import re
from pathlib import Path

VIPACH = "https://www.vipach.at/#organization"
WIKI = "https://www.wikidata.org/wiki/Q138416887"
CATALOG = "https://okoszisztema.kozpontiszovetseg.at/forrasok/#catalog"
for path, lang in (("index.html", "en"), ("hu/index.html", "hu"), ("de/index.html", "de-AT")):
    src = Path(path).read_text(encoding="utf-8")
    blocks = re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', src)
    assert len(blocks) == 1, path + ": single JSON-LD required"
    root = json.loads(blocks[0])
    assert root["@context"] == "https://schema.org"
    graph = root["@graph"]
    assert len(graph) == 64, path + ": graph node count changed"
    org = next(x for x in graph if x.get("@id") == VIPACH)
    assert WIKI in org["sameAs"], path + ": VIPACH Wikidata missing"
    subjects = org.get("subjectOf", [])
    if isinstance(subjects, dict):
        subjects = [subjects]
    assert any(x.get("@id") == CATALOG for x in subjects), path + ": source catalog missing"
    event = next(x for x in graph if x.get("@id") == "https://exhibition.vipach.at/#event")
    assert event["organizer"]["@id"] == VIPACH
    assert event["startDate"] == "2026-11-15T17:00:00+01:00"
    assert event["endDate"] == "2026-11-21T20:00:00+01:00"
    assert any(x.get("inLanguage") == lang for x in graph), path + ": locale missing"
print("PASS: three languages, 64 nodes each, canonical event and organizer identity.")
