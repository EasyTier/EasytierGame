import { acceptHMRUpdate, defineStore } from "pinia";

export const createDefaultRoomConfig = () => ({
	protocol: ["tcp"], // 网络协议
	serverUrl: ["public.easytier.top:11010"],
	networkName: "",
	networkPassword: "",
	hostname: "",
	ipv4: "",
	ipv6: "",
	tcpWhitelistEnable: false, // tcp端口白名单
	udpWhitelistEnable: false, // udp端口白名单
	tcpWhitelist: "", // tcp端口白名单
	udpWhitelist: "", // udp端口白名单
	proxyNetworks: "", // 子网代理
	autoStart: false, // 是否自动启动
	connectAfterStart: false, //软件打开后，是否自动连接
	disableIpv6: false, // 是否禁用IPv6
	port: "0", // 监听端口号
	enableCustomListener: true, // 是否自定义监听
	customListenerData: "tcp://0.0.0.0:11010\nudp://0.0.0.0:11010", // 自定义监听地址
	disbleListenner: false, // 是否禁用监听
	disableEncryption: false, // 是否禁用加密
	multiThread: false, //使用多线程
	enablExitNode: false, // 是否启用退出节点
	noTun: false, // 是否使用TUN
	latencyfirst: false, // 是否优先延迟
	useSmoltcp: false, // 是否为子网代理启用smoltcp堆栈
	disableUdpHolePunching: false, // 是否禁用UDP打洞
	relayAllPeerrpc: true, // 是否启用所有对等RPC
	disbleP2p: false, // 是否使用P2P
	dhcp: true, // 是否使用DHCP
	saveErrorLog: true, // 是否保存错误日志
	logLevel: "error", //日志等级
	devName: true, //自定义网卡名
	devNameValue: "etgame", //自定义网卡名
	enableCustomProtocol: true, //自定义默认协议
	customProtocol: "tcp", //自定义默认协议
	enableNetCardMetric: true, //启用网卡自定义跃点
	netCardMetricValue: 1, //自定义网卡跃点值
	enablePreventSleep: false, //组织系统休眠
	enableUdpBroadcastRelay: true, //Windows UDP广播中继
	enableUpnp: true, //UPnP端口映射
	ipv6PublicAddrProvider: false, //公网IPv6地址前缀提供
	ipv6PublicAddrAuto: false, //公网IPv6地址自动获取
	disableRelayData: false, //禁用Relay数据转发
	compression: "none", //加密算法
	enableKcpProxy: true, //启用kcp代理  默认开启
	disableKcpInput: false, //禁用kcp输入
	enableQuicProxy: false, //启用quic代理  默认开启
	disableQuicInput: false, //禁用quic输入
	bindDeviceEnable: false, //是否绑定设备
	acceptDNS: false, //魔法dns
	privateMode: false, //是否启用私有模式
	enablePortForward: false, //是否启用端口转发
	portForwardData: "" //端口转发数据
});

export type RoomConfig = ReturnType<typeof createDefaultRoomConfig>;

export type RoomProfile = {
	id: string;
	name: string;
	rpcPortal: number;
	config: RoomConfig;
	cidrEnable: boolean;
	proxyForwardBySystem: boolean;
	configStartEnable: boolean;
	configPath: string;
	updatedAt: number;
};

const cloneRoomConfig = (config: RoomConfig): RoomConfig => JSON.parse(JSON.stringify(config));

const createRoomId = () => {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}
	return `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const DEFAULT_RPC_PORTAL = 15888;

const allocateRpcPortal = (usedRpcPortals: Set<number>, preferredPort = DEFAULT_RPC_PORTAL) => {
	let rpcPortal = Number.isInteger(preferredPort) && preferredPort > 0 && preferredPort <= 65535 ? preferredPort : DEFAULT_RPC_PORTAL;
	while (rpcPortal <= 65535 && usedRpcPortals.has(rpcPortal)) {
		rpcPortal += 1;
	}
	if (rpcPortal > 65535) {
		rpcPortal = 1;
		while (rpcPortal <= 65535 && usedRpcPortals.has(rpcPortal)) {
			rpcPortal += 1;
		}
	}
	if (rpcPortal > 65535) {
		throw new Error("没有可用的 EasyTier RPC 端口");
	}
	usedRpcPortals.add(rpcPortal);
	return rpcPortal;
};

const store = defineStore("main", {
	state() {
		return {
			config: createDefaultRoomConfig(),
			roomProfiles: [] as RoomProfile[],
			activeRoomId: "",
			serverConfig: {
				enableWhiteList: true, // 是否启用白名单
				relayAllPeerrpc: false, // 是否启用所有对等RPC
				serverWhiteList: "", // 服务器流量转发白名单
				// enableListener: true, // 是否启用监听
				autoStart: false, //随软件自启
				port: "11010", // 服务器端口
				privateMode: false, //是否启用私有模式
				privateNetworkName: "", // 私有模式房间名
				privateNetworkPassword: "", // 私有模式密码
				ipv6PublicAddrProvider: false, //公网IPv6地址前缀提供
				disableRelayData: false, //禁用Relay数据转发
			},
			cidrEnable: false,
			proxyForwardBySystem: false, // 是否通过系统内核转发子网代理数据包，禁用内置NAT
			basePeers: ["public.easytier.top:11010", "public.easytier.net:11010"],
			theme: false, //主题  false light true dark
			configStartEnable: false, //使用配置文件启动
			configPath: "", //配置文件路径
			winIpBcAutoStart: true,
			createConfigInEasytier: false, //在easytier目录生成config.json文件吗
			githubFastUrl: "https://ghfast.top/",

			// forceBindIp配置
			forceBindIpBit: "64",
			delayInjectDll: false,
			forceBindInput: "",
			forceBindFile: "",

			winipBcPid: 0,
			winipBcStart: false,
			latestTagName: "",

			gameList: [] as Array<{ name: string; exePath: string; id: string; coverImg?: string; showImg: string }> // 游戏列表
		};
	},
	getters: {
		activeRoomProfile(state): RoomProfile | undefined {
			return state.roomProfiles.find(room => room.id === state.activeRoomId);
		}
	},
	actions: {
		initializeRoomProfiles() {
			if (this.roomProfiles.length <= 0) {
				const id = createRoomId();
				this.roomProfiles = [
					{
						id,
						name: this.config.networkName?.trim() || "默认房间",
						rpcPortal: DEFAULT_RPC_PORTAL,
						config: cloneRoomConfig(this.config),
						cidrEnable: this.cidrEnable,
						proxyForwardBySystem: this.proxyForwardBySystem,
						configStartEnable: this.configStartEnable,
						configPath: this.configPath,
						updatedAt: Date.now()
					}
				];
				this.activeRoomId = id;
				return;
			}

			const usedRpcPortals = new Set<number>();
			this.roomProfiles = this.roomProfiles.map((room, index) => {
				const savedRpcPortal = Number(room.rpcPortal);
				const preferredRpcPortal =
					Number.isInteger(savedRpcPortal) && savedRpcPortal > 0 && savedRpcPortal <= 65535 && !usedRpcPortals.has(savedRpcPortal)
						? savedRpcPortal
						: DEFAULT_RPC_PORTAL + index;
				const rpcPortal = allocateRpcPortal(usedRpcPortals, preferredRpcPortal);
				return {
					...room,
					name: room.name?.trim() || `房间 ${index + 1}`,
					rpcPortal,
					config: {
						...createDefaultRoomConfig(),
						...cloneRoomConfig(room.config || this.config)
					},
					cidrEnable: room.cidrEnable ?? false,
					proxyForwardBySystem: room.proxyForwardBySystem ?? false,
					configStartEnable: room.configStartEnable ?? false,
					configPath: room.configPath || "",
					updatedAt: room.updatedAt || Date.now()
				};
			});

			if (!this.roomProfiles.some(room => room.id === this.activeRoomId)) {
				this.activeRoomId = this.roomProfiles[0].id;
			}
			this.applyRoomProfile(this.activeRoomId);
		},
		replaceRoomProfiles(roomProfiles: RoomProfile[], preferredActiveRoomId = "") {
			if (roomProfiles.length <= 0) return false;
			this.roomProfiles = JSON.parse(JSON.stringify(roomProfiles));
			this.activeRoomId = this.roomProfiles.some(room => room.id === preferredActiveRoomId)
				? preferredActiveRoomId
				: this.roomProfiles[0].id;
			this.initializeRoomProfiles();
			return true;
		},
		applyRoomProfile(roomId: string) {
			const room = this.roomProfiles.find(item => item.id === roomId);
			if (!room) return false;
			this.activeRoomId = room.id;
			this.config = cloneRoomConfig(room.config);
			this.cidrEnable = room.cidrEnable;
			this.proxyForwardBySystem = room.proxyForwardBySystem;
			this.configStartEnable = room.configStartEnable;
			this.configPath = room.configPath;
			return true;
		},
		saveActiveRoomProfile() {
			const room = this.roomProfiles.find(item => item.id === this.activeRoomId);
			if (!room) return false;
			const serializedConfig = JSON.stringify(this.config);
			if (
				JSON.stringify(room.config) === serializedConfig &&
				room.cidrEnable === this.cidrEnable &&
				room.proxyForwardBySystem === this.proxyForwardBySystem &&
				room.configStartEnable === this.configStartEnable &&
				room.configPath === this.configPath
			) {
				return true;
			}
			room.config = JSON.parse(serializedConfig);
			room.cidrEnable = this.cidrEnable;
			room.proxyForwardBySystem = this.proxyForwardBySystem;
			room.configStartEnable = this.configStartEnable;
			room.configPath = this.configPath;
			room.updatedAt = Date.now();
			return true;
		},
		switchRoomProfile(roomId: string) {
			if (roomId === this.activeRoomId) return true;
			this.saveActiveRoomProfile();
			return this.applyRoomProfile(roomId);
		},
		addRoomProfile(name: string) {
			this.saveActiveRoomProfile();
			const sourceRoom = this.activeRoomProfile;
			const sourceRpcPortal = sourceRoom?.rpcPortal || DEFAULT_RPC_PORTAL;
			const usedRpcPortals = new Set(this.roomProfiles.map(room => room.rpcPortal));
			const rpcPortal = allocateRpcPortal(usedRpcPortals);

			const config = cloneRoomConfig(sourceRoom?.config || this.config);
			const portOffset = (rpcPortal - sourceRpcPortal) * 10;
			if (!config.disbleListenner && config.enableCustomListener && portOffset !== 0) {
				config.customListenerData = config.customListenerData.replace(/:(\d+)(?=\/?$)/gm, (_, port: string) => {
					const nextPort = Number(port) + portOffset;
					return `:${nextPort > 0 && nextPort <= 65535 ? nextPort : port}`;
				});
			}
			if (!config.disbleListenner && !config.enableCustomListener && config.port !== "0" && portOffset !== 0) {
				const nextPort = Number(config.port) + portOffset;
				if (nextPort > 0 && nextPort <= 65535) {
					config.port = `${nextPort}`;
				}
			}
			if (config.devName && config.devNameValue) {
				const devNameBase = config.devNameValue.replace(/-\d+$/, "");
				config.devNameValue = `${devNameBase}-${rpcPortal - DEFAULT_RPC_PORTAL + 1}`;
			}
			config.ipv4 = "";

			const room: RoomProfile = {
				id: createRoomId(),
				name: name.trim(),
				rpcPortal,
				config,
				cidrEnable: sourceRoom?.cidrEnable ?? this.cidrEnable,
				proxyForwardBySystem: sourceRoom?.proxyForwardBySystem ?? this.proxyForwardBySystem,
				// 外部配置文件中的监听器和网卡名无法安全改写，新房间改用已复制的界面配置。
				configStartEnable: false,
				configPath: "",
				updatedAt: Date.now()
			};
			this.roomProfiles.push(room);
			this.applyRoomProfile(room.id);
			return room;
		},
		renameRoomProfile(roomId: string, name: string) {
			const room = this.roomProfiles.find(item => item.id === roomId);
			if (!room || !name.trim()) return false;
			room.name = name.trim();
			room.updatedAt = Date.now();
			return true;
		},
		deleteRoomProfile(roomId: string) {
			if (this.roomProfiles.length <= 1) return false;
			const roomIndex = this.roomProfiles.findIndex(item => item.id === roomId);
			if (roomIndex < 0) return false;
			const wasActive = roomId === this.activeRoomId;
			this.roomProfiles.splice(roomIndex, 1);
			if (wasActive) {
				const nextRoom = this.roomProfiles[Math.min(roomIndex, this.roomProfiles.length - 1)];
				this.applyRoomProfile(nextRoom.id);
			}
			return true;
		}
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
			"config.ipv6",
			"config.proxyNetworks",
			"config.autoStart",
			"config.connectAfterStart",
			"config.disableIpv6",
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
			"config.port",
			"config.tcpWhitelist",
			"config.udpWhitelist",
			"config.tcpWhitelistEnable",
			"config.udpWhitelistEnable",

			"config.enablePortForward",
			"config.portForwardData",

			"config.disbleListenner",
			"config.enableCustomListener",
			"config.customListenerData",

			"config.enableCustomProtocol",
			"config.customProtocol",
			"config.enablePreventSleep",
			"config.compression",

			"config.enableKcpProxy",
			"config.disableKcpInput",
			"config.enableQuicProxy",
			"config.disableQuicInput",


			"config.bindDeviceEnable",

			"config.acceptDNS",

			"config.privateMode",

			"config.enableUdpBroadcastRelay",
			"config.enableUpnp",
			"config.ipv6PublicAddrProvider",
			"config.ipv6PublicAddrAuto",
			"config.disableRelayData",

			"serverConfig.autoStart",
			// 'serverConfig.enableListener',
			"serverConfig.enableWhiteList",
			"serverConfig.relayAllPeerrpc",
			"serverConfig.serverWhiteList",
			"serverConfig.port",
			"serverConfig.privateMode",
			"serverConfig.privateNetworkName",
			"serverConfig.privateNetworkPassword",
			"serverConfig.ipv6PublicAddrProvider",
			"serverConfig.disableRelayData",

			"cidrEnable",
			"proxyForwardBySystem",
			"basePeers",
			"theme",
			"configStartEnable",
			"configPath",
			"winIpBcAutoStart",
			"createConfigInEasytier",
			"githubFastUrl",

			"forceBindIpBit",
			"delayInjectDll",
			"forceBindInput",
			"forceBindFile",
			"latestTagName",
			"roomProfiles",
			"activeRoomId",

			"gameList"
		]
		// // 除了这些，其他都要存下来
		// omit: ["winipBcPid", "winipBcStart"]
	}
});
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(store, import.meta.hot));
export default store;
