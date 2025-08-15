<template>
	<!-- <ElInput
		type="textarea"
		:rows="17"
		v-model="data.originLog"
		resize="none"
		readonly
		placeholder="等待日志中，请先'启动联机'..."
	/> -->
	<div
		ref="logRef"
		@scroll="handleScroll"
		class="overflow-auto"
	>
		<div v-if="!data.log || data.log.length <= 0" class="p-[5px]">
			<ElText type="info">等待日志中，请先'启动联机'...</ElText>
		</div>
		<div
			v-else
			v-for="item in data.log"
			:key="item.id"
			class="p-[5px]"
		>
			<div class="group/item flex items-center justify-start leading-[26px]">
				<ElText
					:closable="false"
					:type="item.type"
				>
					{{ item.text }}
					<ElTooltip
						placement="right"
						content="复制"
					>
						<ElButton
							class="ml-[3px] !hidden w-fit group-hover/item:!inline-flex"
							@click.stop="handleCopyLog(item.text)"
							type="success"
							size="small"
							circle
							plain
							:icon="CopyDocument"
						></ElButton>
					</ElTooltip>
				</ElText>
			</div>
		</div>
		<ElAffix
			v-if="data.originLog"
			class="w-full"
			position="bottom"
			:offset="10"
		>
			<div class="bg-(var(--el-color-primary)) mr-[10px] flex items-center justify-end">
				<ElTooltip
					content="复制全部"
					placement="top"
				>
					<ElButton
						@click.stop="handleCopyLog(data.originLog)"
						type="info"
						size="large"
						circle
						:icon="CopyDocument"
					></ElButton>
				</ElTooltip>
			</div>
		</ElAffix>
	</div>
</template>
<script setup lang="ts">
	import { CopyDocument } from "@element-plus/icons-vue";
	import { listen, type UnlistenFn } from "@tauri-apps/api/event";
	import { reactive, onMounted, onBeforeUnmount, useTemplateRef, nextTick } from "vue";
	import { copyText } from "~/utils";
	type LogItem = { id: string; text: string; type: "danger" | "info" | "warning" | "primary" };
	const data = reactive<{ log: LogItem[]; originLog: string; autoScrollToBottom: boolean }>({
		log: [],
		originLog: "", // 原始日志
		autoScrollToBottom: true // 是否允许自动滚动到底部
	});

	const logEl = useTemplateRef<HTMLDivElement>("logRef");

	const scrollToBottom = () => {
		if (data.autoScrollToBottom) {
			logEl.value?.scrollTo({
				top: logEl.value?.scrollHeight,
				behavior: "smooth"
			});
		}
	};

	const handleScroll = () => {
		if (logEl.value) {
			const autoScrollToBottom = logEl.value.scrollTop + logEl.value.clientHeight >= logEl.value.scrollHeight;
			data.autoScrollToBottom = autoScrollToBottom;
		}
	};

	const listenStart = async () => {
		const unListen = await listen<string>("logs", async event => {
			const payload = event.payload || "";
			if (data.originLog === payload) return;
			data.originLog = payload;
			data.log = payload
				.split("\n")
				.filter(text => text.trim())
				.map((text, idx) => {
					const toLowerCaseText = text.toLocaleLowerCase();
					return {
						id: `${text}-${idx}`,
						text,
						type:
							toLowerCaseText.includes("error") ||
							toLowerCaseText.includes("fail") ||
							toLowerCaseText.includes("failed") ||
							toLowerCaseText.includes("exception") ||
							toLowerCaseText.includes("err")
								? "danger"
								: toLowerCaseText.includes("warn")
									? "warning"
									: toLowerCaseText.includes("new peer connection")
										? "primary"
										: "info"
					};
				});
			await nextTick();
			scrollToBottom();
		});
		return unListen;
	};

	const handleCopyLog = async (text: string) => {
		await copyText(text, "复制记录成功");
	};

	let unlistenStart: UnlistenFn | null = null;
	onMounted(async () => {
		unlistenStart = await listenStart();
	});

	onBeforeUnmount(() => {
		unlistenStart && unlistenStart();
	});
</script>
