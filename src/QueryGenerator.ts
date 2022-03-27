import * as vscode from "vscode";


export class QueryGenerator {
  public queryInfo = {
    tableName: "",
    columnName: "",
    task: "",
  };

  constructor() {}

  getQueryInfo(placeHolderText: string): Thenable<string | undefined> {
    return vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: placeHolderText,
      validateInput: text => {
				return text.trim() === '' ? 'Cant Be Empty' : null;
			}
    });
  }

  async getQueryNL(): Promise<void> {
    const task = await this.getQueryInfo("Task to do");

    if (task && task !== undefined) {
      this.queryInfo.task = task;
      const tableName = await this.getQueryInfo("Table Names");

      if (tableName !== undefined && tableName) {
        this.queryInfo.tableName = tableName;
        const tableNames = tableName?.split(",");
        let columnNames: string[] = [];
        for (let table of tableNames) {
          let columnName = await this.getQueryInfo("Column Name for " + table);
          if (columnName !== undefined && columnName) {
            columnNames.push(columnName);
          } else {
            vscode.window.showErrorMessage("Invalid Column Name!");
          }
        }
        this.queryInfo.columnName = columnNames.join("]");
      } else {
        vscode.window.showErrorMessage("Invalid Table Name!");
      }
    } else {
      vscode.window.showErrorMessage("Invalid Task!");
    }
  }
}