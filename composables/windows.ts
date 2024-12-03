import { type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition, type WindowOptions, Window, currentMonitor } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewLabel, WebviewOptions } from "@tauri-apps/api/webview";
import useMainStore from "@/stores/index";
import { onBeforeUnmount } from "vue";

const _listenersMaps: { [key: string]: [UnlistenFn | null, UnlistenFn | null] } = {};

export default async (
	label: WebviewLabel,
	options?: Omit<WebviewOptions, "x" | "y" | "width" | "height"> & WindowOptions,
	afterCreatedFunc?: (webviewWindow: WebviewWindow, appWindow: Window) => void | null,
	beforeCloseFunc?: () => void | null
) => {
	const unlistenFnList: [UnlistenFn | null, UnlistenFn | null] = _listenersMaps[label] || [null, null];
	let [unlistenLogCreated, unListenlogClose] = unlistenFnList;
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
		unlistenLogCreated && (await (unlistenLogCreated as Function)());
		unListenlogClose && (await unListenlogClose());
		dialog = new WebviewWindow(label, { ...defaultOpts, ...options });
		unlistenLogCreated = await dialog.listen("tauri://webview-created", async () => {
			if (dialog) {
				afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
				await dialog.show();
			}
		});
		unlistenFnList[0] = unlistenLogCreated;
		unListenlogClose = await dialog.onCloseRequested(async () => {
			beforeCloseFunc && (await beforeCloseFunc());
			unListenlogClose && (await unListenlogClose());
			unlistenLogCreated && (await (unlistenLogCreated as Function)());
		});
		unlistenFnList[1] = unlistenLogCreated;
		_listenersMaps[label] = unlistenFnList;
	} else {
		const visible = await dialog.isVisible();
		if (visible) {
			await dialog.close();
			unlistenLogCreated && (await (unlistenLogCreated as Function)());
		}
	}
};

export const dataSubscribe = async (cb?: (...args: any) => any) => {
	if (!cb) return;
	const mainStore = useMainStore();
	const currentWindow = getCurrentWindow();
	let removeSubscribe = mainStore.$subscribe(async (...args) => {
		const emitData = await cb(args);
		await currentWindow.emitTo({ kind: "Window", label: "main" }, "config", emitData);
	});
	const unlisten = currentWindow.listen<any>("global-main-store", event => {
		console.log('global-main-store')
		console.log(event);
		removeSubscribe && removeSubscribe();
		mainStore.$patch({ ...event.payload.store }); // 更新全局状态
		removeSubscribe = mainStore.$subscribe(async (...args) => {
			const emitData = await cb(args);
			await currentWindow.emitTo({ kind: "Window", label: "main" }, "config", emitData);
		});
	});
	onBeforeUnmount(async () => {
		unlisten && (await unlisten)();
		removeSubscribe && removeSubscribe();
	});
};
