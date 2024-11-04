<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
<script setup lang="ts">
	import { initTheme } from "~/composables/theme";
	initTheme();
</script>
