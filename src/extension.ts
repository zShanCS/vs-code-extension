/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

const dotenv = require("dotenv");
dotenv.config({ path: "D:/code/extensions/vs code/devrev/autoflow/.env" });
const axios = require("axios").default;
import { Configuration, OpenAIApi } from "openai";
var ncp = require("copy-paste");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
import { NodeDependenciesProvider } from "./TreeView/nodeDependencies";
import * as vscode from "vscode";
import { CodelensProvider } from "./CodeLensProvider";
import { QueryGenerator } from "./QueryGenerator";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const codeLensProvider = new CodelensProvider();

  vscode.languages.registerCodeLensProvider("*", codeLensProvider);

  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";

  const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath);

  vscode.window.registerTreeDataProvider(
    "nodeDependencies",
    new NodeDependenciesProvider(rootPath)
  );
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "autoflow" is now active!');
  vscode.window.createTreeView("nodeDependencies", {
    treeDataProvider: new NodeDependenciesProvider(rootPath),
  });
  vscode.commands.registerCommand("nodeDependencies.refreshEntry", () =>
    nodeDependenciesProvider.refresh()
  );
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  

  let disposable = vscode.commands.registerCommand("autoflow.all", async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const allOptions = [
      "Explain Code",
      "Fix Bugs In Code",
      "Explain Error In My Code",
      "Explain This SQL Query",
      "Make One Liner Function From This Function",
      "Make Doc String",
      "Make Unit Test",
      "Code Completion",
      "Generate SQL Query",
      "API Request",
      "Reccommend Commit Message",
      "Detect Defect",
      "Autoflow: Magic",
    ];
    const userSelect = await vscode.window.showQuickPick(allOptions, {
      title: "What Do You Want Autoflow To Do?",
      placeHolder: "e.g. Explain Code or Make API Request",
    });
    if (userSelect) {
      console.log("User Selected :", userSelect);
      switch (userSelect) {
        case "Explain Code":
          vscode.commands.executeCommand("autoflow.code2nl");
          break;
        case "Fix Bugs In Code":
          vscode.commands.executeCommand("autoflow.fix_bugs");
          break;
        case "Explain Error In My Code":
          vscode.commands.executeCommand("autoflow.explain_error");
          break;
        case "Explain This SQL Query":
          vscode.commands.executeCommand("autoflow.sql2nl");
          break;
        case "Make One Liner Function From This Function":
          vscode.commands.executeCommand("autoflow.oneliner");
          break;
        case "Make Doc String":
          vscode.commands.executeCommand("autoflow.docstring");
          break;
        case "Make Unit Test":
          vscode.commands.executeCommand("autoflow.unit_test");
          break;
        case "Code Completion":
          vscode.commands.executeCommand("autoflow.complete_code");
          break;
        case "Generate SQL Query":
          vscode.commands.executeCommand("autoflow.nl2sql");
          break;
        case "API Request":
          vscode.commands.executeCommand("autoflow.api_req");
          break;
        case "Reccommend Commit Message":
          vscode.commands.executeCommand("autoflow.recc_commit");
          break;
        case "Detect Defect":
          vscode.commands.executeCommand("autoflow.detect_defect");
          break;
        case "Autoflow: Magic":
          vscode.commands.executeCommand("autoflow.flow");
          break;

        default:
          break;
      }
    } else {
      console.log(userSelect);
    }
  });

  let disposableFlow = vscode.commands.registerCommand(
    "autoflow.flow",
    async (...args: any[]) => {
      console.log("autoflow.flow command exxecuted with args: ", { args });
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const insertionPoint = openedDoc?.selection.end;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Prompt Selected. Please Highlight Some Prompt or message.."
        );
        return;
      }
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);

          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/magic`, {
              prompt: prompt,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (!insertionPoint) {
                return;
              }
              editText.insert(
                insertionPoint,
                `\n'''\n${res["data"]["output"]}\n'''\n`
              );
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
          }
        }
      );
    }
  );

  let disposableCode2nl = vscode.commands.registerCommand(
    "autoflow.code2nl",
    async (...args: any[]) => {
      console.log(`Code2Nl ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      const selectionStart = openedDoc?.selection.anchor;

      const prompt = openedDoc?.document.getText(openedDoc.selection);
      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);

          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/code2nl`, {
              prompt: prompt,
              language: fileExtension,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/*\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
          }
        }
      );
    }
  );

  let disposableFixBugs = vscode.commands.registerCommand(
    "autoflow.fix_bugs",
    async (...args: any[]) => {
      console.log(`FixBUgs ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/fix_bugs`, {
              prompt: prompt,
              language: fileExtension,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''\nFixed Code:\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/*\nFixed Code:\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableExplainError = vscode.commands.registerCommand(
    "autoflow.explain_error",
    async (...args: any[]) => {
      console.log(`FixBUgs ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(
              `http://127.0.0.1:8080/explain_error`,
              {
                prompt: prompt,
              }
            );
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''\nError Explanation:\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/*\nError Explanation:\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableSQL2NL = vscode.commands.registerCommand(
    "autoflow.sql2nl",
    async (...args: any[]) => {
      console.log(`FixBUgs ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.start;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Query Selected. Please Type and Highlight a SQL Query.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/sql2nl`, {
              prompt: prompt,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''\nSQL QUery Explanation:\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/*\nSQL Query Explanation:\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableOneLiner = vscode.commands.registerCommand(
    "autoflow.oneliner",
    async (...args: any[]) => {
      console.log(`One Liner ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.start;
      const selectionEnd = openedDoc?.selection.end;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/oneliner`, {
              prompt: prompt,
              language: fileExtension,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  selectionEnd ?? range?.end,
                  `\n'''\nOne Liner:\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  selectionEnd ?? range?.end,
                  `\n/*\nOne Liner:\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableCode2DocString = vscode.commands.registerCommand(
    "autoflow.docstring",
    async (...args: any[]) => {
      console.log(`One Liner ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(
              `http://127.0.0.1:8080/code2docstring`,
              {
                prompt: prompt,
              }
            );
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/*\n\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );
  let disposableDetectDefect = vscode.commands.registerCommand(
    "autoflow.detect_defect",
    async (...args: any[]) => {
      console.log(`Detect defect ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(
              `http://127.0.0.1:8080/detect-defect`,
              {
                prompt: prompt,
              }
            );
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''Defect Found: \n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/* Defect Found: \n\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  
  let disposableRefine = vscode.commands.registerCommand(
    "autoflow.refine",
    async (...args: any[]) => {
      console.log(`Refine ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(
              `http://127.0.0.1:8080/refine`,
              {
                prompt: prompt,
              }
            );
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''Refined Result: \n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/* Refined Result: \n\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableCode2UT = vscode.commands.registerCommand(
    "autoflow.unit_test",
    async (...args: any[]) => {
      console.log(`Unit Test ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/code2ut`, {
              prompt: prompt,
              language: fileExtension,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''Unit Tests:\n\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/*Unit Tests:\n\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableCodeCompletion = vscode.commands.registerCommand(
    "autoflow.complete_code",
    async (...args: any[]) => {
      console.log(`Complete Code ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      //when the selection starts. this helps to see where to put the result
      const selectionStart = openedDoc?.selection.anchor;
      const selectionEnd = openedDoc?.selection.end;
      const prompt = openedDoc?.document.getText(openedDoc.selection);

      if (!prompt) {
        vscode.window.showErrorMessage(
          "No Code Selected. Please Highlight Some Code.."
        );
        return;
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      const task = await vscode.window.showInputBox({
        value: "",
        valueSelection: [2, 4],
        placeHolder:
          'Enter What you want this code to do. e.g. "Check for prime numbers"',
        validateInput: (text) => {
          return text.trim() === "" ? "Cant Be Empty" : null;
        },
      });
      if (!task || task === "") {
        console.log(
          "user enetered nothing in task, so cant really do anyhting with it."
        );
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          try {
            progress.report({
              increment: 0,
              message: "Processing your query...",
            });
            setTimeout(() => {
              progress.report({
                increment: 30,
                message: "Generating response",
              });
            }, 1000);
            setTimeout(() => {
              progress.report({ increment: 20, message: "Half way there..." });
            }, 3000);
            setTimeout(() => {
              progress.report({ increment: 30, message: "Finishing query" });
            }, 5000);
            setTimeout(() => {
              progress.report({ increment: 15, message: "Prinitng Response" });
            }, 9000);

            const res = await axios.post(
              `http://127.0.0.1:8080/complete_code`,
              {
                code: prompt,
                task: task,
              }
            );
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                if (selectionEnd) {
                  editText.insert(selectionEnd, `${res["data"]["output"]}\n`);
                } else {
                  editText.insert(
                    range?.end,
                    `\n'''\nCompleted Code:\n\n${res["data"]["output"]}\n'''\n`
                  );
                }
              } else {
                if (selectionEnd) {
                  editText.insert(selectionEnd, `${res["data"]["output"]}\n`);
                } else {
                  editText.insert(
                    range?.end,
                    `\n/*\nCompleted Code:\n\n${res["data"]["output"]}\n*/\n`
                  );
                }
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposablNLtoSQL = vscode.commands.registerCommand(
    "autoflow.nl2sql",
    async (...args: any[]) => {
      console.log(`Nl2SQL ran with`, args);
      const openedDoc = vscode.window.activeTextEditor;
      const selectionStart = openedDoc?.selection.anchor;

      /*const prompt = openedDoc?.document.getText(openedDoc.selection);
			if (!prompt){
				vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
				return;
			}*/
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);

      const queryGenerator = new QueryGenerator();
      await queryGenerator.getQueryNL();

      if (
        queryGenerator.queryInfo.task === "" ||
        queryGenerator.queryInfo.tableName === "" ||
        queryGenerator.queryInfo.columnName === ""
      ) {
        return;
      }
      const range: vscode.Range = args[0];
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);

          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/nl2sql`, {
              tableName: queryGenerator.queryInfo.tableName,
              columnName: queryGenerator.queryInfo.columnName,
              task: queryGenerator.queryInfo.task,
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n'''\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionStart,
                  `\n/\n${res["data"]["output"]}\n/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
          }
        }
      );
    }
  );

  let disposableApiReq = vscode.commands.registerCommand(
    "autoflow.api_req",
    async (...args: any[]) => {
      console.log(`API Req ran with`, args);
      let openedDoc = vscode.window.activeTextEditor;
      if (!openedDoc) {
        vscode.window.showErrorMessage(
          "Please Open a Filer Where the Autoflow can show result"
        );
      }
      const fileExtension = openedDoc?.document.fileName.split(".").pop();
      console.log("opened file is", fileExtension);
      const range: vscode.Range = args[0];

      const api_name = await vscode.window.showInputBox({
        value: "",
        placeHolder: "API Name you want to request. e.g. Google Translate",
        validateInput: (text) => {
          return text.trim() === "" ? "Cant Be Empty" : null;
        },
      });
      if (!api_name) {
        console.log(
          "user enetered some of fields empty, so cant really do anyhting with it."
        );
        return;
      }
      const task = await vscode.window.showInputBox({
        value: "",
        placeHolder:
          'Enter what you want to do with API. e.g. "Translate from German To English"',
        validateInput: (text) => {
          return text.trim() === "" ? "Cant Be Empty" : null;
        },
      });
      if (!api_name || !task) {
        console.log(
          "user enetered some of fields empty, so cant really do anyhting with it."
        );
        return;
      }
      const params = await vscode.window.showInputBox({
        value: "",
        placeHolder:
          'Enter Parameters for the API to use e.g. "Ich bin dein vater"',
        validateInput: (text) => {
          return text.trim() === "" ? "Cant Be Empty" : null;
        },
      });
      if (!api_name || !task || !params) {
        console.log(
          "user enetered some of fields empty, so cant really do anyhting with it."
        );
        return;
      }
      const token = await vscode.window.showInputBox({
        value: "",
        placeHolder:
          'Enter token value for your api (leave empty if not required) e.g. "z$&74bfdd83-bkdd-$hf8##h4"',
      });

      if (!api_name || !task || !params) {
        console.log(
          "user enetered some of fields empty, so cant really do anyhting with it."
        );
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          try {
            progress.report({
              increment: 0,
              message: "Processing your query...",
            });
            setTimeout(() => {
              progress.report({
                increment: 30,
                message: "Generating response",
              });
            }, 1000);
            setTimeout(() => {
              progress.report({ increment: 20, message: "Half way there..." });
            }, 3000);
            setTimeout(() => {
              progress.report({ increment: 30, message: "Finishing query" });
            }, 5000);
            setTimeout(() => {
              progress.report({ increment: 15, message: "Prinitng Response" });
            }, 9000);
            const resBody: { [id: string]: string } = {
              api_name: api_name,
              task: task,
              params: params,
            };
            if (token && token !== "") {
              resBody["token"] = token;
            }
            const res = await axios.post(
              `http://127.0.0.1:8080/api_req`,
              resBody
            );
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            if (!openedDoc) {
              let openedDoc = vscode.window.activeTextEditor;
              vscode.window.showErrorMessage(
                "Please Open a Filer Where the Autoflow can show result"
              );
            }
            const selectionEnd =
              vscode.window.activeTextEditor?.visibleRanges[0].start;

            openedDoc?.edit((editText) => {
              if (fileExtension === "py") {
                editText.insert(
                  range?.end ?? selectionEnd,
                  `\n'''\nAPI Req Code:\n\n${res["data"]["output"]}\n'''\n`
                );
              } else {
                editText.insert(
                  range?.end ?? selectionEnd,
                  `\n/*\nAPI Req Code:\n\n${res["data"]["output"]}\n*/\n`
                );
              }
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );

  let disposableCommitMessage = vscode.commands.registerCommand(
    "autoflow.recc_commit",
    async (...args: any[]) => {
      vscode.window.activeTerminal?.sendText("git diff > .autoflow");
      vscode.window.showInformationMessage(
        'Make sure to add ".autoflow" to .gitignore file'
      );
      const f = await vscode.workspace.findFiles(".autoflow");
      const t = await vscode.workspace.fs.readFile(f[0]);
      const diff_text = t.toString();
      console.log(diff_text);



      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);

          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {
            const res = await axios.post(`http://127.0.0.1:8080/commit-message`, {
              prompt: diff_text
            });
            console.log(res, res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }
            const com_chan = vscode.window.createOutputChannel('commit-message');
            com_chan.append(res['data']['output']);
            com_chan.show();
            vscode.window.showInformationMessage(`Commit Message: ${res['data']['output']}`);
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
          }
        }
      );



    }
  );

  let disposableSearch = vscode.commands.registerCommand(
    "autoflow.search",
    async () => {
      const userQuery = await vscode.window.showInputBox({
        title:'What Do You Want to Search?'
      });
      if (!userQuery){
        return;
      }
     
      
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: true,
          title: "AutoFlow",
        },
        async (progress, cancelToken) => {
          cancelToken.onCancellationRequested(() => {
            vscode.window.showInformationMessage("Cancelled!");
          });

          progress.report({
            increment: 0,
            message: "Processing your query...",
          });
          setTimeout(() => {
            progress.report({ increment: 30, message: "Generating response" });
          }, 1000);
          setTimeout(() => {
            progress.report({ increment: 20, message: "Half way there..." });
          }, 3000);
          setTimeout(() => {
            progress.report({ increment: 30, message: "Finishing query" });
          }, 5000);
          setTimeout(() => {
            progress.report({ increment: 15, message: "Prinitng Response" });
          }, 9000);

          try {

            const allfiles = await vscode.workspace.findFiles(
              "*",
              "**​/node_modules/**"
            );
            const codeList:any[] = [];

            async function readFiles(){

              for(const element of allfiles){
                let code:{[key:string]:string} = {};
                console.log(element.fsPath);
                code['fp'] = element.fsPath;
                code['content'] = (await vscode.workspace.fs.readFile(element)).toString();
                codeList.push(code);
              }
            }
            


            await readFiles();
            console.log('code list being sent to server',codeList);
            const res = await axios.post(`http://127.0.0.1:8080/search-code`, {
              prompt: userQuery,
              recreate: true,
              code:codeList
            });
            console.log(res["data"]);
            if (res["data"]["status"] !== "ok") {
              vscode.window.showErrorMessage(
                "looks like something went wrong..."
              );
              return;
            }

            const com_chan = vscode.window.createOutputChannel('code-search');
            com_chan.append(res['data']['output']);
            com_chan.show();
            

          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(
              "looks like something went wrong..."
            );
            return;
          }
        }
      );
    }
  );




  context.subscriptions.push(disposableSearch);
  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableFlow);
  context.subscriptions.push(disposableCode2nl);
  context.subscriptions.push(disposableFixBugs);
  context.subscriptions.push(disposableExplainError);
  context.subscriptions.push(disposableSQL2NL);
  context.subscriptions.push(disposableOneLiner);
  context.subscriptions.push(disposableCode2DocString);
  context.subscriptions.push(disposableCode2UT);
  context.subscriptions.push(disposableCodeCompletion);
  context.subscriptions.push(disposablNLtoSQL);
  context.subscriptions.push(disposableApiReq);
  context.subscriptions.push(disposableCommitMessage);
  context.subscriptions.push(disposableDetectDefect);
  context.subscriptions.push(disposableRefine);
}

// this method is called when your extension is deactivated
export function deactivate() {}
