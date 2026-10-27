"""Build compact offline address suggestions from the pinned barangay PSGC mirror.

Usage: python scripts/build-address-directory.py <barangay_flat.json>
Source and license: docs/philippine-addresses.md
"""
import json
import sys
from pathlib import Path

rows = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
by_id = {row["psgc_id"]: row for row in rows}
assert len(by_id) == len(rows), "Duplicate PSGC codes"
locality_types = {"municipality", "component_city", "independent_component_city", "highly_urbanized_city"}
localities = {}
barangays = {}

for row in rows:
    if row["type"] not in locality_types:
        continue
    ancestor = row
    province = ""
    while ancestor["type"] != "region":
        ancestor = by_id[ancestor["parent_psgc_id"]]
        if ancestor["type"] in {"province", "special_geographic_area"}:
            province = ancestor["name"]
    # Province-less HUCs and NCR are valid; do not invent a province.
    localities[row["psgc_id"]] = [row["name"], province, ancestor["name"]]
    barangays[row["psgc_id"]] = []

for row in rows:
    if row["type"] != "barangay":
        continue
    parent = by_id[row["parent_psgc_id"]]
    district = ""
    if parent["type"] == "submunicipality":
        district = parent["name"]
        parent = by_id[parent["parent_psgc_id"]]
    assert parent["psgc_id"] in localities, row
    entry = [row["psgc_id"], row["name"]]
    if district:
        entry.append(district)
    barangays[parent["psgc_id"]].append(entry)

assert len(localities) > 1600 and sum(map(len, barangays.values())) == 42010
target = Path(__file__).resolve().parents[1] / "src" / "constants" / "addresses"
target.mkdir(exist_ok=True)
for filename, data in [("localities.json", localities), ("barangays.json", barangays)]:
    (target / filename).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Built {len(localities)} localities and {sum(map(len, barangays.values()))} barangays")
