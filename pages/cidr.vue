<template>
	<div class="flex h-full flex-col gap-[10px]">
		<ElRadioGroup
			:disabled="!data.isSwitchEnable"
			v-model="mainStore.cidrEnable"
		>
			<ElRadioButton :value="true">开启</ElRadioButton>
			<ElRadioButton :value="false">关闭</ElRadioButton>
		</ElRadioGroup>
		<div class="flex-1 overflow-auto">
			<ElInput
				placeholder="例如: 192.168.1.0/24 一行一个"
				v-model="mainStore.config.proxyNetworks"
				type="textarea"
				:rows="5"
				resize="none"
			></ElInput>
			<ElTable
				stripe
				border
				empty-text="暂无数据"
				:data="data.route"
				class="mt-[5px]"
			>
				<ElTableColumn
					sortable
					width="140"
					label="主机名"
					prop="hostname"
				></ElTableColumn>
				<ElTableColumn
					width="120"
					sortable
					label="虚拟网IP"
					prop="ipv4"
				></ElTableColumn>
				<ElTableColumn
					sortable
					label="被代理的子网"
					prop="proxy_cidrs"
				></ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { dataSubscribe } from "@/composables/windows";
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	import { ATJ, parseCliInfo } from "@/utils";
	import { listen, type UnlistenFn } from "@tauri-apps/api/event";
	const mainStore = useMainStore();

	const data = reactive<{ [key: string]: any }>({
		route: [],
		isStart: false,
		isSwitchEnable: false,
		isRunning: false
	});

	const listenOutput = async () => {
		data.isRunning = true;
		const [error, member] = await ATJ(invoke<string>("get_route_by_cli"));
		data.isRunning = false;
		// if(!member) return;
		if (error) {
			data.route = [];
			return "";
		}
		if (member === "_EasytierGameCliFailedToConnect_") {
			data.route = [];
			await listenOutput();
			return;
		}
		const routeInfo = parseCliInfo(member);
		routeInfo.forEach(value => {
			if (value.cost === "Local") {
				value.cost = "本机";
			}
			if (value.ipv4 && value.ipv4.includes("/")) {
				value.ipv4 = value.ipv4.split("/")[0];
			}
		});
		data.route = routeInfo;
	};

	const listenStart = async () => {
		const unListen = await listen<boolean>("route", async event => {
			data.isStart = event.payload;
			if (data.isStart) {
				data.isSwitchEnable = false;
				if (mainStore.cidrEnable && !data.isRunning) {
					await listenOutput();
				} else {
					data.route = [];
				}
			} else {
				data.isSwitchEnable = true;
				data.route = [];
			}
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

	dataSubscribe(async (...a) => {
		return { cidrEnable: mainStore.cidrEnable, config: { ...mainStore.config } };
	});
</script>
