<template>
	<div class="mb-[4px] flex items-center gap-[5px] rounded-[5px] border border-[var(--el-border-color)] bg-[var(--el-fill-color-light)] p-[4px]">
		<ElSelect
			class="min-w-0 flex-1"
			:model-value="mainStore.activeRoomId"
			placeholder="选择房间配置"
			@change="handleRoomSwitch"
		>
			<template #prefix>
				<span
					class="h-[7px] w-[7px] rounded-full"
					:class="activeRoomStatus.className"
				></span>
			</template>
			<ElOption
				v-for="{ room, status } in roomOptions"
				:key="room.id"
				:label="room.name"
				:value="room.id"
			>
				<div class="flex w-full items-center gap-[8px]">
					<span
						class="h-[7px] w-[7px] flex-shrink-0 rounded-full"
						:class="status.className"
					></span>
					<span class="truncate">{{ room.name }}</span>
					<ElTag
						class="ml-auto"
						size="small"
						:type="status.type"
					>
						{{ status.text }}
					</ElTag>
				</div>
			</ElOption>
		</ElSelect>
		<ElTooltip content="保存当前房间配置">
			<ElButton
				:icon="DocumentChecked"
				@click="handleSaveRoom"
			></ElButton>
		</ElTooltip>
		<ElTooltip content="新增房间配置">
			<ElButton
				:icon="Plus"
				type="primary"
				@click="handleAddRoom"
			></ElButton>
		</ElTooltip>
		<ElDropdown
			trigger="click"
			@command="handleRoomManageCommand"
		>
			<ElButton :icon="MoreFilled"></ElButton>
			<template #dropdown>
				<ElDropdownMenu>
					<ElDropdownItem
						command="rename"
						:icon="EditPen"
					>
						重命名当前房间
					</ElDropdownItem>
					<ElDropdownItem
						command="delete"
						:icon="Delete"
						:disabled="mainStore.roomProfiles.length <= 1 || activeRoomRuntime.isStart"
					>
						删除当前房间
					</ElDropdownItem>
				</ElDropdownMenu>
			</template>
		</ElDropdown>
	</div>
	<ElForm
		size="small"
		label-position="top"
		:model="mainStore.config"
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
						:type="activeRoomStatus.connectionType"
					>
						{{ activeRoomStatus.connectionText }}
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
						<ElBadge
							badge-class="!text-[9px] cursor-pointer ml-auto"
							:hidden="!haveNewCoreVersion"
							:offset="[-5, 6]"
							@click.stop="handleCoreManagement"
							value="N"
						>
							<ElButton
								class="ml-auto mr-[3px]"
								:disabled="hasRunningRoom || listenObj.server_thread_id.value"
								@click.stop="handleCoreManagement"
								:loading="data.update"
								type="primary"
								size="small"
							>
								内核管理
							</ElButton>
						</ElBadge>
					</ElTooltip>
				</div>
			</template>
			<ElSelect
				allow-create
				:reserve-keyword="false"
				filterable
				multiple
				collapse-tags
				collapse-tags-tooltip
				placeholder="请选择服务器地址"
				default-first-option
				v-model="mainStore.config.serverUrl"
				no-data-text="无服务器地址"
				@change="handleServerUrlChange"
			>
				<template #prefix>
					<div :class="mainStore.config.protocol && mainStore.config.protocol.length > 1 ? 'w-[110px]' : 'w-[80px]'">
						<ElSelect
							placeholder="协议"
							multiple
							collapse-tags
							@click.stop
							v-model="mainStore.config.protocol"
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
							underline="never"
							@click.stop="handleShowPublicServersDialog"
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
						v-model="mainStore.config.networkName"
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
						v-model="mainStore.config.networkPassword"
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
					v-model="mainStore.config.hostname"
				></ElInput>
			</ElFormItem>
			<ElFormItem
				class="w-[70%]"
				label="局域网IP"
			>
				<template #label>
					<div class="flex h-[22px] items-center gap-[3px]">
						<div class="mr-[8px]">IP</div>
						<ElSwitch
							v-model="mainStore.config.dhcp"
							inline-prompt
							inactive-text="固定V4"
							active-text="动态V4"
							size="small"
						></ElSwitch>
						<ElTooltip>
							<template #content>
								<div>选填V6地址，可与IPv4一起使用以进行双栈操作</div>
								<div>----------------------------------------</div>
								<div>当前V6地址: {{ mainStore.config.ipv6 || "-" }}</div>
							</template>
							<ElButton
								text
								size="small"
								class="cursor-pointer"
								@click="handleDealIpv6"
								:type="mainStore.config.ipv6 ? 'success' : 'info'"
							>
								V6
							</ElButton>
						</ElTooltip>
						<ElDivider direction="vertical" />
						<ElButton
							@click.stop="handleCopyIp"
							type="primary"
							text
							size="small"
							title="复制V4"
							:icon="CopyDocument"
						></ElButton>
						<!-- <ElTooltip content="对应命令行参数 --ipv4">
							<ElIcon><QuestionFilled /></ElIcon>
						</ElTooltip> -->
					</div>
				</template>
				<ElInput
					maxlength="100"
					:readonly="mainStore.config.dhcp"
					:placeholder="activeRoomRuntime.isStart && mainStore.config.dhcp ? '等待动态分配IP...' : '例如: 10.126.126.1'"
					v-model="mainStore.config.ipv4"
				>
					<template #prefix>
						<ElTooltip
							class="!text-[10px]"
							placement="top-end"
							:content="mainStore.config.dhcp ? '动态获取无法手动填写' : '固定IP可以手动填写'"
						>
							<ElTag
								size="small"
								:type="mainStore.config.dhcp ? 'info' : 'success'"
							>
								{{ mainStore.config.dhcp ? "只读" : "可填" }}
							</ElTag>
						</ElTooltip>
					</template>
				</ElInput>
			</ElFormItem>
		</div>
	</ElForm>
	<!-- <div class="flex justify-center items-center gap-[5px]">
		<el-button>分享当前配置</el-button>
		<el-button>导入联机配置</el-button>
	</div> -->
	<div class="mt-auto flex items-start">
		<div>
			<div class="pt-[4px]">
				<ElDropdown
					@command="handleStartCommand"
					split-button
					trigger="click"
					size="default"
					placement="right-end"
					:type="!activeRoomRuntime.isStart ? 'primary' : 'danger'"
					:disabled="activeRoomRuntime.startLoading || !data.coreVersion || data.update"
					@click="handleConnection()"
				>
					{{ !activeRoomRuntime.isStart ? "启动当前房间" : "停止当前房间" }}
					<template #dropdown>
						<ElDropdownMenu>
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
								:disabled="activeRoomRuntime.isStart"
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
							<ElDropdownItem
								command="game_start_config"
								:icon="SwitchFilled"
							>
								本地游戏列表
							</ElDropdownItem>
							<ElDropdownItem disabled>
								<ElDivider class="!m-0 !h-[2px]" />
							</ElDropdownItem>
							<ElDropdownItem
								command="cidr"
								:icon="Share"
							>
								子网代理
							</ElDropdownItem>
							<!-- <ElDropdownItem
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
							</ElDropdownItem> -->
							<ElDropdownItem
								command="reconnect"
								:icon="RefreshRight"
							>
								重新联机
							</ElDropdownItem>
						</ElDropdownMenu>
					</template>
				</ElDropdown>
			</div>
			<div class="mt-[10px] pl-[2px]">
				<ElTooltip
					placement="top"
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
				v-model="mainStore.config.disbleP2p"
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
					:model-value="mainStore.config.autoStart"
					size="small"
				>
					开机自启
				</ElCheckbox>
			</ElTooltip>
			<div class="flex items-center gap-[0_2px]">
				<ElDropdown
					@command="handleStartCommand"
					trigger="click"
					:show-arrow="false"
				>
					<ElButton
						:icon="Share"
						size="small"
					>
						分享/导入
					</ElButton>
					<template #dropdown>
						<el-dropdown-item command="share_config">分享联机配置</el-dropdown-item>
						<el-dropdown-item command="import_config">导入联机配置</el-dropdown-item>
					</template>
				</ElDropdown>
				<div>
					<ElButton
						@click="handleShowAdvanceDialog"
						:icon="Setting"
						size="small"
					>
						高级选项
					</ElButton>
				</div>
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
					:hidden="!hasNewVersion"
					:offset="[6, 7]"
					value="N"
				>
					<!-- <ElTooltip :disabled="!data.hasNewVersion" content="有新版发布了!"> -->
					<ElLink
						class="ml-[8px] truncate pb-[2px] !text-[9px]"
						type="info"
						underline="never"
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
			<div v-if="data.update">
				<ElProgress :percentage="progress"></ElProgress>
			</div>
		</div>
		<div class="mt-[5px] pb-[5px]">
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
		>
			<template #append>
				<ElTooltip content="github加速链接的发布地址,当前地址失效后,访问它获取最新的地址">
					<ElButton @click="open('https://ghproxy.link/')">发布地址</ElButton>
				</ElTooltip>
			</template>
		</ElInput>
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
		<div class="flex items-center">
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
			<ElTooltip
				placement="top-start"
				:offset="2"
				:show-arrow="false"
				content="删除选中配置"
			>
				<ElButton
					class="!ml-auto"
					:icon="Delete"
					@click="handleDeleteAdminConfig"
					type="danger"
					size="small"
				></ElButton>
			</ElTooltip>
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
				></ElOption>
			</ElSelect>
		</div>
		<template #footer>
			<div class="text-right">
				<div class="mb-[5px]">
					<ElAlert
						show-icon
						type="warning"
						title="打开目录删除文件即可删除配置"
					></ElAlert>
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
					plain
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
		title="IPV6地址填写"
		:close-on-press-escape="false"
		:close-on-click-modal="false"
		:show-close="false"
		v-model="ipv6InputDialog.visible"
	>
		<ElInput
			v-model="mainStore.config.ipv6"
			clearable
			placeholder="请输入IPV6地址"
		></ElInput>
		<template #footer>
			<div class="text-right">
				<ElButton
					type="primary"
					size="small"
					@click="handleValidateIpv6"
				>
					确定
				</ElButton>
			</div>
		</template>
	</ElDialog>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { listen, type UnlistenFn } from "@tauri-apps/api/event";
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
		Platform,
		SwitchFilled,
		DocumentChecked,
		Plus,
		MoreFilled,
		EditPen
	} from "@element-plus/icons-vue";
	import { reactive, onBeforeUnmount, onMounted, ref, computed, watch } from "vue";
	import { useTray, setTrayRunState, setTrayTooltip, checkNewVersion, hasNewVersion } from "~/composables/tray";
	import { getMatches } from "@tauri-apps/plugin-cli";
	import useMainStore from "@/stores/index";
	import { ElMessage, ElMessageBox, ElTooltip } from "element-plus";
	import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
	import { getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
	import etWindows, { dataSubscribe, MAIN_WINDOW_LOGICAL_SIZE } from "@/composables/windows";
	import { resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
	import { readDir, exists, mkdir, BaseDirectory, readFile, writeFile, remove as removeFile } from "@tauri-apps/plugin-fs";
	import { updateConfigJson, updateConfigJsonBounce } from "~/composables/configJson";
	import {
		loadRoomGuiConfigs,
		removeRoomGuiConfig,
		saveRoomGuiConfig,
		saveRoomGuiConfigs
	} from "~/composables/guiConfig";
	import { writeText } from "@tauri-apps/plugin-clipboard-manager";
	import { uniq } from "lodash-es";
	import { addQQGroup, supportProtocols, preventSleep, stopPreventSleep, ATJ, copyText, isValidWindowsFileName, mixedArray } from "~/utils";
	import { ElConfirmDanger, ElConfirmPrimary } from "~/utils/element";
	import { getServerArgs } from "@/composables/server";
	import { isIPv6 } from "is-ip";

	type RoomRuntime = {
		childId: number | null;
		runId: string;
		log: string;
		isStart: boolean;
		isSuccessGetIp: boolean;
		startLoading: boolean;
		error: string;
	};

	type ClientCommandEvent = {
		instanceId: string;
		runId: string;
		eventType: "started" | "output" | "exited" | "error";
		childId?: number;
		output?: string;
		exitCode?: number;
	};

	type RunningClientInstance = {
		childId: number;
		runId: string;
	};

	type RoomStatusView = {
		text: string;
		connectionText: string;
		type: "success" | "warning" | "danger" | "info";
		connectionType: "success" | "danger" | "info";
		className: string;
	};

	const mainStore = useMainStore();
	mainStore.initializeRoomProfiles();

	const roomRuntimes = reactive<Record<string, RoomRuntime>>({});
	const createRoomRuntime = (): RoomRuntime => ({
		childId: null,
		runId: "",
		log: "",
		isStart: false,
		isSuccessGetIp: false,
		startLoading: false,
		error: ""
	});
	const idleRoomRuntime = Object.freeze(createRoomRuntime()) as RoomRuntime;
	const getRoomRuntime = (roomId: string): RoomRuntime => {
		if (!roomRuntimes[roomId]) {
			roomRuntimes[roomId] = createRoomRuntime();
		}
		return roomRuntimes[roomId];
	};
	mainStore.roomProfiles.forEach(room => getRoomRuntime(room.id));
	const activeRoomRuntime = computed(() => roomRuntimes[mainStore.activeRoomId] || idleRoomRuntime);
	const hasRunningRoom = computed(() => Object.values(roomRuntimes).some(runtime => runtime.isStart));
	const getRoomStatus = (runtime: RoomRuntime): RoomStatusView => {
		if (runtime.error) {
			return {
				text: "异常",
				connectionText: "启动失败",
				type: "danger",
				connectionType: "danger",
				className: "bg-[var(--el-color-danger)]"
			};
		}
		if (runtime.isSuccessGetIp) {
			return {
				text: "已连接",
				connectionText: "联机成功",
				type: "success",
				connectionType: "success",
				className: "bg-[var(--el-color-success)]"
			};
		}
		if (runtime.startLoading || runtime.isStart) {
			return {
				text: runtime.startLoading ? "启动中" : "运行中",
				connectionText: "联机中",
				type: "warning",
				connectionType: "info",
				className: "bg-[var(--el-color-warning)]"
			};
		}
		return {
			text: "未运行",
			connectionText: "未联机",
			type: "info",
			connectionType: "info",
			className: "bg-[var(--el-text-color-placeholder)]"
		};
	};
	const activeRoomStatus = computed(() => getRoomStatus(activeRoomRuntime.value));
	const roomOptions = computed(() =>
		mainStore.roomProfiles.map(room => {
			const runtime = roomRuntimes[room.id] || idleRoomRuntime;
			return { room, status: getRoomStatus(runtime) };
		})
	);
	let roomProfileSaveTimer: number | null = null;
	watch(
		[
			() => mainStore.config,
			() => mainStore.cidrEnable,
			() => mainStore.proxyForwardBySystem,
			() => mainStore.configStartEnable,
			() => mainStore.configPath
		],
		() => {
			if (roomProfileSaveTimer) {
				clearTimeout(roomProfileSaveTimer);
			}
			roomProfileSaveTimer = window.setTimeout(() => {
				mainStore.saveActiveRoomProfile();
				roomProfileSaveTimer = null;
			}, 180);
		},
		{ deep: true }
	);

	let is_close = false;
	const tray = await useTray(
		true,
		async () => {
			is_close = true;
			await stopAllRooms();
			await invoke("stop_command", { child_id: data.winipBcPid || 0 });
			await invoke("stop_command", { child_id: listenObj.server_thread_id.value || 0 });
			await stopPreventSleep(); //关闭防休眠
		},
		async () => {
			await handleConnection();
			return activeRoomRuntime.value.isStart;
		},
		async () => {
			await handleReconnect();
		},
		async () => {
			await handleShowPublicServersDialog();
		}
	);

	const protocols = supportProtocols();
	const data = reactive({
		//easytierGame有没有新版
		logVisible: false,
		cidrVisible: false,
		advanceVisible: false,
		toolVisible: false,
		gameListVisible: false,
		nodesListVisible: false,
		serverVisible: false,
		winipBcPid: 0, //WinIPBroadcast进程id
		memberVisible: false,
		serverLog: "", //服务端日志
		update: false,
		releaseList: [[]],
		coreVersion: "-",
		configJsonSeverUrl: [] // 本地保存一次，用于回填config.json
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

	const requestRoomName = async (title: string, initialValue = "", excludeRoomId = "") => {
		const [error, result] = await ATJ(
			ElMessageBox.prompt("请输入便于识别的房间配置名称", title, {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				inputValue: initialValue,
				inputPlaceholder: "例如：朋友联机房",
				inputValidator: (value: string) => {
					const name = value?.trim();
					if (!name) return "房间名称不能为空";
					if (name.length > 32) return "房间名称不能超过 32 个字符";
					if (mainStore.roomProfiles.some(room => room.id !== excludeRoomId && room.name === name)) {
						return "房间名称已存在";
					}
					return true;
				}
			})
		);
		return error ? "" : result?.value?.trim() || "";
	};

	const handleRoomSwitch = async (roomId: string) => {
		if (!roomId || roomId === mainStore.activeRoomId) return;
		await closeRoomDetailWindows();
		mainStore.switchRoomProfile(roomId);
		await updateConfigJsonBounce(data.configJsonSeverUrl);
	};

	const saveRoomProfileFile = async (room: (typeof mainStore.roomProfiles)[number]) => {
		const roomOrder = mainStore.roomProfiles.findIndex(item => item.id === room.id);
		return saveRoomGuiConfig(room, roomOrder);
	};

	const handleSaveRoom = async () => {
		mainStore.saveActiveRoomProfile();
		const room = mainStore.activeRoomProfile;
		if (!room) {
			ElMessage.error("当前房间不存在，无法保存配置");
			return;
		}
		try {
			await saveRoomProfileFile(room);
			if (mainStore.createConfigInEasytier) {
				await updateConfigJson(data.configJsonSeverUrl);
			}
			ElMessage.success(`房间“${room.name}”配置已保存到 gui_config 文件夹`);
		} catch (error) {
			console.error(`保存房间“${room.name}”GUI 配置失败`, error);
			ElMessage.error(`房间“${room.name}”配置写入 gui_config 文件夹失败`);
		}
	};

	const handleAddRoom = async () => {
		const name = await requestRoomName("新增房间配置");
		if (!name) return;
		mainStore.saveActiveRoomProfile();
		const sourceRoom = mainStore.activeRoomProfile;
		try {
			if (sourceRoom) {
				await saveRoomProfileFile(sourceRoom);
			}
			const room = mainStore.addRoomProfile(name);
			try {
				await saveRoomProfileFile(room);
			} catch (error) {
				mainStore.deleteRoomProfile(room.id);
				if (sourceRoom) {
					mainStore.applyRoomProfile(sourceRoom.id);
				}
				throw error;
			}
			getRoomRuntime(room.id);
			await closeRoomDetailWindows();
			ElMessage.success(`已创建并保存房间“${room.name}”`);
		} catch (error) {
			console.error(`新建房间“${name}”时保存 GUI 配置失败`, error);
			ElMessage.error(`新建房间失败，无法写入 gui_config 文件夹`);
		}
	};

	const handleRoomManageCommand = async (command: string | number | object) => {
		const room = mainStore.activeRoomProfile;
		if (!room) return;
		if (command === "rename") {
			const name = await requestRoomName("重命名房间配置", room.name, room.id);
			if (name) {
				const previousName = room.name;
				const previousUpdatedAt = room.updatedAt;
				if (mainStore.renameRoomProfile(room.id, name)) {
					try {
						await saveRoomProfileFile(room);
						ElMessage.success("房间配置已重命名");
					} catch (error) {
						room.name = previousName;
						room.updatedAt = previousUpdatedAt;
						console.error(`重命名房间“${previousName}”时保存 GUI 配置失败`, error);
						ElMessage.error("重命名失败，无法写入 gui_config 文件夹");
					}
				}
			}
		}
		if (command === "delete") {
			const runtime = getRoomRuntime(room.id);
			if (mainStore.roomProfiles.length <= 1) {
				ElMessage.warning("至少需要保留一个房间配置");
				return;
			}
			if (runtime.isStart) {
				ElMessage.warning("请先停止当前房间");
				return;
			}
			const [error] = await ElConfirmDanger(`确定{action}房间“${room.name}”及其配置吗？`, "提示", {
				confirmButtonText: "删除",
				cancelButtonText: "取消",
				action: "删除"
			});
			if (error) return;
			try {
				await removeRoomGuiConfig(room.id);
				if (mainStore.deleteRoomProfile(room.id)) {
					delete roomRuntimes[room.id];
					await closeRoomDetailWindows();
					ElMessage.success("房间配置已删除");
				}
			} catch (error) {
				console.error(`删除房间“${room.name}”GUI 配置失败`, error);
				ElMessage.error("删除失败，无法更新 gui_config 文件夹");
			}
		}
	};

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

	const ipv6InputDialog = reactive<{ visible: boolean; [key: string]: any }>({
		visible: false
	});

	const handleDealIpv6 = async () => {
		ipv6InputDialog.visible = true;
	};

	const handleValidateIpv6 = () => {
		mainStore.config.ipv6 = mainStore.config.ipv6?.trim() || "";
		if (mainStore.config.ipv6 && !isIPv6(mainStore.config.ipv6)) {
			ElMessage.error("请输入正确的IPV6地址");
			return;
		}
		ipv6InputDialog.visible = false;
	};

	const handleCopyIp = async () => {
		const v6 = mainStore.config.ipv6?.trim();
		const v4 = mainStore.config.ipv4?.trim();
		if (v6) {
			const [err] = await ElConfirmPrimary("检测到您填写了IPV6地址，是否复制IPV6地址？", "提示", {
				confirmButtonText: "复制IPV6",
				cancelButtonText: "复制IPV4"
			});
			if (!err) {
				await copyText(v6);
			} else {
				if (!v4) {
					ElMessage.error("没有IPV4地址，无法复制");
					return;
				}
				if (activeRoomRuntime.value.isStart || !mainStore.config.dhcp) {
					await copyText(v4);
				} else {
					await copyText(v4, "复制成功,联机后IP可能会变化");
				}
			}
		} else {
			if (!v4) {
				ElMessage.error("没有IPV4地址，无法复制");
				return;
			}
			if (activeRoomRuntime.value.isStart || !mainStore.config.dhcp) {
				await copyText(v4);
			} else {
				await copyText(v4, "复制成功,联机后IP可能会变化");
			}
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
			const selectIdx = mainStore.config.serverUrl.indexOf(url);
			if (selectIdx >= 0) {
				mainStore.config.serverUrl.splice(selectIdx, 1);
			}
			newBasePeers.splice(idx, 1);
		}
		mainStore.basePeers = uniq([...newBasePeers]);
		if (mainStore.basePeers.length > 0 && mainStore.config.serverUrl.length <= 0) {
			mainStore.config.serverUrl = [mainStore.basePeers[0]];
		}
	};

	const handleServerUrlChange = () => {
		let inputProtocols: string[] = [];
		// console.log(mainStore.config.serverUrl);
		for (const p of protocols) {
			for (const url of mainStore.config.serverUrl) {
				if (url.replace(/\\/g, "/").toLowerCase().startsWith(`${p}://`)) {
					inputProtocols.push(p);
				}
			}
		}
		if (inputProtocols) {
			mainStore.config.protocol = uniq([...mainStore.config.protocol, ...inputProtocols]);
			mainStore.config.serverUrl = (mainStore.config.serverUrl || []).map(url => {
				for (const p of protocols) {
					if (url.replace(/\\/g, "/").toLowerCase().startsWith(`${p}://`)) {
						return url.slice(p.length + 3);
					}
				}
				return url;
			});
		}
		mainStore.basePeers = uniq([...mainStore.config.serverUrl, ...mainStore.basePeers]);
	};

	const memberTimers: Record<string, number> = {};
	const memberTimerGenerations: Record<string, number> = {};
	const reconnectTimers: Record<string, number> = {};
	const stoppingRuns = new Set<string>();
	const cancelledRuns = new Set<string>();
	const stopMemberTimer = (roomId: string) => {
		memberTimerGenerations[roomId] = (memberTimerGenerations[roomId] || 0) + 1;
		if (memberTimers[roomId]) {
			clearTimeout(memberTimers[roomId]);
			delete memberTimers[roomId];
		}
	};
	const clearReconnectTimer = (roomId: string) => {
		if (reconnectTimers[roomId]) {
			clearTimeout(reconnectTimers[roomId]);
			delete reconnectTimers[roomId];
		}
	};
	let requestedTrayStatusKey: string | null = null;
	let appliedTrayRunState: boolean | null = null;
	let appliedTrayTooltip: string | null = null;
	let trayUpdateQueue = Promise.resolve();
	const updateTrayRoomStatus = async () => {
		const runningRooms = mainStore.roomProfiles.filter(room => getRoomRuntime(room.id).isStart);
		const isRunning = runningRooms.length > 0;
		const tooltip = isRunning
			? `${runningRooms.length} 个房间运行中\n${runningRooms
					.slice(0, 4)
					.map(room => {
						const ipv4 = room.config.ipv4?.trim();
						return `${room.name}: ${ipv4 || "连接中"}`;
					})
					.join("\n")}`
			: null;
		const statusKey = `${isRunning}:${tooltip || ""}`;
		if (statusKey === requestedTrayStatusKey) {
			await trayUpdateQueue;
			return;
		}
		requestedTrayStatusKey = statusKey;
		// 托盘 API 串行执行，避免多个房间的异步事件互相覆盖；图标与提示文本分别去重，防止同一图标被重复加载。
		trayUpdateQueue = trayUpdateQueue
			.then(async () => {
				if (appliedTrayRunState !== isRunning) {
					await setTrayRunState(tray, isRunning);
					appliedTrayRunState = isRunning;
				}
				if (appliedTrayTooltip !== tooltip) {
					await setTrayTooltip(tray, tooltip);
					appliedTrayTooltip = tooltip;
				}
			})
			.catch(error => {
				if (requestedTrayStatusKey === statusKey) {
					requestedTrayStatusKey = null;
				}
				console.error("更新托盘状态失败", error);
			});
		await trayUpdateQueue;
	};
	const resetRoomIp = async (roomId: string) => {
		const room = mainStore.roomProfiles.find(item => item.id === roomId);
		const runtime = getRoomRuntime(roomId);
		let changed = runtime.isSuccessGetIp;
		runtime.isSuccessGetIp = false;
		if (room?.config.dhcp) {
			changed ||= Boolean(room.config.ipv4);
			room.config.ipv4 = "";
			if (mainStore.activeRoomId === roomId) {
				changed ||= Boolean(mainStore.config.ipv4);
				mainStore.config.ipv4 = "";
			}
		}
		return changed;
	};
	const startMemberTimer = (roomId: string) => {
		stopMemberTimer(roomId);
		const generation = memberTimerGenerations[roomId];
		const scheduleNextPoll = (delay: number) => {
			if (memberTimerGenerations[roomId] !== generation) return;
			memberTimers[roomId] = window.setTimeout(() => {
				delete memberTimers[roomId];
				void pollMember();
			}, delay);
		};
		const pollMember = async () => {
			const room = mainStore.roomProfiles.find(item => item.id === roomId);
			const runtime = getRoomRuntime(roomId);
			if (!room || !runtime.isStart) {
				stopMemberTimer(roomId);
				if (await resetRoomIp(roomId)) {
					await updateTrayRoomStatus();
				}
				return;
			}
			const runId = runtime.runId;
			const [error, member] = await ATJ(invoke<string>("get_members_by_cli", { rpc_portal: room.rpcPortal }));
			if (memberTimerGenerations[roomId] !== generation || runtime.runId !== runId || !runtime.isStart) return;
			if (!error && member !== "_EasytierGameCliFailedToConnect_") {
				try {
					const memberJson = JSON.parse(member) as Member[];
					const localData = memberJson.find(memberItem => memberItem?.cost == "Local");
					const ipv4 = localData?.ipv4;
					if (localData && ipv4) {
						const changed = room.config.ipv4 !== ipv4 || !runtime.isSuccessGetIp;
						room.config.ipv4 = ipv4;
						if (mainStore.activeRoomId === roomId) {
							mainStore.config.ipv4 = ipv4;
						}
						runtime.isSuccessGetIp = true;
						if (changed) {
							await updateTrayRoomStatus();
						}
					} else if (await resetRoomIp(roomId)) {
						await updateTrayRoomStatus();
					}
				} catch (err) {
					console.error(`解析房间“${room.name}”成员信息失败`, err);
				}
			}
			scheduleNextPoll(runtime.isSuccessGetIp ? 3000 : 1000);
		};
		scheduleNextPoll(0);
	};
	const appendLimitedLog = (currentLog: string, output: string, maxLines = 1000) => {
		const lines = currentLog ? currentLog.split("\n") : [];
		if (lines[lines.length - 1] === "") {
			lines.pop();
		}
		lines.push(output);
		return `${lines.slice(-maxLines).join("\n")}\n`;
	};
	const appendRoomLog = (roomId: string, output: string) => {
		const runtime = getRoomRuntime(roomId);
		runtime.log = appendLimitedLog(runtime.log, output);
	};
	const listenObj: { [key: string]: any } = {
		unListenClientCommand: null,
		unListenServerOutPut: null,
		unListenServerThreadId: null,
		unListenStartStopServer: null,
		server_thread_id: ref(null),
		async listenClientCommand() {
			const unListen = await listen<ClientCommandEvent>("client-command-event", async event => {
				const payload = event.payload;
				const room = mainStore.roomProfiles.find(item => item.id === payload.instanceId);
				if (!room) return;
				const runtime = getRoomRuntime(room.id);
				if (payload.eventType !== "started" && cancelledRuns.delete(payload.runId)) {
					stoppingRuns.delete(payload.runId);
					return;
				}
				if (payload.eventType === "started") {
					if (cancelledRuns.delete(payload.runId) || payload.runId !== runtime.runId) {
						if (payload.childId) {
							stoppingRuns.add(payload.runId);
							const [stopError, stopped] = await ATJ(invoke<boolean>("stop_command", { child_id: payload.childId }));
							if (stopError || !stopped) {
								console.error(`停止房间“${room.name}”的过期启动实例失败`, stopError);
								if (payload.runId === runtime.runId) {
									stoppingRuns.delete(payload.runId);
									runtime.childId = payload.childId;
									runtime.isStart = true;
									runtime.startLoading = false;
									runtime.error = "取消启动 EasyTier 内核失败";
									await updateTrayRoomStatus();
								}
							}
						}
						return;
					}
					runtime.childId = payload.childId || null;
					runtime.isStart = true;
					runtime.startLoading = false;
					runtime.error = "";
					if (payload.output) {
						appendRoomLog(room.id, payload.output);
					}
					startMemberTimer(room.id);
				}
				if (payload.runId !== runtime.runId) {
					stoppingRuns.delete(payload.runId);
					cancelledRuns.delete(payload.runId);
					return;
				}
				let shouldUpdateTray = payload.eventType === "started";
				if (payload.eventType === "output" && payload.output) {
					runtime.startLoading = false;
					appendRoomLog(room.id, payload.output);
					const devName = /tun device ready. dev: (.*)/g.exec(payload.output)?.[1];
					if (
						devName &&
						room.config.enableNetCardMetric &&
						room.config.netCardMetricValue >= 1 &&
						room.config.netCardMetricValue <= 9999
					) {
						try {
							await Command.create(
								"netsh",
								["interface", "ipv4", "set", "interface", devName, "metric=", `${room.config.netCardMetricValue}`],
								{ encoding: "gb2312" }
							).execute();
						} catch (err) {
							console.error(`设置房间“${room.name}”网卡跃点失败`, err);
							ElMessage.error(`房间“${room.name}”跃点设置失败`);
						}
					}
				}
				if (payload.eventType === "error") {
					shouldUpdateTray = true;
					runtime.error = payload.output || "EasyTier 内核启动失败";
					runtime.isStart = false;
					runtime.startLoading = false;
					runtime.childId = null;
					stopMemberTimer(room.id);
					await resetRoomIp(room.id);
					appendRoomLog(room.id, runtime.error);
					ElMessage.error(`房间“${room.name}”启动失败`);
				}
				if (payload.eventType === "exited") {
					shouldUpdateTray = true;
					const expectedStop = stoppingRuns.delete(payload.runId);
					runtime.isStart = false;
					runtime.startLoading = false;
					runtime.childId = null;
					stopMemberTimer(room.id);
					await resetRoomIp(room.id);
					if (!expectedStop) {
						runtime.error =
							payload.exitCode === undefined || payload.exitCode === null
								? "EasyTier 内核异常退出"
								: `EasyTier 内核异常退出，代码 ${payload.exitCode}`;
						appendRoomLog(room.id, runtime.error);
						ElMessage.error(`房间“${room.name}”异常退出`);
					}
				}
				if (shouldUpdateTray) {
					await updateTrayRoomStatus();
				}
			});
			this.unListenClientCommand = unListen;
		},
		async listenServerOutPut() {
			const unListen = await listen<string>("server-command-output", async event => {
				// console.log("server-command-output", event);
				data.serverLog = appendLimitedLog(data.serverLog, event.payload || "");
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

	const stopRoomProcess = async (roomId: string) => {
		const runtime = getRoomRuntime(roomId);
		const runId = runtime.runId;
		if (runtime.startLoading && !runtime.childId && runId) {
			cancelledRuns.add(runId);
		}
		if (runtime.childId) {
			const childId = runtime.childId;
			stoppingRuns.add(runId);
			try {
				const stopped = await invoke<boolean>("stop_command", { child_id: childId });
				if (!stopped && runtime.childId === childId) {
					stoppingRuns.delete(runId);
					runtime.error = "停止 EasyTier 内核失败";
					ElMessage.error(`房间“${mainStore.roomProfiles.find(room => room.id === roomId)?.name || ""}”停止失败`);
					return false;
				}
			} catch (err) {
				if (runtime.runId !== runId || runtime.childId !== childId) return true;
				stoppingRuns.delete(runId);
				runtime.error = "停止 EasyTier 内核失败";
				console.error(runtime.error, err);
				return false;
			}
		}
		if (runtime.runId !== runId) return true;
		stopMemberTimer(roomId);
		runtime.childId = null;
		runtime.isStart = false;
		runtime.startLoading = false;
		runtime.error = "";
		await resetRoomIp(roomId);
		return true;
	};

	const stopRoom = async (roomId: string) => {
		const stopped = await stopRoomProcess(roomId);
		await updateTrayRoomStatus();
		return stopped;
	};

	const stopAllRooms = async () => {
		const runningRooms = mainStore.roomProfiles.filter(room => {
			const runtime = getRoomRuntime(room.id);
			return runtime.isStart || runtime.startLoading || Boolean(runtime.childId);
		});
		await Promise.allSettled(runningRooms.map(room => stopRoomProcess(room.id)));
		await updateTrayRoomStatus();
	};

	const getCoreVersion = async (isClick = false) => {
		const coreVersion = await invoke("get_core_version");
		if (!coreVersion && isClick) {
			ElMessage.error("获取失败");
		}
		data.coreVersion = (coreVersion as string).replace("easytier-core ", "");
	};

	const haveNewCoreVersion = computed<boolean>(() => {
		if (!data.coreVersion) return false;
		const releaseLatestVersion = data?.releaseList?.[0]?.[0];
		if (!releaseLatestVersion) return false;
		const version = `v${/(\d+\.\d+\.\d+)/g.exec(data.coreVersion || "")?.[1]}`;
		// console.log(version, releaseLatestVersion)
		if (releaseLatestVersion != version) {
			return true;
		}
		return false;
	});

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
		// await getReleaseList();
	};

	const handleShowPublicServersDialog = async () => {
		await etWindows(
			"nodesList",
			{
				title: "公共服务器节点",
				width: 1000,
				height: 600,
				minWidth: 800,
				minHeight: 500,
				resizable: true,
				url: "#/nodesList"
			},
			(_, appWindow) => {
				data.nodesListVisible = true;
			},
			() => {
				data.nodesListVisible = false;
			}
		);
	};

	let unlistenDownload: UnlistenFn | null = null;
	let unlistenDownloadError: UnlistenFn | null = null;
	let progress = ref<number>(0);
	let size = 0;
	const handleInstallCore = async () => {
		try {
			if (hasRunningRoom.value || listenObj.server_thread_id.value) {
				return ElMessage.warning("请先停止所有房间和自建服务器");
			}
			if (!coreManagementData.data) {
				return ElMessage.error("请选择一个内核");
			}
			progress.value = 0;
			size = 0;
			data.update = true;
			await getCoreVersion();
			const [isNeedUpdate, downloadUrl, latestVersionFileName] = await checkUpdate();

			if (isNeedUpdate) {
				await reset();
				// console.error(downloadUrl);
				if (unlistenDownload) {
					await unlistenDownload();
				}
				if (unlistenDownloadError) {
					await unlistenDownloadError();
				}
				unlistenDownload = await listen<[number, number]>("download_core_progress", ({ payload }) => {
					size += payload[0];
					progress.value = Math.round((size / payload[1]) * 100);
				});
				unlistenDownloadError = await listen("download_core_progress_error", () => {
					data.update = false;
					progress.value = 0;
					size = 0;
					ElMessage.error("发生错误，请重试");
				});
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
				// console.log(el, el[0], el[2], el[3]); // el[3] 是prerelease bool值
				return el && el[0] && el[2] && !el[2].includes("gui") && (el[3] != "true" || !el[3]);
			})
		] as any;
		coreManagementData.loading = false;
		// console.log(data.releaseList);
	};

	const handleAutoStartByTask = async () => {
		if (import.meta.env.DEV) return ElMessage.warning("开发环境不支持开机自启");
		await invoke("spawn_autostart", { enabled: !mainStore.config.autoStart });
		const is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
		mainStore.config.autoStart = is_enable_by_task;
	};

	const compatibleInitAutoStart = async () => {
		try {
			let is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
			if (is_enable_by_task) {
				// 每次打开Exe重新加载一次开机自启，因为可能路径变了
				if (import.meta.env.DEV) return ElMessage.warning("开发环境不支持开机自启");
				await invoke("spawn_autostart", { enabled: false });
				await invoke("spawn_autostart", { enabled: true });
			}
			is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
			mainStore.config.autoStart = is_enable_by_task;
		} catch (err) {
			console.error(err);
			await invoke("spawn_autostart", { enabled: false });
			const is_enable_by_task = (await invoke("autostart_is_enabled")) as boolean;
			mainStore.config.autoStart = is_enable_by_task;
		}
	};

	// const compatibleIpv6Listener = async () => {
	// 	// ipv6监听在后续版本合并到customListenner里了，这里做兼容处理，去掉IPV6监听
	// 	const customListenerV4 = mainStore.config.customListenerData
	// 				.trim()
	// 				.split("\n")
	// 				.map(el => el.trim())
	// 				.filter(el => el);
	// 	const udpv6 = customListenerV4.indexOf("udp://[::]:11010")
	// 	const tcpv6 = customListenerV4.indexOf("tcp://[::]:11010")
	// 	if (udpv6 != -1) {
	// 		customListenerV4.splice(udpv6, 1);
	// 	}
	// 	if (tcpv6 != -1) {
	// 		customListenerV4.splice(tcpv6, 1);
	// 	}
	// 	mainStore.config.customListenerData = customListenerV4.join("\n");
	// };

	const initConnectAfterStart = async () => {
		if (!data.coreVersion) return;
		for (const room of mainStore.roomProfiles) {
			if (room.config.connectAfterStart && !getRoomRuntime(room.id).isStart) {
				await handleConnection(room.id);
			}
		}
	};

	// 多选serverUrl兼容
	const compatibleInitServerUrl = async () => {
		for (const room of mainStore.roomProfiles) {
			if (typeof room.config.serverUrl == "string") {
				room.config.serverUrl = [room.config.serverUrl || ""];
			}
		}
		mainStore.applyRoomProfile(mainStore.activeRoomId);
	};

	const initRoomGuiConfigs = async () => {
		try {
			const roomProfiles = await loadRoomGuiConfigs();
			if (roomProfiles.length <= 0) return false;
			const preferredActiveRoomId = mainStore.activeRoomId;
			mainStore.replaceRoomProfiles(roomProfiles, preferredActiveRoomId);
			const roomIds = new Set(mainStore.roomProfiles.map(room => room.id));
			for (const roomId of Object.keys(roomRuntimes)) {
				if (!roomIds.has(roomId)) {
					delete roomRuntimes[roomId];
				}
			}
			mainStore.roomProfiles.forEach(room => getRoomRuntime(room.id));
			console.log(`已从 gui_config 文件夹加载 ${roomProfiles.length} 个房间配置`);
			return true;
		} catch (error) {
			console.error("读取 gui_config 文件夹失败，回退到旧配置", error);
			ElMessage.error("读取 gui_config 文件夹失败，已回退到旧配置");
			return false;
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
					// console.log(guiJsonStr);
					// const regex = /^(\s*\/\/.*)/gm;
					// const regex2 = /(,?)\s*\/\/.*(?=\n|$|\r\n)/gm;
					// const resultStr = guiJsonStr.replace(regex, "").replace(regex2, "$1");
					// console.log(resultStr);
					const guiJson = JSON.parse(guiJsonStr);
					let saveServerUrl = [];
					if (guiJson.serverUrl) {
						if (Array.isArray(guiJson.serverUrl)) {
							mainStore.basePeers = uniq([...guiJson.serverUrl, ...mainStore.basePeers]);
							saveServerUrl = uniq([...guiJson.serverUrl]);
						}
						if (typeof guiJson.serverUrl === "string") {
							mainStore.basePeers = uniq([...guiJson.serverUrl.split(","), ...mainStore.basePeers]);
							saveServerUrl = [mainStore.basePeers[0] || ""];
							guiJson.serverUrl = guiJson.serverUrl ? guiJson.serverUrl.split(",") : [];
						}
					} else {
						saveServerUrl = [mainStore.basePeers.length > 0 ? mainStore.basePeers[0] || "" : ""];
					}
					data.configJsonSeverUrl = [...guiJson.serverUrl] as any;
					if (guiJson.enableKcpProxy && guiJson.enableQuicProxy) {
						// 如果同时开启kcp代理和quic代理，则禁用quic代理
						guiJson.enableQuicProxy = false;
					}
					mainStore.$patch({
						config: {
							...mainStore.config,
							...guiJson,
							customListenerData: guiJson?.customListenerData.join("\n") || "",
							serverUrl: saveServerUrl
						}
					});
					mainStore.saveActiveRoomProfile();
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

	const recoverRunningRooms = async () => {
		try {
			const runningInstances = await invoke<Record<string, RunningClientInstance>>("get_running_instances");
			for (const room of mainStore.roomProfiles) {
				const instance = runningInstances[room.id];
				if (!instance?.childId) continue;
				const runtime = getRoomRuntime(room.id);
				runtime.childId = instance.childId;
				runtime.runId = instance.runId;
				runtime.isStart = true;
				runtime.startLoading = false;
				runtime.error = "";
				startMemberTimer(room.id);
			}
			await updateTrayRoomStatus();
		} catch (error) {
			console.error("恢复多房间运行状态失败", error);
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
		const appWindow = getCurrentWindow();
		const scaleFactor = await appWindow.scaleFactor();
		const size = new PhysicalSize(
			Math.ceil(MAIN_WINDOW_LOGICAL_SIZE.width * scaleFactor),
			Math.ceil(MAIN_WINDOW_LOGICAL_SIZE.height * scaleFactor)
		);
		appWindow.setSize(size);
		appWindow.onScaleChanged(({ payload: { scaleFactor } }) => {
			console.log("scaleFactor", scaleFactor);
			appWindow.setSize(
				new PhysicalSize(
					Math.ceil(MAIN_WINDOW_LOGICAL_SIZE.width * scaleFactor),
					Math.ceil(MAIN_WINDOW_LOGICAL_SIZE.height * scaleFactor)
				)
			);
		});
	};

	let logsTimer: number | null = null;
	let serverLogsTimer: number | null = null;
	let cidrTimer: number | null = null;

	onMounted(async () => {
		const loadedFromGuiConfig = await initRoomGuiConfigs();
		await compatibleInitServerUrl();
		if (!loadedFromGuiConfig) {
			await initGuiJson();
		}
		mainStore.saveActiveRoomProfile();
		if (!loadedFromGuiConfig) {
			try {
				await saveRoomGuiConfigs(mainStore.roomProfiles);
			} catch (error) {
				console.error("迁移旧配置到 gui_config 文件夹失败", error);
				ElMessage.error("迁移旧配置到 gui_config 文件夹失败");
			}
		}
		await compatibleInitAutoStart();
		// await initAutoStart();
		// await initStartWinIpBroadcast();  // 对于三层tun而言，winipbroadcast没有作用，先禁用
		await getCoreVersion();
		await listenObj.listenClientCommand();
		await recoverRunningRooms();
		await listenObj.listenServerThreadId();
		await listenObj.listenStartStopServer();
		await initConfigDir();
		await initAutoStartServer();
		await initConnectAfterStart();
		initPreventSleep();
		mountedShow(); // 不需要await
		closePrevent();
		if (import.meta.env.PROD) {
			getReleaseList();
			checkNewVersion();
		}
		await storageDialog();
	});

	// storageEventEmitter.addEventListener("localStorageChange", () => {
	// 	if(mainStore.createConfigInEasytier) {
	// 		updateConfigJsonBounce(data.configJsonSeverUrl)
	// 	}
	// })

	dataSubscribe(null, () => {
		return data.configJsonSeverUrl;
	});

	onBeforeUnmount(() => {
		mainStore.saveActiveRoomProfile();
		roomProfileSaveTimer && clearTimeout(roomProfileSaveTimer);
		listenObj.unListenClientCommand && listenObj.unListenClientCommand();
		listenObj.unListenReleaseList && listenObj.unListenReleaseList();
		listenObj.unListenStartStopServer && listenObj.unListenStartStopServer();
		Object.keys(memberTimerGenerations).forEach(stopMemberTimer);
		Object.keys(reconnectTimers).forEach(clearReconnectTimer);
		logsTimer && clearInterval(logsTimer);
		serverLogsTimer && clearInterval(serverLogsTimer);
		cidrTimer && clearInterval(cidrTimer);
		stopPreventSleep();
		// unListenStorage && unListenStorage();
	});

	const getArgs = async (roomId: string) => {
		const room = mainStore.roomProfiles.find(item => item.id === roomId);
		if (!room) return [];
		const config = room.config;
		const args: string[] = [];
		if (room.configStartEnable) {
			if (room.configPath) {
				const isExists = await exists(room.configPath, { baseDir: BaseDirectory.Resource });
				if (isExists) {
					const resourceDir = await getResourceDir();
					const configPath = await join(resourceDir, room.configPath);
					args.push("-c", configPath);
				} else {
					room.configPath = "";
					if (mainStore.activeRoomId === roomId) {
						mainStore.configPath = "";
						const appWindow = getCurrentWindow();
						const isVisible = await appWindow.isVisible();
						if (!isVisible) {
							await appWindow.show();
							await appWindow.setFocus();
						}
						await handleStartCommand("toml");
					}
					ElMessage.error(`房间“${room.name}”的配置文件不存在，请重新选择`);
					return [];
				}
			} else {
				ElMessage.warning(`房间“${room.name}”尚未选择配置文件`);
				if (mainStore.activeRoomId === roomId) {
					await handleStartCommand("toml");
				}
				return [];
			}
		}
		if (room.configStartEnable) {
			args.push("--rpc-portal", `${room.rpcPortal}`, "--instance-name", room.id);
			return args;
		}

		if (config.serverUrl?.length <= 0) {
			ElMessage.warning(`房间“${room.name}”请至少选择一个服务器`);
			return [];
		}
		if (config.protocol?.length <= 0) {
			ElMessage.warning(`房间“${room.name}”请至少选择一个协议`);
			return [];
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
			const formatUrlArr = config.serverUrl.map((url: string) => url.replace(/\\/g, "/"));
			args.push("--peers", ...mixedArray(config.protocol, formatUrlArr, "://"));
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
			args.push("--disable-ipv6", "true");
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

		if (!config.disbleListenner && !config.enableCustomListener && config.port) {
			args.push("-l", config.port);
		}
		if (room.cidrEnable && config.proxyNetworks) {
			const formatProxyNetworks = config.proxyNetworks.trim().split("\n");
			const newformatProxyNetworks = formatProxyNetworks
				.map(el => el.trim())
				.filter(cidr => {
					return /^\d+\.\d+\.\d+\.\d+\/\d+$/g.test(cidr);
				});
			if (newformatProxyNetworks.length > 0) {
				for(const cidr of newformatProxyNetworks) {
					args.push("-n", cidr);
				}
			}
			config.proxyNetworks = formatProxyNetworks.join("\n");
			if (mainStore.activeRoomId === roomId) {
				mainStore.config.proxyNetworks = config.proxyNetworks;
			}
		}
		if (config.disableEncryption) {
			args.push("--disable-encryption", "true");
		}
		if (config.multiThread) {
			args.push("--multi-thread", "true");
		}
		if (config.enablExitNode) {
			args.push("--enable-exit-node", "true");
		}
		if (config.noTun) {
			args.push("--no-tun", "true");
		}
		if (config.latencyfirst) {
			args.push("--latency-first", "true");
		}
		if (config.useSmoltcp) {
			args.push("--use-smoltcp", "true");
		}
		if (config.disableUdpHolePunching) {
			args.push("--disable-udp-hole-punching", "true");
		}
		if (config.relayAllPeerrpc) {
			args.push("--relay-all-peer-rpc", "true");
		}
		if (config.saveErrorLog) {
			args.push("--file-log-level", config.logLevel, "--file-log-dir", `${import.meta.env.VITE_LOG_PATH}${room.id}`);
		}
		if (config.devName && config.devNameValue) {
			args.push("--dev-name", config.devNameValue);
		}
		if (config.compression && config.compression != "none") {
			args.push("--compression", config.compression);
		}
		if (config.enableKcpProxy) {
			args.push("--enable-kcp-proxy", "true");
		}
		if (config.disableKcpInput) {
			args.push("--disable-kcp-input", "true");
		}
		if (config.enableQuicProxy) {
			args.push("--enable-quic-proxy", "true");
		}
		if (config.disableQuicInput) {
			args.push("--disable-quic-input", "true");
		}
		if (config.enableUdpBroadcastRelay) {
			args.push("--enable-udp-broadcast-relay", "true");
		}
		if (!config.enableUpnp) {
			args.push("--disable-upnp", "true");
		}
		if (config.ipv6PublicAddrProvider) {
			args.push("--ipv6-public-addr-provider", "true");
		}
		if (config.ipv6PublicAddrAuto) {
			args.push("--ipv6-public-addr-auto", "true");
		}
		if (config.disableRelayData) {
			args.push("--disable-relay-data", "true");
		}
		if (config.bindDeviceEnable) {
			args.push("--bind-device", "true");
		}
		if (room.proxyForwardBySystem) {
			args.push("--proxy-forward-by-system", "true");
		}
		if (config.acceptDNS) {
			args.push("--accept-dns", "true");
		}
		if (config.enablePortForward) {
			const formatPortForward = config.portForwardData.trim().split("\n");
			const newformatPortForward = formatPortForward.map(el => el.trim()).filter(el => el);
			if (newformatPortForward.length > 0) {
				newformatPortForward.map(el => {
					args.push("--port-forward", el);
				});
			}
		}
		if (config.privateMode) {
			args.push("--private-mode", "true");
		}
		if (config.ipv6 && !config.disableIpv6) {
			args.push("--ipv6", config.ipv6.trim());
		}
		const tcpWhitelist = config.tcpWhitelist.trim();
		if (config.tcpWhitelistEnable && tcpWhitelist) {
			args.push("--tcp-whitelist", tcpWhitelist);
		}
		const udpWhitelist = config.udpWhitelist.trim();
		if (config.udpWhitelistEnable && udpWhitelist) {
			args.push("--udp-whitelist", udpWhitelist);
		}
		args.push("--rpc-portal", `${room.rpcPortal}`, "--instance-name", room.id);
		return args;
	};

	const closeRoomDetailWindows = async () => {
		const memberDialog = await getAllWebviewWindows();
		const memberDialogs = memberDialog.filter(item => item.label === "member" || item.label === "cidr");
		if (memberDialogs && memberDialogs.length > 0) {
			data.memberVisible = false;
			for (const memberDialog of memberDialogs) {
				const isVisible = await memberDialog.isVisible();
				if (isVisible) {
					await memberDialog.destroy();
				}
			}
		}
	};

	const reset = async (roomId: string = mainStore.activeRoomId) => {
		if (roomId === mainStore.activeRoomId) {
			await closeRoomDetailWindows();
		}
		await stopRoom(roomId);
	};

	const updateRoomConnectAfterStart = (room: (typeof mainStore.roomProfiles)[number], enabled: boolean) => {
		room.config.connectAfterStart = enabled;
		if (room.id === mainStore.activeRoomId) {
			mainStore.config.connectAfterStart = enabled;
			mainStore.saveActiveRoomProfile();
		} else {
			room.updatedAt = Date.now();
		}
	};

	const handleConnection = async (roomId: string = mainStore.activeRoomId) => {
		clearReconnectTimer(roomId);
		if (roomId === mainStore.activeRoomId) {
			mainStore.saveActiveRoomProfile();
		}
		const room = mainStore.roomProfiles.find(item => item.id === roomId);
		if (!room) return;
		const runtime = getRoomRuntime(roomId);
		if (runtime.startLoading) {
			ElMessage.info(`房间“${room.name}”正在启动，请稍候`);
			return;
		}
		if (runtime.isStart) {
			const previousConnectAfterStart = room.config.connectAfterStart;
			updateRoomConnectAfterStart(room, false);
			try {
				// 先持久化停止意图，写入失败时不停止进程，避免下次启动仍被旧文件自动拉起。
				await saveRoomProfileFile(room);
			} catch (error) {
				updateRoomConnectAfterStart(room, previousConnectAfterStart);
				console.error(`停止房间“${room.name}”前保存自动启动状态失败`, error);
				ElMessage.error(`房间“${room.name}”配置保存失败，已取消停止`);
				return;
			}
			await reset(roomId);
		} else {
			runtime.error = "";
			const args = await getArgs(roomId);
			if (!args || args.length <= 0) {
				await reset(roomId);
				return;
			}
			const previousConnectAfterStart = room.config.connectAfterStart;
			updateRoomConnectAfterStart(room, true);
			try {
				// 手动启动即代表下次仍需启动，必须在拉起进程前写入，防止软件立即重启时丢失意图。
				await saveRoomProfileFile(room);
			} catch (error) {
				updateRoomConnectAfterStart(room, previousConnectAfterStart);
				console.error(`启动房间“${room.name}”前保存自动启动状态失败`, error);
				ElMessage.error(`房间“${room.name}”配置保存失败，已取消启动`);
				return;
			}
			if (args[0] === "-c") {
				ElMessage.warning({
					message: `房间“${room.name}”使用外部配置文件启动`,
					duration: 5000
				});
			}
			runtime.log = "";
			runtime.runId = `${room.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
			runtime.startLoading = true;
			runtime.isStart = true;
			await updateTrayRoomStatus();
			try {
				await invoke("run_command", {
					args,
					instance_id: room.id,
					run_id: runtime.runId
				});
			} catch (err) {
				runtime.isStart = false;
				runtime.startLoading = false;
				runtime.error = "请求启动 EasyTier 内核失败";
				appendRoomLog(room.id, `${runtime.error}: ${err}`);
				updateRoomConnectAfterStart(room, previousConnectAfterStart);
				try {
					await saveRoomProfileFile(room);
				} catch (saveError) {
					console.error(`房间“${room.name}”启动失败后恢复自动启动状态失败`, saveError);
					ElMessage.error(`房间“${room.name}”自动启动状态恢复失败`);
				}
				await updateTrayRoomStatus();
				ElMessage.error(`房间“${room.name}”启动失败`);
			}
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
					enablePreventSleep,
					enableKcpProxy,
					disableKcpInput,
					enableQuicProxy,
					disableQuicInput,
					privateMode
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
								enablePreventSleep,
								enableKcpProxy,
								disableKcpInput,
								enableQuicProxy,
								disableQuicInput,
								privateMode
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
		if (command === "cidr") {
			await handleShowCidrDialog();
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
			mainStore.saveActiveRoomProfile();
			const room = mainStore.activeRoomProfile;
			if (!room) return;
			const config = btoa(
				encodeURIComponent(
					JSON.stringify({
						version: 2,
						room: {
							config: room.config,
							cidrEnable: room.cidrEnable,
							proxyForwardBySystem: room.proxyForwardBySystem,
							configStartEnable: room.configStartEnable,
							configPath: room.configPath
						}
					})
				)
			);
			const [error, { value = "" } = {}] = await ATJ(
				ElMessageBox.prompt("请输入配置的存储名", "提示", {
					confirmButtonText: "保存",
					cancelButtonText: "取消",
					inputPlaceholder: "请输入2个字以上的存储名",
					closeOnPressEscape: false,
					closeOnClickModal: false,
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

		if (command === "game_start_config") {
			await etWindows(
				"gameList",
				{
					title: "本地游戏列表",
					width: 800,
					height: 400,
					minWidth: 800,
					minHeight: 400,
					resizable: true,
					url: "#/gameList"
				},
				(_, appWindow) => {
					data.gameListVisible = true;
				},
				() => {
					data.gameListVisible = false;
				}
			);
		}

		if (command === "reconnect") {
			handleReconnect();
		}
	};

	const handleReconnect = async () => {
		const roomId = mainStore.activeRoomId;
		clearReconnectTimer(roomId);
		if (activeRoomRuntime.value.isStart || activeRoomRuntime.value.startLoading) {
			ElMessage.info({
				message: `正在重新连接房间“${mainStore.activeRoomProfile?.name || ""}”...`,
				duration: 2200
			});
			const stopped = await stopRoom(roomId);
			if (!stopped) return;
			reconnectTimers[roomId] = window.setTimeout(() => {
				delete reconnectTimers[roomId];
				const runtime = getRoomRuntime(roomId);
				if (!runtime.isStart && !runtime.startLoading) {
					void handleConnection(roomId);
				}
			}, 2000);
		} else {
			await handleConnection(roomId);
		}
	};

	const handleDeleteAdminConfig = async () => {
		const path = configAdminData.fileName;
		if (!path) return ElMessage.warning("请选择配置");
		const [err] = await ElConfirmDanger("确定{action}选中的配置吗?", "提示", {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			action: "删除"
		});
		if (err) return;
		try {
			await removeFile(path, { baseDir: BaseDirectory.Resource });
			ElMessage.success("删除成功");
			configAdminData.fileName = "";
			await handleStartCommand("config_admin");
		} catch (err) {
			ElMessage.error("删除配置失败");
			console.log(err);
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
			if (activeRoomRuntime.value.isStart) {
				ElMessage.warning("正在停止当前房间...");
				await reset();
			}
			const payload = JSON.parse(decodeURIComponent(atob(decoder.decode(base64U8Arrray))));
			const savedRoom = payload.version === 2 && payload.room ? payload.room : payload;
			mainStore.$patch({
				config: {
					...mainStore.config,
					...(savedRoom.config || {})
				},
				cidrEnable: savedRoom.cidrEnable ?? mainStore.cidrEnable,
				proxyForwardBySystem: savedRoom.proxyForwardBySystem ?? mainStore.proxyForwardBySystem,
				configStartEnable: savedRoom.configStartEnable ?? mainStore.configStartEnable,
				configPath: savedRoom.configPath ?? mainStore.configPath
			});
			mainStore.saveActiveRoomProfile();
			ElMessage.success("当前房间配置切换成功");
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
			payload.config.serverUrl = Array.isArray(payload?.config?.serverUrl)
				? payload?.config?.serverUrl
				: typeof payload?.config?.serverUrl == "string"
					? payload?.config?.serverUrl.split(",")
					: typeof mainStore.config.serverUrl == "string"
						? [mainStore.config.serverUrl]
						: [];
			mainStore.$patch({
				config: {
					...mainStore.config,
					...payload.config
				}
			});
			mainStore.saveActiveRoomProfile();
			ElMessage.success("导入成功");
			importConfigData.visible = false;
			mainStore.basePeers = uniq([...(mainStore.config.serverUrl || []), ...mainStore.basePeers].filter(el => el.trim()));
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
			mainStore.saveActiveRoomProfile();
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
		if (!activeRoomRuntime.value.isStart) {
			return ElMessage.warning("请先启动联机");
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
					appWindow.emitTo({ kind: "WebviewWindow", label: "log" }, "logs", activeRoomRuntime.value.log);
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
					appWindow.emitTo({ kind: "WebviewWindow", label: "cidr" }, "route", activeRoomRuntime.value.isStart);
				}, 650);
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

	const storageDialog = async () => {
		await etWindows(
			"storage-listener",
			{
				title: "存储监听",
				minWidth: 0,
				minHeight: 0,
				width: 0,
				height: 0,
				x: 9999,
				y: 9999,
				resizable: false,
				transparent: true,
				hiddenTitle: true,
				alwaysOnBottom: true,
				visible: false,
				url: "#/storage-listener"
			},
			dialog => {
				dialog.hide();
			}
		);
	};
</script>
