import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
import useMainStore from "@/stores/index";
import { ElMessage } from "element-plus";
import { uniq, intersection, isNil } from "lodash-es";
import { bounce } from "~/utils";

const b = bounce(600);
export type ConfigServerUrlType = Array<string>;

export const updateConfigJsonBounce = (configJsonSeverUrl?: ConfigServerUrlType) => {
	b(async () => {
		const mainStore = useMainStore();
		if (mainStore.createConfigInEasytier) {
			await updateConfigJson(configJsonSeverUrl);
		}
	});
};

export const updateConfigJson = async (configJsonSeverUrl?: ConfigServerUrlType) => {
	const mainStore = useMainStore();
	const path = import.meta.env.VITE_CONFIG_FILE_NAME;
	if (isNil(configJsonSeverUrl)) {
		configJsonSeverUrl = [];
	}
	if(typeof(configJsonSeverUrl) == 'string') {
		configJsonSeverUrl = [configJsonSeverUrl];
	}
	configJsonSeverUrl = configJsonSeverUrl || [];
	try {
		const {
			proxyNetworks,
			autoStart,
			connectAfterStart,
			saveErrorLog,
			serverUrl,
			enableCustomListener,
			customListenerData,
			bindDeviceEnable,
			acceptDNS,
			enablePortForward,
			portForwardData,
			tcpWhitelist,
			udpWhitelist,
			tcpWhitelistEnable,
			udpWhitelistEnable,
			...otherConfig
		} = mainStore.config;
		let writeServerUrl: Array<string> = serverUrl;
		let writeCustomListenerData: Array<string> = (customListenerData || "").split("\n");

		writeServerUrl = intersection(
			uniq([...serverUrl, ...configJsonSeverUrl]).filter(boolean => boolean),
			mainStore.basePeers
		);

		await writeTextFile(
			path,
			JSON.stringify({ serverUrl: writeServerUrl, enableCustomListener, customListenerData: writeCustomListenerData, ...otherConfig }, null, 4),
			{ baseDir: BaseDirectory.Resource }
		);
	} catch (err) {
		console.error(err);
		ElMessage.error(`更新config.json失败`);
	}
};
