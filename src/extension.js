const vscode = require("vscode");

// Function to remove comments from text
function removeComments(text, fileExtension) {
  let regex;

  // Regex patterns for different file types
  if (["js", "javascript"].includes(fileExtension.toLowerCase())) {
    regex = /\/\/.*|\/\*[\s\S]*?\*\//g; // JS-style: // and /* */
  } else if (["py", "python"].includes(fileExtension.toLowerCase())) {
    regex = /#.*/g; // Python Style
  } else {
    return { cleanedText: text, num: 0, supported: false };
  }

  const matches = text.match(regex); // Find all comments
  const num = matches ? matches.length : 0; // Count them
  const cleanedText = text.replace(regex, "");

  return { cleanedText, num, supported: true };
}

// Function to get file extension safely
function getFileExtension(fileName) {
  if (!fileName || fileName.indexOf(".") === -1) {
    return "";
  }
  return fileName.substring(fileName.lastIndexOf(".") + 1);
}

// Function to process the current editor content
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

  if (!result.supported) {
    vscode.window.showInformationMessage(
      `${fileExtension} files are currently not supported by Sweeper.`
    );
    return;
  }

  // Only process if there are actually comments to remove
  if (result.num === 0) {
    vscode.window.showInformationMessage(
      `No comments found in .${fileExtension} file!`
    );
    return;
  }

  editor
    .edit((editBuilder) => {
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

// Flag to prevent infinite loops
let isProcessing = false;

function activate(context) {
  // Register the manual command
  const disposable = vscode.commands.registerCommand(
    "extension.removeComments",
    () => {
      if (isProcessing) return;
      const editor = vscode.window.activeTextEditor;
      processEditorContent(editor);
    }
  );

  // Register paste event listener
  const pasteDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    // Prevent infinite loops
    if (isProcessing) return;

    // Check if this is a paste operation
    if (event.contentChanges.length > 0) {
      const change = event.contentChanges[0];
      const editor = vscode.window.activeTextEditor;

      // Better paste detection: large text changes with multiple lines
      if (
        editor &&
        editor.document === event.document &&
        change.text.length > 20 &&
        change.text.includes("\n")
      ) {
        isProcessing = true;

        // Small delay to ensure the paste is complete
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
