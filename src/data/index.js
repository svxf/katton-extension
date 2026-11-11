const { SYNTAX } = require('./syntax');
const { API_TYPES, MEMBER_RESULT_TYPES } = require('./api');
const { ADMIN_COMMANDS, ADMIN_COMMAND_DOCS } = require('./admin-commands');
const {
  EVENTS, PERMISSIONS, PROJECTILES, DURATION_UNITS, EVENT_NAMES, PERMISSION_NAMES,
} = require('./events');

const STRING_PARAMS = new Set([
  'text', 'title', 'subtitle', 'sound', 'type', 'material', 'tag', 'key', 'name', 'message', 'command', 'particle',
]);

const memberName = signature => signature.split('(')[0].trim();
const isMethod = signature => signature.includes('(');

function splitTopLevel(value, delimiter) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '\"' || char === "'") { quote = char; continue; }
    if (char === '(' || char === '[' || char === '{') depth++;
    else if (char === ')' || char === ']' || char === '}') depth--;
    else if (char === delimiter && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function parseParams(signature) {
  const inner = (signature.match(/\(([^)]*)\)/) || [, ''])[1].trim();
  if (!inner) return [];
  return splitTopLevel(inner, ',').map(raw => {
    const [name, fallback] = splitTopLevel(raw, '=').map(part => part.trim());
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
  MEMBER_CONTEXTS[type] = members.map(([signature, description, snippet, metadata]) => {
    const insert = snippet || defaultSnippet(signature);
    const details = { ...(metadata || {}), signature, description, prefix };
    MEMBER_INDEX[`${type}.${memberName(signature)}`] = details;
    if (group) addEntry(group, prefix + signature, description, wikiOnly ? undefined : prefix + insert, wikiOnly);
    return { label: signature, insert, description, metadata: details, isMethod: isMethod(signature) };
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