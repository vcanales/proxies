import { exec, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { PROXY_HOST, PROXY_PORT, KEY_PATH, PROXY_USER } = process.env;

export function start() {
	// use spawn to run the ssh command above
	const ssh = spawn('ssh', [
		'-NvD', PROXY_PORT,
		'-M', '-S', 'ssh-socks-proxy-8080',
		'-fnT', '-i', KEY_PATH,
		'-o', 'UserKnownHostsFile="/Applications/AutoProxxy.app/Contents/Resources/ProxyHostKey.pub"',
		'-p', '22',
		'-vvv',
		'-E', 'ssh.log',
		`${PROXY_USER}@${PROXY_HOST}`
	], { detached: true });

	writeFileSync('pid', `${ssh.pid}`);

	ssh.unref();
}

export function stop() {
	const pid = readFileSync('pid', 'utf8');
	exec(`kill ${pid}`);
	// delete pid file
	exec('rm pid');
}

export function status() {
	const pidFile = readFileSync('pid', 'utf8');

	if (!pidFile) {
		return false;
	}

	const ssh = spawn('ssh', [
		'-O', 'check',
		'-S', 'ssh-socks-proxy-8080',
		'-i', KEY_PATH,
		'-p', PROXY_PORT,
		`${PROXY_USER}@${PROXY_HOST}`
	]);

	ssh.stdout.on('data', data => {
		console.log('data', data.toString());
	});

	ssh.stderr.on('data', data => {
		console.log('data', data.toString());
	});

	ssh.on('close', code => {
		console.log('code', code);
	});

	ssh.on('error', error => {
		console.log('error', error);
	});

	ssh.on('exit', code => {
		console.log('exit', code);
	});

	ssh.on('disconnect', () => {
		console.log('disconnect');
	});

	ssh.on('message', message => {
		console.log('message', message);
	});

	ssh.on('spawn', () => {
		console.log('spawn');
	});

	ssh.on('disconnect', () => {
		console.log('disconnect');
	});
}





