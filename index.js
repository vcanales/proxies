#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { readConfig, saveConfig, logs, start, status, stop } from './functions.js';

const program = new Command();

program
	.option('-v, --verbose', 'Show verbose output');

program
	.command('config')
	.description('Set the configuration variables')
	.action(() => {
		console.log('Setting configuration variables');
		promptForEnvVariables();
	});

program
	.command('start')
	.description('Start the proxy')
	.action(() => {
		console.log('Starting proxy');
		const isVerbose = program.opts().verbose;

		try {
			const hasStarted = start(true, isVerbose);
			if (hasStarted) {
				console.log('Proxy started');
			} else if (hasStarted === false) {
				console.log('Proxy already running');
			}
		} catch(error) {
			console.error('Proxy failed to start', error)
		}
	});

program
	.command('stop')
	.description('Stop the proxy')
	.action(() => {
		console.log('Stopping proxy');
		if (stop()) {
			console.log('Proxy stopped');
		} else {
			console.log('Proxy failed to stop');
		}
	});

program
	.command('status')
	.description('Check the status of the proxy')
	.action(() => {
		const isVerbose = program.opts().verbose;
		console.log('Checking proxy status');
		const ss = status(false, isVerbose);
		console.log(`Proxy is ${ss ? 'running' : 'not running'}`);
		
	});

program
	.command('logs')
	.description('Show the logs of the proxy')
	.action(() => {
		const isVerbose = program.opts().verbose;
		logs(isVerbose);
	});

program.parse(process.argv);

/*
	Sets up the prompts for the configuration variables
*/
async function promptForEnvVariables() {
	const defaults = readConfig();
  const questions = [
    {
      type: 'input',
      name: 'PROXY_HOST',
      message: "What's your proxy host?",
			default: defaults.PROXY_HOST 
    },
    {
      type: 'input',
      name: 'PROXY_PORT',
      message: "What's your proxy port?",
      default: defaults.PROXY_PORT || 8080
    },
    {
      type: 'input',
      name: 'PROXY_USER',
      message: "What's your proxy user?",
			default: defaults.PROXY_USER || ''
    },
    {
      type: 'input',
      name: 'KEY_PATH',
      message: "What's the path to your SSH key?",
			default: defaults.KEY_PATH || ''
		},
		{
			type: 'input',
			name: 'PAC_FILE_URL',
			message: "What's the URL to your PAC file?",
			default: defaults.PAC_FILE_URL || ''
		}
  ];

  try {
    const answers = await inquirer.prompt(questions);
		saveConfig(answers);
  } catch (error) {
    console.error('Error prompting for environment variables:', error);
  }
}
