const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

async function buildIncludesMap(mainFilePath, visited = new Set(), rootDir = null) {
  const absMain = path.resolve(mainFilePath)
  if (visited.has(absMain)) return {}
  visited.add(absMain)

  // rootDir: nginx prefix 디렉터리 (최초 호출 시 main conf 위치로 고정)
  // nginx는 모든 상대 경로를 prefix 기준으로 해석함
  if (!rootDir) rootDir = path.dirname(absMain)

  let content
  try { content = fs.readFileSync(absMain, 'utf8') } catch { return {} }

  const map = {}
  const regex = /^\s*include\s+(.+?)\s*;/gm
  let match
  while ((match = regex.exec(content)) !== null) {
    const pattern = match[1]
    // 상대 경로는 rootDir(nginx prefix) 기준으로 해석
    // 절대 경로는 그대로 사용
    const abs = path.isAbsolute(pattern) ? pattern : path.join(rootDir, pattern)
    const absDir  = path.dirname(abs)
    const absBase = path.basename(abs)

    try {
      // glob 패턴은 vscode.workspace.findFiles, 단일 파일은 직접 읽기
      if (absBase.includes('*') || absBase.includes('?')) {
        const uris = await vscode.workspace.findFiles(
          new vscode.RelativePattern(vscode.Uri.file(absDir), absBase)
        )
        for (const uri of uris) {
          try {
            const fileContent = fs.readFileSync(uri.fsPath, 'utf8')
            map[pattern] = (map[pattern] || '') + '\n' + fileContent
            // 재귀: rootDir 유지하며 해당 include 파일 안의 include도 수집
            const sub = await buildIncludesMap(uri.fsPath, visited, rootDir)
            Object.assign(map, sub)
          } catch {}
        }
      } else {
        map[pattern] = fs.readFileSync(abs, 'utf8')
        // 재귀: rootDir 유지하며 해당 include 파일 안의 include도 수집
        const sub = await buildIncludesMap(abs, visited, rootDir)
        Object.assign(map, sub)
      }
    } catch {}
  }
  return map
}

function activate(context) {
  const disposable = vscode.commands.registerCommand('nginx-viewer.open', async (uri) => {
    let fileUri = uri;
    if (!fileUri && vscode.window.activeTextEditor) {
      fileUri = vscode.window.activeTextEditor.document.uri;
    }

    if (!fileUri) {
      vscode.window.showErrorMessage('No nginx config file selected.');
      return;
    }

    const filePath = fileUri.fsPath;
    const fileName = path.basename(filePath);

    const panel = vscode.window.createWebviewPanel(
      'nginxViewer',
      `Nginx Viewer: ${fileName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'webview')
        ]
      }
    );

    const webviewUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'webview')
    ).toString();

    let html = fs.readFileSync(
      path.join(context.extensionPath, 'webview', 'index.html'),
      'utf8'
    );

    // Replace relative asset paths: ./assets/... (Vite build with base: './')
    html = html.replace(/(src|href)="\.\/assets\//g, `$1="${webviewUri}/assets/`);
    // Fallback: /nginx/assets/... (older build)
    html = html.replace(/\/nginx\/assets\//g, `${webviewUri}/assets/`);

    // Add Content-Security-Policy
    const csp = [
      `default-src 'none'`,
      `script-src 'unsafe-inline' ${panel.webview.cspSource}`,
      `style-src 'unsafe-inline' ${panel.webview.cspSource}`,
      `img-src ${panel.webview.cspSource} data:`,
      `font-src ${panel.webview.cspSource}`
    ].join('; ');
    html = html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`
    );

    // Inject VS Code flag, locale, file content, and resolved includes before </head>
    const locale = vscode.env.language;
    const fileContent = fs.readFileSync(filePath, 'utf8').replace(/`/g, '\\`');
    const includesMap = await buildIncludesMap(filePath);
    html = html.replace(
      '</head>',
      `<script>window.__vscode_webview__ = true; window.__vscode_locale__ = '${locale}'; window.__nginx_initial_content__ = \`${fileContent}\`; window.__nginx_includes__ = ${JSON.stringify(includesMap)};</script>\n  </head>`
    );

    panel.webview.html = html;

    panel.webview.onDidReceiveMessage(
      message => {
        if (message.command === 'save') {
          try {
            fs.writeFileSync(filePath, message.content, 'utf8');
            panel.webview.postMessage({ command: 'saved' });
          } catch (err) {
            panel.webview.postMessage({ command: 'save-error', message: err.message });
          }
        }
      },
      undefined,
      context.subscriptions
    );

    // 사이드바 숨기고 에디터 최대화
    vscode.commands.executeCommand('workbench.action.maximizeEditorHideSidebar');
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
