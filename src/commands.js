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

function chunkString(str, length) {
  const chunks = [];
  for (let i = 0; i < str.length; i += length) {
    chunks.push(str.substring(i, i + length));
  }
  return chunks;
}

function showTokenChunksWebview(name, chunks) {
  const panel = vscode.window.createWebviewPanel(
    'kattonTokenChunks',
    `Katton tokens - ${name}`,
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === 'copy') {
      await vscode.env.clipboard.writeText(message.text);
      vscode.window.showInformationMessage(`copied chunk ${message.index + 1} to clipboard!`);
    }
  });

  const chunksHtml = chunks
    .map((chunk, index) => {
      const safeChunk = chunk
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      return `
        <div class="chunk-card">
          <div class="chunk-header">
            <h3>chunk ${index + 1} of ${chunks.length} <span class="char-count">(${chunk.length} chars)</span></h3>
            <button onclick="copyChunk(${index})">copy chunk ${index + 1}</button>
          </div>
          <textarea readonly id="chunk-${index}">${safeChunk}</textarea>
        </div>
      `;
    })
    .join('');

  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 20px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1 {
      font-size: 1.4em;
      margin-bottom: 8px;
    }
    p {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 20px;
    }
    .chunk-card {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-widget-border, #444);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .chunk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .chunk-header h3 {
      margin: 0;
      font-size: 1.1em;
    }
    .char-count {
      font-weight: normal;
      font-size: 0.9em;
      opacity: 0.8;
    }
    button {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    textarea {
      width: 100%;
      height: 100px;
      box-sizing: border-box;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, #555);
      border-radius: 4px;
      padding: 8px;
      font-family: monospace;
      resize: vertical;
    }
  </style>
</head>
<body>
  <h1>katton import token - ${name}</h1>
  <p>the exported token exceeds 15,000 characters and was split into <strong>${chunks.length} chunks</strong>. copy each chunk individually to import ingame!</p>
  
  ${chunksHtml}

  <script>
    const vscode = acquireVsCodeApi();
    const chunksData = ${JSON.stringify(chunks)};

    function copyChunk(index) {
      vscode.postMessage({
        command: 'copy',
        index: index,
        text: chunksData[index]
      });
    }
  </script>
</body>
</html>`;
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

  const MAX_CHUNK_SIZE = 15000;

  if (token.length > MAX_CHUNK_SIZE) {
    const chunks = chunkString(token, MAX_CHUNK_SIZE);

    showTokenChunksWebview(name, chunks);

    vscode.window.showWarningMessage(
      `token for "${name}" is too large (${token.length} chars). split into ${chunks.length} chunks. opened viewer page!`
    );
  } else {
    await vscode.env.clipboard.writeText(token);
    const choice = await vscode.window.showInformationMessage(
      `import token for "${name}" copied to clipboard. run /katton import ingame and paste it`,
      'show token'
    );
    if (choice === 'show token') {
      const tokenDoc = await vscode.workspace.openTextDocument({ content: token, language: 'plaintext' });
      await vscode.window.showTextDocument(tokenDoc, { preview: false });
    }
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