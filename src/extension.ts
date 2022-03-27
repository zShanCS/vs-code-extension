// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

const dotenv = require('dotenv');
dotenv.config({path:'D:/code/extensions/vs code/devrev/autoflow/.env'});
const axios = require('axios').default;
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
import { NodeDependenciesProvider } from './TreeView/nodeDependencies';
import * as vscode from 'vscode';
import { CodelensProvider } from "./CodeLensProvider";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	const codeLensProvider = new CodelensProvider();

	vscode.languages.registerCodeLensProvider('*', codeLensProvider);

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

	let disposableFlow = vscode.commands.registerCommand('autoflow.flow', async (...args:any[]) => {
		console.log('autoflow.flow command exxecuted with args: ',{args});
		const openedDoc = vscode.window.activeTextEditor;
			const queryText = openedDoc?.document.getText(openedDoc.selection) || args[0];
			if (!queryText){
				vscode.window.showErrorMessage('No Code Selected... Highlight some code please');
				return;
			}
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


				
			
			try {
				const res = await openai.createCompletion('code-davinci-001',{
					temperature:0.2,
					prompt:queryText,
					max_tokens:256
				});
				console.log(res);
				if (!res?.data?.choices){
					console.log('api retuened undefined choices');
					return;
				}

				const output = res.data.choices[0].text;
				openedDoc?.edit(async (editText)=>{
					if (args[1]){
						editText.insert(args[1].end,`\n#Autoflow Query: ${queryText}.\n#Response:\n${output}`);
					}
					else {
						editText.replace(openedDoc.selection,`${queryText}\n\n${output}`);
					}
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

	let disposableCode2nl = vscode.commands.registerCommand('autoflow.code2nl',async (...args:any[]) => {
		console.log(`Code2Nl ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		const selectionStart = openedDoc?.selection.anchor;

		const prompt = openedDoc?.document.getText(openedDoc.selection);
		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];
		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/code2nl`, {
								prompt: prompt,
								language: fileExtension
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(range?.end ?? selectionStart, `\n'''\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(range?.end ?? selectionStart, `\n/*\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
			}
		});
		

	});

	
	let disposableFixBugs = vscode.commands.registerCommand('autoflow.fix_bugs',async (...args:any[]) => {
		console.log(`FixBUgs ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.anchor;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/fix_bugs`, {
								prompt: prompt,
								language: fileExtension
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(range?.end ?? selectionStart, `\n'''\nFixed Code:\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(range?.end ?? selectionStart, `\n/*\nFixed Code:\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});

	
	let disposableExplainError = vscode.commands.registerCommand('autoflow.explain_error',async (...args:any[]) => {
		console.log(`FixBUgs ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.anchor;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/explain_error`, {
								prompt: prompt
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(range?.end ?? selectionStart, `\n'''\nError Explanation:\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(range?.end ?? selectionStart, `\n/*\nError Explanation:\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});

	
	let disposableSQL2NL = vscode.commands.registerCommand('autoflow.sql2nl',async (...args:any[]) => {
		console.log(`FixBUgs ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.anchor;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Query Selected. Please Type and Highlight a SQL Query..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/sql2nl`, {
								prompt: prompt
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(range?.end ?? selectionStart, `\n'''\nSQL QUery Explanation:\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(range?.end ?? selectionStart, `\n/*\nSQL Query Explanation:\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});

	
	
	let disposableOneLiner = vscode.commands.registerCommand('autoflow.oneliner',async (...args:any[]) => {
		console.log(`One Liner ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.start;
		const selectionEnd = openedDoc?.selection.end;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/oneliner`, {
								prompt: prompt,
								language: fileExtension
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(selectionEnd?? range?.end, `\n'''\nOne Liner:\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(selectionEnd?? range?.end, `\n/*\nOne Liner:\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});

	
	let disposableCode2DocString = vscode.commands.registerCommand('autoflow.docstring',async (...args:any[]) => {
		console.log(`One Liner ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.anchor;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/code2docstring`, {
								prompt: prompt
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(range?.end ?? selectionStart, `\n'''\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(range?.end ?? selectionStart, `\n/*\n\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});

	let disposableCode2UT = vscode.commands.registerCommand('autoflow.unit_test',async (...args:any[]) => {
		console.log(`Unit Test ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.anchor;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
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

			try {
				const res = await axios.post(`http://127.0.0.1:8080/code2ut`, {
								prompt: prompt,
								language: fileExtension
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						editText.insert(range?.end ?? selectionStart, `\n'''Unit Tests:\n\n${res['data']['output']}\n'''\n`);
					}
					else{
						editText.insert(range?.end ?? selectionStart, `\n/*Unit Tests:\n\n${res['data']['output']}\n*/\n`);
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});

	let disposableCodeCompletion = vscode.commands.registerCommand('autoflow.complete_code',async (...args:any[]) => {
		console.log(`Complete Code ran with`, args);
		const openedDoc = vscode.window.activeTextEditor;
		//when the selection starts. this helps to see where to put the result
		const selectionStart = openedDoc?.selection.anchor;
		const selectionEnd = openedDoc?.selection.end;
		const prompt = openedDoc?.document.getText(openedDoc.selection);

		if (!prompt){
			vscode.window.showErrorMessage('No Code Selected. Please Highlight Some Code..');
			return;
		}
		const fileExtension = openedDoc?.document.fileName.split('.').pop();
		console.log('opened file is',fileExtension);
		const range:vscode.Range = args[0];

		const task = await vscode.window.showInputBox({
			value: '',
			valueSelection: [2, 4],
			placeHolder: 'Enter What you want this code to do. e.g. "Check for prime numbers"',
			validateInput: text => {
				return text.trim() === '' ? 'Cant Be Empty' : null;
			}
		});
		if (!task || task===''){
			console.log('user enetered nothing in task, so cant really do anyhting with it.');
			return ;
		}

		vscode.window.withProgress({
			location:vscode.ProgressLocation.Notification,
			cancellable:true,
			title:'AutoFlow'
		}, async (progress, cancelToken)=>{
			cancelToken.onCancellationRequested(()=>{
				vscode.window.showInformationMessage('Cancelled!');
			});


			try {
				
			
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

				const res = await axios.post(`http://127.0.0.1:8080/complete_code`, {
								code: prompt,
								task: task
							});
				console.log(res, res['data']);
				if (res['data']['status']!=='ok'){
					vscode.window.showErrorMessage('looks like something went wrong...');
					return;
				}
				openedDoc?.edit((editText)=>{
					if (fileExtension === 'py'){
						if (selectionEnd){
							editText.insert(selectionEnd, `${res['data']['output']}\n`);
						}
						else{
						editText.insert(range?.end, `\n'''\nCompleted Code:\n\n${res['data']['output']}\n'''\n`);
						}
					}
					else{
						if (selectionEnd){
							editText.insert(selectionEnd, `${res['data']['output']}\n`);
						}
						else{
						editText.insert(range?.end, `\n/*\nCompleted Code:\n\n${res['data']['output']}\n*/\n`);
						}
					}
					
				});
			} catch (error) {
				console.log(error);
				vscode.window.showErrorMessage('looks like something went wrong...');
				return;
			}
		});
		

	});
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
}

// this method is called when your extension is deactivated
export function deactivate() {}
