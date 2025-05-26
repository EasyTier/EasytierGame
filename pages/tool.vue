<template>
	<div class="h-full overflow-auto">
		<ElTabs
			v-model="data.activeTab"
			@tab-change="handleTabsChange"
			class="h-full"
		>
			<ElTabPane
				label="联机失败解决办法"
				name="netcard"
				class="flex h-full flex-col"
			>
				<div>
					<div>
						<ElTooltip
							content="找不到游戏房间时，就开启它后再尝试搜索房间(默认开启)
                        例如: 一个游戏玩家，有时通过本地局域网联机，有时通过某些联机工具进行联机，但是他只能在其中一个联机方式里看到朋友的游戏房间，而另一个里看不到，这时就可以使用这个工具，让他在两个地方都能看到游戏房间"
						>
							<ElText>
								方案1
								<ElIcon class="ml-[3px]"><QuestionFilled /></ElIcon>
							</ElText>
						</ElTooltip>
					</div>
					<ElLink
						class="mr-[10px] !text-[15px]"
						type="info"
						underline="never"
						@click="open('https://github.com/dechamps/WinIPBroadcast/releases/tag/winipbroadcast-1.6')"
					>
						WinIPBroadcast
					</ElLink>
					<ElSwitch
						inline-prompt
						:model-value="mainStore.winipBcStart"
						@change="handleWinipBcStart"
						size="small"
						label="WinIPBroadcast"
						active-text="已开启"
						inactive-text="已关闭"
					></ElSwitch>
				</div>
				<div>
					<ElTooltip
						content="使用ForceBindIP启动应用 (强制绑定IP或者网卡)，如果还没有启动联机，请先启动联机，联机成功后，点击刷新获取easytier生成的网卡"
					>
						<ElText>
							方案2
							<ElIcon class="ml-[3px]"><QuestionFilled /></ElIcon>
						</ElText>
					</ElTooltip>
				</div>
				<div>
					<div>
						<ElLink
							class="!text-[15px]"
							type="info"
							underline="never"
							@click="open('https://r1ch.net/projects/forcebindip')"
						>
							ForceBindIP
						</ElLink>
					</div>
					<div>
						<ElRadioGroup
							class="mr-[30px]"
							v-model="mainStore.forceBindIpBit"
						>
							<ElRadio
								label="32位"
								value="32"
							></ElRadio>
							<ElRadio
								label="64位"
								value="64"
							></ElRadio>
						</ElRadioGroup>
						<ElTooltip
							placement="top"
							content="如果目标应用程序在启动时崩溃或出现其他意外行为，请尝试开启它，ForceBindIP 加载程序将等待应用程序进入其消息循环后再注入拦截 DLL"
						>
							<ElCheckbox
								v-model="mainStore.delayInjectDll"
								label="延迟注入DLL"
							></ElCheckbox>
						</ElTooltip>
					</div>
					<div class="flex items-center gap-[5px]">
						<ElSelect
							placeholder="请输入IP地址或选择网卡"
							v-model="mainStore.forceBindInput"
							filterable
							allow-create
							no-data-text="暂无网卡数据，请尝试刷新"
						>
							<ElOption
								v-for="guid in data.guids"
								:key="guid[0]"
								:label="guid[1]"
								:value="guid[0]"
							></ElOption>
						</ElSelect>
						<ElButton @click="getGuids">刷新</ElButton>
					</div>
					<div class="mt-[5px] flex items-center gap-[5px]">
						<ElInput
							placeholder="请选择或输入应用程序路径"
							:disabled="data.forceBindStart"
							v-model="mainStore.forceBindFile"
						></ElInput>
						<div class="flex items-center">
							<ElButton
								@click="handleBrowser"
								:disabled="data.forceBindStart"
							>
								浏览
							</ElButton>
							<ElButton
								:disabled="data.forceBindStart"
								@click="startForceBindIp"
								type="primary"
							>
								启动
							</ElButton>
						</div>
					</div>
				</div>
				<div>
					<!-- const guids = await invoke<string[]>("get_network_adapter_guids"); -->
				</div>
				<div>
					<ElTooltip content="设置网卡的跃点，提升网卡优先级，尝试将您联机使用的网卡跃点设置为最小，请先查询网卡信息">
						<ElText>
							方案3
							<ElIcon class="ml-[3px]"><QuestionFilled /></ElIcon>
						</ElText>
					</ElTooltip>
				</div>
				<div class="mt-[5px] flex items-center">
					<ElButton
						@click="initNetCardInfo"
						size="small"
						type="primary"
					>
						查询网卡信息
					</ElButton>
					<div
						v-if="data.row.name"
						class="ml-auto flex flex-nowrap items-center gap-[10px]"
					>
						<ElTooltip content="跃点越小，网卡优先级越高，范围(1-9999)">
							<ElInput
								class="!w-[80px]"
								autofocus
								size="small"
								v-model="data.row.metric"
								placeholder="请输入跃点"
							/>
						</ElTooltip>
						<ElButton
							type="success"
							size="small"
							@click="handleSaveMetric"
						>
							保存
						</ElButton>
					</div>
				</div>
				<div class="mt-[5px] flex-1 overflow-auto">
					<ElTable
						height="100%"
						empty-text="暂无数据"
						highlight-current-row
						:data="data.netcardList"
						@row-click="handleRowClick"
						border
					>
						<ElTableColumn
							sortable
							label="网卡名"
							prop="name"
						></ElTableColumn>
						<ElTableColumn
							sortable
							label="跃点"
							prop="metric"
						></ElTableColumn>
					</ElTable>
				</div>
			</ElTabPane>
			<ElTabPane
				label="防火墙"
				name="firewall"
				class="flex h-full flex-col"
			>
				<div class="flex flex-col items-center">
					<div class="mb-[10px]">
						<ElButton
							type="warning"
							size="small"
							@click.stop="handleCloseAllFireWall"
						>
							一键关闭防火墙
						</ElButton>
					</div>
					<div class="mb-[10px]">
						<ElText class="!mx-[10px]">域防火墙</ElText>
						<ElTag :type="data.firewallStatus.domain ? 'danger' : 'success'">
							{{ data.firewallStatus.domain ? "已开启" : "已关闭" }}
						</ElTag>
					</div>
					<div class="mb-[10px]">
						<ElText class="!mx-[10px]">公用防火墙</ElText>
						<ElTag :type="data.firewallStatus.public ? 'danger' : 'success'">
							{{ data.firewallStatus.public ? "已开启" : "已关闭" }}
						</ElTag>
					</div>
					<div>
						<ElText class="!mx-[10px]">专用防火墙</ElText>
						<ElTag :type="data.firewallStatus.dedicated ? 'danger' : 'success'">
							{{ data.firewallStatus.dedicated ? "已开启" : "已关闭" }}
						</ElTag>
					</div>
				</div>
				<ElDivider>Ping测试</ElDivider>
				<div class="flex items-center gap-[10px]">
					<ElInput
						style="width: 150px"
						size="small"
						v-model="data.pingIp"
						placeholder="请输入IP地址"
					/>
					<ElInputNumber
						controls-position="right"
						size="small"
						:precision="0"
						v-model="data.pingNum"
						:min="1"
						:max="10"
					>
						<template #suffix>
							<span>次</span>
						</template>
					</ElInputNumber>
					<ElButton
						size="small"
						:disabled="data.isPing"
						@click="handleTestPing('v4')"
					>
						Ping一下
					</ElButton>
					<!-- <ElButton
						size="small"
						:disabled="data.isPing"
						@click="handleTestPing('v6')"
					>
						Ping一下(v6)
					</ElButton> -->
				</div>
				<div class="mt-[5px] flex-1 overflow-auto">
					<ElInput
						placeholder="日志信息"
						type="textarea"
						:autosize="{ minRows: 9 }"
						resize="none"
						v-model="data.pingLog"
					/>
				</div>
			</ElTabPane>
		</ElTabs>
	</div>
</template>
<script setup lang="ts">
	import { open, Command } from "@tauri-apps/plugin-shell";
	import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
	import { ElMessage, type TabPaneName } from "element-plus";
	import { QuestionFilled } from "@element-plus/icons-vue";
	import { onMounted, reactive } from "vue";
	import useMainStore from "@/stores/index";
	import { handleWinipBcStart, initStartWinIpBroadcast } from "@/composables/netcard";
	import { isValidIP } from "~/utils";
	import { dataSubscribe } from "~/composables/windows";
	import { invoke } from "@tauri-apps/api/core";
	import { BaseDirectory, exists } from "@tauri-apps/plugin-fs";

	const mainStore = useMainStore();
	const data = reactive<{ guids: string[][]; [key: string]: any }>({
		activeTab: "netcard",
		winipBcPid: 0,
		pingNum: 1,
		winipBcStart: false,
		pingIp: "",
		isPing: false,
		pingLog: "",
		firewallStatus: {
			domain: false,
			public: false,
			dedicated: false
		},
		row: {
			name: "",
			metric: ""
		},
		netcardList: [],
		guids: [],
		forceBindStart: false
	});


	const handleCloseAllFireWall = async () => {
		try {
				const output = await Command.create("netsh", ["advfirewall", "set", "allprofiles", "state", "off"], {
					encoding: "gb2312"
				}).execute();
				ElMessage.success("关闭成功");
				await initFirewall();
			} catch (err) {
				ElMessage.error(`关闭失败${err}`);
				console.error(err);
			}
	}

	const handleTabsChange = async (tabPaneName: TabPaneName) => {
		if (tabPaneName === "netcard") {
			// await initNetCardInfo();
		} else if (tabPaneName == "firewall") {
			await initFirewall();
		}
	};

	const handleRowClick = async (row: any, column: any, event: Event) => {
		data.row = { ...row };
	};

	const handleSaveMetric = async () => {
		if (data.row.metric && data.row.name) {
			try {
				const output = await Command.create("netsh", ["interface", "ipv4", "set", "interface", data.row.name, "metric=", data.row.metric], {
					encoding: "gb2312"
				}).execute();
				ElMessage.success("设置成功");
				await initNetCardInfo();
			} catch (err) {
				console.error(err);
			}
		}
	};

	const awaitTime = (time: number) => {
		return new Promise(res => {
			setTimeout(res, time);
		});
	};

	const handleTestPing = async (type: 'v4' | 'v6' = 'v4') => {
		// const is = isValidIP(data.pingIp);
		if (data.pingIp) {
			data.pingLog = "";
			data.isPing = true;
			const args = type === 'v4' ? ["-n", "1", data.pingIp] : ["-6", '-n', "1", data.pingIp]
			try {
				for (let i = 0; i < data.pingNum; i++) {
					const output = await Command.create("ping", args, {
						encoding: "gb2312"
					}).execute();
					if (output.stdout) {
						data.pingLog += `${i + 1} - ${output.stdout.split("\n")[2]}`;
					}
					if (output.stderr) {
						data.pingLog += `${i + 1}error - ${output.stderr}`;
					}
					if (i != data.pingNum - 1) {
						await awaitTime(1000);
					}
				}
				data.pingLog += "完毕";
			} catch (err) {
				ElMessage.error("Ping发生错误");
				console.error(err);
			} finally {
				data.isPing = false;
			}
		} else {
			ElMessage.error("请输入正确的IP");
		}
	};

	const initNetCardInfo = async () => {
		try {
			const output = await Command.create("netsh", ["interface", "ipv4", "show", "interface"], {
				encoding: "gb2312"
			}).execute();
			data.netcardList = output.stdout
				.split("\n")
				.map(el => el.trim().replace(/\s+/g, " "))
				.filter(el => el)
				.slice(2)
				.map(el => {
					const [idx, Met, MTU, status, ...rest] = el.split(" ");
					return {
						index: idx,
						metric: Met,
						MTU,
						status,
						name: rest.join(" ")
					};
				}) as any;
		} catch (err) {
			ElMessage.error("网卡获取失败");
			console.error(err);
		}
	};

	const initFirewall = async () => {
		try {
			const output = await Command.create("netsh", ["advfirewall", "show", "allprofiles", "state"], {
				encoding: "gb2312"
			}).execute();
			const state = output.stdout
				.trim()
				.replace(/[\-]+/g, "")
				.split("\n")
				.map(el => el.trim())
				.filter(el => el)
				.slice(0, -1);
			for (let idx = 0; idx < state.length; idx += 2) {
				const status = state[idx + 1].replace(/状态\s+/, "");
				const matchName = /域|公用|专用/.exec(state[idx]);
				if (matchName) {
					const name = matchName[0];
					if (name == "域") {
						data.firewallStatus.domain = status != "关闭";
					} else if (name == "公用") {
						data.firewallStatus.public = status != "关闭";
					} else if (name == "专用") {
						data.firewallStatus.dedicated = status != "关闭";
					}
				}
			}
		} catch (err) {
			// netsh advfirewall firewall add rule name="EXE名称" dir=out action=allow program="EXE绝对路径"
			ElMessage.error("获取防火墙状态失败");
			console.error(err);
		}
	};

	const handleBrowser = async () => {
		const file = await dialogOpen({
			multiple: false,
			directory: false
		});
		if (file) {
			mainStore.forceBindFile = file;
		} else {
			ElMessage.error("获取文件路径失败");
		}
	};

	const startForceBindIp = async () => {
		if (!mainStore.forceBindInput) {
			return ElMessage.error("请输入IP地址或者选择一个网卡");
		}
		if (!mainStore.forceBindFile) {
			return ElMessage.error("请选择一个执行文件");
		}

		const forceBindIpExe = mainStore.forceBindIpBit == "32" ? "ForceBindIP" : "ForceBindIP64";
		const isExists = await exists(`easytier/tool/${forceBindIpExe}.exe`, { baseDir: BaseDirectory.Resource });
		if (!isExists) {
			return ElMessage.error("forcebindIP文件不存在");
		}

		data.forceBindStart = true;
		try {
			const dealyDll = mainStore.delayInjectDll ? "-i" : "";
			const child = await Command.create(
				forceBindIpExe,
				[dealyDll, mainStore.forceBindInput, mainStore.forceBindFile.replace(/\//g, "\\")].filter(el => el),
				{
					encoding: "gb2312"
				}
			).spawn();
			// console.log({child});
		} catch (err) {
			ElMessage.error("forcebindIP启动发生未知错误");
			console.error(err);
		} finally {
			data.forceBindStart = false;
		}
	};

	const getGuids = async () => {
		const guids = await invoke<string[][]>("get_network_adapter_guids");
		data.guids = guids && guids.length > 0 ? guids : [];
		if (mainStore.forceBindInput.startsWith("{")) {
			const has = data.guids.find(el => el[0] == mainStore.forceBindInput);
			if (!has) {
				mainStore.forceBindInput = "";
			}
		}
	};

	onMounted(() => {
		data.pingIp = mainStore.config.ipv4;
		initStartWinIpBroadcast();
		getGuids();
	});
	
	dataSubscribe();
</script>
