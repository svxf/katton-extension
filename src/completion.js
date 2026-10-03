const vscode = require('vscode');
const { ENTRIES, MEMBER_CONTEXTS, STRING_CONTEXTS, DURATION_UNITS, snippetFor } = require('./data');
const { resolveType, describeMember, describeValue } = require('./scope');
const { receiverBefore } = require('./util');

const MAX_SNIPPET_RESULTS = 30;

const MarkdownCode = (code, extra = '') =>
  new vscode.MarkdownString('```katton\n' + code + '\n```' + extra);

const rangeBefore = (position, chars) =>
  new vscode.Range(position.line, position.character - chars, position.line, position.character);

class KattonCompletionProvider {
  provideCompletionItems(document, position) {
    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    const context = { document, position, linePrefix };

    if (isInsideString(linePrefix)) return stringValueCompletions(context);
    if (isTypingRangeBound(linePrefix)) return [];

    return durationUnitCompletions(context)
      || memberCompletions(context)
      || snippetCompletions(context)
      || [];
  }
}

// string values
const isInsideString = linePrefix => (linePrefix.match(/"/g) || []).length % 2 === 1;

function stringValueCompletions({ position, linePrefix }) {
  const openQuote = linePrefix.lastIndexOf('"');
  const typed = linePrefix.slice(openQuote + 1).toLowerCase();

  const source = STRING_CONTEXTS.find(([pattern]) => pattern.test(linePrefix.slice(0, openQuote)));
  if (!source) return [];

  const range = new vscode.Range(position.line, openQuote + 1, position.line, position.character);
  return source[1]
    .filter(value => value.toLowerCase().includes(typed))
    .map(value => {
      const doc = describeValue(value);
      const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
      item.range = range;
      item.detail = doc || 'katton value';
      if (doc) item.documentation = new vscode.MarkdownString(doc);
      return item;
    });
}

// durations
const isTypingRangeBound = linePrefix => /\bin\s+-?\d[\d.]*$/.test(linePrefix);

function durationUnitCompletions({ position, linePrefix }) {
  const match = linePrefix.match(/(?<![\w.])\d+(?:\.\d+)?\.(\w*)$/);
  if (!match) return null;

  const typed = match[1].toLowerCase();
  const units = DURATION_UNITS.filter(unit => unit.startsWith(typed));
  if (!units.length) return null;

  const range = rangeBefore(position, typed.length);
  return units.map(unit => {
    const item = new vscode.CompletionItem(unit, vscode.CompletionItemKind.Unit);
    item.range = range;
    item.detail = 'duration unit';
    return item;
  });
}

// members: player., zombie., Katton.vars.script., etc
function memberCompletions({ document, position, linePrefix }) {
  const dot = linePrefix.match(/\.(\w*)$/);
  if (!dot) return null;

  const receiver = receiverBefore(linePrefix, dot.index);
  if (!receiver) return null;
  if (linePrefix[dot.index - receiver.length - 1] === '@') return null;

  const type = resolveType(document.getText(), document.offsetAt(position), receiver);
  if (!type || !MEMBER_CONTEXTS[type]) return [];

  const typed = dot[1].toLowerCase();
  const range = rangeBefore(position, typed.length);
  const inferredNote = receiver !== type ? `\n\n_(${receiver} inferred as ${type})_` : '';

  return MEMBER_CONTEXTS[type]
    .filter(member => member.label.toLowerCase().startsWith(typed))
    .map(member => {
      const kind = member.isMethod ? vscode.CompletionItemKind.Method : vscode.CompletionItemKind.Property;
      const item = new vscode.CompletionItem(member.label, kind);
      const doc = describeMember(type, member.label);

      item.range = range;
      item.insertText = member.insert.includes('$') ? new vscode.SnippetString(member.insert) : member.insert;
      item.detail = doc || `${type} member`;
      item.documentation = MarkdownCode(
        `${receiver}.${member.label}`,
        (doc ? '\n\n' + doc : '') + inferredNote,
      );
      return item;
    });
}

// snippets & API search
function typedSnippetPrefix(linePrefix) {
  const keywordWithParen = linePrefix.match(/(?:^|[\s{};])((?:for|if|when|function)\s*\()$/);
  if (keywordWithParen) return keywordWithParen[1];

  const word = linePrefix.match(/[A-Za-z@][\w./@]*$/);
  return word ? word[0] : null;
}

function snippetCompletions({ position, linePrefix }) {
  const typed = typedSnippetPrefix(linePrefix);
  if (!typed || typed.length < 2) return null;

  const query = typed.toLowerCase();
  const candidates = ENTRIES.filter(entry => !entry.wikiOnly);
  let hits = candidates.filter(entry => entry.s.toLowerCase().startsWith(query));
  if (!hits.length && query.length >= 3) {
    hits = candidates.filter(entry => entry.s.toLowerCase().includes(query));
  }

  const range = rangeBefore(position, typed.length);
  return hits.slice(0, MAX_SNIPPET_RESULTS).map(entry => {
    const item = new vscode.CompletionItem(entry.s, vscode.CompletionItemKind.Snippet);
    item.range = range;
    item.detail = entry.d;
    item.documentation = MarkdownCode(entry.s, `\n\n_${entry.g}_`);
    item.insertText = new vscode.SnippetString(snippetFor(entry));
    return item;
  });
}

module.exports = { KattonCompletionProvider };
