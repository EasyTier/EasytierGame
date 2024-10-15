<template>
	<NuxtPage />
</template>

<script setup lang="tsx">
	//屏蔽右键菜单
	document.addEventListener("contextmenu", (e: MouseEvent) => {
		e.preventDefault();
	});
</script>
