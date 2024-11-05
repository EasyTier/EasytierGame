<template>
	<div class="overflow-auto h-full">
		<div class="w-[1200px]">
			<span v-if="!data.member || data.member.length <= 0">{{ "等待成员信息中..." }}</span>
			<ElTable
				stripe
				:data="data.member"
				v-else>
				<ElTableColumn
					v-for="prop in showTableHeader"
					:label="prop[1]"
					:key="prop[0]">
					<template #default="{ row }">
						<span v-if="prop[0] == 'loss_rate'">
							{{ row[prop[0]] && row[prop[0]] != "-" ? Number(row[prop[0]] * 100).toFixed(2) + "%" : row[prop[0]] }}
						</span>
						<span v-else-if="prop[0] != 'cost'">{{ row[prop[0]] }}</span>
						<ElTag
							v-else
							effect="dark"
							:type="row[prop[0]] == 'p2p' ? 'success' : 'info'">
							{{ row[prop[0]] }}
						</ElTag>
					</template>
				</ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	import { parsePeerInfo } from "@/utils";
	const data = reactive<{ member: any[] }>({
		member: [],
	});

	const showTableHeader = [
		["hostname", "主机名"],
		["lat_ms", "延迟/ms"],
		["ipv4", "虚拟网IP"],
		["cost", "路由"],
		["loss_rate", "丢包率"],
		["nat_type", "NAT类型"],
		["version", "版本"],
	];

	const listenOutput = async () => {
		const member = await invoke("get_members_by_cli");
		const peerInfo = parsePeerInfo(member as string);
		peerInfo.forEach((value) => {
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
