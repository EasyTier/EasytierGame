<template>
	<div class="h-full overflow-auto flex flex-col items-start px-[25px]">
		<div><ElCheckbox v-model="mainStore.config.coonectAfterStart">软件启动后，自动"启动联机"(搭配开机自启，无感联机)</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableIpv6">不使用IPv6</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disbleListenner">不监听任何端口，只连接到对等节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.enablExitNode">允许此节点成为出口节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableEncryption">禁用对等节点通信的加密，默认为false，必须与对等节点相同</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.multiThread">使用多线程运行时，默认为单线程</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.noTun">不创建TUN设备，可以使用子网代理访问节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.useSmoltcp">为子网代理启用smoltcp堆栈</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.latencyfirst">延迟优先模式，将尝试使用最低延迟路径转发流量，默认使用最短路径</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableUdpHolePunching">禁用UDP打洞功能</ElCheckbox></div>
		<div>
			<ElCheckbox v-model="mainStore.config.relayAllPeerrpc">转发所有对等节点的RPC数据包，即使对等节点不在转发网络白名单内</ElCheckbox>
		</div>
		<div class="flex items-center gap-[15px] flex-nowrap">
			<ElCheckbox v-model="mainStore.config.saveErrorLog">输出日志到本地</ElCheckbox>
			<div class="w-[140px]">
				<ElSelect
					v-model="mainStore.config.logLevel"
					placeholder="请选择日志等级"
					class="ml-[5px]"
				>
					<ElOption
						v-for="item in data"
						:key="item"
						:label="`level - ${item}`"
						:value="item"
					></ElOption>
				</ElSelect>
			</div>
			<ElButton
				@click="openLogDir"
				size="small"
			>
				打开日志目录
			</ElButton>
		</div>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
	import { Command } from "@tauri-apps/plugin-shell";
	import { exists, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";

	const mainStore = useMainStore();
	const appWindow = getCurrentWindow();
	const data = ["trace", "debug", "info", "warn", "error", "off"];
	const openLogDir = async () => {
		const resourceDir = await getResourceDir();
		const logPath = import.meta.env.VITE_LOG_PATH;
		const logDirPath = await join(resourceDir, logPath);
		const isExists = await exists(logPath, { baseDir: BaseDirectory.Resource });
		if (!isExists) {
			try {
				await mkdir(logPath, { baseDir: BaseDirectory.Resource });
			} catch (err) {}
		}
		await Command.create("explorer", [logDirPath]).execute();
	};
	mainStore.$subscribe((...a) => {
		// console.log("subscribe", a);
		appWindow.emitTo("main", "config", { config: { ...mainStore.config } });
	});
</script>
