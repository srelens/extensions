import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

test('verifies the signed source independently of frozen legacy entries', () => {
  const root = mkdtempSync(join(tmpdir(), 'catalog-source-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'trust'));
    for (const path of ['scripts/verify-catalog.mjs', 'trust/root.json', 'catalog.signed.json']) {
      copyFileSync(new URL('../' + path, import.meta.url), join(root, path));
    }
    // Use published signatures and public keys; no private key is required.
    const envelope = JSON.parse(readFileSync(join(root, 'catalog.signed.json')));
    const payload = JSON.parse(Buffer.from(envelope.payload, 'base64'));
    // Keep this source-selection regression independent of the published fixture's expiry.
    writeFileSync(join(root, 'time.mjs'), 'Date.now = () => ' + (Date.parse(payload.expires) - 1000) + ';');
    writeFileSync(join(root, 'catalog.json'), JSON.stringify({extensions: []}));
    writeFileSync(join(root, 'catalog.source.json'), JSON.stringify({extensions: payload.extensions}));
    const run = () => spawnSync(process.execPath, ['--import', './time.mjs', 'scripts/verify-catalog.mjs'], {cwd: root, encoding: 'utf8'});
    let result = run();
    assert.equal(result.status, 0, result.stderr);
    writeFileSync(join(root, 'catalog.source.json'), JSON.stringify({extensions: []}));
    result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /catalog.source.json/);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
