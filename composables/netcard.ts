import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import { ElMessage, type TabPaneName } from "element-plus";
import useMainStore from "@/stores/index";
import { BaseDirectory } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";

const getWinIpBroadcastPid = async () => {
    const mainStore = useMainStore();
    const pid = await invoke("search_pid_by_pname", { target_process_name: "WinIPBroadcast" });
    mainStore.winipBcPid = (pid as number) || 0;
    if (mainStore.winipBcPid && mainStore.winipBcPid > 0) {
        mainStore.winipBcStart = true;
    } else {
        mainStore.winipBcStart = false;
    }
};

export const handleWinipBcStart = async () => {
    const mainStore = useMainStore();
    if (!mainStore.winipBcStart) {
        try {
            await invoke("stop_command", { child_id: mainStore.winipBcPid || 0 });
            const isExists = await exists("easytier/tool/WinIPBroadcast.exe", { baseDir: BaseDirectory.Resource });
            if(!isExists) {
                ElMessage.error(`WinipBc不存在`);
                console.error(`WinipBc不存在`);
                return;
            }
            const child = await Command.create("WinIPBroadcast", ["run"]).spawn();
            mainStore.winipBcPid = child.pid || 0;
            if (mainStore.winipBcPid) {
                mainStore.winipBcStart = true;
				mainStore.winIpBcAutoStart = true;
            } else {
                ElMessage.error(`WinipBc失败`);
            }
        } catch (err) {
            ElMessage.error(`WinipBc失败`);
            console.error(err);
        }
    } else {
		mainStore.winIpBcAutoStart = false;
        await invoke("stop_command", { child_id: mainStore.winipBcPid || 0 });
        await getWinIpBroadcastPid();
    }
};

export const initStartWinIpBroadcast = async () => {
    const mainStore = useMainStore();
    await getWinIpBroadcastPid();
    // console.error(mainStore.winipBcStart, mainStore.winIpBcAutoStart)
    if (mainStore.winIpBcAutoStart && !mainStore.winipBcStart) {
        await handleWinipBcStart();
    }
};