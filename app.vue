<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { initTheme } from "@/composables/theme";
	const mainStore = useMainStore();
	// console.log(mainStore.theme)
	initTheme(mainStore.theme);
</script>
