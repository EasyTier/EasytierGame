<template>
	<ElForm
		size="small"
		label-position="top"
		:model="config">
		<ElFormItem
			label="服务器"
			prop="serverUrl">
			<template #label>
				<div class="flex items-center gap-[0_5px]">
					<div>服务器</div>
					<span>-</span>
					<ElTag
						effect="dark"
						:type="data.isSuccessGetIp ? 'success' : 'info'">
						{{ data.isSuccessGetIp ? "联机成功" : "联机中" }}
					</ElTag>
					<ElButton
						v-if="!data.coreVersion"
						@click="getCoreVersion(true)"
						>获取工具版本</ElButton
					>
					<ElTag
						v-else
						type="info"
						>{{ data.coreVersion }}</ElTag
					>
					<ElButton
						:disabled="data.isStart"
						:loading="data.update"
						type="warning"
						@click="handleUpdateCore"
						size="small"
						>{{ data.coreVersion ? "更新" : "下载" }}</ElButton
					>
				</div>
			</template>
			<ElSelect
				allow-create
				filterable
				default-first-option
				v-model="config.serverUrl"
				@change="handleServerUrlChange">
				<template #prefix>
					<div :class="config.protocol && config.protocol.length > 1 ? 'w-[120px]' : 'w-[80px]'">
						<ElSelect
							placeholder="协议"
							multiple
							collapse-tags
							v-model="config.protocol"
							@change="handleServerUrlChange">
							<ElOption
								v-for="item in protocols"
								:key="item"
								:label="item"
								:value="item"></ElOption>
						</ElSelect>
					</div>
				</template>
				<ElOption
					v-for="item in mainStore.basePeers"
					:key="item"
					:label="item"
					:value="item">
					<div class="flex items-center justify-between">
						<span style="float: left">{{ item }}</span>
						<ElButton
							@click.stop="handleDeleteServerUrl(item)"
							round
							:icon="Delete"
							type="danger"></ElButton></div
				></ElOption>
			</ElSelect>
		</ElFormItem>
		<div class="flex flex-wrap gap-[0_10px] items-center">
			<div class="flex-1">
				<ElFormItem label="网络名">
					<template #label>
						<div class="flex items-center">
							网络名
							<ElTooltip content="对应命令行参数 --network-name">
								<ElIcon><QuestionFilled /></ElIcon>
							</ElTooltip>
						</div>
					</template>
					<ElInput
						maxlength="100"
						placeholder="请输入网络名"
						v-model="config.networkName"></ElInput>
				</ElFormItem>
			</div>
			<div class="flex-1">
				<ElFormItem label="网络密码">
					<template #label>
						<div class="flex items-center">
							网络密码
							<ElTooltip content="对应命令行参数 --network-secret">
								<ElIcon><QuestionFilled /></ElIcon>
							</ElTooltip>
						</div>
					</template>
					<ElInput
						show-password
						maxlength="100"
						placeholder="请输入网络密码"
						v-model="config.networkPassword"
						type="password"></ElInput>
				</ElFormItem>
			</div>
		</div>
		<div class="flex gap-[0_10px]">
			<ElFormItem label="主机名">
				<template #label>
					<div class="flex items-center">
						主机名
						<ElTooltip content="对应命令行参数 --hostname">
							<ElIcon><QuestionFilled /></ElIcon>
						</ElTooltip>
					</div>
				</template>
				<ElInput
					maxlength="100"
					placeholder="例如: Player1"
					v-model="config.hostname"></ElInput>
			</ElFormItem>
			<ElFormItem
				class="w-[70%]"
				label="局域网IP">
				<template #label>
					<div class="flex items-center h-[20px]">
						虚拟网IP
						<ElTooltip content="对应命令行参数 --ipv4">
							<ElIcon><QuestionFilled /></ElIcon>
						</ElTooltip>
						<ElSwitch
							v-model="config.dhcp"
							class="ml-[5px]"
							inline-prompt
							inactive-text="固定IP"
							active-text="动态获取IP"
							size="small"></ElSwitch>
					</div>
				</template>
				<ElInput
					maxlength="100"
					:disabled="config.dhcp"
					:placeholder="data.isStart ? '等待动态分配IP...' : '例如: 10.126.126.1'"
					v-model="config.ipv4"></ElInput>
			</ElFormItem>
		</div>
		<div class="flex items-start gap-[0_30px]">
			<div>
				<div>
					<ElButton
						:type="!data.isStart ? 'primary' : 'danger'"
						:disabled="data.startLoading || !data.coreVersion || data.update"
						@click="handleConnection"
						size="default">
						{{ !data.isStart ? "开始联机" : "停止联机" }}
					</ElButton>
				</div>
				<div class="mt-[6px]">
					<ElButton
						type="info"
						@click="handleShowDialog"
						size="default">
						日志信息
					</ElButton>
				</div>
			</div>
			<div>
				<ElCheckbox
					v-model="config.disbleP2p"
					size="small">
					禁用p2p
				</ElCheckbox>
				<ElCheckbox
					v-model="config.disableIpv6"
					size="small">
					禁用ipv6
				</ElCheckbox>
				<ElCheckbox
					v-model="config.disbleListenner"
					size="small">
					禁用端口监听
				</ElCheckbox>
				<ElLink
					class="!text-[11px] pb-[2px] ml-[15px]"
					type="info"
					:underline="false"
					@click="open('https://github.com/EasyTier/EasyTier/releases')">
					easytier发布页
				</ElLink>
				<div>
					<ElLink
						class="!text-[11px]"
						type="danger"
						:underline="false"
						@click="open('https://github.com/dechamps/WinIPBroadcast/releases/tag/winipbroadcast-1.6')">
						找不到房间？建议安装WinIPBroadcast
					</ElLink>
				</div>
			</div>
		</div>
	</ElForm>
	<ElDialog
		title="日志信息"
		top="0"
		v-model="data.visible"
		width="100%"
		class="!h-full !m-0">
		<ElInput
			type="textarea"
			rows="10"
			v-model="data.log"
			resize="none"
			readonly />
	</ElDialog>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { open } from "@tauri-apps/plugin-shell";
	import { QuestionFilled, Delete } from "@element-plus/icons-vue";
	import { reactive, onBeforeUnmount, onMounted } from "vue";
	import { useTray } from "~/composables/tray";
	import useMainStore from "@/stores/index";
	import { ElMessage } from "element-plus";

	useTray(true);
	const mainStore = useMainStore();
	const config = mainStore.config;
	const protocols = ["tcp", "udp", "ws", "wss", "wg"];
	const data = reactive({
		visible: false,
		log: "",
		update: false,
		releaseList: [],
		coreVersion: "",
		isSuccessGetIp: false,
		startLoading: false,
		isStart: false,
	});

	const handleDeleteServerUrl = (url: string) => {
		const newBasePeers = [...mainStore.basePeers];
		const idx = newBasePeers.indexOf(url);
		if (idx >= 0) {
			if (config.serverUrl === url) {
				config.serverUrl = "";
			}
			newBasePeers.splice(idx, 1);
		}
		mainStore.basePeers = [...new Set([...newBasePeers])];
	};

	const handleServerUrlChange = () => {
		mainStore.basePeers = [...new Set([config.serverUrl, ...mainStore.basePeers])];
	};

	const listenObj: { [key: string]: any } = {
		unListenOutPut: null,
		unListenThreadId: null,
		unListenReleaseList: null,
		thread_id: null,
		async listenOutput() {
			const unListen = await listen("command-output", (event) => {
				data.isStart = true;
				if (event.payload) {
					data.startLoading = false;
					let ipv4 = /new: Some\((\d+\.\d+\.\d+\.\d+)\/.*\)/g.exec(event.payload as string)?.[1];
					if (ipv4) {
						data.isSuccessGetIp = true;
						config.ipv4 = ipv4;
					}
				}
				data.log += (event.payload as string) + "\n";
			});
			this.unListenOutPut = unListen;
		},
		async listenThreadId() {
			const unListen = await listen("thread-id", (event) => {
				if (event.payload) {
					this.thread_id = event.payload;
				}
			});
			this.unListenThreadId = unListen;
		},

		async releaseListListener() {
			const unListen = await listen("release-list", (event) => {
				if (event.payload) {
					console.log(event.payload);
				}
			});
			this.unListenReleaseList = unListen;
		},
	};

	const unListenAll = async () => {
		listenObj.unListenOutPut && (await listenObj.unListenOutPut());
		await invoke("stop_command", { child_id: listenObj.thread_id || 0 });
		listenObj.thread_id = null;
	};

	const getCoreVersion = async (isClick = false) => {
		const coreVersion = await invoke("get_core_version");
		if (!coreVersion && isClick) {
			ElMessage.error("获取失败");
		}
		data.coreVersion = (coreVersion as string).replace("easytier-core ", "");
	};

	const checkUpdate = async () => {
		await getReleaseList();
		const latestVersionFileName = data.releaseList?.[0]?.[0]?.[1] as string;
		if (latestVersionFileName) {
			console.log(latestVersionFileName, /\-v(\d+\.\d+\.\d+)/g.exec(latestVersionFileName));
			const latestVersion = /\-v(\d+\.\d+\.\d+)/g.exec(latestVersionFileName)?.[1];
			const currentVersion = /(\d+\.\d+\.\d+)/g.exec(data.coreVersion || "")?.[1];
			if (latestVersion && currentVersion != latestVersion) {
				console.log({ currentVersion, latestVersion });
				ElMessage.success(`更新 -> ${latestVersion}`);
				const downloadUrl = data.releaseList?.[0]?.[0]?.[2];
				return [true, downloadUrl, latestVersionFileName];
			} else if (currentVersion === latestVersion) {
				ElMessage.success(`当前是最新版`);
				return [false, null, null];
			} else {
				ElMessage.error(`获取版本失败`);
				return [false, null, null];
			}
		}
		return [false, null, null];
	};

	const handleUpdateCore = async () => {
		// easytier-windows-x86_64-v2.0.3.zip
		data.update = true;
		await getCoreVersion();
		const [isNeedUpdate, downloadUrl, latestVersionFileName] = await checkUpdate();
		if (isNeedUpdate) {
			await reset();
			console.log(downloadUrl);
			await invoke("download_easytier_zip", { download_url: downloadUrl, file_name: latestVersionFileName });
		}
		await getCoreVersion();
		data.update = false;
	};

	const getReleaseList = async () => {
		const list = await invoke("fetch_easytier_list");
		data.releaseList = list as never[];
	};

	onMounted(async () => {
		// await handleUpdateCore();  //默认不自动更新
		await getCoreVersion();
		await listenObj.releaseListListener();
		await listenObj.listenThreadId();
	});

	onBeforeUnmount(() => {
		unListenAll();
		listenObj.unListenReleaseList && listenObj.unListenReleaseList();
	});

	const getArgs = () => {
		const args = [];
		if (config.dhcp) {
			args.push("-d");
		}
		if (config.hostname) {
			args.push("--hostname", config.hostname);
		}
		if (config.networkName) {
			args.push("--network-name", config.networkName);
		}
		if (config.networkPassword) {
			args.push("--network-secret", config.networkPassword);
		}
		if (config.ipv4) {
			args.push("--ipv4", config.ipv4);
		}
		if (config.serverUrl) {
			const formatUrl = config.serverUrl.replace(/\\/g, "/");
			args.push("--peers", ...config.protocol.map((protocol) => `${protocol}://${formatUrl}`));
		}
		if (config.disbleP2p) {
			args.push("--disable-p2p");
		}
		if (config.disableIpv6) {
			args.push("--disable-ipv6");
		}
		if (config.disbleListenner) {
			args.push("--no-listener");
		}
		return args;
	};

	const reset = async () => {
		data.isStart = false;
		data.isSuccessGetIp = false;
		config.ipv4 = "";
		await unListenAll();
	};

	const handleConnection = async () => {
		if (data.isStart) {
			await reset();
		} else {
			data.startLoading = true;
			await unListenAll();
			await listenObj.listenOutput();
			const args = getArgs();
			await invoke("run_command", {
				args,
			});
		}
	};

	const handleShowDialog = async () => {
		data.visible = true;
	};
</script>
