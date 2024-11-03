<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
<script setup lang="ts">
	import { useDark, useToggle, usePreferredDark } from "@vueuse/core";
	import { isFunction } from "lodash-es";
	const isDark = usePreferredDark();
	const darkConfig = useDark({
		selector: "html",
		attribute: "class",
		valueDark: "dark",
		valueLight: "",
	});
	const toggleDark = useToggle(darkConfig);
	if (isDark && isFunction(toggleDark)) {
		toggleDark(isDark);
	}
</script>
