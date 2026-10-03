const { PERMISSION_NAMES, EVENT_NAMES, PROJECTILES } = require('./data');
const { stripComment } = require('./util');

const MAX_DIAGNOSTICS = 200;

function checkQuotes({ code }) {
  const quotes = (code.match(/(?<!\\)"/g) || []).length;
  return quotes % 2 ? [{ col: code.lastIndexOf('"'), len: 1, msg: 'unclosed quote' }] : [];
}

function checkFunctionParams(row) {
  const decl = row.trimmed.match(/^function\s+\w+\s*\(([^)]*)\)/);
  if (decl && decl[1].includes(':')) {
    return [wholeRow(row, 'function parameters cannot have types. use function name(a, b), not function name(a: Type)')];
  }
  return [];
}

function checkCommandAnnotation(row) {
  if (!/^@Katton\.command\s*\(/.test(row.trimmed)) return [];
  const problems = [];

  if (!/name\s*=\s*"[a-z0-9_-]+"/.test(row.trimmed)) {
    problems.push(wholeRow(row, 'command needs name = "..." using only lowercase letters, numbers, _ and -'));
  }
  const permission = row.trimmed.match(/permission\s*=\s*"([^"]*)"/);
  if (!permission) {
    problems.push(wholeRow(row, 'command needs permission = "admin" | "creative" | "all"'));
  } else if (!PERMISSION_NAMES.includes(permission[1])) {
    problems.push(wholeRow(row, 'permission must be exactly "admin", "creative", or "all"'));
  }
  return problems;
}

function checkListenAnnotation(row) {
  if (!/^@Katton\.listen\s*\(/.test(row.trimmed)) return [];

  const event = row.trimmed.match(/^@Katton\.listen\s*\(\s*"([^"]*)"\s*\)\s*$/);
  if (!event) return [wholeRow(row, '@Katton.listen(...) takes exactly one string literal event name')];
  if (!EVENT_NAMES.includes(event[1])) {
    return [wholeRow(row, `unknown event "${event[1]}". see the wiki for the supported events`)];
  }
  return [];
}

function checkAnnotationHasFunction(row, { rows, index }) {
  if (!/^@Katton\.(command|listen)/.test(row.trimmed)) return [];
  let next = index + 1;
  while (next < rows.length && rows[next].blank) next++;
  if (next >= rows.length || !/^function\s+\w+\s*\(/.test(rows[next].trimmed)) {
    return [wholeRow(row, 'an annotation must be immediately followed by a function declaration')];
  }
  return [];
}

function checkProjectiles(row) {
  const problems = [];
  const call = /\.shootProjectile\s*\(\s*(?:projectile\s*=\s*)?"([^"]*)"/g;
  for (let m; (m = call.exec(row.code));) {
    if (!PROJECTILES.includes(m[1])) {
      const col = m.index + m[0].lastIndexOf(m[1]);
      problems.push({
        col, len: Math.max(1, m[1].length), severity: 'warning',
        msg: `"${m[1]}" can't be shot. allowed: ${PROJECTILES.join(', ')}`,
      });
    }
  }
  return problems;
}

const ROW_RULES = [
  checkQuotes, checkFunctionParams, checkCommandAnnotation,
  checkListenAnnotation, checkAnnotationHasFunction, checkProjectiles,
];

// helperss
function wholeRow(row, msg) {
  const start = row.code.length - row.code.trimStart().length;
  return { col: start, len: Math.max(1, row.code.trimEnd().length - start), msg };
}

function toRows(text) {
  return text.split('\n').map(line => {
    const code = stripComment(line);
    return { code, trimmed: code.trim(), blank: !code.trim() };
  });
}

// brackets
const OPENERS = { '{': '}', '(': ')', '[': ']' };
const CLOSERS = { '}': '{', ')': '(', ']': '[' };

function checkBrackets(text) {
  const problems = [];
  const stack = [];
  let inString = false;

  text.split('\n').forEach((line, lineIndex) => {
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '"' && line[col - 1] !== '\\') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '/' && line[col + 1] === '/') break;

      if (OPENERS[ch]) {
        stack.push({ ch, lineIndex, col });
      } else if (CLOSERS[ch]) {
        if (stack.length && stack[stack.length - 1].ch === CLOSERS[ch]) {
          stack.pop();
        } else {
          problems.push({ line: lineIndex, col, len: 1, msg: `unexpected "${ch}" with no matching "${CLOSERS[ch]}"` });
        }
      }
    }
  });

  if (stack.length) {
    const top = stack[stack.length - 1];
    problems.push({
      line: top.lineIndex, col: top.col, len: 1,
      msg: `unclosed "${top.ch}" - add a matching "${OPENERS[top.ch]}"`,
    });
  }
  return problems;
}

function lint(text) {
  const diagnostics = [];
  const push = (line, { col, len, msg, severity = 'error' }) => {
    diagnostics.push({ line, col, len: Math.max(1, len), sev: severity, msg });
  };

  const rows = toRows(text);
  rows.forEach((row, index) => {
    if (row.blank || diagnostics.length > MAX_DIAGNOSTICS) return;
    for (const rule of ROW_RULES) {
      for (const problem of rule(row, { rows, index })) push(index, problem);
    }
  });

  for (const problem of checkBrackets(text)) push(problem.line, problem);
  return diagnostics;
}

module.exports = { lint };
