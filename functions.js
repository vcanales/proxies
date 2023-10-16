import { execSync, spawn, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { PROXY_HOST, PROXY_PORT, KEY_PATH, PROXY_USER } = process.env;
const PROXY_KEY = path.join(__dirname, 'ProxyHostKey.pub');
const PID_FILE = path.join(__dirname, 'pid');
const SSH_LOG = path.join(__dirname, 'ssh.log');
const SSH_SOCKS_PROXY = path.join(__dirname, `ssh-socks-proxy-${PROXY_USER}-${PROXY_PORT}`);

export function start() {
	const ss = status();
	
	if (ss) {
		console.log('ssh proxy is already running');
		return;
	}

	// use spawn to run the ssh command above
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

	writeFileSync(PID_FILE, `${ssh.pid}`);

	ssh.unref();
}

export function stop() {
	const pid = status(true);
	
	if (!pid) {
		console.log('ssh proxy is not running');
		return;
	}
	
	try {
		execSync(`kill ${pid}`);
	} catch(err) {
		console.log('ssh process is not found.');
		return;
	}
}

export function status(returnPid = false) {
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

	if (stderr.includes('Master running')) {
		if (returnPid) {
			const pid = stderr.toString().match(/pid=(\d+)/)[1];
			return pid;
		}
		return true;
	}

	return false;
}





