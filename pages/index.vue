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
						{{ data.isSuccessGetIp ? "联机成功" : data.isStart && !data.isSuccessGetIp ? "联机中" : "未联机" }}
					</ElTag>
					<ElButton
						v-if="!data.coreVersion"
						@click="getCoreVersion(true)">
						获取工具版本
					</ElButton>
					<ElTag
						v-else
						type="info">
						core-{{ data.coreVersion }}
					</ElTag>
					<ElButton
						:disabled="data.isStart"
						:loading="data.update"
						type="warning"
						@click="handleUpdateCore"
						size="small">
						{{ data.coreVersion ? "更新" : "下载" }}
					</ElButton>
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
							@click.stop
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
							type="danger"></ElButton>
					</div>
				</ElOption>
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
			<div class="w-[95px]">
				<div>
					<ElButton
						:type="!data.isStart ? 'primary' : 'danger'"
						:disabled="data.startLoading || !data.coreVersion || data.update"
						@click="handleConnection"
						size="default">
						{{ !data.isStart ? "启动联机" : "停止联机" }}
					</ElButton>
				</div>
				<div class="mt-[6px] pl-[2px]">
					<!-- <ElButtonGroup> -->
					<ElTooltip
						placement="left"
						content="日志">
						<ElButton
							:type="!data.logVisible ? 'info' : 'warning'"
							@click="handleShowLogDialog"
							:icon="List"
							size="small"
							plain></ElButton>
					</ElTooltip>
					<ElTooltip
						placement="left"
						content="成员">
						<ElButton
							@click="handleShowMemberDialog"
							:icon="UserFilled"
							plain
							type="success"
							size="small"></ElButton>
					</ElTooltip>
					<!-- </ElButtonGroup> -->
				</div>
			</div>
			<div>
				<ElCheckbox
					v-model="config.disbleP2p"
					size="small">
					强制中转
				</ElCheckbox>
				<!-- <ElCheckbox
					v-model="config.disableIpv6"
					size="small"
				>
					禁用ipv6
				</ElCheckbox> -->
				<ElCheckbox
					@change="handleAutoStart"
					:model-value="config.autoStart"
					size="small">
					开机自启
				</ElCheckbox>
				<!-- <ElCheckbox
					v-model="config.disbleListenner"
					size="small"
				>
					禁用端口监听
				</ElCheckbox> -->
				<div>
					<ElButton
						@click="handleShowCidrDialog"
						:icon="Share"
						>子网代理</ElButton
					>
					<ElButton
						@click="handleShowAdvanceDialog"
						:icon="Setting"
						>高级选项</ElButton
					>
				</div>
				<div class="flex items-center gap-[0_5px]">
					<div>
						<ElLink
							class="!text-[11px]"
							type="info"
							:underline="false"
							@click="open('https://github.com/dechamps/WinIPBroadcast/releases/tag/winipbroadcast-1.6')">
							WinIPBroadcast
							<ElTooltip content="找不到游戏房间时，就开启它后再刷新尝试(默认开启)">
								<ElIcon class="ml-[3px]"><QuestionFilled /></ElIcon>
							</ElTooltip>
						</ElLink>
						<ElSwitch
							inline-prompt
							:model-value="data.winipBcStart"
							@change="handleWinipBcStart"
							size="small"
							label="WinIPBroadcast"
							active-text="开启"
							inactive-text="关闭"></ElSwitch>
					</div>
					<ElLink
						class="!text-[11px] pb-[2px] ml-[15px]"
						type="info"
						:underline="false"
						@click="open('https://github.com/EasyTier/EasytierGame')">
						主页
					</ElLink>
				</div>
			</div>
		</div>
	</ElForm>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { open, Command } from "@tauri-apps/plugin-shell";
	import { QuestionFilled, Delete, List, UserFilled, Setting, Share } from "@element-plus/icons-vue";
	import { reactive, onBeforeUnmount, onMounted } from "vue";
	import { useTray, setTrayRunState } from "~/composables/tray";
	import useMainStore from "@/stores/index";
	import { ElMessage } from "element-plus";
	import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
	import { getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
	import etWindows from "@/composables/windows";
	import * as tauriAutoStart from "@tauri-apps/plugin-autostart";

	let is_close = false;

	const tray = await useTray(true, async () => {
		is_close = true;
		await invoke("stop_command", { child_id: listenObj.thread_id || 0 });
		await invoke("stop_command", { child_id: data.winipBcPid || 0 });
	});

	const mainStore = useMainStore();
	const config = mainStore.config;
	// console.log(config);
	const protocols = ["tcp", "udp", "ws", "wss", "wg"];
	const data = reactive({
		logVisible: false,
		cidrVisible: false,
		advanceVisible: false,
		winipBcPid: 0, //WinIPBroadcast进程id
		winipBcStart: false,
		memberVisible: false,
		log: "",
		update: false,
		releaseList: [],
		coreVersion: "",
		isSuccessGetIp: false,
		startLoading: false,
		isStart: false,
	});

	const closePrevent = async () => {
		const appWindow = getCurrentWindow();
		if (appWindow.label == "main") {
			appWindow.onCloseRequested(async (event) => {
				console.log(appWindow.label);
				if (!is_close) {
					event.preventDefault();
					appWindow.hide();
				}
			});
		}
	};

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
		unListenConfigStart: null,
		thread_id: null,
		async listenOutput() {
			const appWindow = getCurrentWindow();
			const unListen = await listen("command-output", async (event) => {
				data.isStart = true;
				if (event.payload) {
					data.startLoading = false;
					let ipv4 = /new: Some\((\d+\.\d+\.\d+\.\d+)\/.*\)/g.exec(event.payload as string)?.[1];
					if (ipv4) {
						data.isSuccessGetIp = true;
						await setTrayRunState(tray, true);
						config.ipv4 = ipv4;
					}
				}
				appWindow.emitTo("log", "logs", data.log);
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
		async listenConfigStart() {
			const unListen = await listen("config", (event) => {
				// console.log("config", event.payload);
				const ipv4 = config.ipv4;
				mainStore.$patch(event.payload);
				config.ipv4 = ipv4;
			});
			this.unListenConfigStart = unListen;
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
		} else {
			ElMessage.error(`获取版本失败`);
		}
		return [false, null, null];
	};

	const handleUpdateCore = async () => {
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

	const getWinIpBroadcastPid = async () => {
		const pid = await invoke("search_pid_by_pname", { target_process_name: "WinIPBroadcast" });
		data.winipBcPid = (pid as number) || 0;
		if (data.winipBcPid && data.winipBcPid > 0) {
			data.winipBcStart = true;
		} else {
			data.winipBcStart = false;
		}
	};

	const handleWinipBcStart = async () => {
		if (!data.winipBcStart) {
			try {
				await invoke("stop_command", { child_id: data.winipBcPid || 0 });
				const child = await Command.create("WinIPBroadcast", ["run"]).spawn();
				data.winipBcPid = child.pid || 0;
				if (data.winipBcPid) {
					data.winipBcStart = true;
				} else {
					ElMessage.error(`启动失败`);
				}
			} catch (err) {
				ElMessage.error(`启动失败`);
				console.log(err);
			}
		} else {
			await invoke("stop_command", { child_id: data.winipBcPid || 0 });
			await getWinIpBroadcastPid();
		}
	};

	const initStartWinIpBroadcast = async () => {
		await getWinIpBroadcastPid();
		if (!data.winipBcStart) {
			await handleWinipBcStart();
		}
	};

	const handleAutoStart = async () => {
		let is_enable = await tauriAutoStart.isEnabled();
		if (!config.autoStart && !is_enable) {
			try {
				await tauriAutoStart.enable();
			} catch (err) {
				ElMessage.error(`开机自启失败`);
			}
		} else {
			try {
				await tauriAutoStart.disable();
			} catch (err) {
				// ElMessage.error(`取消自启失败`);
			}
		}
		is_enable = await tauriAutoStart.isEnabled();
		if (!is_enable) {
			config.autoStart = false;
		} else {
			config.autoStart = true;
		}
	};

	const initAutoStart = async () => {
		try {
			const is_enable = await tauriAutoStart.isEnabled();
			if (!is_enable) {
				config.autoStart = false;
			} else {
				config.autoStart = true;
			}
		} catch (err) {
			config.autoStart = false;
		}
	};

	let logsTimer: NodeJS.Timeout | null = null;

	onMounted(async () => {
		// await handleUpdateCore();  //默认不自动更新
		await initAutoStart();
		await initStartWinIpBroadcast();
		await getCoreVersion();
		await listenObj.listenThreadId();
		await listenObj.listenConfigStart();
		closePrevent();
	});

	onBeforeUnmount(() => {
		unListenAll();
		listenObj.unListenReleaseList && listenObj.unListenReleaseList();
		listenObj.unListenConfigStart && listenObj.unListenConfigStart();
		logsTimer && clearInterval(logsTimer);
	});

	const getArgs = () => {
		// console.log(config.proxyNetworks);
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
		if (mainStore.cidrEnable && config.proxyNetworks) {
			// console.log(config.proxyNetworks);
			const reg = /\d+\.\d+\.\d+\.\d+\/\d+/g;
			const formatProxyNetworks = config.proxyNetworks
				.split("\n")
				.map((item) => item.trim())
				.filter((item) => item && reg.test(item));
			args.push("--proxy-networks", ...formatProxyNetworks);
			config.proxyNetworks = formatProxyNetworks.join("\n");
		}
		if (config.disableEncryption) {
			args.push("--disable-encryption");
		}
		if (config.multiThread) {
			args.push("--multi-thread");
		}
		if (config.enablExitNode) {
			args.push("--enable-exit-node");
		}
		if (config.noTun) {
			args.push("--no-tun");
		}
		if (config.latencyfirst) {
			args.push("--latency-first");
		}
		if (config.useSmoltcp) {
			args.push("--use-smoltcp");
		}
		if (config.disableUdpHolePunching) {
			args.push("--disable-udp-hole-punching");
		}
		if (config.relayAllPeerrpc) {
			args.push("--relay-all-peer-rpc");
		}
		return args;
	};

	const reset = async () => {
		data.isStart = false;
		data.isSuccessGetIp = false;
		if (config.dhcp) {
			config.ipv4 = "";
		}
		const memberDialog = await getAllWebviewWindows();
		const memberDialogs = memberDialog.filter((item) => item.label === "member");
		if (memberDialogs && memberDialogs.length > 0) {
			data.memberVisible = false;
			for (const memberDialog of memberDialogs) {
				const isVisible = await memberDialog.isVisible();
				if (isVisible) {
					await memberDialog.destroy();
				}
			}
		}
		await setTrayRunState(tray, false);
		await unListenAll();
	};

	const handleConnection = async () => {
		if (data.isStart) {
			await reset();
		} else {
			data.log = ""; //清空日志
			data.startLoading = true;
			await unListenAll();
			await listenObj.listenOutput();
			const args = getArgs();
			await invoke("run_command", {
				args,
			});
		}
	};

	const handleShowMemberDialog = async () => {
		if (!data.isStart) {
			return ElMessage.warning("请先开始联机");
		}
		if (!mainStore.config.ipv4) {
			return ElMessage.warning("请等待获取IP");
		}

		await etWindows(
			"member",
			{
				title: "成员列表",
				width: 470,
				height: 380,
				url: "#/member",
			},
			() => {
				data.memberVisible = true;
			},
			() => {
				data.memberVisible = false;
			}
		);
	};

	const handleShowLogDialog = async () => {
		await etWindows(
			"log",
			{
				title: "日志",
				width: 600,
				height: 380,
				resizable: false,
				url: "#/log",
			},
			(_, appWindow) => {
				data.logVisible = true;
				logsTimer && clearInterval(logsTimer);
				logsTimer = setInterval(() => {
					appWindow.emitTo("log", "logs", data.log);
				}, 3000);
			},
			() => {
				data.logVisible = false;
			}
		);
	};

	const handleShowCidrDialog = async () => {
		await etWindows(
			"cidr",
			{
				title: "子网代理",
				width: 600,
				height: 380,
				resizable: false,
				url: "#/cidr",
			},
			(_, appWindow) => {
				data.cidrVisible = true;
			},
			() => {
				data.cidrVisible = false;
			}
		);
	};

	const handleShowAdvanceDialog = async () => {
		await etWindows(
			"advance",
			{
				title: "高级选项",
				width: 600,
				height: 380,
				resizable: false,
				url: "#/advance",
			},
			(_, appWindow) => {
				data.advanceVisible = true;
			},
			() => {
				data.advanceVisible = false;
			}
		);
	};
</script>
