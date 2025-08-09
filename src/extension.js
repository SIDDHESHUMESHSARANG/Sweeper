const vscode = require("vscode");

function removeComments(text, fileExtension) {
  let regex;
  fileExtension = fileExtension.toLowerCase();

  if (["js", "javascript", "java","class","cpp","h","c"].includes(fileExtension)) {
    regex = /\/\/.*|\/\*[\s\S]*?\*\//g;
  } else if (["tsx", "jsx"].includes(fileExtension)) {
    regex = /\{\/\*[\s\S]*?\*\/\}|\/\/.*|\/\*[\s\S]*?\*\//g;
  } else if (["py", "python"].includes(fileExtension)) {
    regex = /(#.*)|(r?'''[\s\S]*?'''|r?"""[\s\S]*?""")/g;
  } else if (["sql"].includes(fileExtension)) {
    regex = `--.*|\/\*[\s\S]*?\*\/`/g;
  } else {
    return { cleanedText: text, num: 0, supported: false };
  }

  if (!regex) {
      return { cleanedText: text, num: 0, supported: false };
  }

  const matches = text.match(regex);
  const num = matches ? matches.length : 0;
  const cleanedText = text.replace(regex, "");

  return { cleanedText, num, supported: true };
}

function getFileExtension(fileName) {
  if (!fileName || fileName.indexOf(".") === -1) {
    return "";
  }
  return fileName.substring(fileName.lastIndexOf(".") + 1);
}

function processEditorContent(editor) {
  if (!editor) {
    vscode.window.showInformationMessage("No active editor found");
    return;
  }

  const fileName = editor.document.fileName;
  const fileExtension = getFileExtension(fileName);

  if (!fileExtension) {
    vscode.window.showInformationMessage(
      "File must have an extension to be processed."
    );
    return;
  }

  const text = editor.document.getText();

  const result = removeComments(text, fileExtension);
  
  editor.edit((editBuilder) => {
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(text.length)
      );
      editBuilder.replace(fullRange, result.cleanedText);
    })
    .then(() => {
      if (result.num === 1) {
        vscode.window.showInformationMessage(
          `1 comment removed from .${fileExtension} file!`
        );
      } else {
        vscode.window.showInformationMessage(
          `${result.num} comments removed from .${fileExtension} file!`
        );
      }
    })
    .catch((error) => {
      vscode.window.showErrorMessage(`Error processing file: ${error.message}`);
    });
}

let isProcessing = false;

function activate(context) {

  const disposable = vscode.commands.registerCommand(
    "extension.removeComments",
    () => {
      if (isProcessing) return;
      const editor = vscode.window.activeTextEditor;
      processEditorContent(editor);
    }
  );

  const pasteDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    if (isProcessing) return;
    if (event.contentChanges.length > 0) {
      const change = event.contentChanges[0];
      const editor = vscode.window.activeTextEditor;

      if (
        editor &&
        editor.document === event.document &&
        change.text.length > 20 &&
        change.text.includes("\n")
      ) {
        isProcessing = true;

        setTimeout(() => {
          try {
            processEditorContent(editor);
          } finally {
            isProcessing = false;
          }
        }, 200);
      }
    }
  });

  context.subscriptions.push(disposable, pasteDisposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};