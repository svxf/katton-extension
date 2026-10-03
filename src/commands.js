const vscode = require('vscode');
const path = require('path');
const { ENTRIES, snippetFor } = require('./data');
const { encodeToken, decodeToken } = require('./token');

const sanitizeName = (raw, fallback) =>
  raw.trim().replace(/[^A-Za-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || fallback;

async function fileExists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function exportToken() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'katton') {
    vscode.window.showErrorMessage('open a .kat file to export an import token');
    return;
  }

  const { fileName } = editor.document;
  const name = sanitizeName(path.basename(fileName, path.extname(fileName)), 'script');
  const token = encodeToken(name, editor.document.getText());

  await vscode.env.clipboard.writeText(token);
  const choice = await vscode.window.showInformationMessage(
    `import token for "${name}" copied to clipboard. run /katton import ingame and paste it`,
    'show token',
  );
  if (choice === 'show token') {
    const tokenDoc = await vscode.workspace.openTextDocument({ content: token, language: 'plaintext' });
    await vscode.window.showTextDocument(tokenDoc, { preview: false });
  }
}

async function freeScriptUri(root, base) {
  let name = base;
  for (let n = 2; await fileExists(vscode.Uri.joinPath(root, name + '.kat')); n++) {
    name = `${base}-${n}`;
  }
  return { name, uri: vscode.Uri.joinPath(root, name + '.kat') };
}

async function importToken() {
  const raw = await vscode.window.showInputBox({
    prompt: 'paste a Katton import token',
    placeHolder: 'KTN1...',
    ignoreFocusOut: true,
  });
  if (!raw) return;

  let script;
  try {
    script = decodeToken(raw);
  } catch (err) {
    vscode.window.showErrorMessage('Katton import failed: ' + err.message);
    return;
  }

  const base = sanitizeName(script.n, 'imported');
  const folders = vscode.workspace.workspaceFolders;

  if (!folders || !folders.length) {
    const doc = await vscode.workspace.openTextDocument({ content: script.c, language: 'katton' });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`imported "${base}" as an unsaved file, save it as ${base}.kat`);
    return;
  }

  const { name, uri } = await freeScriptUri(folders[0].uri, base);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(script.c, 'utf8'));
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));

  vscode.window.showInformationMessage(
    name === base ? `imported as ${name}.kat` : `imported as ${name}.kat (name was taken)`,
  );
}

async function showWiki() {
  const items = ENTRIES.map(entry => ({
    label: entry.s, description: entry.g, detail: entry.d, entry,
  }));
  const pick = await vscode.window.showQuickPick(items, {
    title: 'Katton wiki',
    placeHolder: 'search the Katton scripting API',
    matchOnDescription: true,
    matchOnDetail: true,
  });

  const editor = vscode.window.activeTextEditor;
  if (pick && editor && !pick.entry.wikiOnly) {
    editor.insertSnippet(new vscode.SnippetString(snippetFor(pick.entry)));
  }
}

module.exports = { exportToken, importToken, showWiki };
