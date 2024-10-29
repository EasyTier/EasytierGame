<template>
	<NuxtPage />
</template>

<script setup lang="tsx">
	//屏蔽右键菜单
	document.addEventListener("contextmenu", (e: MouseEvent) => {
		if (import.meta.env.PROD) {
			e.preventDefault();
		}
	});
</script>
