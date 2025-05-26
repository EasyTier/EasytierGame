<template>
	<div class="h-full overflow-auto">
		<div class="w-[1200px]">
			<ElText
				size="small"
				v-if="!data.member || data.member.length <= 0"
			>
				{{ "等待成员信息中..." }}
			</ElText>
			<ElTable
				stripe
				border
				:data="data.member"
				v-else
			>
				<ElTableColumn
					sortable
					width="140"
					label="成员名"
					prop="hostname"
				>
					<template #default="{ row }">
						{{
							(row.hostname || "").toLowerCase().includes("publicserver")
								? (row.hostname || "").replace("PublicServer", "服务器")
								: row.hostname || "-"
						}}
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="90"
					prop="cost"
					label="方式"
				>
					<template #default="{ row }">
						<ElTag
							size="small"
							effect="dark"
							:type="row.cost == 'p2p' ? 'success' : 'info'"
						>
							{{ row.cost ? row.cost.replace("relay", "中转").replace("p2p", "直连") : row.cost }}
						</ElTag>
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="120"
					prop="ipv4"
					label="虚拟网IP"
				></ElTableColumn>
				<ElTableColumn
					sortable
					prop="lat_ms"
					width="100"
					label="延迟/ms"
					:sort-method="sortLatMs"
					:sort-orders="['ascending', 'descending', null]"
				>
					<template #default="{ row }">
						{{ formatLatency(row.lat_ms) }}
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="100"
					prop="loss_rate"
					label="丢包率"
				>
					<template #default="{ row }">
						{{ row.loss_rate && row.loss_rate != "-" ? Number(row.loss_rate * 100).toFixed(2) + "%" : row.loss_rate }}
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="110"
					label="NAT类型"
					prop="nat_type"
				>
					<template #default="{ row }">
						{{ natMaps[row.nat_type.toLowerCase() as natKyes] || row.nat_type || "-" }}
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="122"
					prop="version"
					label="版本"
				></ElTableColumn>
				<ElTableColumn
					sortable
					width="100"
					prop="tunnel_proto"
					label="隧道协议"
				></ElTableColumn>
				<ElTableColumn
					sortable
					width="90"
					prop="rx_bytes"
					label="接收"
				></ElTableColumn>
				<ElTableColumn
					sortable
					prop="tx_bytes"
					label="传输"
				></ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	import { ATJ, parseCliInfo } from "@/utils";
	import { ElConfirmDanger } from "~/utils/element";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { isNaN } from "lodash-es";
	// 	enum NatType {
	//   // has NAT; but own a single public IP, port is not changed
	//   Unknown = 0;
	//   OpenInternet = 1;
	//   NoPAT = 2;
	//   FullCone = 3;
	//   Restricted = 4;
	//   PortRestricted = 5;
	//   Symmetric = 6;
	//   SymUdpFirewall = 7;
	//   SymmetricEasyInc = 8;
	//   SymmetricEasyDec = 9;
	// }
	const natMaps = {
		unknown: "未知",
		OpenInternet: "nat0-openinternet",
		nopat: "nat0-nopat",
		fullcone: "nat1",
		restricted: "nat2",
		portrestricted: "nat3",
		symmetric: "nat4",
		symmetriceasydec: "nat4-easydec",
		symmetriceasyinc: "nat4-easyinc",
		symUdpfirewall: "nat4-udpfirewall"
	};
	type natKyes = keyof typeof natMaps;

	const data = reactive<{ member: { hostname: string; cost: string; ipv4: string; lat_msg: string; loss_rate: string; nat_type: string }[] }>({
		member: []
	});

	// 延迟排序函数
	const sortLatMs = (a: any, b: any): number => {
		const getLatencyValue = (row: any): number => {
			const latMs = row.lat_ms;

			if (latMs === null || latMs === undefined || latMs === "") {
				return Infinity;
			}

			const num = Number(latMs);
			if (isNaN(num) || num < 0) {
				return Infinity;
			}

			return Math.floor(num);
		};

		const valueA = getLatencyValue(a);
		const valueB = getLatencyValue(b);

		if (valueA === Infinity && valueB === Infinity) {
			return 0;
		}

		return valueA - valueB;
	};

	// 格式化延迟显示
	const formatLatency = (latMs: any): string => {
		if (latMs === null || latMs === undefined || latMs === "") {
			return "-";
		}

		const num = Number(latMs);
		if (isNaN(num)) {
			return "-";
		}

		if (num < 0) {
			return "-";
		}

		return num.toFixed(0);
	};

	const _showTableHeader = [
		["hostname", "主机名"],
		["cost", "路由"],
		["ipv4", "虚拟网IP"],
		["lat_ms", "延迟/ms"],
		["loss_rate", "丢包率"],
		["nat_type", "NAT类型"],
		["version", "版本"],
		["tunnel_proto", "隧道协议"],
		["rx_bytes", "接收"],
		["tx_bytes", "传输"]
	];

	let timer: NodeJS.Timeout | null = null;

	const listenOutput = async () => {
		const [error, member] = await ATJ(invoke<string>("get_members_by_cli"));
		// if(!member) return;
		if (error) {
			data.member = [];
			return "";
		}
		if (member === "_EasytierGameCliFailedToConnect_") {
			data.member = [];
			stopTimer();
			const [error] = await ElConfirmDanger("连接已断开,是否重新尝试?", "警告", {
				confirmButtonText: "重试",
				cancelButtonText: "关闭窗口"
			});
			if (!error) {
				await listenOutput();
			} else {
				const appWindow = getCurrentWindow();
				await appWindow.close();
			}
			return;
		}
		const peerInfo = parseCliInfo(member);
		peerInfo.forEach(value => {
			if (value.cost === "Local") {
				value.cost = "本机";
			}
			if (value.ipv4 && value.ipv4.includes("/")) {
				value.ipv4 = value.ipv4.split("/")[0];
			}
		});
		// console.log(peerInfo)
		data.member = peerInfo;
		startTimer();
	};

	const startTimer = () => {
		timer && clearTimeout(timer);
		timer = setTimeout(() => {
			listenOutput();
		}, 1000);
	};

	const stopTimer = () => {
		timer && clearTimeout(timer);
		timer = null;
	};

	onMounted(async () => {
		await listenOutput();
	});

	onBeforeUnmount(() => {
		stopTimer();
	});
</script>
