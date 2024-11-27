import useMainStore from "@/stores/index";
export const getServerArgs = () => {
	const mainStore = useMainStore();
	const args = [];
	if (!mainStore.serverConfig.port) {
		mainStore.serverConfig.port = "11010";
	}
	args.push("-l", mainStore.serverConfig.port);
	if (mainStore.serverConfig.relayAllPeerrpc) {
		args.push("--relay-all-peer-rpc");
	}
	const whiteList = mainStore.serverConfig.serverWhiteList
		.trim()
		.split("\n")
		.map(el => el.trim())
		.filter(el => el)
		.join(" ");
	if (whiteList && mainStore.serverConfig.enableWhiteList) {
		args.push("--relay-network-whitelist", whiteList);
	}
	if (!whiteList && mainStore.serverConfig.enableWhiteList) {
		args.push("--relay-network-whitelist");
	}
	return args;
};