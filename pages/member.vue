<template>
	<div class="h-full overflow-auto">
		<div class="max-w-[2000px]">
			<ElText
				size="small"
				v-if="!data.member || data.member.length <= 0"
			>
				{{ "等待成员信息中..." }}
			</ElText>
			<ElTable
				stripe
				border
				:data="computedMember"
				v-else
			>
				<ElTableColumn
					sortable
					label="成员名"
					prop="hostname"
				>
					<template #default="{ row }">
						<div :class="`whitespace-pre-wrap`">
							<div>
								{{
									(row.hostname || "").toLowerCase().includes("publicserver")
										? (row.hostname || "").replace("PublicServer", "服务器")
										: row.hostname || "-"
								}}
							</div>
							<div
								class="space-y-1"
								v-if="row?.connections_addrs?.length > 0"
							>
								<ElTag
									:key="url"
									v-for="url in row.connections_addrs"
									class="!flex !h-auto !whitespace-pre-wrap !break-all !py-[5px]"
								>
									{{ url }}
								</ElTag>
							</div>
						</div>
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="70"
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
				>
					<template #default="{ row }">
						<div class="space-y-[5px]">
							<div>
								{{ row.ipv4 || "-" }}
							</div>
							<div v-if="row.proxy?.[0]">
								<ElTooltip :content="row.proxy?.[1] == 'Connected' ? '已连接' : '已断开'">
									<ElTag
										size="small"
										:type="row.proxy?.[1] == 'Connected' ? 'success' : 'danger'"
									>
										{{ row.proxy?.[0] || "-" }}代理
									</ElTag>
								</ElTooltip>
							</div>
						</div>
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					prop="lat_ms"
					width="80"
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
					width="70"
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
					width="100"
					label="NAT类型"
					prop="nat_type"
				>
					<template #default="{ row }">
						{{ natMaps[row.nat_type.toLowerCase() as NATKyes] || row.nat_type || "-" }}
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
	import { reactive, onMounted, onBeforeUnmount, computed } from "vue";
	import { ATJ } from "@/utils";
	import { ElConfirmDanger } from "~/utils/element";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { isNaN } from "lodash-es";

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

	type NATKyes = keyof typeof natMaps;

	const data = reactive<{ member: Member[]; proxy: Proxy[] }>({
		member: [],
		proxy: []
	});

	const computedMember = computed(() => {
		const localMember = data.member.find(member => member?.cost == "Local");
		if (!localMember) return data.member;
		const ipv4 = localMember.ipv4;
		const proxyMember = data.proxy?.filter(proxy => proxy.src.startsWith(`${ipv4}:`));
		const proxyObj: Record<string, [string, "Connected" | "Closed"]> = {};
		for (const proxy of proxyMember) {
			proxyObj[proxy.dst.split(":")[0]] = [proxy.transport_type, proxy.state];
		}
		return data.member.map(m => {
			m.proxy = proxyObj?.[m.ipv4.split(":")?.[0]] || m?.proxy || ["", "Closed"];
			return m;
		});
	});

	// 延迟排序函数
	const sortLatMs = (a: Member, b: Member): number => {
		const getLatencyValue = (row: Member): number => {
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
		const [errorConnections, connections] = await ATJ(invoke<string>("get_members_connections_cli"));
		const memberConnections: ConnectionsType[] = JSON.parse(connections) as ConnectionsType[];

		if (errorConnections != "_EasytierGameCliFailedToGetConnections_") {
			data.member = (JSON.parse(member) as Member[]).map(member => {
				const connection = memberConnections.find(conn => String(conn.route.peer_id) === member.id);
				if (connection) {
					member.connections_addrs = connection?.peer?.conns?.map(conn => conn?.tunnel?.remote_addr?.url || "") || [];
				} else {
					member.connections_addrs = [];
				}
				return member;
			});
		} else {
			data.member = JSON.parse(member) as Member[];
		}
		// console.log(data.member);
		getMembersProxy();
		startTimer();
	};

	const getMembersProxy = async () => {
		const [error, proxy] = await ATJ(invoke<string>("get_members_proxy"));
		if (error) {
			data.proxy = [];
			return "";
		}
		if (proxy === "_EasytierGameCliFailedToGetProxy_") {
			data.proxy = [];
			return "";
		}
		try {
			data.proxy = JSON.parse(proxy) as Proxy[];
		} catch (error) {
			data.proxy = [];
		}
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
