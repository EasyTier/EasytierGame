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
					prop="version"
					label="版本"
				></ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	import { parsePeerInfo } from "@/utils";

	const natMaps = {
		unknown: "未知",
		nopat: "nat0",
		fullcone: "nat1",
		restricted: "nat2",
		addressrestricted: "nat2",
		portrestricted: "nat3",
		symmetric: "nat4"
	};
	type natKyes = keyof typeof natMaps;
	// NAT1: Full Cone NAT，全锥形NAT，这是最宽松的网络环境，你想做什么，基本没啥限制IP和端口都不受限。
	// NAT2: Address-Restricted Cone NAT，受限锥型NAT，相比NAT1，NAT2 增加了地址限制，也就是IP受限，而端口不受限。
	// NAT3: Port-Restricted Cone NAT，端口受限锥型，相比NAT2，NAT3 又增加了端口限制，也就是说IP、端口都受限。
	// NAT4: Symmetric NAT，对称型NAT，对称型NAT具有端口受限锥型的受限特性，内部地址每一次请求一个特定的外部地址，
	// 都可能会绑定到一个新的端口号。也就是请求不同的外部地址映射的端口号是可能不同的。这种类型基本上就告别 P2P 了。
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
		["version", "版本"]
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
		// console.log(peerInfo);
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
