import * as vscode from 'vscode';
import path from 'node:path';
import trash from 'trash';
import { cleanSidecar } from './cleaner.js';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('AppleDouble Cleaner');
  const pending = new Map<string, Promise<boolean>>();
  let hasShownFailure = false;

  const processSidecar = (sidecarPath: string): Promise<boolean> => {
    const key = path.resolve(sidecarPath);
    const existing = pending.get(key);
    if (existing) {
      return existing;
    }

    const operation = cleanSidecar(key, async (filePath) => {
      await trash(filePath);
    })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : String(error);
        output.appendLine(`Could not move "${key}" to Trash: ${detail}`);
        output.show(true);
        if (!hasShownFailure) {
          hasShownFailure = true;
          void vscode.window.showErrorMessage(
            'AppleDouble Cleaner could not move a sidecar to Trash. See the AppleDouble Cleaner output channel.'
          );
        }
        return false;
      })
      .finally(() => {
        pending.delete(key);
      });

    pending.set(key, operation);
    return operation;
  };

  const sidecarForCreatedFile = (filePath: string): string => {
    const name = path.basename(filePath);
    return name.startsWith('._')
      ? filePath
      : path.join(path.dirname(filePath), `._${name}`);
  };

  const cleanWorkspace = async (): Promise<number> => {
    const candidates = await vscode.workspace.findFiles('**/._*', '**/.git/**');
    let moved = 0;
    for (const candidate of candidates) {
      if (await processSidecar(candidate.fsPath)) {
        moved += 1;
      }
    }
    return moved;
  };

  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  context.subscriptions.push(
    output,
    watcher,
    watcher.onDidCreate((uri) => {
      if (uri.scheme === 'file') {
        void processSidecar(sidecarForCreatedFile(uri.fsPath));
      }
    }),
    vscode.commands.registerCommand('appledoubleCleaner.cleanNow', async () => {
      const moved = await cleanWorkspace();
      const message = moved === 1
        ? 'Moved 1 AppleDouble sidecar to Trash.'
        : `Moved ${moved} AppleDouble sidecars to Trash.`;
      void vscode.window.showInformationMessage(message);
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void cleanWorkspace();
    })
  );

  void cleanWorkspace();
}

export function deactivate(): void {}
