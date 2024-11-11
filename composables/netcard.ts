import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import { ElMessage, type TabPaneName } from "element-plus";
import useMainStore from "@/stores/index";

const getWinIpBroadcastPid = async () => {
    const mainStore = useMainStore();
    const pid = await invoke("search_pid_by_pname", { target_process_name: "WinIPBroadcast" });
    mainStore.winipBcPid = (pid as number) || 0;
    if (mainStore.winipBcPid && mainStore.winipBcPid > 0) {
        mainStore.winipBcStart = true;
        mainStore.winIpBcAutoStart = true;
    } else {
        mainStore.winipBcStart = false;
        mainStore.winIpBcAutoStart = false;
    }
};

export const handleWinipBcStart = async () => {
    const mainStore = useMainStore();
    if (!mainStore.winipBcStart) {
        try {
            await invoke("stop_command", { child_id: mainStore.winipBcPid || 0 });
            const child = await Command.create("WinIPBroadcast", ["run"]).spawn();
            mainStore.winipBcPid = child.pid || 0;
            if (mainStore.winipBcPid) {
                mainStore.winipBcStart = true;
            } else {
                ElMessage.error(`启动失败`);
            }
        } catch (err) {
            ElMessage.error(`启动失败`);
            console.log(err);
        }
    } else {
        await invoke("stop_command", { child_id: mainStore.winipBcPid || 0 });
        await getWinIpBroadcastPid();
    }
};

export const initStartWinIpBroadcast = async () => {
    const mainStore = useMainStore();
    await getWinIpBroadcastPid();
    // console.log(mainStore.winipBcStart, mainStore.winIpBcAutoStart)
    if (!mainStore.winipBcStart && mainStore.winIpBcAutoStart) {
        await handleWinipBcStart();
    }
};