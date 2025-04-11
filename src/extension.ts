import * as vscode from 'vscode';
import * as path from 'path';
import { Execute } from './execute';
import { Config } from './config';
import { Log } from './log';
import { FindFile } from './findFile';


export class Emacs implements vscode.Disposable {
	private config: Config;
	private log: Log;
	private killRing: string = '';
	private isKilling: boolean = false;
	private markSet: boolean = false;
	private recenterState: number = 0;  // 0: center, 1: top, 2: bottom

	private async startKill(): Promise<void> {
	    this.isKilling = true;
	}

	private async endKill(): Promise<void> {
	    this.isKilling = false;
	}
	constructor(context: vscode.ExtensionContext) {
	        console.log("Emacs extension constructor called"); 
		this.config = Config.getInstance();
		this.log = Log.getInstance();


		// Register Commands
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.set.mark', () => this.setMark()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.find.file', () => this.findFile()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.copy', () => this.copy()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.kill', () => this.kill()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.kill.line', () => this.killLine()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.search.forward', () => this.search('search forward: ')));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.search.backward', () => this.search('search backward: ')));
		context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(() => {
			// Clear kill ring if selection changes not from a kill command
			if (!this.isKilling) {
			    this.killRing = '';
			}
		    })
		);
		context.subscriptions.push(
		    vscode.window.onDidChangeTextEditorSelection((e) => {
			if (this.markSet && e.textEditor.selection.isEmpty) {
			    this.markSet = false;
			}
		    })
		);
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorUp', () => this.cursorUp()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorDown', () => this.cursorDown()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorLeft', () => this.cursorLeft()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorRight', () => this.cursorRight()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorHome', () => this.cursorHome()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorEnd', () => this.cursorEnd()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorTop', () => this.cursorTop()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorBottom', () => this.cursorBottom()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorPageUp', () => this.cursorPageUp()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.cursorPageDown', () => this.cursorPageDown()));
		context.subscriptions.push(vscode.commands.registerCommand('emacs-code.recenterTop', () => this.recenterTop()));
	}

	dispose(): void {
	}


private recenterTimeout: NodeJS.Timeout | undefined;

	async recenterTop(): Promise<void> {
	    const editor = vscode.window.activeTextEditor;
	    if (editor) {
		// Clear any existing timeout
		if (this.recenterTimeout) {
		    clearTimeout(this.recenterTimeout);
		}

		const currentLine = editor.selection.active.line;

		switch (this.recenterState) {
		    case 0:  // Center current line
			await vscode.commands.executeCommand('revealLine', {
			    lineNumber: currentLine,
			    at: 'center'
			});
			this.recenterState = 1;
			break;

		    case 1:  // Top current line
			await vscode.commands.executeCommand('revealLine', {
			    lineNumber: currentLine,
			    at: 'top'
			});
			this.recenterState = 2;
			break;

		    case 2:  // Bottom current line
			await vscode.commands.executeCommand('revealLine', {
			    lineNumber: currentLine,
			    at: 'bottom'
			});
			this.recenterState = 0;
			break;
		}

		// Set timeout to reset state
		this.recenterTimeout = setTimeout(() => {
		    this.recenterState = 0;
		}, 1000);  // Reset after 1 second of no ctrl+l
	    }
	    return Promise.resolve();
	}


	async cursorPageUp(): Promise<void> {
	    const command = this.markSet ? 'cursorPageUpSelect' : 'cursorPageUp';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorPageDown(): Promise<void> {
	    const command = this.markSet ? 'cursorPageDownSelect' : 'cursorPageDown';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}


	async cursorHome(): Promise<void> {
	    const command = this.markSet ? 'cursorHomeSelect' : 'cursorHome';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorEnd(): Promise<void> {
	    const command = this.markSet ? 'cursorEndSelect' : 'cursorEnd';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorTop(): Promise<void> {
	    const command = this.markSet ? 'cursorTopSelect' : 'cursorTop';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorBottom(): Promise<void> {
	    const command = this.markSet ? 'cursorBottomSelect' : 'cursorBottom';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}


	async cursorUp(): Promise<void> {
	    const command = this.markSet ? 'cursorUpSelect' : 'cursorUp';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorDown(): Promise<void> {
	    const command = this.markSet ? 'cursorDownSelect' : 'cursorDown';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorLeft(): Promise<void> {
	    const command = this.markSet ? 'cursorLeftSelect' : 'cursorLeft';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}

	async cursorRight(): Promise<void> {
	    const command = this.markSet ? 'cursorRightSelect' : 'cursorRight';
	    await vscode.commands.executeCommand(command);
	    return Promise.resolve();
	}


        async setMark(): Promise<void> {
	    const editor = vscode.window.activeTextEditor;
	    if (editor) {
		if (this.markSet) {
		    // Mark is currently set, so turn it off and cancel selection
		    this.markSet = false;
		    await vscode.commands.executeCommand('cancelSelection');
		} else {
		    // Mark isn't set, so set it and start selection at current point
		    this.markSet = true;
		    const pos = editor.selection.active;
		    editor.selection = new vscode.Selection(pos, pos);
		}
	    }
	    return Promise.resolve();
	}


	async copy(): Promise<void> {
		await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
		return Promise.resolve();
	}

	async kill(): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			if (!selection.isEmpty) {
				const text = editor.document.getText(selection);
				await vscode.env.clipboard.writeText(text);
				await editor.edit((editBuilder) => {
					editBuilder.delete(selection);
				});
			}
		}
//		await vscode.commands.executeCommand('editor.action.clipboardCutAction');
		return Promise.resolve();
	}

	async killLine(): Promise<void> {
	    await this.startKill();
 	    try {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
		    await vscode.commands.executeCommand('cancelSelection');
		    await vscode.commands.executeCommand('cursorEndSelect');
		    const selection = editor.selection;

		    if (!selection.isEmpty) {
			// Get the selected text (to end of line)
			const text = editor.document.getText(selection);
			// Append to kill ring with a newline if this isn't empty line
			this.killRing += text;

			// Delete the selection
			await editor.edit((editBuilder) => {
			    editBuilder.delete(selection);
			});

			// If we're not at end of file, append newline and delete it
			const position = editor.selection.active;
			if (position.line < editor.document.lineCount - 1) {
			    this.killRing += '\n';
			    await vscode.commands.executeCommand('deleteRight');
			}
		    } else {
			// Empty selection means we're at end of line
			// Just add a newline to kill ring and delete it
			this.killRing += '\n';
			await vscode.commands.executeCommand('deleteRight');
		    }

		    // Update clipboard with accumulated kill ring
		    await vscode.env.clipboard.writeText(this.killRing);
	        }
	    } finally {
		await this.endKill();
	    }
	    return Promise.resolve();
	}

	private findWord(): string {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			const msg: string = 'Cannot find Active Text Editor.';
			this.log.err(msg);
			vscode.window.showInformationMessage(msg);
			return '';
		}
		const document = editor.document;
		const selection = editor.selection;
		if (!selection.isEmpty) {
			return document.getText(selection);
		}
		const range = document.getWordRangeAtPosition(selection.active);
		if (!range) {
			return '';
		}
		return document.getText(range);
	}

	search(prompt: string, word: string | undefined = undefined): void {
		if (word == undefined) {
			word = this.findWord();
		}
		vscode.window.setStatusBarMessage(prompt + word);
	}

	private async getCurrentDirectory(): Promise<string> {
		let currentDirectory = '';

		// opened file
		const file = vscode.window.activeTextEditor?.document?.uri.fsPath;
		if (file !== undefined) {
			await vscode.workspace.fs.stat(vscode.Uri.file(file)).then((value) => {
				currentDirectory = path.dirname(file);
			}, (reason) => {
			});
		}

		// predefined directories
		if (currentDirectory === '') {
			if (vscode.workspace.workspaceFolders) {
				currentDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;
			} else if (process.env.home) {
				currentDirectory = process.env.home;
			} else {
				currentDirectory = vscode.env.appRoot;
			}
		}

		return new Promise<string>((resolve, reject) => resolve(currentDirectory));
	}

	async findFile(): Promise<void> {
		const currentDirectory = await this.getCurrentDirectory();
		const findFile = new FindFile(currentDirectory);
		await findFile.prepare();
		const result = await findFile.show();
		if (result !== undefined) {
			const file = vscode.Uri.file(result);
			const stat = await vscode.workspace.fs.stat(file);
			if (stat.type & vscode.FileType.Directory) {
				await vscode.commands.executeCommand('vscode.openFolder', file);
			} else {
				await vscode.window.showTextDocument(file);
			}
			findFile.dispose();
			Promise.resolve();
		}
	}
}

let emacs: Emacs | undefined;

export function activate(context: vscode.ExtensionContext): void {
	emacs = new Emacs(context);
	console.log('"emacs-code" is now active!');
}

export function deactivate(): void {
	if (emacs) {
		emacs.dispose();
		emacs = undefined;
	}
	console.log('"emacs-code" is now inactive!');
}