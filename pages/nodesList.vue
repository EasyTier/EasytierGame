<template>
	<div class="relative flex h-full flex-col flex-wrap gap-[0] overflow-hidden">
		<div class="flex h-[40px] w-full flex-nowrap items-center gap-[0_8px]">
			<div class="ml-[5px] mr-auto flex">
				<ElText class="text-lg font-semibold">公共服务器节点列表</ElText>
			</div>
			<div class="flex w-fit flex-nowrap items-center gap-[0_8px]">
				<div>
					<ElInput
						placeholder="搜索名称/地址"
						v-model="searchName"
						clearable
					></ElInput>
				</div>
				<div>
					<ElButton
						size="small"
						type="primary"
						@click="refreshNodes"
					>
						刷新
					</ElButton>
					<ElButton
						:disabled="selectedNodes.length === 0"
						size="small"
						type="success"
						class="mr-[8px]"
						@click="addSelectedToServerList"
					>
						添加选中 ({{ selectedNodes.length }})
					</ElButton>
					<ElTag
						size="small"
						type="info"
					>
						最后更新: {{ lastUpdateTime || "00:00:00" }}
					</ElTag>
				</div>
			</div>
		</div>
		<div class="flex w-full flex-1 flex-wrap gap-[0] overflow-auto">
			<ElTable
				:data="computedNodes"
				stripe
				height="100%"
				ref="tableRef"
				:empty-text="loading ? '加载中...' : '暂无可用服务器'"
				:default-sort="{ prop: 'last_response_time', order: 'ascending' }"
				@select-all="handleSelectChange"
				@select="handleSelectChange"
				@row-click="handleRowClick"
			>
				<ElTableColumn
					type="selection"
					width="55"
				/>
				<ElTableColumn
					prop="name"
					label="服务器名称"
					width="200"
					show-overflow-tooltip
					sortable
				/>
				<ElTableColumn
					prop="protocol"
					label="协议"
					width="80"
					sortable
				>
					<template #default="{ row }">
						<ElTag
							:type="row.protocol === 'tcp' ? 'success' : 'warning'"
							size="small"
						>
							{{ row.protocol.toUpperCase() }}
						</ElTag>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="address"
					label="地址"
					width="200"
					show-overflow-tooltip
					sortable
				/>
				<ElTableColumn
					prop="last_response_time"
					label="响应时间"
					width="100"
					sortable
				>
					<template #default="{ row }">
						<ElTag
							:type="getResponseTimeType(row.last_response_time)"
							size="small"
						>
							{{ Number(row.last_response_time / 1000).toFixed(2) }}ms
						</ElTag>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="current_health_status"
					label="状态/健康率"
					width="120"
					sortable
				>
					<template #default="{ row }">
						<div class="flex flex-col gap-1">
							<ElTag
								:type="row.current_health_status === 'healthy' ? 'success' : 'danger'"
								size="small"
							>
								{{ row.current_health_status === "healthy" ? "健康" : "异常" }}
							</ElTag>
							<ElTag
								:type="getHealthType(row.health_percentage_24h)"
								size="small"
							>
								{{ Number(row.health_percentage_24h).toFixed(1) }}%
							</ElTag>
						</div>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="usage_percentage"
					label="使用率"
					width="100"
					sortable
				>
					<template #default="{ row }">
						<div class="flex items-center">
							<ElProgress
								:percentage="row.usage_percentage"
								:stroke-width="6"
								:show-text="false"
								:color="getUsageColor(row.usage_percentage)"
								class="mr-2 flex-1"
							/>
							<span class="text-xs">{{ row.usage_percentage.toFixed(1) }}%</span>
						</div>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="description"
					label="描述"
					sortable
				>
					<template #default="{ row }">
						<div class="whitespace-pre-wrap">{{ row.description }}</div>
					</template>
				</ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>

<script setup lang="ts">
	import useMainStore from "@/stores/index";
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount, ref, useTemplateRef, computed, nextTick } from "vue";
	import { ElMessage, type TableInstance } from "element-plus";
	import { dataSubscribe } from "~/composables/windows";
	import { inputBounceRef } from "@/utils";
	import { uniq } from "lodash-es";

	const mainStore = useMainStore();
	// 节点数据
	const nodes = reactive<NodeItem[]>([]);
	const loading = ref(false);
	const lastUpdateTime = ref("");
	const selectedNodes = ref<NodeItem[]>([]);
	const searchName = ref<string>("");
	const computedNodes = computed(() => {
		const v = searchName.value.trim();
		let result = nodes;
		if (v) {
			result = nodes.filter(node => node.name.includes(v) || node.address.includes(v));
		}
		nextTick(() => {
			for (const node of selectedNodes.value) {
				const nodeItem = nodes?.find(n => n.id === node.id);
				tableRef.value?.toggleRowSelection(nodeItem, true);
			}
		});
		return result;
	});
	const tableRef = useTemplateRef<TableInstance>("tableRef");

	// 定时器
	let refreshTimer: number | null = null;

	// 获取使用率颜色
	const getUsageColor = (percentage: number) => {
		if (percentage < 50) return "#67c23a";
		if (percentage < 80) return "#e6a23c";
		return "#f56c6c";
	};

	// 获取响应时间类型
	const getResponseTimeType = (responseTime: number) => {
		if (responseTime < 60 * 1000) return "success";
		if (responseTime < 100 * 1000) return "warning";
		return "danger";
	};

	// 获取健康率类型
	const getHealthType = (health: number) => {
		if (health >= 95) return "success";
		if (health >= 90) return "warning";
		return "danger";
	};

	// 刷新节点数据
	const refreshNodes = async () => {
		loading.value = true;
		let nodesList = await invoke<string>("fetch_nodes_list", { page: 1, limit: 1000 });
		try {
			if (nodesList === "_EasytierGameFetchNodesError_") {
				nodesList = "";
				return;
			}
			if (nodesList) {
				const nodesListData: NodesResponse = JSON.parse(nodesList);
				// console.log(nodesListData);
				if (nodesListData.success && nodesListData.data.items) {
					// 过滤可用节点
					const availableNodes = filterAvailableNodes(nodesListData.data.items);
					// 按优先级排序
					const sortedNodes = sortNodesByPriority(availableNodes);

					// 更新节点数据
					nodes.splice(0, nodes.length, ...sortedNodes);

					// 更新最后更新时间
					lastUpdateTime.value = new Date().toLocaleTimeString();

					// console.log(`已更新 ${sortedNodes.length} 个可用节点`);
				}
			}
		} catch (err) {
			console.log(nodesList);
			console.error("获取节点数据失败:", err);
			ElMessage.error("获取节点数据失败");
		} finally {
			loading.value = false;
		}
	};

	// 过滤可用节点的函数
	const filterAvailableNodes = (nodes: NodeItem[]): NodeItem[] => {
		return nodes.filter(node => {
			// 基本条件：节点必须激活且被批准
			if (!node.is_active || !node.is_approved) {
				return false;
			}

			// 健康状态检查
			if (node.current_health_status !== "healthy") {
				return false;
			}

			// 使用率检查：使用率不能超过95%
			if (node.usage_percentage > 95) {
				return false;
			}

			// 24小时健康率检查：必须大于90%
			if (node.health_percentage_24h < 90) {
				return false;
			}

			// 响应时间检查：响应时间不能超过60秒
			if (node.last_response_time > 60000) {
				return false;
			}

			// 连接数检查：当前连接数不能超过最大连接数的90%
			if (node.current_connections > node.max_connections * 0.9) {
				return false;
			}

			// 必须有有效的地址
			if (!node.address || !node.host || !node.port) {
				return false;
			}

			return true;
		});
	};

	// 按优先级排序节点的函数
	const sortNodesByPriority = (nodes: NodeItem[]): NodeItem[] => {
		return nodes.sort((a, b) => {
			// 优先级排序规则：
			// 1. 响应时间越短越好
			// 2. 使用率越低越好
			// 3. 24小时健康率越高越好
			// 4. 当前连接数越少越好

			// 响应时间权重最高
			const responseTimeDiff = a.last_response_time - b.last_response_time;
			if (Math.abs(responseTimeDiff) > 1000) {
				// 如果响应时间差异超过1秒
				return responseTimeDiff;
			}

			// 使用率权重次之
			const usageDiff = a.usage_percentage - b.usage_percentage;
			if (Math.abs(usageDiff) > 5) {
				// 如果使用率差异超过5%
				return usageDiff;
			}

			// 24小时健康率
			const healthDiff = b.health_percentage_24h - a.health_percentage_24h;
			if (Math.abs(healthDiff) > 1) {
				// 如果健康率差异超过1%
				return healthDiff;
			}

			// 当前连接数
			return a.current_connections - b.current_connections;
		});
	};

	// 启动定时器
	const startRefreshTimer = () => {
		refreshTimer = setInterval(() => {
			refreshNodes();
		}, 60000); // 10秒刷新一次
	};

	// 停止定时器
	const stopRefreshTimer = () => {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	};

	// 处理选择变化
	const handleSelectChange = (selection: NodeItem[]) => {
		selectedNodes.value = selection;
	};

	const handleRowClick = (row: NodeItem) => {
		tableRef.value?.toggleRowSelection(row);
		selectedNodes.value = tableRef.value?.getSelectionRows() || [];
	};

	// 添加选中的服务器到主页面服务器列表
	const addSelectedToServerList = async () => {
		if (selectedNodes.value.length === 0) {
			ElMessage.warning("请先选择要添加的服务器");
			return;
		}

		try {
			// 提取服务器地址（去掉协议前缀）
			const protocols = selectedNodes.value.map(node => node.protocol.toLowerCase());
			const serverAddresses = selectedNodes.value.map(node => node.address.replace(`${node.protocol}://`, ""));
			mainStore.basePeers = uniq([...mainStore.basePeers, ...serverAddresses]);
			mainStore.config.serverUrl = uniq([...serverAddresses, ...mainStore.config.serverUrl]);
			mainStore.config.protocol = uniq([...protocols, ...mainStore.config.protocol]);
			ElMessage.success(`${selectedNodes.value.length} 个服务器，添加成功`);

			// 清空选择
			tableRef.value?.clearSelection();
			selectedNodes.value = [];
		} catch (err) {
			console.error("处理选中服务器失败:", err);
			ElMessage.error("处理选中服务器失败");
		}
	};

	onMounted(async () => {
		// 初始加载数据
		await refreshNodes();
		// 启动定时器
		startRefreshTimer();
	});

	onBeforeUnmount(() => {
		// 清理定时器
		stopRefreshTimer();
	});

	dataSubscribe();
</script>
