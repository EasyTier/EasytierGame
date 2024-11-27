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
				connectAfterStart: false, //软件打开后，是否自动连接
				disableIpv6: false, // 是否禁用IPv6
				disbleListenner: false, // 是否禁用监听
				disableEncryption: true, // 是否禁用加密
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
				enableNetCardMetric: false, //启用网卡自定义跃点
				netCardMetricValue: 1 //自定义网卡跃点值
			},
			serverConfig: {
				enableWhiteList: true, // 是否启用白名单
				relayAllPeerrpc: false, // 是否启用所有对等RPC
				serverWhiteList: "", // 服务器流量转发白名单
				// enableListener: true, // 是否启用监听
				autoStart: false, //随软件自启
				port: "11010", // 服务器端口
			},
			cidrEnable: false,
			basePeers: ["public.easytier.top:11010"],
			theme: false, //主题  false light true dark
			configStartEnable: false, //使用配置文件启动
			configPath: "", //配置文件路径
			winIpBcAutoStart: true,
			createConfigInEasytier: false, //在easytier目录生成config.json文件吗
			githubFastUrl: "https://ghproxy.cc/",


			winipBcPid: 0,
			winipBcStart: false
		};
	},
	persist: {
		// 防止持久化保存 用户使用config.json输入的无用的字段
		pick: [
			"config.protocol",
			"config.serverUrl",
			"config.networkName",
			"config.networkPassword",
			"config.hostname",
			"config.ipv4",
			"config.proxyNetworks",
			"config.autoStart",
			"config.connectAfterStart",
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
			"config.disbleP2p",
			"config.dhcp",
			"config.saveErrorLog",
			"config.logLevel",
			"config.devName",
			"config.devNameValue",
			"config.enableNetCardMetric",
			"config.netCardMetricValue",

			"serverConfig.autoStart",
			// 'serverConfig.enableListener',
			'serverConfig.enableWhiteList',
			'serverConfig.relayAllPeerrpc',
			'serverConfig.serverWhiteList',
			'serverConfig.port',


			"cidrEnable",
			"basePeers",
			"theme",
			"configStartEnable",
			"configPath",
			"winIpBcAutoStart",
			"createConfigInEasytier",
			"githubFastUrl",
		],
		// // 除了这些，其他都要存下来
		// omit: ["winipBcPid", "winipBcStart"]
	}
});
