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
	if (whiteList && mainStore.serverConfig.enableWhiteList) {
		args.push("--relay-network-whitelist", ...whiteList);
	}
	if (!whiteList && mainStore.serverConfig.enableWhiteList) {
		args.push("--relay-network-whitelist");
	}
	if (mainStore.serverConfig.privateMode) {
		args.push("--private-mode", "true");
	}
	const networkName = mainStore.serverConfig.privateNetworkName.trim();
	if (networkName) {
		args.push("--network-name", networkName);
	}
	const networkSecret = mainStore.serverConfig.privateNetworkPassword.trim();
	if (networkSecret) {
		args.push("--network-secret", networkSecret);
	}

	return args;
};
