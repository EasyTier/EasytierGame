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
				proxyNetworks: "", // 子网代理
				autoStart: false, // 是否自动启动
				coonectAfterStart: false, //软件打开后，是否自动连接
				disableIpv6: false, // 是否禁用IPv6
				disbleListenner: false, // 是否禁用监听
				disableEncryption: false, // 是否禁用加密
				multiThread: false, //使用多线程
				enablExitNode: false, // 是否启用退出节点
				noTun: false, // 是否使用TUN
				latencyfirst: false, // 是否优先延迟
				useSmoltcp: false, // 是否为子网代理启用smoltcp堆栈
				disableUdpHolePunching: false, // 是否禁用UDP打洞
				relayAllPeerrpc: false, // 是否启用所有对等RPC
				disbleP2p: false, // 是否使用P2P
				dhcp: true, // 是否使用DHCP
				saveErrorLog: true, // 是否保存错误日志
				logLevel: "error", //日志等级
				devName: false, //自定义网卡名
				devNameValue: "", //自定义网卡名
			},
			configStartEnable: false, //使用配置文件启动
			configPath: "", //配置文件路径
			cidrEnable: false,
			basePeers: ["public.easytier.top:11010"],
		};
	},
	persist: {
		paths: [
			"basePeers",
			"cidrEnable",
			"config.proxyNetworks",
			"config.serverUrl",
			"config.networkName",
			"config.protocol",
			"config.networkPassword",
			"config.disbleP2p",
			"config.autoStart",
			"config.coonectAfterStart",
			"config.disableIpv6",
			"config.disbleListenner",
			"config.disableEncryption",
			"config.multiThread",
			"config.enablExitNode",
			"config.noTun",
			"config.latencyfirst",
			"config.useSmoltcp",
			"config.disableUdpHolePunching",
			"config.relayAllPeerrpc",
			"config.hostname",
			"config.dhcp",
			"config.saveErrorLog",
			"config.logLevel"
		],
	},
});
