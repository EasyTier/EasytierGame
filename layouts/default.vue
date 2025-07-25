<template>
	<NuxtPage />
</template>

<script setup lang="tsx">
	//屏蔽右键菜单
	document.addEventListener("contextmenu", (e: MouseEvent) => {
		const el = (e.target as HTMLElement);
		if (import.meta.env.PROD && !el.classList.contains("el-input__inner") && !el.classList.contains("el-textarea__inner")
	&& !el.classList.contains("allow-contextmenu")) { // 所有输入框不禁用右键
			e.preventDefault();
		}
	});
</script>
