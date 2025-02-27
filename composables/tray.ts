import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";
import pkg from "@/package.json";
import { setTheme } from "~/composables/theme";
import useMainStore from "@/stores/index";
import { resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
// import { ElConfirmPrimary } from "~/utils/element";
import { open } from "@tauri-apps/plugin-shell";
import { computed } from "vue";

const DEFAULT_TRAY_NAME = "main";

async function toggleVisibility() {
	if (await getCurrentWindow().isVisible()) {
		await getCurrentWindow().hide();
	} else {
		await getCurrentWindow().show();
		await getCurrentWindow().unminimize();
		await getCurrentWindow().setFocus();
	}
}

export async function useTray(init: boolean = false, beforExit: Function, handleConnection: Function) {
	let tray;
	try {
		tray = await TrayIcon.getById(DEFAULT_TRAY_NAME);
		if (!tray) {
			tray = await TrayIcon.new({
				tooltip: `EasyTierGame\n${pkg.version}`,
				title: `EasyTierGame\n${pkg.version}`,
				id: DEFAULT_TRAY_NAME,
				menu: await Menu.new({
					id: "main",
					items: await generateMenuItem(beforExit, handleConnection),
				}),
				action: async (e) => {
					toggleVisibility();
				},
			});
		}
	} catch (error) {
		console.error("Error while creating tray icon:", error);
		return null;
	}

	if (init) {
		tray.setTooltip(`EasyTierGame\n${pkg.version}`);
		tray.setShowMenuOnLeftClick(false);
		tray.setMenu(
			await Menu.new({
				id: "main",
				items: await generateMenuItem(beforExit, handleConnection),
			})
		);
	}

	return tray;
}

export async function generateMenuItem(beforExit: Function, handleConnection:Function) {
	return [
		await MenuItemShow("显示 / 隐藏"),
		await MenuItemExchangeConnection("联机 / 断开", handleConnection),
		await MenuItemTheme(),
		await PredefinedMenuItem.new({ item: "Separator" }),
		await MenuItemPublicPeers(),
		await PredefinedMenuItem.new({ item: "Separator" }),
		await MenuItemExit("退出", beforExit),
	];
}

export async function MenuItemExit(text: string, beforExit: Function) {
	return await MenuItem.new({
		id: "quit",
		text,
		action: async () => {
			if (beforExit) {
				await beforExit();
			}
			await getCurrentWindow().close();
		},
	});
}

export async function MenuItemPublicPeers() {

	return await MenuItem.new({
		id: "publicPeers",
		text: "公共节点",
		action: async () => {
			await open(import.meta.env.VITE_PUBLIC_PEERS_URL)
		},
	});
}

export async function MenuItemShow(text: string) {
	return await MenuItem.new({
		id: "show",
		text,
		action: async () => {
			await toggleVisibility();
		},
	});
}

export async function MenuItemExchangeConnection(text: string, handleConnection:Function) {
	const menutItem =  await MenuItem.new({
		id: "exchangeConnection",
		text,
		action: async () => {
			const isStart = await handleConnection();
		},
	});
	return menutItem;
}

export async function MenuItemTheme() {
	return await MenuItem.new({
		id: "theme",
		text: "主题切换",
		action: async () => {
			const mainStore = useMainStore();
			mainStore.$patch({
				theme: !mainStore.theme
			});
			// mainStore.$persist();
			await setTheme(mainStore.theme);
		},
	});
}

// export async function setTrayMenu(items: (MenuItem | PredefinedMenuItem)[] | undefined = undefined) {
//   // const tray = await useTray()
//   const tray = await TrayIcon.getById(DEFAULT_TRAY_NAME)
//   if (!tray)
//     return
//   const menu = await Menu.new({
//     id: 'main',
//     items: items || await generateMenuItem(),
//   })
//   tray.setMenu(menu)
// }

export async function setTrayRunState(tray: TrayIcon | null, isRunning: boolean = false) {
	if (!tray) return;
	const resourceDir = await getResourceDir();
	const path = await join(resourceDir, isRunning ? "easytier/icons/icon-inactive.ico" : "easytier/icons/icon.ico");
	// "easytier/icons/icon-inactive.ico", { baseDir: BaseDirectory.Resource }
	await tray.setIcon(path);
}

export async function setTrayTooltip(tray: TrayIcon | null, tooltip?: string | null) {
	if (!tray) return;
	if (tooltip) {
		await tray.setTooltip(`EasyTierGame\n${pkg.version}\n${tooltip}`);
	} else {
		await tray.setTooltip(`EasyTierGame\n${pkg.version}`);
	}
}


export const checkNewVersion = async () => {
	const mainStore = useMainStore();
	// if(mainStore.latestTagName && mainStore.latestTagName == pkg.version) return;
	if (hasNewVersion.value) return;
	let [tagName, downloadUrl] = await invoke<string[]>("fetch_game_releases");
	mainStore.latestTagName = tagName;
}

export const hasNewVersion = computed<boolean>(() => {
	const mainStore = useMainStore();
	return !!mainStore.latestTagName && mainStore.latestTagName != pkg.version;
})