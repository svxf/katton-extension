const { MEMBER_CONTEXTS, MEMBER_INDEX, MEMBER_RESULT_TYPES, VALUE_DOCS, memberName } = require('./data');
const { stripLine, findClosingParen } = require('./util');

function findMember(type, label) {
  return MEMBER_INDEX[`${type}.${memberName(label)}`] || null;
}

function describeMember(type, label) {
  const member = findMember(type, label);
  return member ? member.description : '';
}

function describeValue(value) {
  return VALUE_DOCS[value.trim()] || '';
}

// finds every `@Katton.command` / `@Katton.listen` function
function findAnnotatedFunctions(text) {
  const lines = text.split('\n');
  const functions = [];

  for (let i = 0; i < lines.length; i++) {
    const annotation = lines[i].trim().match(/^@Katton\.(command|listen)\b/);
    if (!annotation) continue;

    let declLine = i + 1;
    while (declLine < lines.length && !lines[declLine].trim()) declLine++;
    const decl = declLine < lines.length && lines[declLine].trim().match(/^function\s+\w+\s*\(([^)]*)\)/);
    if (!decl) continue;

    functions.push({
      kind: annotation[1],
      startLine: declLine,
      endLine: findBlockEnd(lines, declLine),
      params: decl[1].split(',').map(p => p.trim()).filter(Boolean),
    });
  }
  return functions;
}

function findBlockEnd(lines, startLine) {
  let depth = 0;
  let opened = false;
  for (let i = startLine; i < lines.length; i++) {
    for (const ch of stripLine(lines[i])) {
      if (ch === '{') { depth++; opened = true; }
      else if (ch === '}') depth = Math.max(0, depth - 1);
    }
    if (opened && depth === 0) return i;
  }
  return lines.length - 1;
}

// expression typing
function parseChain(expression) {
  const text = expression.trim().replace(/;$/, '').trim();
  const segments = [];
  let i = 0;

  while (i < text.length) {
    const ident = /^[A-Za-z_]\w*/.exec(text.slice(i));
    if (!ident) return null;
    const segment = { name: ident[0], isCall: false };
    i += ident[0].length;

    if (text[i] === '(') {
      const close = findClosingParen(text, i);
      if (close < 0) return null;
      segment.isCall = true;
      i = close + 1;
    }
    segments.push(segment);

    if (i === text.length) break;
    if (text[i] !== '.') return null;
    if (++i >= text.length) return null;
  }
  return segments.length ? segments : null;
}

function typeOfName(name, scope) {
  return scope[name] || (MEMBER_CONTEXTS[name] ? name : null);
}

function typeOfMember(type, { name }) {
  const key = `${type}.${name}`;
  return MEMBER_RESULT_TYPES[key] || (MEMBER_CONTEXTS[key] ? key : null);
}

function typeOfExpression(expression, scope) {
  const segments = parseChain(expression);
  if (!segments) return null;

  let type = typeOfName(segments[0].name, scope);
  for (let i = 1; type && i < segments.length; i++) {
    type = typeOfMember(type, segments[i]);
  }
  return type;
}




// scope building
const DECLARATION = /(?:^|[\s{};])(?:val|var)\s+(\w+)\s*=\s*(.+)$/;
const FOR_HEADER = /\bfor\s*\(\s*(\w+)\s+in\s+/;

function parseForLoop(line) {
  const header = FOR_HEADER.exec(line);
  if (!header) return null;

  const start = header.index + header[0].length;
  let depth = 0;
  for (let i = start; i < line.length; i++) {
    if (line[i] === '(') depth++;
    else if (line[i] === ')' && depth-- === 0) {
      return { variable: header[1], iterable: line.slice(start, i) };
    }
  }
  return { variable: header[1], iterable: line.slice(start) };
}

function buildScope(text, offset) {
  const scope = {};
  const lineIndex = text.slice(0, offset).split('\n').length - 1;

  const insideFunction = findAnnotatedFunctions(text).find(fn => lineIndex >= fn.startLine && lineIndex <= fn.endLine);
  if (insideFunction && insideFunction.params[0]) {
    scope[insideFunction.params[0]] = insideFunction.kind === 'command' ? 'player' : 'event';
  }

  for (const rawLine of text.slice(0, offset).split('\n')) {
    const line = stripLine(rawLine);

    const declaration = DECLARATION.exec(line);
    if (declaration) {
      const type = typeOfExpression(declaration[2], scope);
      if (type) scope[declaration[1]] = type;
    }

    const loop = parseForLoop(line);
    if (loop) {
      const listType = typeOfExpression(loop.iterable, scope);
      if (listType && listType.endsWith('[]')) scope[loop.variable] = listType.slice(0, -2);
    }
  }
  return scope;
}

function resolveType(text, offset, expression) {
  return typeOfExpression(expression, buildScope(text, offset));
}

module.exports = { resolveType, findMember, describeMember, describeValue };
