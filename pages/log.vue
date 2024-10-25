<template>
	<ElInput
		type="textarea"
		:rows="17"
		v-model="data.log"
		resize="none"
		readonly
		placeholder="等待日志中，请先'启动联机'..."
	/>
</template>
<script setup lang="ts">
	import { listen, type UnlistenFn } from "@tauri-apps/api/event";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	const data = reactive({
		log: ""
	});

	const listenStart = async () => {
		const unListen = await listen("logs", event => {
			data.log = (event.payload as string) || "";
		});
		return unListen;
	};

	let unlistenStart: UnlistenFn | null = null;
	onMounted(async () => {
		unlistenStart = await listenStart();
	});

	onBeforeUnmount(() => {
		unlistenStart && unlistenStart();
	});
</script>
