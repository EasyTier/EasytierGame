<template>
	<div class="flex h-full flex-col items-start overflow-auto px-[25px]">
		<div class="flex flex-nowrap items-center gap-[15px]">
			<div class="flex flex-nowrap items-center gap-[5px]">
				<ElCheckbox v-model="mainStore.config.enableCustomProtocol">直连(P2P)优先使用传输协议</ElCheckbox>
				<ElTooltip content="若无法建立指定的协议，会自动使用可建立连接的协议">
					<ElIcon><QuestionFilled /></ElIcon>
				</ElTooltip>
			</div>
			<div class="w-[80px]">
				<ElSelect
					size="small"
					v-model="mainStore.config.customProtocol"
					placeholder="请选择协议"
					class="ml-[5px]"
				>
					<ElOption
						v-for="item in protocols"
						:key="item"
						:label="`${item}`"
						:value="item"
					></ElOption>
				</ElSelect>
			</div>
		</div>
		<div>
			<ElCheckbox v-model="mainStore.config.relayAllPeerrpc">帮助他人建立直连(P2P)连接</ElCheckbox>
		</div>
		<div><ElCheckbox v-model="mainStore.config.connectAfterStart">软件启动后，自动"启动联机"(搭配开机自启，无感联机)</ElCheckbox></div>
		<div class="flex flex-nowrap items-center gap-[15px]">
			<ElCheckbox v-model="mainStore.createConfigInEasytier">自动生成界面配置文件easytier/config.json</ElCheckbox>
			<ElButton
				@click="openConfigJsonDir"
				size="small"
			>
				打开config.json目录
			</ElButton>
		</div>
		<div><ElCheckbox v-model="mainStore.config.enablePreventSleep">防止系统休眠(比如:屏幕会一直亮着)</ElCheckbox></div>
		<div class="flex flex-nowrap items-center gap-[5px]">
			<ElCheckbox v-model="mainStore.config.latencyfirst">使用低延迟模式</ElCheckbox>
			<ElTooltip content="弱网环境下可能会导致网络延迟延迟忽高忽低">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div class="flex flex-nowrap items-center gap-[5px]">
			<ElCheckbox v-model="mainStore.config.enableKcpProxy">启用KCP代理</ElCheckbox>
			<ElTooltip content="将TCP流量转为KCP流量，降低传输延迟，提升传输速度">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
			<CoreVersionWarning version="2.2.0" />
		</div>
		<div class="flex flex-nowrap items-center gap-[5px]">
			<ElCheckbox v-model="mainStore.config.disableKcpInput">禁用KCP输入</ElCheckbox>
			<ElTooltip content="禁用KCP入站流量，其他开启KCP代理的节点无法连接到本节点">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
			<CoreVersionWarning version="2.2.0" />
		</div>
		<div><ElCheckbox v-model="mainStore.config.disableUdpHolePunching">禁用UDP打洞功能</ElCheckbox></div>
		<div><ElCheckbox v-model="mainStore.config.disableIpv6">不使用IPv6</ElCheckbox></div>
		<ElDivider />
		<div class="flex items-center gap-[10px]">
			<ElCheckbox v-model="mainStore.config.disbleListenner">不监听任何端口，只连接到对等节点</ElCheckbox>
			<ElTooltip content="无法联机时，可以尝试开启这个选项">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div class="flex items-center gap-[10px]">
			<ElText
				class="flex-shrink-0"
				size="small"
			>
				监听端口
			</ElText>
			<ElInput
				:disabled="mainStore.config.disbleListenner || mainStore.config.enableCustomListener"
				size="small"
				:maxlength="10"
				v-model="mainStore.config.port"
				placeholder="请输入端口号"
			/>
		</div>
		<div class="flex items-center gap-[10px]">
			<ElCheckbox
				:disabled="mainStore.config.disbleListenner"
				v-model="mainStore.config.enableCustomListener"
			>
				自定义监听地址
			</ElCheckbox>
			<ElButton
				size="small"
				:disabled="mainStore.config.disbleListenner"
				@click="handleListenerDialog"
			>
				填写
			</ElButton>
			<ElDialog
				width="95%"
				top="10px"
				append-to-body
				:z-index="10"
				class="!mb-0"
				v-model="listenerDialogData.visible"
				:close-on-press-escape="false"
				title="自定义监听地址"
			>
				<ElInput
					type="textarea"
					:rows="8"
					placeholder="请输入监听地址一行一个"
					v-model="mainStore.config.customListenerData"
				></ElInput>
				<template #footer>
					<div class="text-right">
						<ElButton
							size="default"
							@click="handleFinishInputListener"
							type="primary"
						>
							确定
						</ElButton>
					</div>
				</template>
			</ElDialog>
		</div>
		<!-- <div class="flex items-center gap-[10px]">
			<ElCheckbox
				:disabled="mainStore.config.disbleListenner"
				:model-value="mainStore.config.enableCustomListenerV6"
				@change="handleCustomListenerV6Change"
			>
				自定义IPV6监听地址
			</ElCheckbox>
			<div class="w-[200px]">
				<ElInput
					:disabled="mainStore.config.disbleListenner || mainStore.config.enableCustomListenerV6"
					size="small"
					:maxlength="100"
					v-model="mainStore.config.customListenerV6Data"
					placeholder="请输入自定义IPV6监听地址"
				/>
			</div>
			<ElTooltip content="例如：tcp://[::]:11010，如果未设置，将在随机UDP端口上监听(内核版本2.2.3之后，ipv6监听被移除并合并到'自定义监听')">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
			<CoreVersionWarning version="2.1.0" />
		</div> -->
		<ElDivider />
		<div class="flex items-center gap-[10px]">
			<ElCheckbox v-model="mainStore.config.devName">自定义虚拟网卡名称</ElCheckbox>
			<ElInput
				size="small"
				maxlength="10"
				v-model="mainStore.config.devNameValue"
				placeholder="请输入虚拟网卡名称"
			/>
		</div>
		<div class="flex items-center gap-[10px]">
			<ElCheckbox v-model="mainStore.config.enableNetCardMetric">自定义虚拟网卡优先级</ElCheckbox>
			<ElInputNumber
				controls-position="right"
				:min="1"
				:value-on-clear="1"
				:max="9999"
				:step="1"
				:precision="0"
				size="small"
				v-model="mainStore.config.netCardMetricValue"
				placeholder="请输入优先级"
			/>
			<ElTooltip content="数值越小，优先级越高">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div>
			<ElText
				size="small"
				type="warning"
			>
				(不使用自定义虚拟网卡名称,那么联机时默认会生成一个名为 "et_xxx" 的网卡，也可以使用 “自定义虚拟网卡优先级”
				功能，除非你启用了下面的功能)
			</ElText>
		</div>

		<div class="flex items-center gap-[5px]">
			<ElCheckbox v-model="mainStore.config.noTun">不创建TUN虚拟网卡</ElCheckbox>

			<ElTooltip content="开启后该节点无法主动访问其他节点">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>

		<div class="flex items-center gap-[5px]">
			<div><ElCheckbox v-model="mainStore.config.bindDeviceEnable">绑定物理网卡</ElCheckbox></div>
			<!-- <div class="flex items-center gap-[5px]"> -->
			<!-- <ElSelect
					placeholder="选择设备"
					v-model="mainStore.config.bindDevice"
					filterable
					no-data-text="暂无网卡设备数据，请刷新"
				>
					<ElOption
						v-for="guid in guids"
						:key="guid[0]"
						:label="guid[1]"
						:value="guid[0]"
					></ElOption>
				</ElSelect> -->
			<!-- <ElButton @click="getGuids">刷新</ElButton> -->
			<ElTooltip content="将连接器的套接字绑定到物理设备以避免路由问题。比如子网代理网段与某节点的网段冲突，绑定物理设备后可以与该节点正常通信">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
			<!-- </div> -->
			<CoreVersionWarning version="2.2.3" />
		</div>

		<ElDivider />
		<div><ElCheckbox v-model="mainStore.config.enablExitNode">允许此节点成为出口节点</ElCheckbox></div>
		<div class="flex items-center gap-[5px]">
			<ElCheckbox v-model="mainStore.config.disableEncryption">关闭信息加密</ElCheckbox>
			<ElTooltip content="关闭后通信数据将在互联网上明文传输，如房间名和密码">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div class="flex items-center gap-[5px]">
			<ElCheckbox v-model="mainStore.config.multiThread">开启多线程</ElCheckbox>
			<ElTooltip content="开启后可能会提高网络性能">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div class="flex items-center gap-[10px]">
			<ElText>传输数据压缩算法</ElText>
			<div class="w-[160px]">
				<ElSelect
					size="small"
					v-model="mainStore.config.compression"
					placeholder="请选择压缩算法"
				>
					<ElOption
						v-for="item in [
							['none', '不压缩(游戏联机推荐)'],
							['zstd', 'zstd算法']
						]"
						:key="item[0]"
						:label="item[1]"
						:value="item[0]"
					></ElOption>
				</ElSelect>
			</div>
			<CoreVersionWarning version="2.1.0" />
		</div>
		<ElDivider />

		<div class="flex items-center gap-[10px]">
			<ElCheckbox v-model="mainStore.config.useSmoltcp">为子网代理和 KCP 代理开启用户网络栈</ElCheckbox>
			<ElTooltip content="开启后会降低网络性能，但不需要配置防火墙">
				<ElIcon><QuestionFilled /></ElIcon>
			</ElTooltip>
		</div>
		<div class="flex flex-nowrap items-center gap-[15px]">
			<ElCheckbox v-model="mainStore.config.saveErrorLog">输出日志到本地</ElCheckbox>
			<div class="w-[140px]">
				<ElSelect
					size="small"
					v-model="mainStore.config.logLevel"
					placeholder="请选择日志等级"
					class="ml-[5px]"
				>
					<ElOption
						v-for="item in data"
						:key="item"
						:label="`level - ${item}`"
						:value="item"
					></ElOption>
				</ElSelect>
			</div>
			<ElButton
				@click="openLogDir"
				size="small"
			>
				打开日志目录
			</ElButton>
		</div>
	</div>
</template>
<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { QuestionFilled } from "@element-plus/icons-vue";
	import { resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
	import { Command } from "@tauri-apps/plugin-shell";
	import { exists, mkdir, BaseDirectory, remove } from "@tauri-apps/plugin-fs";
	import { ElMessage } from "element-plus";
	import { reactive, ref } from "vue";
	import { dataSubscribe } from "@/composables/windows";
	import { ATJ, supportProtocols } from "~/utils";
	import CoreVersionWarning from "@/components/CoreVersionWarning.vue";
	import { ElConfirmDanger } from "~/utils/element";
	import { invoke } from "@tauri-apps/api/core";

	const protocols = supportProtocols();
	const listenerDialogData = reactive<{ [key: string]: any }>({
		visible: false,
		loading: false
	});

	const handleListenerDialog = () => {
		listenerDialogData.visible = true;
	};

	const handleFinishInputListener = async () => {
		listenerDialogData.visible = false;
	};

	// const handleCustomListenerV6Change = async (value: boolean) => {
	// 	if (value) {
	// 		const [error, _] = await ElConfirmDanger("内核版本2.2.3之后，ipv6监听被移除并合并到'自定义监听'，请谨慎使用", "警告", {
	// 			confirmButtonText: "继续使用",
	// 			cancelButtonText: "取消"
	// 		});
	// 		if (!error) {
	// 			mainStore.config.enableCustomListenerV6 = value;
	// 		}
	// 	} else {
	// 		mainStore.config.enableCustomListenerV6 = value;
	// 	}
	// };

	const mainStore = useMainStore();
	const data = ["trace", "debug", "info", "warn", "error", "off"];
	const guids = ref<string[][]>([]);
	const openLogDir = async () => {
		const resourceDir = await getResourceDir();
		const logPath = import.meta.env.VITE_LOG_PATH;
		const logDirPath = await join(resourceDir, logPath);
		const isExists = await exists(logPath, { baseDir: BaseDirectory.Resource });
		if (!isExists) {
			try {
				await mkdir(logPath, { baseDir: BaseDirectory.Resource });
			} catch (err) {}
		}
		await Command.create("explorer", [logDirPath]).execute();
	};

	const openConfigJsonDir = async () => {
		const resourceDir = await getResourceDir();
		const easytierDir = await join(resourceDir, "easytier/");
		const isExists = await exists("easytier/", { baseDir: BaseDirectory.Resource });
		if (isExists) {
			await Command.create("explorer", [easytierDir]).execute();
		} else {
			ElMessage.error("config.json的目录不存在");
		}
	};

	// 为bind_device功能增加改方法
	const getGuids = async () => {
		const guidsValue = await invoke<string[][]>("get_network_adapter_guids");
		guids.value = guidsValue && guidsValue.length > 0 ? guidsValue : [];
	};

	dataSubscribe(async () => {
		if (!mainStore.createConfigInEasytier) {
			// 考虑删除本地config.json文件
			const configJsonPath = import.meta.env.VITE_CONFIG_FILE_NAME;
			const isExists = await exists(configJsonPath, { baseDir: BaseDirectory.Resource });
			// console.log({ isExists });
			if (isExists) {
				const [error, _] = await ElConfirmDanger("生成配置文件功能被关闭,是否删除本地config.json", "提示", {
					confirmButtonText: "删除",
					cancelButtonText: "保留"
				});
				if (!error) {
					// 删除本地config.json文件
					const [error, _] = await ATJ(remove(configJsonPath, { baseDir: BaseDirectory.Resource }));
					if (error) {
						ElMessage.error("删除失败，请打开目录手动删除");
					}
				}
			}
		}
	});
</script>
