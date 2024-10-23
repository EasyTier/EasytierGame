<template>
	<div class="h-full flex flex-col gap-[10px]">
		<ElRadioGroup v-model="mainStore.cidrEnable">
			<ElRadioButton :value="true">开启</ElRadioButton>
			<ElRadioButton :value="false">关闭</ElRadioButton>
		</ElRadioGroup>
		<div class="flex-1 overflow-auto">
			<ElInput
				placeholder="例如: 192.168.1.0/24 一行一个"
				v-model="mainStore.config.proxyNetworks"
				type="textarea"
				:rows="30"
				resize="none"></ElInput>
		</div>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
    import { getCurrentWindow } from "@tauri-apps/api/window";
	const mainStore = useMainStore();
	const appWindow = getCurrentWindow();
	mainStore.$subscribe((...a) => {
		appWindow.emitTo("main", "config", { cidrEnable: mainStore.cidrEnable, config: { ...mainStore.config } });
	});
</script>
