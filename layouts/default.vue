<template>
	<NuxtPage />
</template>

<script setup lang="tsx">
	import { onBeforeUnmount } from "vue";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { listen } from "@tauri-apps/api/event";

	const appWindow = getCurrentWindow();

	const unlisten = listen("window-close-event", (event) => {
		closeApp();
	});

	onBeforeUnmount(() => {
		unlisten.then((unlisten) => {
			unlisten && unlisten instanceof Function && unlisten();
		});
	});

	const closeApp = async () => {
		appWindow.hide();
	};
</script>
