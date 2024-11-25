<template>
	<div class="overflow-auto h-full">
		<div class="w-[1200px]">
			<span v-if="!data.member || data.member.length <= 0">{{ "等待成员信息中..." }}</span>
			<ElTable
				stripe
				border
				:data="data.member"
				v-else
			>
				<ElTableColumn
					sortable
					width="140"
					label="主机名"
					prop="hostname"
				></ElTableColumn>
				<ElTableColumn
					sortable
					width="90"
					prop="cost"
					label="路由"
				>
					<template #default="{ row }">
						<ElTag
							effect="dark"
							:type="row.cost == 'p2p' ? 'success' : 'info'"
						>
							{{ row.cost }}
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
					width="130"
					label="延迟/ms"
				></ElTableColumn>
				<ElTableColumn
					sortable
					width="120"
					prop="loss_rate"
					label="丢包率"
				>
					<template #default="{ row }">
						{{ row.loss_rate && row.loss_rate != "-" ? Number(row.loss_rate * 100).toFixed(2) + "%" : row.loss_rate }}
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="120"
					label="nat_type"
					prop="NAT类型"
				>
					<template #default="{ row }">
						{{ natMaps[row.nat_type.toLowerCase() as natKyes] || row.nat_type || "-" }}
					</template>
				</ElTableColumn>
				<ElTableColumn
					sortable
					width="120"
					prop="version"
					label="版本"
				></ElTableColumn>
				<ElTableColumn
					sortable
					prop="tunnel_proto"
					label="隧道协议"
				></ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	import { parsePeerInfo } from "@/utils";
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

	const data = reactive<{ member: any[] }>({
		member: []
	});

	const _showTableHeader = [
		["hostname", "主机名"],
		["cost", "路由"],
		["ipv4", "虚拟网IP"],
		["lat_ms", "延迟/ms"],
		["loss_rate", "丢包率"],
		["nat_type", "NAT类型"],
		["version", "版本"],
		["tunnel_proto", "隧道协议"]
	];

	const listenOutput = async () => {
		const member = await invoke<string>("get_members_by_cli");
		const peerInfo = parsePeerInfo(member);
		peerInfo.forEach(value => {
			if (value.cost === "Local") {
				value.cost = "本机";
			}
			if (value.ipv4 && value.ipv4.includes("/")) {
				value.ipv4 = value.ipv4.split("/")[0];
			}
		});
		// console.error(peerInfo);
		data.member = peerInfo;
	};

	let timer: NodeJS.Timeout | null = null;

	onMounted(async () => {
		listenOutput();
		timer = setInterval(() => {
			listenOutput();
		}, 1000 * 10);
	});

	onBeforeUnmount(() => {
		timer && clearInterval(timer);
	});
</script>
