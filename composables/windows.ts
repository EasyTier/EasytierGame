import { type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition, type WindowOptions, Window, currentMonitor } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewLabel, WebviewOptions } from "@tauri-apps/api/webview";
import useMainStore from "@/stores/index";
import { onBeforeUnmount } from "vue";

const _listenersMaps: { [key: string]: [UnlistenFn | null] } = {};

const dealCloseListener = async (
	dialog: WebviewWindow,
	label: string,
	beforeCloseFunc?: () => void | null
) => {
	const unlistenFnList: [UnlistenFn | null] = _listenersMaps[label] || [null];
	let [unListenlogClose] = unlistenFnList;

	unListenlogClose && (await unListenlogClose());

	unListenlogClose = await dialog.onCloseRequested(async () => {
		beforeCloseFunc && (await beforeCloseFunc());
		unListenlogClose && (await unListenlogClose());
		console.log("close")
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
			const appSize = await appWindow.outerSize();
			const factor = await appWindow.scaleFactor();
			const appPosition = await appWindow.outerPosition();
			const logicalPosition = new PhysicalPosition(appPosition.x + appSize.width, appPosition.y).toLogical(factor);
			defaultOpts.parent = appWindow;
			// console.error(logicalPosition);
			defaultOpts.x = logicalPosition.x;
			defaultOpts.y = logicalPosition.y;
		}
		dialog = new WebviewWindow(label, { ...defaultOpts, ...options });
		await dealCloseListener(dialog, label, beforeCloseFunc);
		afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
		await dialog.show();

	} else {
		const visible = await dialog.isVisible();
		if (visible) {
			await dialog.close();
		} else {
			const appWindow = getCurrentWindow();
			await dealCloseListener(dialog, label, beforeCloseFunc);
			afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
			await dialog.show();
		}
	}
};

export const dataSubscribe = async (cb?: (...args: any) => any) => {
	if (!cb) return;
	const mainStore = useMainStore();
	const abort = new AbortController();
	window.addEventListener(
		"storage",
		async () => {
			mainStore.$hydrate();
			if (cb && cb instanceof Function) {
				await cb();
			}
		},
		{
			signal: abort.signal
		}
	);
	onBeforeUnmount(() => {
		abort?.abort();
	});
};
