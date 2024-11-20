<template>
	<div class="h-full overflow-auto flex flex-col items-start px-[25px]">
		<div><ElCheckbox v-model="mainStore.config.disableIpv6">不使用IPv6</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disbleListenner">不监听任何端口，只连接到对等节点</ElCheckbox></div>
		<div class="flex items-center gap-[15px] flex-nowrap">
			<ElCheckbox v-model="mainStore.config.saveErrorLog">输出日志到本地</ElCheckbox>
			<div class="w-[140px]">
				<ElSelect
					size="small"
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
		<div><ElCheckbox v-model="mainStore.config.connectAfterStart">软件启动后，自动"启动联机"(搭配开机自启，无感联机)</ElCheckbox></div>
		<div class="flex items-center gap-[15px] flex-nowrap">
			<ElCheckbox v-model="mainStore.createConfigInEasytier">自动生成界面配置文件easytier/config.json</ElCheckbox>
			<ElButton
				@click="openConfigJsonDir"
				size="small"
			>
				打开config.json目录
			</ElButton>
		</div>

		<ElDivider />
		<div class="flex items-center gap-[10px]">
			<ElCheckbox v-model="mainStore.config.devName">自定义网卡名</ElCheckbox>
			<ElInput
				size="small"
				maxlength="10"
				v-model="mainStore.config.devNameValue"
				placeholder="请输入网卡名"
			/>
		</div>
		<div class="flex items-center gap-[10px]">
			<ElCheckbox v-model="mainStore.config.enableNetCardMetric">自定义easytier网卡跃点</ElCheckbox>
			<ElInputNumber
				controls-position="right"
				:min="1"
				:value-on-clear="1"
				:max="9999"
				:step="1"
				:precision="0"
				size="small"
				v-model="mainStore.config.netCardMetricValue"
				placeholder="请选择跃点数"
			/>
			<ElTooltip content="设置easytier网卡的跃点，提升网卡优先级，跃点越小，网卡优先级越高">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div>
			<ElText
				size="small"
				type="warning"
			>
				(不使用自定义网卡名,那么联机时默认会生成一个名为 "et_xxx" 的网卡，也可以使用 “设置跃点” 功能，除非你启用了下面的功能)
			</ElText>
		</div>
		<div><ElCheckbox v-model="mainStore.config.noTun">不创建TUN设备(网卡)，可以使用子网代理访问节点</ElCheckbox></div>

		<ElDivider />
		<div><ElCheckbox v-model="mainStore.config.enablExitNode">允许此节点成为出口节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableEncryption">禁用对等节点通信的加密，默认为启用，必须与对等节点相同</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.multiThread">使用多线程运行时，默认为单线程</ElCheckbox></div>
		<ElDivider />

		<div><ElCheckbox v-model="mainStore.config.useSmoltcp">为子网代理启用smoltcp堆栈</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.latencyfirst">延迟优先模式，将尝试使用最低延迟路径转发流量，默认使用最短路径</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableUdpHolePunching">禁用UDP打洞功能</ElCheckbox></div>
		<div>
			<ElCheckbox v-model="mainStore.config.relayAllPeerrpc">转发所有对等节点的RPC数据包，即使对等节点不在转发网络白名单内</ElCheckbox>
		</div>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { QuestionFilled } from "@element-plus/icons-vue";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
	import { Command } from "@tauri-apps/plugin-shell";
	import { exists, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";
	import { ElMessage } from "element-plus";

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
	const openConfigJsonDir = async () => {
		const resourceDir = await getResourceDir();
		const easytierDir = await join(resourceDir, "easytier/");
		const isExists = await exists("easytier/", { baseDir: BaseDirectory.Resource });
		if (isExists) {
			await Command.create("explorer", [easytierDir]).execute();
		} else {
			ElMessage.error("config.json的目录不存在");
		}
	};
	mainStore.$subscribe(async (...a) => {
		// console.error("subscribe", a);
		await appWindow.emitTo("main", "config", { config: { ...mainStore.config }, createConfigInEasytier: mainStore.createConfigInEasytier });
		// if(mainStore.createConfigInEasytier) {
		// 	updateConfigJson();
		// }
	});
</script>
