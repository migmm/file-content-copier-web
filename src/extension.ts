import * as vscode from 'vscode';

async function getFileStructure(allSelections: vscode.Uri[]): Promise<string> {
    const fileStructure = allSelections.map(uri => vscode.workspace.asRelativePath(uri)).join('\n');
    return `Folder Structure:\n${fileStructure}\n\n`;
}

export function activate(context: vscode.ExtensionContext) {
    async function copyFilesContent(uri?: vscode.Uri) {
        let filesToProcess: vscode.Uri[] = [];

        if (uri) {
            filesToProcess = [uri];
        } else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                filesToProcess = [editor.document.uri];
            } else {
                vscode.window.showWarningMessage('No active editor found.');
                return;
            }
        }

        if (filesToProcess.length === 0) {
            vscode.window.showWarningMessage('No files selected.');
            return;
        }

        try {
            const config = vscode.workspace.getConfiguration('copyFilesContent');
            const includeStructure = config.get<boolean>('includeFolderStructure', true);

            let structure = '';

            if (includeStructure) {
                structure = await getFileStructure(filesToProcess);
            }

            const fileContents = await Promise.all(
                filesToProcess.map(async (uri) => {
                    try {
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
    }

    let copyDisposable = vscode.commands.registerCommand('extension.copyFilesContent', async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
        if (allUris && allUris.length > 0) {
            try {
                const config = vscode.workspace.getConfiguration('copyFilesContent');
                const includeStructure = config.get<boolean>('includeFolderStructure', true);

                let structure = '';

                if (includeStructure) {
                    structure = await getFileStructure(allUris);
                }

                const fileContents = await Promise.all(
                    allUris.map(async (uri) => {
                        try {
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
        } else {
            await copyFilesContent(uri);
        }
    });

    let settingsDisposable = vscode.commands.registerCommand('extension.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'copyFilesContent');
    });

    context.subscriptions.push(copyDisposable, settingsDisposable);
}

export function deactivate() { }