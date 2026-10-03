const vscode = require('vscode');
const { lint } = require('./lint');

const SEVERITY = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
};

function refreshDiagnostics(document, collection) {
  if (document.languageId !== 'katton') return;

  const diagnostics = lint(document.getText()).map(problem => {
    const range = new vscode.Range(problem.line, problem.col, problem.line, problem.col + problem.len);
    const diagnostic = new vscode.Diagnostic(range, problem.msg, SEVERITY[problem.sev] ?? SEVERITY.error);
    diagnostic.source = 'katton';
    return diagnostic;
  });
  collection.set(document.uri, diagnostics);
}

function registerDiagnostics(context) {
  const collection = vscode.languages.createDiagnosticCollection('katton');
  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(doc => refreshDiagnostics(doc, collection)),
    vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, collection)),
    vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri)),
  );

  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, collection);
  }
}

module.exports = { registerDiagnostics };
