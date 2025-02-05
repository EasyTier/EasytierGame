<template>
	<div class="flex flex-col gap-[10px] h-full">
		<ElForm
			size="small"
			label-position="top"
			:model="mainStore.serverConfig"
		>
			<ElFormItem
				label="白名单"
				prop="ServerWhiteList"
				class="full-label full-content overflow-hidden !flex flex-col h-full !mb-[0]"
			>
				<template #label>
					<div class="flex items-center gap-[10px]">
						白名单
						<ElSwitch
							v-model="mainStore.serverConfig.enableWhiteList"
							inline-prompt
							active-text="启用"
							inactive-text="禁用"
						></ElSwitch>

						<div class="ml-auto">
							<ElTooltip
								placement="top"
								content="打开软件的时候，就会开启这个自建服务"
							>
								<ElCheckbox v-model="mainStore.serverConfig.autoStart">自动启动</ElCheckbox>
							</ElTooltip>
							<ElTooltip
								placement="top"
								content="帮助其他虚拟网建立P2P链接"
							>
								<ElCheckbox v-model="mainStore.serverConfig.relayAllPeerrpc">转发所有对等节点的RPC数据包</ElCheckbox>
							</ElTooltip>
						</div>
					</div>
				</template>
				<div class="h-full w-full flex flex-col overflow-hidden">
					<div class="flex-1 overflow-auto">
						<ElInput
							:disabled="!mainStore.serverConfig.enableWhiteList"
							placeholder="一行一个，支持通配符列表，如（ab*）。当该参数的列表为空时，就不会为所有其他网络提供转发服务。"
							:maxlength="1000"
							v-model="mainStore.serverConfig.serverWhiteList"
							type="textarea"
							:rows="3"
							resize="none"
						></ElInput>
					</div>
				</div>
			</ElFormItem>
		</ElForm>
		<div class="flex items-center gap-[10px]">
			<div class="flex items-center gap-[5px]">
				<ElText>服务器端口</ElText>
				<div class="max-w-[100px]">
					<ElTooltip content="端口号">
						<ElInput v-model="mainStore.serverConfig.port"></ElInput>
					</ElTooltip>
				</div>
			</div>
			<ElButton
				size="large"
				:loading="data.loading"
				:type="data.isStart ? 'danger' : 'primary'"
				@click="hanldeClickStart"
			>
				{{ !data.isStart ? "启动服务器" : "停止服务器" }}
			</ElButton>
		</div>

		<ElInput
			placeholder="服务器日志"
			:model-value="data.log"
			type="textarea"
			:rows="14"
			resize="none"
		></ElInput>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { listen, type UnlistenFn } from "@tauri-apps/api/event";
	import { getServerArgs } from "@/composables/server";
	import { dataSubscribe } from "@/composables/windows";

    const appWindow = getCurrentWindow();
	const mainStore = useMainStore();
	const data = reactive({
		log: "",
		isStart: false,
		loading: true
	});

	const listenStart = async () => {
		const unListen = await listen<{ log: string; threadId: number | null }>("server_logs", event => {
			data.log = event.payload.log || "";
			if (event.payload.threadId) {
				data.isStart = true;
			} else {
				data.isStart = false;
			}
			data.loading = false;
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

	const hanldeClickStart = async () => {
		data.loading = true;
        const args = getServerArgs();
		await appWindow.emitTo("main", "startStopServer", { args });
	};

	dataSubscribe();

</script>
