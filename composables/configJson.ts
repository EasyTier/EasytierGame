import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
import useMainStore from "@/stores/index";
import { ElMessage } from "element-plus";
import { uniq, intersection, isNil } from "lodash-es";
export const updateConfigJson = async (configJsonSeverUrl: Array<string> | string | null | undefined) => {
	const mainStore = useMainStore();
	const path = import.meta.env.VITE_CONFIG_FILE_NAME;
	if (isNil(configJsonSeverUrl)) {
		configJsonSeverUrl = [];
	}
	const isArray = Array.isArray(configJsonSeverUrl);
	const isString = typeof configJsonSeverUrl === "string";
	try {
		const {
			proxyNetworks,
			autoStart,
			relayAllPeerrpc,
			connectAfterStart,
			multiThread,
			enablExitNode,
			useSmoltcp,
			saveErrorLog,
			logLevel,
			serverUrl,
			...otherConfig
		} = mainStore.config;
		let writeServerUrl: Array<string> | string = serverUrl;
		if (isArray) {
			writeServerUrl = intersection(
				uniq([serverUrl, ...configJsonSeverUrl]).filter(boolean => boolean),
				mainStore.basePeers
			);
		}
		if (isString && configJsonSeverUrl) {
			writeServerUrl = intersection(
				uniq([serverUrl, ...(configJsonSeverUrl as string).split(",")]).filter(boolean => boolean),
				mainStore.basePeers
			).join(",");
		}
		await writeTextFile(path, JSON.stringify({ serverUrl: writeServerUrl, ...otherConfig }, null, 4), { baseDir: BaseDirectory.Resource });
	} catch (err) {
		console.log(err);
		ElMessage.error(`更新config.json失败`);
	}
};
