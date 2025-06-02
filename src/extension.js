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
        } else if (['html','css','lua','sql'].includes(fileExtension) ) {   
            regex = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//|/.*|--\[\[[\s\S]*?\]\]|--.*?|^[Cc*!].*/gm;
        } else {
            vscode.window.showInformationMessage(
                `${fileExtension} files are currently not supported by Sweeper.`);
            return;
        }

        const matches = text.match(regex); // Find all comments
        const num = matches ? matches.length : 0; // Count them

        const cleanedText = text.replace(regex, '');

        editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(text.length)
            );
            editBuilder.replace(fullRange, cleanedText);
        });

        if (num === 1) {
            vscode.window.showInformationMessage(`1 comment removed from .${fileExtension} file!`);
        } else if (num === 0) {
            vscode.window.showInformationMessage(`No comments removed from .${fileExtension} file!`);
        } else {
            vscode.window.showInformationMessage(`${num} comments removed from .${fileExtension} file!`);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};