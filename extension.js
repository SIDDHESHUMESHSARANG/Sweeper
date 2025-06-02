const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.getFileExtension', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found');
            return;
        }

        const filename = editor.document.fileName;
        const fileExtension = filename.substring(filename.lastIndexOf('.') + 1);
        vscode.window.showInformationMessage(`File extension: ${fileExtension}`);
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}; 