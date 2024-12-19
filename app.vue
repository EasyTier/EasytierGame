<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { initTheme } from "@/composables/theme";
	import { warn, debug, trace, info, error } from "@tauri-apps/plugin-log";
	function forwardConsole(fnName: "log" | "debug" | "info" | "warn" | "error", logger: (message: string) => Promise<void>) {
		const original = console[fnName];
		console[fnName] = message => {
			original(message);
			try {
				if (typeof message === "string") {
					logger(message);
				} else {
					logger(JSON.stringify(message));
				}
			} catch (e) {
				logger(`${message}`);
			}
		};
	}
	if (import.meta.env.PROD) {
		forwardConsole("log", info);
		forwardConsole("debug", debug);
		forwardConsole("info", info);
		forwardConsole("warn", warn);
		forwardConsole("error", error);
	}

	const mainStore = useMainStore();
	// console.log(mainStore.theme)
	initTheme(mainStore.theme);
</script>
