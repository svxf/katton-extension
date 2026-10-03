const vscode = require('vscode');
const { ENTRIES } = require('./data');

const ADMIN_GROUP = 'Admin-command allow-list';
const { resolveType, findMember } = require('./scope');
const { receiverBefore } = require('./util');

class KattonHoverProvider {
  provideHover(document, position) {
    const range = document.getWordRangeAtPosition(position, /[A-Za-z_]\w*/);
    if (!range) return null;

    const word = document.getText(range);
    const line = document.lineAt(range.start.line).text;
    const inString = isInsideString(line.slice(0, range.start.character));
    const found = memberOnReceiver(document, range, word) || syntaxEntry(word, inString);
    if (!found) return null;

    const markdown = new vscode.MarkdownString();
    markdown.appendCodeblock(found.signature, 'katton');
    markdown.appendMarkdown(found.description || '_(no description)_');
    return new vscode.Hover(markdown, range);
  }
}

function memberOnReceiver(document, range, word) {
  const line = document.lineAt(range.start.line).text;
  const before = line.slice(0, range.start.character);
  if (!before.endsWith('.')) return null;

  const receiver = receiverBefore(before, before.length - 1);
  if (!receiver) return null;

  const type = resolveType(document.getText(), document.offsetAt(range.start), receiver);
  const member = type && findMember(type, word);
  return member && { signature: member.prefix + member.signature, description: member.description };
}

const isInsideString = linePrefix => (linePrefix.match(/"/g) || []).length % 2 === 1;

function syntaxEntry(word, inString) {
  const entry = ENTRIES.find(e =>
    e.s.replace(/[\s(].*$/, '') === word && (inString || e.g !== ADMIN_GROUP));
  return entry && { signature: entry.s, description: entry.d };
}

module.exports = { KattonHoverProvider };
