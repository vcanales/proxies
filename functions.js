import { execSync, spawn, spawnSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

function initEnv(debug = false) {
	dotenv.config(
		{
			path: envPath,
			debug,
	}
	);

	const { PAC_FILE_URL = '', PROXY_HOST, PROXY_PORT, KEY_PATH, PROXY_USER } = process.env;
	const PROXY_KEY = path.join(__dirname, 'ProxyHostKey.pub');
	const PID_FILE = path.join(__dirname, 'pid');
	const SSH_LOG = path.join(__dirname, 'ssh.log');
	const SSH_SOCKS_PROXY = path.join(__dirname, 'proxier-socks');

	return {
		PAC_FILE_URL,
		PROXY_HOST,
		PROXY_PORT,
		KEY_PATH,
		PROXY_USER,
		PROXY_KEY,
		PID_FILE,
		SSH_LOG,
		SSH_SOCKS_PROXY
	}
}

export function readConfig() {
	// read .env file and return the variables
	// create .env if it doesn't exist
	if (!existsSync(envPath)) {
		writeFileSync(envPath, '');
	}
	const env = dotenv.config({
		path: envPath
	});
	const { parsed, error } = env;
	if (error) {
		throw error;
	}
	return typeof parsed == undefined ? {} : parsed;
}

export function saveConfig(variables) {
	// save variable values to .env file
	// create .env if it doesn't exist
	if (!existsSync(envPath)) {
		writeFileSync(envPath, '');
	}
	const env = dotenv.config();
	const { parsed } = env;
	const newEnv = { ...parsed, ...variables };
	const newEnvString = Object.keys(newEnv).map(key => `${key}=${newEnv[key]}`).join('\n');
	writeFileSync(envPath, newEnvString);
}

export function start(shouldRestart, isVerbose) {
	const { PAC_FILE_URL, PROXY_HOST, PROXY_PORT, KEY_PATH, PROXY_USER, PROXY_KEY, PID_FILE, SSH_LOG, SSH_SOCKS_PROXY } = initEnv(isVerbose);
	// check for env vars
	if (!PROXY_HOST || !PROXY_PORT || !KEY_PATH || !PROXY_USER) {
		console.log('Configuration variables are missing. Please run the `proxier config` command to set them.');
		return;
	}

	if (shouldRestart) {
		stop();
	} else {
		const isProxyAlreadyRunning = status();

		if (isProxyAlreadyRunning) {
			console.log('ssh proxy is already running');
			return;
		}
	}

	// if macos, use networksetup to set automatic proxy config on
	if (process.platform === 'darwin') {
		try {
			execSync(`networksetup -setautoproxyurl "Wi-Fi" ${PAC_FILE_URL}`);
		} catch(err) {
			console.log('Error setting automatic proxy config on');
			return;
		}
	}

	// use spawn to run the ssh command
	try {
		const ssh = spawn('ssh', [
			'-NvD', PROXY_PORT,
			'-M', '-S', SSH_SOCKS_PROXY,
			'-fnT', '-i', KEY_PATH,
			'-o', `UserKnownHostsFile="${PROXY_KEY}"`,
			'-p', '22',
			'-vvv',
			'-E', SSH_LOG,
			`${PROXY_USER}@${PROXY_HOST}`
		], { detached: true });

		if (isVerbose) {
			ssh.stdout.pipe(process.stdout);
			ssh.stderr.pipe(process.stderr);
		}

		writeFileSync(PID_FILE, `${ssh.pid}`);

		ssh.unref();
	} catch(err) {
		console.log(err);
	}
}

export function stop() {
	const pid = status(true);
	
	if (!pid) {
		console.log('ssh proxy is not running');
		return;
	}

	// if macos, use networksetup to set automatic proxy config off
	if (process.platform === 'darwin') {
		try {
			execSync(`networksetup -setautoproxystate "Wi-Fi" off`);
		} catch(err) {
			console.log('Error setting automatic proxy config off');
			return;
		}
	}
	
	try {
		execSync(`kill ${pid}`);
	} catch(err) {
		console.log('ssh process is not found.');
		return;
	}
}

export function status(returnPid = false, isVerbose = false) {
	const { PROXY_HOST, PROXY_USER, PID_FILE, SSH_SOCKS_PROXY } = initEnv(isVerbose);
	const pidFile = existsSync(PID_FILE);
	const socksProxy = existsSync(SSH_SOCKS_PROXY);

	if (!pidFile || !socksProxy) {
		return false;
	}

	const ssh = spawnSync('ssh', [
		'-O', 'check',
		'-S', SSH_SOCKS_PROXY,
		`${PROXY_USER}@${PROXY_HOST}`
	]);

	const { stderr } = ssh;

	if (isVerbose) {
		console.log(stderr.toString());
	}

	if (stderr.includes('Master running')) {
		if (returnPid) {
			const pid = stderr.toString().match(/pid=(\d+)/)[1];
			return pid;
		}
		return true;
	}

	return false;
}

export function logs(isVerbose = false) {
	const { SSH_LOG } = initEnv(isVerbose);
	const tail = spawn('tail', ['-f', SSH_LOG]);
	tail.stdout.pipe(process.stdout);
	tail.stderr.pipe(process.stderr);
}





