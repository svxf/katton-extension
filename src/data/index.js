const { SYNTAX } = require('./syntax');
const { API_TYPES, MEMBER_RESULT_TYPES } = require('./api');
const { ADMIN_COMMANDS, ADMIN_COMMAND_DOCS } = require('./admin-commands');
const {
  EVENTS, PERMISSIONS, PROJECTILES, DURATION_UNITS, EVENT_NAMES, PERMISSION_NAMES,
} = require('./events');

const STRING_PARAMS = new Set([
  'text', 'title', 'subtitle', 'sound', 'type', 'material', 'tag', 'key', 'name', 'message', 'command',
]);

const memberName = signature => signature.split('(')[0].trim();
const isMethod = signature => signature.includes('(');

function parseParams(signature) {
  const inner = (signature.match(/\(([^)]*)\)/) || [, ''])[1].trim();
  if (!inner) return [];
  return inner.split(',').map(raw => {
    const [name, fallback] = raw.split('=').map(part => part.trim());
    return { name, optional: fallback !== undefined };
  });
}


function defaultSnippet(signature) {
  const name = memberName(signature);
  if (!isMethod(signature)) return name;

  const params = parseParams(signature);
  if (!params.length) return `${name}()`;

  const required = params.filter(p => !p.optional);
  if (!required.length)
    return `${name}($1)`;

  const args = required.map((p, i) => {
    const stop = '${' + (i + 1) + ':' + p.name + '}';
    return STRING_PARAMS.has(p.name) ? `"${stop}"` : stop;
  });
  return `${name}(${args.join(', ')})`;
}

const ENTRIES = [];
const MEMBER_CONTEXTS = {};
const MEMBER_INDEX = {};
const VALUE_DOCS = {};

const addEntry = (group, s, d, snippet, wikiOnly = false) => {
  ENTRIES.push({ s, d, g: group, snippet, wikiOnly });
};

const addValues = (group, pairs) => {
  for (const [value, doc] of pairs) {
    addEntry(group, value, doc, undefined, true);
    VALUE_DOCS[value] = doc;
  }
};

for (const [group, entries] of SYNTAX) {
  for (const [signature, description, snippet] of entries) addEntry(group, signature, description, snippet);
}

addValues('events', EVENTS);
addValues('command permission values', PERMISSIONS);

for (const { type, group, prefix, wikiOnly, members } of API_TYPES) {
  MEMBER_CONTEXTS[type] = members.map(([signature, description, snippet]) => {
    const insert = snippet || defaultSnippet(signature);
    MEMBER_INDEX[`${type}.${memberName(signature)}`] = { signature, description, prefix };
    if (group) addEntry(group, prefix + signature, description, wikiOnly ? undefined : prefix + insert, wikiOnly);
    return { label: signature, insert, description, isMethod: isMethod(signature) };
  });
}

addValues('admin command allowlist', ADMIN_COMMAND_DOCS);

function snippetFor(entry) {
  if (entry.snippet) return entry.snippet;
  return entry.s
    .replace('{ ... }', '{\n\t$1\n}')
    .replace('("")', '("$1")')
    .replace(/\(\)$/, '($1)')
    .replace(/\$(?![\d{])/g, '\\$'); // `$` not a snippet variable
}

const STRING_CONTEXTS = [
  [/@Katton\.listen\(\s*$/, EVENT_NAMES],
  [/permission\s*=\s*$/, PERMISSION_NAMES],
  [/Katton\.makeAdminExecuteCommand\(\s*$/, ADMIN_COMMANDS.map(command => command + ' ')],
  [/shootProjectile\(\s*$/, PROJECTILES],
  [/projectile\s*=\s*$/, PROJECTILES],
];

module.exports = {
  ENTRIES, MEMBER_CONTEXTS, MEMBER_INDEX, MEMBER_RESULT_TYPES, STRING_CONTEXTS, VALUE_DOCS,
  EVENT_NAMES, PERMISSION_NAMES, PROJECTILES, DURATION_UNITS, memberName, snippetFor,
};
