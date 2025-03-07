import * as vscode from 'vscode';

async function getFileStructure(allSelections: vscode.Uri[]): Promise<string> {
    const fileStructure = allSelections.map(uri => vscode.workspace.asRelativePath(uri)).join('\n');
    return `Folder Structure:\n${fileStructure}\n\n`;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.copyFilesContent', async (...cmdArgs: [vscode.Uri, vscode.Uri[]]) => {
        const [contextSelection, allSelections] = cmdArgs;

        if (!allSelections || allSelections.length === 0) {
            vscode.window.showWarningMessage('No files selected.');
            return;
        }

        try {
            const config = vscode.workspace.getConfiguration('copyFilesContent');
            const includeStructure = config.get<boolean>('includeFolderStructure', true);

            let structure = '';

            if (includeStructure) {
                structure = await getFileStructure(allSelections);
            }

            const fileContents = await Promise.all(
                allSelections.map(async (uri) => {
                    try {
                        // Usar TextDocument en lugar de readFile directo para mejor compatibilidad
                        const fileContent = await vscode.workspace.openTextDocument(uri);
                        const fileName = vscode.workspace.asRelativePath(uri);
                        const content = fileContent.getText();
                        return `File: ${fileName}\n\n${content}`;
                    } catch (error) {
                        console.error(`Error reading file ${uri.toString()}:`, error);
                        return `File: ${vscode.workspace.asRelativePath(uri)}\n\nError reading file content`;
                    }
                })
            );

            const formattedContent = `${structure}${fileContents.join('\n\n')}`;
            if (formattedContent !== '') {
                await vscode.env.clipboard.writeText(formattedContent);
                vscode.window.showInformationMessage('Content copied to clipboard!');
            } else {
                vscode.window.showWarningMessage('No content to copy!');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            } else {
                console.error('Unexpected error:', error);
                vscode.window.showErrorMessage('An unexpected error occurred.');
            }
        }
    });

    // Registrar un comando para abrir la configuración
    let settingsDisposable = vscode.commands.registerCommand('extension.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'copyFilesContent');
    });

    context.subscriptions.push(disposable, settingsDisposable);
}

export function deactivate() { }