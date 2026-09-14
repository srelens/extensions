"""Validate catalog metadata and deterministically build catalog.json (no network)."""
import argparse
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

def fields(value, expected):
    if not isinstance(value, dict) or set(value) != set(expected):
        raise ValueError(f'Expected fields: {", ".join(expected)}')

def text(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('Expected nonempty text')

def url(value):
    text(value)
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise ValueError('URLs must use HTTPS without credentials or fragments')

def matches(pattern, value):
    if not isinstance(value, str) or not re.fullmatch(pattern, value):
        raise ValueError(f'Invalid value: {value!r}')

def validate(entries):
    seen = set()
    if not isinstance(entries, list):
        raise ValueError('Entries must be a list')
    for entry in entries:
        fields(entry, ['id', 'name', 'description', 'repository', 'license', 'release', 'testedHost'])
        matches(r'[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+', entry['id'])
        if entry['id'] in seen:
            raise ValueError('Duplicate extension ID')
        seen.add(entry['id'])
        for key in ['name', 'description', 'license']:
            text(entry[key])
        url(entry['repository'])
        release = entry['release']
        fields(release, ['version', 'manifestUrl', 'sha256', 'srelensApiVersion', 'prerelease'])
        matches(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?', release['version'])
        url(release['manifestUrl'])
        matches(r'[a-f0-9]{64}', release['sha256'])
        text(release['srelensApiVersion'])
        if not isinstance(release['prerelease'], bool):
            raise ValueError('prerelease must be boolean')
        fields(entry['testedHost'], ['repository', 'revision'])
        url(entry['testedHost']['repository'])
        matches(r'[a-f0-9]{40}', entry['testedHost']['revision'])

def build():
    entries = []
    for path in sorted((ROOT / 'entries').glob('*.json')):
        entry = json.loads(path.read_text())
        if path.stem != entry.get('id'):
            raise ValueError(f'{path.name}: filename must match extension ID')
        entries.append(entry)
    validate(entries)
    return json.dumps({'schemaVersion': 1, 'extensions': entries}, indent=2) + '\n'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    rendered = build()
    target = ROOT / 'catalog.json'
    if args.check:
        if not target.exists() or target.read_text() != rendered:
            raise SystemExit('catalog.json is stale; run python3 scripts/catalog.py')
    else:
        target.write_text(rendered)
