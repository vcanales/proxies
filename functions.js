import { exec, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const config = {
	key: {
		path: '/Users/vcanales/.ssh/id_ed25519',
	}
};

const HOST = 'vforvicente@proxy.automattic.com';
const PORT = '22';
const KEY = config.key.path;
const CONTROL_SOCKET = path.resolve('socks','ssh-socks-proxy-8080');

function start() {
	// use spawn to run the ssh command above
	const ssh = spawn('ssh', [
		'-NvD', '8080',
		'-M', '-S', CONTROL_SOCKET,
		'-fnT', '-i', KEY,
		'-o', 'UserKnownHostsFile="/Applications/AutoProxxy.app/Contents/Resources/ProxyHostKey.pub"',
		'-p', PORT,
		'-vvv',
		'-E', 'ssh.log',
		HOST
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





