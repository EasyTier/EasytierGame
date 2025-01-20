<template>
	<ElForm
		size="small"
		label-position="top"
		:model="config"
	>
		<ElFormItem
			label="服务器"
			prop="serverUrl"
			class="full-label"
		>
			<template #label>
				<div class="flex flex-nowrap items-center gap-[0_5px]">
					<div class="flex flex-nowrap items-center gap-[5px]">
						<div>服务器</div>
						<ElTooltip content="服务器是什么协议，中转就是什么协议">
							<ElIcon><QuestionFilled /></ElIcon>
						</ElTooltip>
					</div>
					<div class="h-[fit-content]">-</div>
					<ElTag
						effect="dark"
						:type="data.isSuccessGetIp ? 'success' : 'info'"
					>
						{{ data.isSuccessGetIp ? "联机成功" : data.isStart && !data.isSuccessGetIp ? "联机中" : "未联机" }}
					</ElTag>
					<ElButton
						v-if="!data.coreVersion"
						@click="getCoreVersion(true)"
					>
						获取内核版本
					</ElButton>
					<div
						v-else
						class="flex-1 truncate !leading-[1em]"
					>
						<ElTooltip :content="`内核版本:${data.coreVersion}(不是软件的版本)`">
							<ElTag
								size="small"
								type="info"
							>
								{{ data.coreVersion }}
							</ElTag>
						</ElTooltip>
					</div>
					<ElTooltip content="请先停止自建服务和联机后再使用，否则内核被占用的情况下，无法进行内核更换">
						<ElButton
							class="ml-auto"
							:disabled="data.isStart || listenObj.server_thread_id.value"
							@click="handleCoreManagement"
							:loading="data.update"
							type="primary"
							size="small"
						>
							内核管理
						</ElButton>
					</ElTooltip>
				</div>
			</template>
			<ElSelect
				allow-create
				filterable
				placeholder="请选择服务器地址"
				default-first-option
				v-model="config.serverUrl"
				no-data-text="无服务器地址"
				@change="handleServerUrlChange"
			>
				<template #prefix>
					<div :class="config.protocol && config.protocol.length > 1 ? 'w-[120px]' : 'w-[80px]'">
						<ElSelect
							placeholder="协议"
							multiple
							collapse-tags
							@click.stop
							v-model="config.protocol"
							@change="handleServerUrlChange"
						>
							<ElOption
								v-for="item in protocols"
								:key="item"
								:label="item"
								:value="item"
							></ElOption>
						</ElSelect>
					</div>
				</template>
				<template #footer>
					<div class="text-center">
						<ElLink
							type="primary"
							size="small"
							:underline="false"
							@click.stop="open(publicPeersLink)"
						>
							其他公共服务器
						</ElLink>
					</div>
				</template>
				<ElOption
					v-for="item in mainStore.basePeers"
					:key="item"
					:label="item"
					:value="item"
				>
					<div class="flex max-w-[calc(100vw-62px)] flex-nowrap items-center gap-[20px] overflow-hidden">
						<ElTooltip
							v-if="item && item.length > 26"
							placement="top"
							:content="item || '-'"
						>
							<p class="truncate">{{ item }}</p>
						</ElTooltip>
						<p
							v-else
							class="truncate"
						>
							{{ item }}
						</p>
						<div class="ml-auto flex-shrink-0">
							<ElButton
								@click.stop="copyText(item)"
								circle
								size="small"
								title="复制"
								:icon="CopyDocument"
							></ElButton>

							<ElButton
								@click.stop="handleDeleteServerUrl(item)"
								circle
								size="small"
								:icon="Delete"
								title="删除"
								type="danger"
							></ElButton>
						</div>
					</div>
				</ElOption>
			</ElSelect>
		</ElFormItem>
		<div class="flex flex-wrap items-center gap-[0_10px]">
			<div class="flex-1">
				<ElFormItem label="房间名">
					<template #label>
						<div class="flex items-center">
							房间名
							<!-- <ElTooltip content="对应命令行参数 --network-name">
								<ElIcon><QuestionFilled /></ElIcon>
							</ElTooltip> -->
						</div>
					</template>
					<ElInput
						maxlength="100"
						placeholder="请输入房间名"
						v-model="config.networkName"
					></ElInput>
				</ElFormItem>
			</div>
			<div class="flex-1">
				<ElFormItem label="房间密码">
					<template #label>
						<div class="flex items-center">
							房间密码
							<!-- <ElTooltip content="对应命令行参数 --network-secret">
								<ElIcon><QuestionFilled /></ElIcon>
							</ElTooltip> -->
						</div>
					</template>
					<ElInput
						show-password
						maxlength="100"
						placeholder="请输入房间密码"
						v-model="config.networkPassword"
						type="password"
					></ElInput>
				</ElFormItem>
			</div>
		</div>
		<div class="flex gap-[0_10px]">
			<ElFormItem label="成员名">
				<template #label>
					<div class="flex items-center">
						成员名
						<!-- <ElTooltip content="对应命令行参数 --hostname">
							<ElIcon><QuestionFilled /></ElIcon>
						</ElTooltip> -->
					</div>
				</template>
				<ElInput
					maxlength="100"
					placeholder="例如: Player1"
					v-model="config.hostname"
				></ElInput>
			</ElFormItem>
			<ElFormItem
				class="w-[70%]"
				label="局域网IP"
			>
				<template #label>
					<div class="flex h-[20px] items-center gap-[3px]">
						虚拟网IP
						<ElButton
							@click.stop="handleCopyIp"
							type="primary"
							text
							size="small"
							title="复制IP"
							:icon="CopyDocument"
						></ElButton>
						<ElSwitch
							v-model="config.dhcp"
							inline-prompt
							inactive-text="固定IP"
							active-text="动态获取"
							size="small"
						></ElSwitch>
						<!-- <ElTooltip content="对应命令行参数 --ipv4">
							<ElIcon><QuestionFilled /></ElIcon>
						</ElTooltip> -->
					</div>
				</template>
				<ElInput
					maxlength="100"
					:readonly="config.dhcp"
					:placeholder="data.isStart && config.dhcp ? '等待动态分配IP...' : '例如: 10.126.126.1'"
					v-model="config.ipv4"
				>
					<template #prefix>
						<ElTooltip
							class="!text-[10px]"
							placement="top-end"
							:content="config.dhcp ? '动态获取无法手动填写' : '固定IP可以手动填写'"
						>
							<ElTag
								size="small"
								:type="config.dhcp ? 'info' : 'success'"
							>
								{{ config.dhcp ? "只读" : "可填" }}
							</ElTag>
						</ElTooltip>
					</template>
				</ElInput>
			</ElFormItem>
		</div>
	</ElForm>
	<div class="mt-auto flex items-start">
		<div>
			<div class="pt-[4px]">
				<ElDropdown
					@command="handleStartCommand"
					split-button
					trigger="click"
					size="default"
					placement="right-end"
					:type="!data.isStart ? 'primary' : 'danger'"
					:disabled="data.startLoading || !data.coreVersion || data.update"
					@click="handleConnection"
				>
					{{ !data.isStart ? "启动联机" : "停止联机" }}
					<template #dropdown>
						<ElDropdownMenu>
							<ElDropdownItem
								command="import_config"
								:icon="Link"
							>
								导入联机配置
							</ElDropdownItem>
							<ElDropdownItem
								command="share_config"
								:icon="Share"
							>
								分享联机配置
							</ElDropdownItem>
							<ElDropdownItem disabled>
								<ElDivider class="!m-0 !h-[2px]" />
							</ElDropdownItem>
							<ElDropdownItem
								:icon="SetUp"
								command="create_server"
							>
								自建服务器
								<ElTag
									size="small"
									class="ml-[5px]"
									:type="listenObj.server_thread_id.value ? 'success' : 'info'"
								>
									{{ listenObj.server_thread_id.value ? "运行中" : "未运行" }}
								</ElTag>
							</ElDropdownItem>
							<ElDropdownItem
								:icon="Tools"
								command="toml"
								:disabled="data.isStart"
							>
								使用外部配置文件
							</ElDropdownItem>
							<ElDropdownItem disabled>
								<ElDivider class="!m-0 !h-[2px]" />
							</ElDropdownItem>
							<ElDropdownItem
								command="config_admin"
								:icon="Platform"
							>
								房间配置管理
							</ElDropdownItem>
							<ElDropdownItem
								command="save_config_admin"
								:icon="CirclePlusFilled"
							>
								保存当前房间配置
							</ElDropdownItem>
						</ElDropdownMenu>
					</template>
				</ElDropdown>
			</div>
			<div class="mt-[10px] pl-[2px]">
				<ElTooltip
					placement="left"
					content="日志"
				>
					<ElButton
						:type="!data.logVisible ? 'info' : 'warning'"
						@click="handleShowLogDialog"
						:icon="List"
						size="small"
						plain
					></ElButton>
				</ElTooltip>
				<!-- <ElTooltip
					placement="left"
					content="房间信息"
				> -->
				<ElButton
					class="!ml-[7px]"
					@click="handleShowMemberDialog"
					plain
					type="success"
					size="small"
				>
					房间信息
				</ElButton>
				<!-- </ElTooltip> -->
			</div>
		</div>
		<div class="ml-auto">
			<ElCheckbox
				v-model="config.disbleP2p"
				size="small"
			>
				强制中转
			</ElCheckbox>
			<ElTooltip
				placement="top-start"
				content="自启后隐藏于托盘，不显示界面"
			>
				<ElCheckbox
					@change="handleAutoStartByTask"
					:model-value="config.autoStart"
					size="small"
				>
					开机自启
				</ElCheckbox>
			</ElTooltip>
			<div>
				<ElButton
					@click="handleShowCidrDialog"
					:icon="Share"
					size="small"
				>
					子网代理
				</ElButton>
				<ElButton
					@click="handleShowAdvanceDialog"
					:icon="Setting"
					size="small"
				>
					高级选项
				</ElButton>
			</div>
			<div class="flex items-center gap-[0_5px]">
				<div>
					<ElButton
						plain
						type="primary"
						size="small"
						:icon="MagicStick"
						@click="handleShowToolDialog"
					>
						增强工具
					</ElButton>
				</div>

				<ElBadge
					badge-class="!text-[9px] cursor-pointer"
					:hidden="!data.hasNewVersion"
					:offset="[6, 7]"
					value="N"
				>
					<!-- <ElTooltip :disabled="!data.hasNewVersion" content="有新版发布了!"> -->
					<ElLink
						class="ml-[8px] truncate pb-[2px] !text-[9px]"
						type="info"
						:underline="false"
						@click="open('https://github.com/EasyTier/EasytierGame')"
					>
						EasytierGame主页
					</ElLink>
					<!-- </ElTooltip> -->
				</ElBadge>
			</div>
		</div>
	</div>
	<ElDialog
		width="95%"
		top="10px"
		append-to-body
		:z-index="10"
		class="!mb-0"
		v-model="coreManagementData.visible"
		:close-on-press-escape="false"
		title="内核管理"
	>
		<div>
			<ElText>当前版本: {{ data.coreVersion || "-" }}</ElText>
		</div>
		<div class="mt-[10px] pb-[5px]">
			<ElText class="!mr-[10px]">选择一个内核版本安装</ElText>
			<ElButton
				:loading="coreManagementData.loading"
				@click="getReleaseList"
				size="small"
			>
				刷新
			</ElButton>
			<ElTooltip
				placement="top"
				content="打开内核缓存目录"
			>
				<ElButton
					:icon="Folder"
					size="small"
					@click="handleOpenCache"
				></ElButton>
			</ElTooltip>
		</div>
		<ElSelect
			placeholder="请选择内核版本"
			no-data-text="正在获取中..."
			popper-class="!h-[120px]"
			v-model="coreManagementData.data"
		>
			<ElOption
				v-for="(release, idx) in data.releaseList"
				:key="`${idx}-ray`"
				:label="release[0]"
				:value="`${release[2]}<>${release[1]}`"
			>
				{{ release ? release[0] : "" }}
			</ElOption>
		</ElSelect>
		<div class="mt-[10px] pb-[5px]">
			<ElTooltip content="不使用出国软件也能告诉下载github Release包的地址，可自行搜索替换使用">
				<ElText>github下载加速地址</ElText>
			</ElTooltip>
		</div>
		<ElInput
			v-model="mainStore.githubFastUrl"
			placeholder="请输入github加速地址"
		></ElInput>
		<template #footer>
			<div class="text-right">
				<ElButton
					size="small"
					:loading="data.update"
					@click="handleInstallCore"
					type="primary"
				>
					安装选中内核
				</ElButton>
				<ElButton
					size="small"
					type="warning"
					@click="addQQGroup"
				>
					加群获取
				</ElButton>
				<ElButton
					size="small"
					@click="coreManagementData.visible = false"
				>
					取消
				</ElButton>
			</div>
		</template>
	</ElDialog>
	<ElDialog
		width="95%"
		top="10px"
		append-to-body
		:z-index="10"
		class="!mb-0"
		v-model="importConfigData.visible"
		:close-on-press-escape="false"
		title="导入分享"
	>
		<ElInput
			type="textarea"
			:rows="6"
			placeholder="请粘贴分享的配置"
			v-model="importConfigData.data"
		></ElInput>
		<template #footer>
			<div>
				<el-text type="danger">导入成功后，您当前的部分配置将被替换</el-text>
			</div>
			<div class="text-right">
				<ElButton
					size="small"
					@click="handleStartImport"
					type="primary"
				>
					导入
				</ElButton>
			</div>
		</template>
	</ElDialog>
	<ElDialog
		width="95%"
		top="30px"
		append-to-body
		:z-index="10"
		class="!mb-0"
		v-model="configStart.visible"
		:close-on-press-escape="false"
		title="配置文件启动"
	>
		<div class="flex items-center gap-[0_4px]">
			<span>启用</span>
			<ElSwitch v-model="mainStore.configStartEnable"></ElSwitch>
			<ElTooltip content="启用后将完全使用选中的配置文件作为联机配置，其余界面配置不会生效">
				<ElIcon class="ml-[3px]"><QuestionFilled /></ElIcon>
			</ElTooltip>
			<ElButton
				@click="openConfigDir"
				size="small"
			>
				打开存储目录
			</ElButton>
			<ElButton
				@click="handleStartCommand('toml')"
				type="primary"
				:icon="RefreshRight"
				size="small"
			>
				刷新
			</ElButton>
		</div>
		<div class="mt-[5px]">
			<ElSelect
				v-model="mainStore.configPath"
				no-data-text="目录没有配置文件"
				placeholder="选择配置文件"
				filterable
			>
				<ElOption
					v-for="item in configStart.list"
					:key="item.path"
					:value="item.path"
					:label="item.name"
				></ElOption>
			</ElSelect>
		</div>
		<template #footer>
			<div class="text-right">
				<ElButton
					size="small"
					@click="configStart.visible = false"
					type="danger"
				>
					关闭
				</ElButton>
			</div>
		</template>
	</ElDialog>
	<ElDialog
		width="95%"
		top="30px"
		append-to-body
		:z-index="10"
		class="!mb-0"
		v-model="configAdminData.visible"
		:close-on-press-escape="false"
		title="房间配置管理"
	>
		<div class="flex items-center gap-[0_4px]">
			<ElButton
				@click="openConfigAdminDir"
				size="small"
			>
				打开存储目录
			</ElButton>
			<ElButton
				@click="handleStartCommand('config_admin')"
				type="primary"
				:icon="RefreshRight"
				size="small"
			>
				刷新
			</ElButton>
		</div>
		<div class="mt-[5px]">
			<ElSelect
				v-model="configAdminData.fileName"
				no-data-text="目录没有配置文件"
				placeholder="选择配置文件"
				filterable
			>
				<ElOption
					v-for="item in configAdminData.list"
					:key="item.path"
					:value="item.path"
					:label="item.name"
				>
				</ElOption>
			</ElSelect>
		</div>
		<template #footer>
			<div class="text-right">
				<div class="mb-[5px]">
					<ElAlert show-icon type="warning" title="打开目录删除文件即可删除配置"></ElAlert>
				</div>
				<ElButton
					size="small"
					@click="handleExchangeAdminConfig"
					type="primary"
				>
					切换选中配置
				</ElButton>
				<ElButton
					size="small"
					@click="configAdminData.visible = false"
					type="danger"
				>
					关闭
				</ElButton>
			</div>
		</template>
	</ElDialog>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { open, Command } from "@tauri-apps/plugin-shell";
	import {
		QuestionFilled,
		Delete,
		List,
		CirclePlusFilled,
		Setting,
		Share,
		RefreshRight,
		Link,
		Tools,
		MagicStick,
		SetUp,
		Folder,
		CopyDocument,
		Platform
	} from "@element-plus/icons-vue";
	import { reactive, onBeforeUnmount, onMounted, ref, toRaw } from "vue";
	import { useTray, setTrayRunState, setTrayTooltip, checkNewVersion } from "~/composables/tray";
	import { getMatches } from "@tauri-apps/plugin-cli";
	import { initStartWinIpBroadcast } from "~/composables/netcard";
	import useMainStore from "@/stores/index";
	import { ElMessage, ElMessageBox, ElTooltip } from "element-plus";
	import { getCurrentWindow, type Window } from "@tauri-apps/api/window";
	import { getAllWebviewWindows, WebviewWindow } from "@tauri-apps/api/webviewWindow";
	import etWindows from "@/composables/windows";
	import { resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
	import { readDir, exists, mkdir, BaseDirectory, readTextFile, readFile, writeFile } from "@tauri-apps/plugin-fs";
	import { updateConfigJson } from "~/composables/configJson";
	import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
	import { sortedUniq, uniq } from "lodash-es";
	import { bounce, addQQGroup, supportProtocols, preventSleep, stopPreventSleep, ATJ, copyText, isValidWindowsFileName } from "~/utils";
	import { ElConfirmDanger, ElConfirmPrimary } from "~/utils/element";
	import { getServerArgs } from "@/composables/server";

	let is_close = false;
	const publicPeersLink = import.meta.env.VITE_PUBLIC_PEERS_URL;
	const tray = await useTray(
		true,
		async () => {
			is_close = true;
			await invoke("stop_command", { child_id: listenObj.thread_id || 0 });
			await invoke("stop_command", { child_id: data.winipBcPid || 0 });
			await invoke("stop_command", { child_id: listenObj.server_thread_id.value || 0 });
			await stopPreventSleep(); //关闭防休眠
		},
		async () => {
			await handleConnection();
			return data.isStart;
		}
	);

	const mainStore = useMainStore();
	const config = mainStore.config;
	// console.error(config);
	const protocols = supportProtocols();
	const data = reactive({
		hasNewVersion: false, //easytierGame有没有新版
		logVisible: false,
		cidrVisible: false,
		advanceVisible: false,
		toolVisible: false,
		serverVisible: false,
		winipBcPid: 0, //WinIPBroadcast进程id
		winipBcStart: false,
		memberVisible: false,
		log: "",
		serverLog: "", //服务端日志
		update: false,
		releaseList: [[]],
		coreVersion: "-",
		isSuccessGetIp: false,
		startLoading: false,
		isStart: false,
		connectionSuccess: false,
		configJsonSeverUrl: "" // 本地保存一次，用于回填config.json
	});

	const configStart = reactive<{ list: Array<{ path: string; name: string }>; [key: string]: any }>({
		visible: false,
		loading: false,
		list: [] //配置文件列表
	});

	const configAdminData = reactive<{ fileName: string; list: Array<{ path: string; name: string }>; [key: string]: any }>({
		visible: false,
		loading: false,
		list: [],
		fileName: ""
	});

	const importConfigData = reactive<{ data: ""; [key: string]: any }>({
		visible: false,
		loading: false,
		data: ""
	});

	const coreManagementData = reactive<{ data: ""; [key: string]: any }>({
		visible: false,
		loading: false,
		data: ""
	});

	const closePrevent = async () => {
		const appWindow = getCurrentWindow();
		if (appWindow.label == "main") {
			appWindow.onCloseRequested(async event => {
				// console.error(appWindow.label);
				if (!is_close) {
					// console.error(1);s
					event.preventDefault();
					appWindow.hide();
				}
			});
		}
	};

	const handleCopyIp = async () => {
		if (!config.ipv4?.trim()) return;
		if (data.isStart || !config.dhcp) {
			await copyText(mainStore.config.ipv4);
		} else {
			await copyText(mainStore.config.ipv4, "复制成功,联机后IP可能会变化");
		}
	};

	const handleOpenCache = async () => {
		const cache_path = import.meta.env.VITE_CACHE_PATH;
		const resourceDir = await getResourceDir();
		const configPath = await join(resourceDir, cache_path);
		const isExists = await exists(cache_path, { baseDir: BaseDirectory.Resource });
		if (!isExists) {
			try {
				await mkdir(cache_path, { baseDir: BaseDirectory.Resource });
			} catch (err) {}
		}
		// console.error(configPath);
		await Command.create("explorer", [configPath]).execute();
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
		mainStore.basePeers = uniq([...newBasePeers]);
		if (mainStore.basePeers.length > 0) {
			mainStore.config.serverUrl = mainStore.basePeers[0];
		}
	};

	const handleServerUrlChange = () => {
		let inputProtocols: string | null = null;
		for (const p of protocols) {
			if (config.serverUrl.toLowerCase().startsWith(`${p}://`)) {
				inputProtocols = p;
				break;
			}
		}
		if (inputProtocols) {
			mainStore.config.protocol = [inputProtocols];
			mainStore.config.serverUrl = mainStore.config.serverUrl.slice(inputProtocols.length + 3);
		}
		mainStore.basePeers = uniq([mainStore.config.serverUrl, ...mainStore.basePeers]);
	};

	// 手动触发持久化数据
	const persist = async (appWindow: Window) => {
		try {
			appWindow.emitTo({ kind: "Any" }, "global-main-store", { store: { ...mainStore.$state } });
			mainStore.$persist();
		} catch (err) {
			console.error(err);
			ElMessage.error("手动持久数据失败");
		}
	};

	const listenObj: { [key: string]: any } = {
		unListenOutPut: null,
		unListenThreadId: null,
		unListenServerOutPut: null,
		unListenServerThreadId: null,
		unListenConfigStart: null,
		unListenStartStopServer: null,
		thread_id: null,
		server_thread_id: ref(null),
		async listenOutput() {
			// const appWindow = getCurrentWindow();
			const unListen = await listen<string>("command-output", async event => {
				data.isStart = true;
				// console.error(event.payload);
				if (event.payload) {
					data.startLoading = false;
					let ipv4 = /dhcp ip changed. old: None, new: Some\((\d+\.\d+\.\d+\.\d+).*\)/g.exec(event.payload as string)?.[1];
					let devName = /tun device ready. dev: (.*)/g.exec(event.payload as string)?.[1];
					if (mainStore.configStartEnable || mainStore.config.dhcp) {
						let configIpv4 = /ipv4\s.*=\s.*[\'\"](\d+\.\d+\.\d+\.\d+).*[\'\"]/g.exec(event.payload as string)?.[1];
						if (configIpv4) {
							mainStore.config.ipv4 = configIpv4;
						}
					}
					// if (event.payload.includes("peer connection removed")) {
					// 	data.isSuccessGetIp = false;
					// }
					if (event.payload.includes("new peer connection added") && !data.isSuccessGetIp) {
						await setTrayRunState(tray, true);
						data.isSuccessGetIp = true;
						await setTrayTooltip(tray, `IP: ${mainStore.config.ipv4}`);
					}
					if (ipv4) {
						mainStore.config.ipv4 = ipv4;
						await setTrayTooltip(tray, `IP: ${ipv4}`);
					}
					if (
						devName &&
						mainStore.config.enableNetCardMetric &&
						mainStore.config.netCardMetricValue &&
						mainStore.config.netCardMetricValue >= 1 &&
						mainStore.config.netCardMetricValue <= 9999
					) {
						try {
							const output = await Command.create(
								"netsh",
								["interface", "ipv4", "set", "interface", devName, "metric=", `${mainStore.config.netCardMetricValue}`],
								{
									encoding: "gb2312"
								}
							).execute();
						} catch (err) {
							console.error(err);
							ElMessage.error("跃点设置失败");
						}
					}
				}
				const logArr = data.log.split("\n");
				const start = logArr.length > 1000 ? logArr.length - 1000 : 0;
				data.log = logArr.slice(start).join("\n");
				data.log += (event.payload as string) + "\n";
			});
			this.unListenOutPut = unListen;
		},
		async listenThreadId() {
			const unListen = await listen("thread-id", event => {
				if (event.payload) {
					this.thread_id = event.payload;
				}
			});
			this.unListenThreadId = unListen;
		},
		async listenServerOutPut() {
			const unListen = await listen<string>("server-command-output", async event => {
				// console.log("server-command-output", event);
				const logArr = data.serverLog.split("\n");
				const start = logArr.length > 1000 ? logArr.length - 1000 : 0;
				data.serverLog = logArr.slice(start).join("\n");
				data.serverLog += (event.payload || "") + "\n";
			});
			this.unListenServerOutPut = unListen;
		},
		async listenServerThreadId() {
			const unListen = await listen("server-thread-id", event => {
				if (event.payload) {
					this.server_thread_id.value = event.payload;
				}
			});
			this.unListenServerThreadId = unListen;
		},
		async listenConfigStart() {
			const appWindow = getCurrentWindow();
			const unListen = await listen("config", event => {
				const ipv4 = config.ipv4;
				mainStore.$patch(event.payload as any);
				config.ipv4 = ipv4;
				if (mainStore.config.enablePreventSleep) {
					preventSleep();
				} else {
					stopPreventSleep();
				}
				persist(appWindow);
			});
			const unListen2 = mainStore.$subscribe(() => {
				persist(appWindow);
			});
			this.unListenConfigStart = [unListen, unListen2];
		},
		async listenStartStopServer() {
			const unListen = await listen<{ args: Array<string> }>("startStopServer", async event => {
				await listenObj?.unListenServerOutPut?.();
				await invoke("stop_command", { child_id: listenObj.server_thread_id.value || 0 });
				if (listenObj.server_thread_id.value) {
					listenObj.server_thread_id.value = null;
				} else {
					data.serverLog = "";
					await listenObj.listenServerOutPut();
					await invoke("run_command", {
						args: event.payload.args,
						is_server: true
					});
				}
			});
			this.unListenStartStopServer = unListen;
		}
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
		// const latestVersionFileName = data.releaseList?.[0]?.[0]?.[1] as string;
		let [downloadUrl, versionFileName] = (coreManagementData.data as string).split("<>");
		if (mainStore.githubFastUrl) {
			let fastUrl = mainStore.githubFastUrl.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
			if (!fastUrl.endsWith("/")) fastUrl += "/";
			downloadUrl = fastUrl + downloadUrl;
		}
		if (versionFileName) {
			// console.error(latestVersionFileName, /\-v(\d+\.\d+\.\d+)/g.exec(latestVersionFileName));
			const version = /\-v(\d+\.\d+\.\d+)/g.exec(versionFileName)?.[1];
			const currentVersion = /(\d+\.\d+\.\d+)/g.exec(data.coreVersion || "")?.[1];
			if (version && currentVersion != version) {
				// console.error({ currentVersion, latestVersion });
				ElMessage.success(`变更为 -> ${version}`);
				return [true, downloadUrl, versionFileName];
			} else if (currentVersion === version) {
				ElMessage.success(`当前版本无需安装`);
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

	const handleCoreManagement = async () => {
		coreManagementData.visible = true;
		await getReleaseList();
	};

	const handleInstallCore = async () => {
		try {
			if (!coreManagementData.data) {
				return ElMessage.error("请选择一个内核");
			}
			data.update = true;
			await getCoreVersion();
			const [isNeedUpdate, downloadUrl, latestVersionFileName] = await checkUpdate();

			if (isNeedUpdate) {
				await reset();
				// console.error(downloadUrl);
				await invoke("download_easytier_zip", { download_url: downloadUrl, file_name: latestVersionFileName });
			}
			await getCoreVersion();
		} catch (err) {
			console.error(err);
		} finally {
			data.update = false;
		}
	};

	const getReleaseList = async () => {
		coreManagementData.loading = true;
		const list = await invoke<string[][][]>("fetch_easytier_list");
		data.releaseList = [
			...list.flat().filter(el => {
				// console.log(el, el[0], el[2]);
				return el && el[0] && el[2] && !el[2].includes("gui");
			})
		] as any;
		coreManagementData.loading = false;
		// console.log(data.releaseList);
	};

	const handleAutoStartByTask = async () => {
		await invoke("spawn_autostart", { enabled: !config.autoStart });
		const is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
		config.autoStart = is_enable_by_task;
	};

	const compatibleInitAutoStart = async () => {
		try {
			let is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
			if (is_enable_by_task) {
				// 每次打开Exe重新加载一次开机自启，因为可能路径变了
				await invoke("spawn_autostart", { enabled: false });
				await invoke("spawn_autostart", { enabled: true });
			}
			is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
			config.autoStart = is_enable_by_task;
		} catch (err) {
			console.error(err);
			await invoke("spawn_autostart", { enabled: false });
			const is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
			config.autoStart = is_enable_by_task;
		}
	};

	const initConnectAfterStart = async () => {
		if (config.connectAfterStart && data.coreVersion) {
			await reset();
			await handleConnection();
		}
	};

	const initGuiJson = async () => {
		const path = import.meta.env.VITE_CONFIG_FILE_NAME;
		const isExists = await exists(path, { baseDir: BaseDirectory.Resource });
		if (isExists) {
			const guiJsonStrUint8 = await readFile(path, { baseDir: BaseDirectory.Resource });
			if (guiJsonStrUint8) {
				try {
					const decoder = new TextDecoder("utf-8");
					const guiJsonStr = decoder.decode(guiJsonStrUint8);
					const regex = /^(\s*\/\/.*)/gm;
					const regex2 = /(,?)\s*\/\/.*(?=\n|$|\r\n)/gm;
					const resultStr = guiJsonStr.replace(regex, "").replace(regex2, "$1");
					const guiJson = JSON.parse(resultStr);
					let saveServerUrl = "";
					if (guiJson.serverUrl) {
						if (Array.isArray(guiJson.serverUrl)) {
							mainStore.basePeers = uniq([...guiJson.serverUrl, ...mainStore.basePeers]);
						}
						if (typeof guiJson.serverUrl === "string") {
							mainStore.basePeers = uniq([...guiJson.serverUrl.split(","), ...mainStore.basePeers]);
						}
						saveServerUrl = mainStore.basePeers[0] || "";
					} else {
						saveServerUrl = mainStore.basePeers.length > 0 ? mainStore.basePeers[0] || "" : "";
					}
					data.configJsonSeverUrl = guiJson.serverUrl;
					mainStore.$patch({
						config: {
							...mainStore.config,
							...guiJson,
							serverUrl: saveServerUrl
						}
					});
					if (mainStore.createConfigInEasytier) {
						await updateConfigJson(data.configJsonSeverUrl);
					}
				} catch (err) {
					console.error(err);
					ElMessage.error(`config.json格式或编码错误`);
				} finally {
					// mainStore.$patch({
					// 	createConfigInEasytier: true // 发现本地存在config.json 默认启用该功能
					// });
				}
			}
		}
		const b = bounce(600);
		mainStore.$subscribe(async (...a) => {
			if (mainStore.createConfigInEasytier) {
				b(async () => {
					await updateConfigJson(data.configJsonSeverUrl);
				});
			}
		});
	};

	const initAutoStartServer = async () => {
		if (mainStore.serverConfig.autoStart && data.coreVersion) {
			const args = getServerArgs();
			await listenObj?.unListenServerOutPut?.();
			await invoke("stop_command", { child_id: listenObj.server_thread_id.value || 0 });
			data.serverLog = "";
			await listenObj.listenServerOutPut();
			await invoke("run_command", {
				args,
				is_server: true
			});
		}
	};

	const initPreventSleep = async () => {
		if (mainStore.config.enablePreventSleep) {
			preventSleep();
		}
	};

	const mountedShow = async () => {
		const args = await getMatches();
		if (!args.args?.["task-auto-start"]?.value) {
			const appWindow = getCurrentWindow();
			await appWindow.show();
			await appWindow.setFocus();
		}
	};

	let logsTimer: NodeJS.Timeout | null = null;
	let serverLogsTimer: NodeJS.Timeout | null = null;
	let cidrTimer: NodeJS.Timeout | null = null;

	onMounted(async () => {
		await initGuiJson();
		await compatibleInitAutoStart();
		// await initAutoStart();
		await initStartWinIpBroadcast();
		await getCoreVersion();
		await listenObj.listenThreadId();
		await listenObj.listenServerThreadId();
		await listenObj.listenConfigStart();
		await listenObj.listenStartStopServer();
		await initConfigDir();
		await initAutoStartServer();
		await initConnectAfterStart();
		initPreventSleep();
		mountedShow(); // 不需要await
		closePrevent();
		data.hasNewVersion = await checkNewVersion();
	});

	onBeforeUnmount(() => {
		unListenAll();
		listenObj.unListenReleaseList && listenObj.unListenReleaseList();
		listenObj.unListenConfigStart && listenObj.unListenConfigStart[0]();
		listenObj.unListenConfigStart && listenObj.unListenConfigStart[1]();
		listenObj.unListenStartStopServer && listenObj.unListenStartStopServer();
		logsTimer && clearInterval(logsTimer);
		serverLogsTimer && clearInterval(serverLogsTimer);
		cidrTimer && clearInterval(cidrTimer);
		stopPreventSleep();
	});

	const getArgs = async () => {
		// console.error(config.proxyNetworks);
		const args = [];
		if (mainStore.configStartEnable) {
			if (mainStore.configPath) {
				const isExists = await exists(mainStore.configPath, { baseDir: BaseDirectory.Resource });
				if (isExists) {
					const resourceDir = await getResourceDir();
					const configPath = await join(resourceDir, mainStore.configPath);
					args.push("-c", configPath);
					return args;
				} else {
					const appWindow = getCurrentWindow();
					const isVisible = await appWindow.isVisible();
					if (!isVisible) {
						await appWindow.show();
						await appWindow.setFocus();
					}
					mainStore.configPath = "";
					ElMessage.error(`配置文件不存在 请重新选择`);
					await handleStartCommand("toml"); // 配置文件不存在，显示配置文件弹窗
					return [];
				}
			} else {
				ElMessage.warning(`配置文件不存在 请选择`);
				await handleStartCommand("toml"); // 配置文件不存在，显示配置文件弹窗
				return [];
			}
		}

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
			args.push("--ipv4", config.ipv4.trim());
		}
		if (config.serverUrl) {
			const formatUrl = config.serverUrl.replace(/\\/g, "/");
			args.push("--peers", ...config.protocol.map(protocol => `${protocol}://${formatUrl}`));
		}
		if (config.enableCustomProtocol) {
			const includes = config.protocol.includes(config.customProtocol);
			if (includes) {
				args.push("--default-protocol", config.customProtocol);
			}
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
		if (!config.disbleListenner && config.enableCustomListener && config.customListenerData) {
			const customListener = config.customListenerData
				.trim()
				.split("\n")
				.map(el => el.trim())
				.filter(el => el);
			if (customListener.length > 0) {
				args.push("-l", ...customListener);
			}
		}
		if (!config.disbleListenner && config.enableCustomListenerV6 && config.customListenerV6Data) {
			args.push("--ipv6-listener", config.customListenerV6Data);
		}
		if (!config.disbleListenner && !config.enableCustomListener && config.port) {
			args.push("-l", config.port);
		}
		if (mainStore.cidrEnable && config.proxyNetworks) {
			let formatProxyNetworks = config.proxyNetworks.trim().split("\n");
			const newformatProxyNetworks = formatProxyNetworks
				.map(el => el.trim())
				.filter(cidr => {
					return /^\d+\.\d+\.\d+\.\d+\/\d+$/g.test(cidr);
				});
			if (newformatProxyNetworks.length > 0) {
				args.push("--proxy-networks", ...newformatProxyNetworks);
			}
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
		if (config.saveErrorLog) {
			args.push("--file-log-level", config.logLevel, "--file-log-dir", import.meta.env.VITE_LOG_PATH);
		}
		if (config.devName && config.devNameValue) {
			args.push("--dev-name", config.devNameValue);
		}
		if (config.compression && config.compression != "none") {
			args.push("--compression", config.compression);
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
		const memberDialogs = memberDialog.filter(item => item.label === "member");
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
		await setTrayTooltip(tray);
		await unListenAll();
	};

	const handleConnection = async () => {
		if (data.isStart) {
			await reset();
		} else {
			await setTrayTooltip(tray, "请求联机中...");
			const args = await getArgs();
			if (!args || args.length <= 0) {
				await reset();
				return;
			}
			if (args[0] === "-c") {
				ElMessage.warning({
					message: "使用配置文件中.",
					duration: 5000
				});
			}
			data.log = ""; //清空日志
			data.startLoading = true;
			await unListenAll();
			await listenObj.listenOutput();
			await invoke("run_command", {
				args
			});
		}
	};

	//configStart
	const handleStartCommand = async (command: string | number | object) => {
		if (command === "toml") {
			configStart.visible = true;
			const path = import.meta.env.VITE_CONFIG_PATH;
			const isExists = await exists(path, { baseDir: BaseDirectory.Resource });
			if (!isExists) {
				mainStore.configStartEnable = false;
				mainStore.configPath = "";
				try {
					await mkdir(path, { baseDir: BaseDirectory.Resource, recursive: true });
				} catch (err) {
					console.error(err);
					return;
				}
			}
			const entries = await readDir(path, { baseDir: BaseDirectory.Resource });
			configStart.list = entries
				.filter(item => {
					const nameLower = item.name.toLowerCase();
					return item.isFile && (nameLower.endsWith(".toml") || nameLower.endsWith(".yaml"));
				})
				.map(item => ({
					name: item.name,
					path: `${path}${item.name}`
				})) as any;
		}
		if (command === "share_config") {
			try {
				const {
					protocol,
					serverUrl,
					networkName,
					networkPassword,
					dhcp,
					disableIpv6,
					disbleP2p,
					enableCustomProtocol,
					customProtocol,
					disbleListenner,
					port,
					enableCustomListener,
					customListenerData,
					enableCustomListenerV6,
					customListenerV6Data,
					devName,
					devNameValue,
					enableNetCardMetric,
					netCardMetricValue,
					disableEncryption,
					multiThread,
					latencyfirst,
					disableUdpHolePunching,
					relayAllPeerrpc,
					compression,
					enablePreventSleep
				} = mainStore.config;
				const WT = btoa(
					encodeURIComponent(
						JSON.stringify({
							config: {
								protocol,
								serverUrl,
								networkName,
								networkPassword,
								dhcp,
								disableIpv6,
								disbleP2p,
								enableCustomProtocol,
								customProtocol,
								disbleListenner,
								port,
								enableCustomListener,
								customListenerData,
								enableCustomListenerV6,
								customListenerV6Data,
								devName,
								devNameValue,
								enableNetCardMetric,
								netCardMetricValue,
								disableEncryption,
								multiThread,
								latencyfirst,
								disableUdpHolePunching,
								relayAllPeerrpc,
								compression,
								enablePreventSleep
							}
						})
					)
				);
				await writeText(WT);
				await ElConfirmPrimary(
					`{action} 虚拟网IP，主机名，子网代理，为子网代理启用smoltcp堆栈，开机自启，软件启动自动联机，出口节点，不生成Tun网卡，错误日志相关配置`,
					"提示",
					{
						confirmButtonText: "知道了",
						showCancelButton: false,
						action: "不会分享"
					}
				);
				ElMessage.success("配置已复制");
			} catch (err) {
				console.error(err);
				ElMessage.error("分享失败");
			}
		}
		if (command === "import_config") {
			importConfigData.data = "";
			importConfigData.visible = true;
		}
		if (command === "create_server") {
			await handleShowServerDialog();
		}
		if (command === "config_admin") {
			configAdminData.visible = true;
			const path = import.meta.env.VITE_CONFIG_ADMIN_PATH;
			const isExists = await exists(path, { baseDir: BaseDirectory.Resource });
			if (!isExists) {
				try {
					await mkdir(path, { baseDir: BaseDirectory.Resource, recursive: true });
				} catch (err) {
					console.error(err);
					return;
				}
			}
			const entries = await readDir(path, { baseDir: BaseDirectory.Resource });
			configAdminData.list = entries
				.filter(item => item.isFile)
				.map(item => ({
					name: item.name,
					path: `${path}${item.name}`
				})) as any;
		}
		if (command === "save_config_admin") {
			const config = btoa(encodeURIComponent(JSON.stringify(mainStore.$state)));
			const [error, { value = "" } = {}] = await ATJ(
				ElMessageBox.prompt("请输入配置的存储名", "提示", {
					confirmButtonText: "保存",
					cancelButtonText: "取消",
					inputPlaceholder: "请输入2个字以上的存储名",
					inputValidator: (value: string) => {
						const result = isValidWindowsFileName(value);
						if (result) {
							return true;
						}
						return "文件名不合法";
					}
				})
			);
			if (!error) {
				const dir = import.meta.env.VITE_CONFIG_ADMIN_PATH;
				const filePath = `${dir}${value}`;
				const isExistsDir = await exists(dir, { baseDir: BaseDirectory.Resource });
				if (!isExistsDir) {
					try {
						await mkdir(dir, { baseDir: BaseDirectory.Resource, recursive: true });
					} catch (err) {
						console.error(err);
						return;
					}
				}
				const isExists = await exists(filePath, { baseDir: BaseDirectory.Resource });
				let allowWrite = true;
				if (isExists) {
					const [err] = await ElConfirmPrimary("配置名已存在，是否覆盖?", "提示", {
						confirmButtonText: "确定",
						cancelButtonText: "取消"
					});
					if (err) {
						allowWrite = false;
					}
				}
				if (allowWrite) {
					let encoder = new TextEncoder();
					let data = encoder.encode(config);
					// console.log(filePath, data);
					await writeFile(filePath, data, { baseDir: BaseDirectory.Resource });
					ElMessage.success("保存成功");
				}
			}
		}
	};

	const handleExchangeAdminConfig = async () => {
		const path = configAdminData.fileName;
		if (!path) return ElMessage.warning("请选择配置");
		// import.meta.env.VITE_CONFIG_ADMIN_PATH
		const [err] = await ElConfirmPrimary("会覆盖当前配置,确定切换吗?");
		if (err) return;
		const base64U8Arrray = await readFile(path, { baseDir: BaseDirectory.Resource });
		const decoder = new TextDecoder("utf-8");
		try {
			if (data.isStart) {
				ElMessage.warning("停止联机..");
				await reset();
			}
			const json: typeof mainStore.$state = JSON.parse(decodeURIComponent(atob(decoder.decode(base64U8Arrray))));
			mainStore.$patch(json);
			ElMessage.success("切换成功");
			configAdminData.visible = false;
		} catch (err) {
			ElMessage.error("读取配置失败");
			console.log(err);
		}
	};

	const handleStartImport = async () => {
		const [err] = await ElConfirmPrimary("确定导入?", "提示", {
			confirmButtonText: "确定",
			cancelButtonText: "取消"
		});
		if (!err) {
			const payload = JSON.parse(decodeURIComponent(atob(importConfigData.data)));
			payload.config.serverUrl = payload?.config?.serverUrl?.trim() || config.serverUrl;
			mainStore.$patch({
				config: {
					...mainStore.config,
					...payload.config
				}
			});
			ElMessage.success("导入成功");
			importConfigData.visible = false;
			mainStore.basePeers = uniq([config.serverUrl, ...mainStore.basePeers].filter(el => el.trim()));
		} else {
			console.error(err);
			if (err !== "cancel") {
				ElMessage.error("导入失败");
			}
		}
	};

	const initConfigDir = async () => {
		const path = import.meta.env.VITE_CONFIG_PATH;
		const isExists = await exists(path, { baseDir: BaseDirectory.Resource });
		if (!isExists) {
			mainStore.configStartEnable = false;
			mainStore.configPath = "";
			try {
				await mkdir(path, { baseDir: BaseDirectory.Resource });
			} catch (err) {
				console.error(err);
			}
		}
	};

	const openConfigDir = async () => {
		const resourceDir = await getResourceDir();
		const configPath = await join(resourceDir, import.meta.env.VITE_CONFIG_PATH);
		// console.error(configPath);
		await Command.create("explorer", [configPath]).execute();
	};
	const openConfigAdminDir = async () => {
		const resourceDir = await getResourceDir();
		const configPath = await join(resourceDir, import.meta.env.VITE_CONFIG_ADMIN_PATH);
		// console.error(configPath);
		await Command.create("explorer", [configPath]).execute();
	};

	const handleShowMemberDialog = async () => {
		if (!data.isStart) {
			return ElMessage.warning("请先开始联机");
		}
		// if (!mainStore.config.ipv4) {
		// 	return ElMessage.warning("请等待获取IP");
		// }

		await etWindows(
			"member",
			{
				title: "成员列表",
				width: 875,
				height: 380,
				url: "#/member"
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
				title: "联机日志",
				width: 600,
				height: 380,
				resizable: false,
				url: "#/log"
			},
			(_, appWindow) => {
				data.logVisible = true;
				logsTimer && clearInterval(logsTimer);
				logsTimer = setInterval(() => {
					appWindow.emitTo({ kind: "WebviewWindow", label: "log" }, "logs", data.log);
				}, 650);
			},
			() => {
				logsTimer && clearInterval(logsTimer);
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
				url: "#/cidr"
			},
			(_, appWindow) => {
				data.cidrVisible = true;
				cidrTimer && clearInterval(cidrTimer);
				cidrTimer = setInterval(() => {
					appWindow.emitTo({ kind: "WebviewWindow", label: "cidr" }, "route", data.isStart);
				}, 1000);
			},
			() => {
				cidrTimer && clearInterval(cidrTimer);
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
				url: "#/advance"
			},
			(_, appWindow) => {
				data.advanceVisible = true;
			},
			() => {
				data.advanceVisible = false;
			}
		);
	};

	const handleShowToolDialog = async () => {
		await etWindows(
			"tool",
			{
				title: "增强工具",
				width: 460,
				height: 480,
				resizable: true,
				url: "#/tool"
			},
			(_, appWindow) => {
				data.toolVisible = true;
			},
			() => {
				data.toolVisible = false;
			}
		);
	};

	const handleShowServerDialog = async () => {
		await etWindows(
			"server",
			{
				title: "自建服务器",
				minWidth: 550,
				minHeight: 460,
				width: 550,
				height: 460,
				resizable: true,
				url: "#/server"
			},
			(_, appWindow) => {
				data.serverVisible = true;
				serverLogsTimer && clearInterval(serverLogsTimer);
				serverLogsTimer = setInterval(() => {
					appWindow.emitTo({ kind: "WebviewWindow", label: "server" }, "server_logs", {
						log: data.serverLog,
						threadId: listenObj.server_thread_id.value
					});
				}, 650);
			},
			() => {
				serverLogsTimer && clearInterval(serverLogsTimer);
				data.serverVisible = false;
			}
		);
	};
</script>
