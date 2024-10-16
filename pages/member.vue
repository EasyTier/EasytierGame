<template>
	<div class="overflow-auto h-full">
		<div class="w-[1200px]">
			<span v-if="!data.member || data.member.length <= 0">{{ "等待成员信息中..." }}</span>
			<ElTable
				stripe
				:data="data.member"
				v-else
			>
				<ElTableColumn
					v-for="prop in showTableHeader"
					:prop="prop[0]"
					:label="prop[1]"
				></ElTableColumn>
			</ElTable>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { reactive, onMounted, onBeforeUnmount } from "vue";
	const data = reactive<{ member: any[] }>({
		member: []
	});

	const showTableHeader = [["ipv4", "虚拟网IP"], ["hostname", "主机名"], ["lat_ms", "延迟"], ["loss_rate", "丢包率"], ["version", '版本']];
	const headers = [
		"ipv4",
		"hostname",
		"cost",
		"lat_ms",
		"loss_rate",
		"rx_bytes",
		"rx_unit",
		"tx_bytes",
		"tx_unit",
		"tunnel_proto",
		"nat_type",
		"id",
		"version"
	];

	const formatData = (data: any[]) => {
		if (!data) return [];
		const result = [];
		let obj: any = {};
		let length = data.length;
		for (let idx = 0; idx < length; idx++) {
			let headersIdx = idx % headers.length;
			if (headersIdx === 0) {
				console.log(idx, [...data]);
				obj = {};
				result.push(obj);
			}
			if (["ipv4"].includes(headers[headersIdx]) && !/\d+\.\d+\.\d+\.\d\/\d+/.test(data[idx]) && data[idx]) {
				const next = data[idx];
				data[idx] = "-";
				const head = data.slice(0, idx);
				const latest = data.slice(idx);
				data = [...head, next, ...latest];
				length = data.length;
			} else if (["rx_bytes", "tx_bytes"].includes(headers[headersIdx]) && data[idx] == "-") {
				const head = data.slice(0, idx);
				const latest = data.slice(idx);
				data = [...head, "-", ...latest];
				length = data.length;
			} else if (
				["tunnel_proto"].includes(headers[headersIdx]) &&
				![
					"tcp",
					"udp",
					"ws",
					"wss",
					"wg",
					"-",
					"tcp,udp",
					"ws,wss",
					"tcp,udp,ws,wss,wg",
					"tcp,ws,wss,wg",
					"udp,ws,wss,wg",
					"tcp,wg",
					"udp,wg",
					"tcp,ws",
					"tcp,wss",
					"udp,ws",
					"udp,wss",
					"tcp,udp,ws",
					"tcp,udp,wss",
					"tcp,udp,ws,wss",
					"tcp,udp,ws,wss,wg",
					"tcp,udp,wg",
					"tcp,udp,ws,wg",
					"udp,tcp",
					"udp,tcp,ws",
					"udp,tcp,wss",
					"udp,tcp,ws,wss",
					"udp,tcp,ws,wss,wg",
					"udp,tcp,wg",
					"udp,tcp,ws,wg",
					"tcp,udp,wss,wg",
					"tcp,udp,ws,wg",
					"tcp,udp,wss,wg",
					"ws,tcp",
					"ws,udp",
					"ws,tcp,udp",
					"ws,tcp,udp,ws",
					"ws,tcp,udp,wss",
					"ws,tcp,udp,ws,wss",
					"ws,tcp,udp,ws,wss,wg",
					"ws,tcp,udp,wg",
					"ws,tcp,udp,ws,wg",
					"ws,udp,tcp",
					"ws,udp,tcp,ws",
					"ws,udp,tcp,wss",
					"ws,udp,tcp,ws,wss",
					"wss,tcp",
					"wss,udp",
					"wss,tcp,udp",
					"wss,tcp,udp,ws",
					"wss,tcp,udp,wss",
					"wss,tcp,udp,ws,wss",
					"wss,tcp,udp,ws,wss,wg",
					"wss,tcp,udp,wg",
					"wg,tcp",
					"wg,udp",
					"wg,tcp,udp",
					"wg,tcp,udp,ws",
					"wg,tcp,udp,wss",
					"wg,tcp,udp,ws,wss",
					"wg,tcp,udp,ws,wss,wg",
					"wg,tcp,udp,wg",
					"wg,udp,tcp"
				].includes(data[idx])
			) {
				const head = data.slice(0, idx);
				const latest = data.slice(idx);
				data = [...head, "-", ...latest];
				length = data.length;
			}
			obj[headers[headersIdx]] = data[idx];
		}
		return result;
	};

	const listenOutput = async () => {
		const member = await invoke("get_members_by_cli");
		let memberData = ((member as string) || "")
			.replace(/[\│\├\┌\└\─\┬\┴\┼\┤\┐\┘]+/g, "")
			.split(" ")
			.filter(el => el && !["\n", "\n\n"].includes(el))
			.slice(11);
		if (memberData.length <= 0) {
			return;
		}
		const result = formatData(memberData);
		data.member = result;
		console.log({ member: data.member });
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
