import useMainStore from "@/stores/index";
import * as tauriAutoStart from "@tauri-apps/plugin-autostart";
import { open, Command } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";

const getExeAbsPath = async () => {
	const aExePath = (await invoke("get_exe_directory")) as [string, string];
	return aExePath;
};

const checkServerOnWindows = async () => {
	try {
		const serverStatus = await Command.create("nssm", ["status", import.meta.env.VITE_AUTO_START_SERVICE_NAME]).execute();
		if (serverStatus.stderr.includes("Can't open service")) {
			return false;
		}
		return true;
	} catch (err) {
		return false;
	}
};

const handleAutoStartByNssm = async () => {
    const config = useMainStore().config;
	const [exeAbsPath, parentDir] = await getExeAbsPath();
	const isExist = await checkServerOnWindows();
	if (isExist) {
		const outputStop = await Command.create("nssm", ["stop", import.meta.env.VITE_AUTO_START_SERVICE_NAME, "confirm"]).execute();
		console.log({ outputStop });
		const outputRemove = await Command.create("nssm", ["remove", import.meta.env.VITE_AUTO_START_SERVICE_NAME, "confirm"]).execute();
		console.log({ outputRemove });
	}
	if (exeAbsPath) {
		const output = await Command.create("nssm", ["install", import.meta.env.VITE_AUTO_START_SERVICE_NAME, exeAbsPath]).execute();
		console.log(output);
		if (output.stdout && output.stdout.includes("installed successfully")) {
			const outputAppDirectory = await Command.create("nssm", [
				"set",
				import.meta.env.VITE_AUTO_START_SERVICE_NAME,
				"AppDirectory",
				parentDir
			]).execute();
			console.log({ outputAppDirectory });
			const outputStart = await Command.create("nssm", [
				"set",
				import.meta.env.VITE_AUTO_START_SERVICE_NAME,
				"Start",
				"SERVICE_AUTO_START"
			]).execute();
			console.log({ outputStart });
			config.autoStart = true;
		}
	}
};

// 兼容autostart插件
const compatibleAutoStart = async () => {
    const config = useMainStore().config;
	const is_enable = await tauriAutoStart.isEnabled();
	if (is_enable) {
		try {
			await tauriAutoStart.disable();
			config.autoStart = false;
		} catch (err) {
			// ElMessage.error(`取消自启失败`);
		}
	}
	const serverStatus = await Command.create("nssm", ["status", import.meta.env.VITE_AUTO_START_SERVICE_NAME]).execute();
	console.log(serverStatus);
};
