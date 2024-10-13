import { defineStore } from "pinia";
export default defineStore("main", {
	state() {
		return {
			config: {
				protocol: ["tcp", "udp"], // 网络协议
				serverUrl: "public.easytier.top:11010",
				networkName: "",
				networkPassword: "",
				hostname: "",
				ipv4: "",
				disableIpv6: false, // 是否禁用IPv6
				disbleListenner: false, // 是否禁用监听
				disbleP2p: true, // 是否使用P2P
				dhcp: true, // 是否使用DHCP
			},
			basePeers: ["public.easytier.top:11010"],
		};
	},
	persist: {
		paths: [
			"basePeers",
			"config.serverUrl",
			"config.networkName",
			"config.protocol",
			"config.networkPassword",
			"config.disbleP2p",
			"config.disableIpv6",
			"config.disbleListenner",
			"config.hostname",
			"config.dhcp",
		],
	},
});
