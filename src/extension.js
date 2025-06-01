const vscode = require('vscode');

function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.removeComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found');
            return;
        }

        const fileName = editor.document.fileName;
        const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);
        const text = editor.document.getText();

        let regex;

        // Regex patterns for different file types
        if (['js', 'ts', 'c', 'java'].includes(fileExtension)) {
            regex = /\/\/.*|\/\*[\s\S]*?\*\//g; // JS-style: // and /* */
        } else if (['py', 'sh'].includes(fileExtension)) {
            regex = /#.*/g; // Python/bash style
        } else {
            vscode.window.showInformationMessage(`Unsupported file type: .${fileExtension}`);
            return;
        }

        const cleanedText = text.replace(regex, '');

        editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(text.length)
            );
            editBuilder.replace(fullRange, cleanedText);
        });

        vscode.window.showInformationMessage(`Comments removed from .${fileExtension} file!`);
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
