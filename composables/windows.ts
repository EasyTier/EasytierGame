import { type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition, type WindowOptions, Window, currentMonitor, PhysicalSize } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewLabel, WebviewOptions } from "@tauri-apps/api/webview";
import useMainStore from "@/stores/index";
import { onBeforeUnmount } from "vue";
import { updateConfigJsonBounce, type ConfigServerUrlType } from "./configJson";

const _listenersMaps: { [key: string]: [UnlistenFn | null] } = {};

const dealCloseListener = async (dialog: WebviewWindow, label: string, beforeCloseFunc?: () => void | null) => {
	const unlistenFnList: [UnlistenFn | null] = _listenersMaps[label] || [null];
	let [unListenlogClose] = unlistenFnList;

	unListenlogClose && (await unListenlogClose());

	unListenlogClose = await dialog.onCloseRequested(async () => {
		beforeCloseFunc && (await beforeCloseFunc());
		unListenlogClose && (await unListenlogClose());
		console.log("close");
	});
};
export default async (
	label: WebviewLabel,
	options?: Omit<WebviewOptions, "x" | "y" | "width" | "height"> & WindowOptions,
	afterCreatedFunc?: (webviewWindow: WebviewWindow, appWindow: Window) => void | null,
	beforeCloseFunc?: () => void | null
) => {
	const unlistenFnList: [UnlistenFn | null] = _listenersMaps[label] || [null];
	let dialog = await WebviewWindow.getByLabel(label);
	if (!dialog) {
		let defaultOpts: { [key: string]: any; parent: Window | undefined } = {
			parent: undefined,
			closable: true,
			resizable: true,
			decorations: true,
			maximizable: false,
			minimizable: false,
			x: 0,
			y: 0
		};
		const appWindow = getCurrentWindow();
		if (appWindow) {
			defaultOpts.parent = appWindow;
			// console.error(logicalPosition);
			if (defaultOpts.x == 0 && defaultOpts.y == 0) {
				const logicalAppSize = {
					width: 340,
					height: 305
				}
				const factor = await appWindow.scaleFactor();
				const appPosition = await appWindow.outerPosition();
				const logicalPosition = new PhysicalPosition(appPosition.x + Math.ceil((logicalAppSize.width + 5) * factor), appPosition.y).toLogical(factor);
				defaultOpts.x = logicalPosition.x;
				defaultOpts.y = logicalPosition.y;
			}
		}
		dialog = new WebviewWindow(label, { ...defaultOpts, ...options });
		await dealCloseListener(dialog, label, beforeCloseFunc);
		await dialog.show();
		afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
	} else {
		const visible = await dialog.isVisible();
		if (visible) {
			await dialog.close();
		} else {
			const appWindow = getCurrentWindow();
			await dealCloseListener(dialog, label, beforeCloseFunc);
			await dialog.show();
			afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
		}
	}
};

export const dataSubscribe = async (cb?: any, getconfigServerUrl?: () => ConfigServerUrlType) => {
	const mainStore = useMainStore();
	const abort = new AbortController();

	window.addEventListener(
		"storage",
		async () => {
			// console.log("触发", {dhcp:mainStore.config.dhcp, c: mainStore.createConfigInEasytier})
			mainStore.$hydrate();
			const configServerUrl = getconfigServerUrl && getconfigServerUrl instanceof Function ? getconfigServerUrl() : null;
			updateConfigJsonBounce(configServerUrl);
			if (cb && cb instanceof Function) {
				await cb();
			}
		},
		{
			signal: abort.signal
		}
	);
	onBeforeUnmount(() => {
		console.log("取消监听");
		abort?.abort();
	});
};
