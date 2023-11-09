#!/usr/bin/env node

import { Command } from 'commander';
import { logs, start, status, stop } from './functions.js';

const program = new Command();

program
	.option('-v, --verbose', 'Show verbose output');

program
	.command('start')
	.description('Start the proxy')
	.action(() => {
		console.log('Starting proxy');
		const isVerbose = program.opts().verbose;
		start(false, isVerbose);
		console.log('Proxy started');
	});

program
	.command('stop')
	.description('Stop the proxy')
	.action(() => {
		console.log('Stopping proxy');
		stop();
		console.log('Proxy stopped');
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
		console.log('Showing proxy logs');
		logs();
	});

	program.parse(process.argv);