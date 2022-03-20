// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

const dotenv = require('dotenv');
dotenv.config({path:'D:/code/extensions/vs code/devrev/autoflow/.env'});

import { NodeDependenciesProvider } from './TreeView/nodeDependencies';
import * as vscode from 'vscode';
import * as API from './API';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const rootPath =
	vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
	  ? vscode.workspace.workspaceFolders[0].uri.fsPath
	  : "";

	  
  const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath);
	  
  vscode.window.registerTreeDataProvider(
	'nodeDependencies',
	new NodeDependenciesProvider(rootPath)
  );
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "autoflow" is now active!');
	vscode.window.createTreeView('nodeDependencies', {
		treeDataProvider: new NodeDependenciesProvider(rootPath)
	  });
	  vscode.commands.registerCommand('nodeDependencies.refreshEntry', () =>
    nodeDependenciesProvider.refresh()
  );
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('autoflow.sayhi', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VS Code from autoflow!');
	});

	let disposableFlow = vscode.commands.registerCommand('autoflow.flow', async () => {
		

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		},async (progress, token) => {
			token.onCancellationRequested(()=>{
				vscode.window.showInformationMessage('Cancelled!');
			});

			progress.report({increment:0, message:'Processing your query...'});
			setTimeout(() => {
				progress.report({increment:30, message:'Generating response'});
			}, 1000);
			setTimeout(() => {
				progress.report({increment:20, message:'Half way there...'});
			}, 3000);
			setTimeout(() => {
				progress.report({increment:30, message:'Finishing query'});
			}, 5000);
			
			setTimeout(() => {
				progress.report({increment:15, message:'Prinitng Response'});
			}, 9000);


				
			const openedDoc = vscode.window.activeTextEditor;
			const queryText = openedDoc?.document.getText(openedDoc.selection);
			if (!queryText){
				vscode.window.showErrorMessage('No Code Selected... Highlight some code please');
				return;
			}
			try {
				const res = await API.processQuery(queryText);
				console.log(res);
				if (!res){
					console.log('api retuened undefined');
					return;
				}
				
				openedDoc?.edit(async (editText)=>{
					editText.replace(openedDoc.selection, `${queryText}\n\n${res}`);
				});
				vscode.window.showInformationMessage('Succussfull');
			} 
			catch (error:any) {
				console.log(error);
				if (error?.response?.status>=500){
					vscode.window.showErrorMessage('looks like Server failed...');
				}
				else if (error?.response?.status>=400){
					vscode.window.showErrorMessage('looks like Authorrization failed...');
				}
				else{
				vscode.window.showErrorMessage('looks like something went wrong...');
				}
			}
		});

	});


	context.subscriptions.push(disposable);
	context.subscriptions.push(disposableFlow);
}

// this method is called when your extension is deactivated
export function deactivate() {}
