#!/usr/bin/env node
// Checks a signed catalog the way a srelens host does before it trusts one
// (srelens/srelens#559), so CI never publishes a catalog hosts would refuse:
//
// - trust/root.json is signed by its own root role, at its threshold;
// - the catalog is signed by that root's catalog role, at its threshold;
// - every publisher delegation in it is signed by the catalog role too;
// - it has not expired, and its version is higher than `--previous`'s;
// - it carries exactly the entries catalog.json lists.
//
// A host checks all of this again, and more (crates/registry/src/extensions/trust.rs and
// catalog.rs in srelens/srelens). This is the part a mistake here could get wrong: the
// wrong key in the secret, a delegation signed by another key, a stale or rolled-back file.
//
//   node scripts/verify-catalog.mjs catalog.signed.json [--previous <catalog.signed.json>]
import { createHash, createPublicKey, verify } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const TYPES = {
  root: 'application/vnd.srelens.root+json',
  catalog: 'application/vnd.srelens.catalog+json',
  publisher: 'application/vnd.srelens.publisher+json',
};
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function fail(message) {
  console.error(`verify-catalog.mjs: ${message}`);
  process.exit(1);
}

function readJson(path, what) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${what} (${path}) is not readable JSON: ${error.message}`);
  }
}

/** DSSE's pre-authentication encoding: what a signature covers. */
function pae(type, body) {
  return Buffer.concat([Buffer.from(`DSSEv1 ${Buffer.byteLength(type)} ${type} ${body.length} `), body]);
}

/** A role's keys by ID, each ID checked to be the SHA-256 of its key, as the host computes it. */
function roleKeys(root, role) {
  return Object.fromEntries(
    root.roles[role].keyids.map((id) => {
      const spec = root.keys[id];
      if (!spec || spec.keytype !== 'ed25519') fail(`the ${role} role names key ${id}, which the root does not list`);
      const raw = Buffer.from(spec.keyval.public, 'hex');
      if (createHash('sha256').update(raw).digest('hex') !== id) fail(`root key ${id} is listed under another key's ID`);
      return [id, createPublicKey({ key: Buffer.concat([SPKI_PREFIX, raw]), format: 'der', type: 'spki' })];
    }),
  );
}

/** The payload of `envelope`, when at least `threshold` distinct keys of `keys` signed it. */
function open(envelope, type, keys, threshold, what) {
  if (envelope?.payloadType !== type) fail(`${what} is not a ${type} document`);
  const body = Buffer.from(envelope.payload, 'base64');
  const message = pae(type, body);
  const signed = new Set();
  for (const signature of envelope.signatures ?? []) {
    const key = keys[signature.keyid];
    if (!key || signed.has(signature.keyid)) continue;
    if (verify(null, message, key, Buffer.from(signature.sig, 'base64'))) signed.add(signature.keyid);
  }
  if (signed.size < threshold) fail(`${what} is signed by ${signed.size} of the ${threshold} keys it needs`);
  return JSON.parse(body);
}

const args = process.argv.slice(2);
const previousAt = args.indexOf('--previous');
const previousPath = previousAt === -1 ? undefined : args.splice(previousAt, 2)[1];
const [catalogPath = 'catalog.signed.json'] = args;

const pinned = readJson(new URL('../trust/root.json', import.meta.url), 'trust/root.json');
const claimed = JSON.parse(Buffer.from(pinned.payload ?? '', 'base64'));
const root = open(pinned, TYPES.root, roleKeys(claimed, 'root'), claimed.roles.root.threshold, 'trust/root.json');
const catalogKeys = roleKeys(root, 'catalog');
const threshold = root.roles.catalog.threshold;

const catalog = open(readJson(catalogPath, 'the signed catalog'), TYPES.catalog, catalogKeys, threshold, 'the catalog');
if (catalog._type !== 'catalog' || catalog.schemaVersion !== 2) fail('not a schema 2 catalog document');
if (!Number.isSafeInteger(catalog.version) || catalog.version < 1) fail(`version ${catalog.version} is not a whole number of at least 1`);
const expires = Date.parse(catalog.expires);
if (Number.isNaN(expires)) fail(`expiry ${catalog.expires} is not an RFC 3339 time`);
if (expires <= Date.now()) fail(`the catalog expired on ${catalog.expires}`);

const publishers = (catalog.publishers ?? []).map((delegation, index) => {
  const publisher = open(delegation, TYPES.publisher, catalogKeys, threshold, `publisher delegation ${index}`);
  if (publisher._type !== 'publisher' || !publisher.namespaces?.length) fail(`publisher delegation ${index} delegates nothing`);
  return publisher;
});

const source = readJson('catalog.json', 'catalog.json');
if (JSON.stringify(catalog.extensions) !== JSON.stringify(source.extensions)) {
  fail('the signed catalog does not carry exactly the entries catalog.json lists');
}

if (previousPath && existsSync(previousPath)) {
  const previous = JSON.parse(Buffer.from(readJson(previousPath, 'the previous signed catalog').payload, 'base64'));
  // A host refuses a version lower than one it has verified, and a different catalog under
  // the same version.
  if (catalog.version <= previous.version) {
    fail(`version ${catalog.version} is not higher than the published version ${previous.version}`);
  }
}

console.log(
  `catalog version ${catalog.version}, expires ${catalog.expires}: ${catalog.extensions.length} apps; publishers ${publishers
    .map((publisher) => `${publisher.id} (${publisher.namespaces.join(', ')})`)
    .join('; ')}`,
);
