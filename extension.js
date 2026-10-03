const vscode = require('vscode');
const { KattonCompletionProvider } = require('./src/completion');
const { KattonHoverProvider } = require('./src/hover');
const { registerDiagnostics } = require('./src/diagnostics');
const commands = require('./src/commands');

function activate(context) {
  registerDiagnostics(context);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider('katton', new KattonCompletionProvider(), '.', '"'),
    vscode.languages.registerHoverProvider('katton', new KattonHoverProvider()),
    vscode.commands.registerCommand('katton.exportToken', commands.exportToken),
    vscode.commands.registerCommand('katton.importToken', commands.importToken),
    vscode.commands.registerCommand('katton.showWiki', commands.showWiki),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
