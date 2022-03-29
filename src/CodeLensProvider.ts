/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
const axios = require("axios").default;
/**
 * CodelensProvider
 */

const commandList = [
  "code2nl",
  "fix_bugs",
  "get_api_request_code",
  "get_error_explanation",
  "nl2sql",
  "sql2nl",
  "code2docstring",
  "get_oneliner",
  "code2ut",
  "complete_code",
];

const BASE_LINK = process.env.path;
console.log(BASE_LINK);
export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = /(autoflow:+)/g;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[] | null> {
    if (
      vscode.workspace.getConfiguration("autoflow").get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      let matches;
      while ((matches = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(matches.index).line);
        const indexOf = line.text.indexOf(matches[0]);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          new RegExp(this.regex)
        );
        const userQuery = line.text.toLowerCase();
        let someCodeLensGenerated = false;
        if (range && userQuery.startsWith("autoflow:")) {
          const cleanedQuery = userQuery.replace('autoflow:', '');
          try {
            const res = await axios.post(`http://127.0.0.1:8080/intent`, {
              query: cleanedQuery,
            });
            console.log(res);
            if (res["data"]["status"] !== "ok") {
              return null;
            }
            //generate lens from server intents;
            const intentList: Array<string> = res["data"]["output"];
            console.log(cleanedQuery, intentList);
            intentList.forEach((command) => {
              if (commandList.includes(command)) {
                let lens = generateLens(command, range);
                if (lens) {
                  someCodeLensGenerated = true;
                  this.codeLenses.push(lens);
                }
              }
            });
            

          } catch (error) {
            console.log(error);
          }
          if (!someCodeLensGenerated) {
            this.codeLenses.push(
              new vscode.CodeLens(range, {
                title: "AutoFlow Magic",
                command: "autoflow.flow",
                tooltip: "Let Autoflow take your prompt and show you best result.",
                arguments: [
                  range,
                  cleanedQuery
                ],
              })
            );
          }

            //show more button that shows all commands.
          this.codeLenses.push(
            new vscode.CodeLens(range, {
              title: "More",
              command: "autoflow.all",
              tooltip: "Show All Possible Commands"
            })
          );

        }
      }

      return this.codeLenses;
    }
    return [];
  }
  // public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
  //     if (vscode.workspace.getConfiguration("autoflow").get("enableCodeLens", true)) {

  //         codeLens.command = {
  //             title: "Autoflow",
  //             tooltip: "Run Autoflow here",
  //             command: "autoflow.flow",
  //             arguments: [vscode.window.activeTextEditor?.document.getText(codeLens.range).replace('autoflow:',''), codeLens.range],
  //         };
  //         return codeLens;
  //     }
  //     return null;
  // }
}

function generateLens(command: string, range: vscode.Range) {
  switch (command) {
    case "code2nl": {
      return new vscode.CodeLens(range, {
        title: "Explain Code",
        command: "autoflow.code2nl",
        tooltip: "Generate an Explanation for this code",
        arguments: [range],
      });
    }
    case "sql2nl": {
      return new vscode.CodeLens(range, {
        title: "Explain Query",
        command: "autoflow.sql2nl",
        tooltip: "Generate an Explanation for this SQL query",
      });
    }
    case "fix_bugs": {
      return new vscode.CodeLens(range, {
        title: "Fix Bugs",
        command: "autoflow.fix_bugs",
        tooltip: "Find and Fix Bugs in selected code",
        arguments: [range],
      });
    }
    case "get_error_explanation": {
      return new vscode.CodeLens(range, {
        title: "Explain Error",
        command: "autoflow.explain_error",
        tooltip: "Find and Explain Error in selected code",
        arguments: [range],
      });
    }
    case "sql2nl": {
      return new vscode.CodeLens(range, {
        title: "Explain SQL Query",
        command: "autoflow.sql2nl",
        tooltip: "Explain SQL Query in Natural Language",
        arguments: [range],
      });
    }
    case "get_oneliner": {
      return new vscode.CodeLens(range, {
        title: "Generate One Line Code",
        command: "autoflow.oneliner",
        tooltip: "Generate One Line Alternative",
        arguments: [range],
      });
    }
    case "code2docstring": {
      return new vscode.CodeLens(range, {
        title: "Make DocString",
        command: "autoflow.docstring",
        tooltip: "Generate Documentation",
        arguments: [range],
      });
    }
    case "code2ut": {
      return new vscode.CodeLens(range, {
        title: "Make Unit Test",
        command: "autoflow.unit_test",
        tooltip: "Generate Unit Test",
        arguments: [range],
      });
    }
    case "complete_code": {
      return new vscode.CodeLens(range, {
        title: "Complete Code",
        command: "autoflow.complete_code",
        tooltip: "Complete The Code",
        arguments: [range],
      });
    }
    case 'nl2sql':{
        return new vscode.CodeLens(range, {
            title:'Generate Query',
            command:'autoflow.nl2sql',
            tooltip:'Generate SQL Query',
            arguments:[range]
        });
    }
    break;
    case "get_api_request_code": {
      return new vscode.CodeLens(range, {
        title: "Make API Request Code ",
        command: "autoflow.api_req",
        tooltip: "Create API Request Code",
        arguments: [range],
      });
    }

    default:
      break;
  }
}
