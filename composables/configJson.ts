import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
import useMainStore from "@/stores/index";
import { ElMessage } from "element-plus";
export const updateConfigJson = async () => {
    
	const mainStore = useMainStore();
    const path = import.meta.env.VITE_CONFIG_FILE_NAME;
    try {
        const { proxyNetworks, autoStart, relayAllPeerrpc, coonectAfterStart, multiThread, enablExitNode, useSmoltcp, saveErrorLog, logLevel, ...otherConfig } =
            mainStore.config;
        await writeTextFile(path, JSON.stringify(otherConfig, null, 4), { baseDir: BaseDirectory.Resource });
    } catch (err) {
        console.log(err);
        ElMessage.error(`更新config.json失败`);
    }
}
