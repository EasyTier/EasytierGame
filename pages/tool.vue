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
				class="flex flex-col h-full"
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
						class="!text-[15px] mr-[10px]"
						type="info"
						:underline="false"
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
					<ElTooltip content="设置网卡的跃点，提升网卡优先级，尝试将您联机使用的网卡跃点设置为最小，请先查询网卡信息">
						<ElText>
							方案2
							<ElIcon class="ml-[3px]"><QuestionFilled /></ElIcon>
						</ElText>
					</ElTooltip>
				</div>
				<div class="flex items-center mt-[5px]">
					<ElButton
						@click="initNetCardInfo"
						size="small"
						type="primary"
					>
						查询网卡信息
					</ElButton>
					<div
						v-if="data.row.name"
						class="ml-auto flex items-center flex-nowrap gap-[10px]"
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
				<div class="flex-1 overflow-auto mt-[5px]">
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
				class="flex flex-col h-full"
			>
				<div class="flex flex-col items-center">
					<div class="mb-[10px]">
						<ElButton
							type="warning"
							size="small"
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
						@click="handleTestPing"
					>
						Ping一下
					</ElButton>
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
	import { ElMessage, type TabPaneName } from "element-plus";
	import { QuestionFilled } from "@element-plus/icons-vue";
	import { onMounted, reactive } from "vue";
	import useMainStore from "@/stores/index";
	import { handleWinipBcStart, initStartWinIpBroadcast } from "@/composables/netcard";
	import { isValidIP } from "~/utils";
	import { dataSubscribe } from "~/composables/windows";

	const mainStore = useMainStore();
	const data = reactive({
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
		netcardList: []
	});

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

	const handleTestPing = async () => {
		// const is = isValidIP(data.pingIp);
		if (data.pingIp) {
			data.pingLog = "";
			data.isPing = true;
			try {
				for (let i = 0; i < data.pingNum; i++) {
					const output = await Command.create("ping", ["-n", "1", data.pingIp], {
						encoding: "gb2312"
					}).execute();
					if (output.stdout) {
						data.pingLog += `${i + 1} - ${output.stdout.split("\n")[2]}`;
					}
					if (output.stderr) {
						data.pingLog += `${i + 1}error - ${output.stderr}`;
					}
					if(i != data.pingNum - 1) {
						await awaitTime(1000);
					}
				}
				data.pingLog += '完毕'
			} catch (err) {
				ElMessage.error("Ping发生错误");
				console.error(err);
			} finally {
				data.isPing = false;
			}
		}else {
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


	dataSubscribe(async (...a) => {
		return { winIpBcAutoStart: mainStore.winIpBcAutoStart, config: { ...mainStore.config } };
	});

	onMounted(() => {
		data.pingIp = mainStore.config.ipv4;
		initStartWinIpBroadcast();
	});
</script>
