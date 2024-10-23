<template>
	<div class="h-full overflow-auto flex flex-col items-start px-[25px]">
		<div>
			<ElCheckbox v-model="mainStore.config.disableIpv6">不使用IPv6</ElCheckbox>
		</div>
		<div><ElCheckbox v-model="mainStore.config.disbleListenner">不监听任何端口，只连接到对等节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.enablExitNode">允许此节点成为出口节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableEncryption">禁用对等节点通信的加密，默认为false，必须与对等节点相同</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.multiThread">使用多线程运行时，默认为单线程</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.noTun">不创建TUN设备，可以使用子网代理访问节点</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.useSmoltcp">为子网代理启用smoltcp堆栈</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.latencyfirst">延迟优先模式，将尝试使用最低延迟路径转发流量，默认使用最短路径</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableUdpHolePunching">禁用UDP打洞功能</ElCheckbox></div>
		<div>
			<ElCheckbox v-model="mainStore.config.relayAllPeerrpc">转发所有对等节点的RPC数据包，即使对等节点不在转发网络白名</ElCheckbox>
		</div>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	const mainStore = useMainStore();
	const appWindow = getCurrentWindow();
	mainStore.$subscribe((...a) => {
		// console.log("subscribe", a);
		appWindow.emitTo("main", "config", { config: { ...mainStore.config } });
	});
</script>
