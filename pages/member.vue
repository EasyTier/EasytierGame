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
					:sort-method="sortIpv4"
					:sort-orders="['ascending', 'descending', null]"
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
						{{
							row.loss_rate && row.loss_rate != "-"
								? row.loss_rate.endsWith("%")
									? row.loss_rate
									: Number(row.loss_rate * 100).toFixed(2) + "%"
								: row.loss_rate
						}}
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
					:sort-method="sortBytes"
					:sort-orders="['ascending', 'descending', null]"
				></ElTableColumn>
				<ElTableColumn
					sortable
					prop="tx_bytes"
					label="传输"
					:sort-method="(a: any, b: any) => sortBytes(a, b, 'tx_bytes')"
					:sort-orders="['ascending', 'descending', null]"
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
	import { endsWith, isNaN } from "lodash-es";
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

	// IP地址排序函数
	const sortIpv4 = (a: any, b: any): number => {
		const ipToNumber = (ip: string): number => {
			if (!ip || ip === "-" || ip === "") {
				return 0;
			}

			// 处理可能包含端口号或子网掩码的情况
			const cleanIp = ip.split("/")[0].split(":")[0];
			const parts = cleanIp.split(".");

			if (parts.length !== 4) {
				return 0;
			}

			try {
				const nums = parts.map(part => {
					const num = parseInt(part, 10);
					return isNaN(num) || num < 0 || num > 255 ? 0 : num;
				});

				// 将IP地址转换为32位数字进行比较
				return (nums[0] << 24) + (nums[1] << 16) + (nums[2] << 8) + nums[3];
			} catch {
				return 0;
			}
		};

		const numA = ipToNumber(a.ipv4);
		const numB = ipToNumber(b.ipv4);

		return numA - numB;
	};

	// 字节数据排序函数
	const sortBytes = (a: any, b: any, field: string = "rx_bytes"): number => {
		const parseBytes = (bytesStr: string): number => {
			if (!bytesStr || bytesStr === "-" || bytesStr === "") {
				return 0;
			}

			// 统一转换为小写并去除空格
			const cleanStr = bytesStr.toLowerCase().trim();

			// 使用正则表达式匹配数字和单位
			const match = cleanStr.match(/^(\d+(?:\.\d+)?)\s*([a-z]*)$/);
			if (!match) {
				return 0;
			}

			const value = parseFloat(match[1]);
			const unit = match[2];

			if (isNaN(value)) {
				return 0;
			}

			// 根据单位转换为字节数
			switch (unit) {
				case "b":
				case "byte":
				case "bytes":
				case "":
					return value;
				case "k":
				case "kb":
				case "kib":
					return value * 1024;
				case "m":
				case "mb":
				case "mib":
					return value * 1024 * 1024;
				case "g":
				case "gb":
				case "gib":
					return value * 1024 * 1024 * 1024;
				case "t":
				case "tb":
				case "tib":
					return value * 1024 * 1024 * 1024 * 1024;
				case "p":
				case "pb":
				case "pib":
					return value * 1024 * 1024 * 1024 * 1024 * 1024;
				default:
					return value; // 未知单位当作字节处理
			}
		};

		const bytesA = parseBytes(a[field]);
		const bytesB = parseBytes(b[field]);

		return bytesA - bytesB;
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

	let timer: number | null = null;

	const listenOutput = async () => {
		const [error, member] = await ATJ(invoke<string>("get_members_by_cli"));
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
		// const peerInfo = parseCliInfo(member);
		// peerInfo.forEach(value => {
		// 	if (value.cost === "Local") {
		// 		value.cost = "本机";
		// 	}
		// 	if (value.ipv4 && value.ipv4.includes("/")) {
		// 		value.ipv4 = value.ipv4.split("/")[0];
		// 	}
		// });
		// data.member = peerInfo;

		data.member = JSON.parse(member);
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
