import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

export class Trello implements vscode.TreeDataProvider<TrelloItems> {
  private userInfo = {
    apiKey: "trelloViewerApiKey",
    apiToken: "trelloViewerApiToken",
  };

  constructor() {}

  getTreeItem(element: TrelloItems): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TrelloItems): Thenable<TrelloItems[]> {
    return Promise.resolve([]);
  }


  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItems | undefined | null | void> = new vscode.EventEmitter<TrelloItems | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TrelloItems | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setTrelloCredential(isPassword: boolean, placeHolderText: string): Thenable<string | undefined> {
    return vscode.window.showInputBox({ ignoreFocusOut: true, password: isPassword, placeHolder: placeHolderText });
  }

    // Generates a Trello API token and opens link in external browser
    async fetchApiToken(apiKey: string): Promise<void> {
      const apiTokenUrl = `https://trello.com/1/authorize?expiration=never&name=AutoFlow&scope=read,write,account&response_type=token&key=${apiKey}`;
      try {
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(apiTokenUrl));
        const apiToken = await this.setTrelloCredential(true, "Your Trello API token");
        if (apiToken !== undefined) {
          this.userInfo.apiToken = apiToken;
        }
      } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage("Error fetching API token");
      }
    }



  async authenticate(): Promise<void>{
    try {
      const apiKey = await this.setTrelloCredential(false, "Your Trello API key");
      
      if (apiKey !== undefined) {
        this.userInfo.apiKey = apiKey;
        await this.fetchApiToken(apiKey);
        
        
        const user = await axios.get
        (`https://api.trello.com/1/members/me/?key=${apiKey}&token=${this.userInfo.apiToken}`)
            .then(response => console.log(response["data"]))
            .catch(err => console.log(err));

        
        vscode.window.showInformationMessage("Authenticated");
        //await this.fetchApiToken(apiKey);
        //this.getCredentials();
      } else {
        const appKeyUrl = await vscode.window.showInformationMessage(
          "Get your Trello API key here:",
          "https://trello.com/app-key"
        );
        if (appKeyUrl) {
          vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(appKeyUrl));
        }
      }
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error during authentication");
    }
  }


}

class TrelloItems extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}
