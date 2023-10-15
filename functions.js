import { exec, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const { HOST, PORT, KEY_PATH, USER } = process.env;
const controlSocketName = `ssh-socks-proxy-${USER}-${HOST}-${PORT}`;
const CONTROL_SOCKET = path.resolve('socks', controlSocketName);

function start() {
	// use spawn to run the ssh command above
	const ssh = spawn('ssh', [
		'-NvD', '8080',
		'-M', '-S', CONTROL_SOCKET,
		'-fnT', '-i', KEY_PATH,
		'-o', 'UserKnownHostsFile="/Applications/AutoProxxy.app/Contents/Resources/ProxyHostKey.pub"',
		'-p', PORT,
		'-vvv',
		'-E', 'ssh.log',
		`${USER}@${HOST}`
	], { detached: true });

	writeFileSync('pid', `${ssh.pid}`);

	ssh.unref();
}

function stop() {
	const pid = readFileSync('pid', 'utf8');
	exec(`kill ${pid}`);
	// delete pid file
	exec('rm pid');
}

export {
	start,
	stop,
};





