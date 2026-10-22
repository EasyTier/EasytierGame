import { type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition, type WindowOptions, Window, currentMonitor } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WebviewLabel, WebviewOptions } from "@tauri-apps/api/webview";
import useMainStore from "@/stores/index";
import { onBeforeUnmount } from "vue";
import { updateConfigJsonBounce, type ConfigServerUrlType } from "./configJson";

const _listenersMaps: { [key: string]: UnlistenFn | undefined } = {};
const _windowOperations: { [key: string]: Promise<void> | undefined } = {};

const waitForWindowCreated = async (dialog: WebviewWindow, label: string) => {
	await new Promise<void>((resolve, reject) => {
		let settled = false;
		let unlistenCreated: UnlistenFn | undefined;
		let unlistenError: UnlistenFn | undefined;
		const cleanup = () => {
			clearTimeout(timeout);
			unlistenCreated?.();
			unlistenError?.();
		};
		const finish = (error?: unknown) => {
			if (settled) return;
			settled = true;
			cleanup();
			if (error) reject(error);
			else resolve();
		};
		const timeout = setTimeout(() => finish(new Error(`Timed out while creating window '${label}'`)), 10_000);
		// Creation is asynchronous; window commands must wait for the native window.
		void dialog
			.once("tauri://created", () => finish())
			.then(unlisten => {
				unlistenCreated = unlisten;
				if (settled) unlisten();
			}, finish);
		void dialog
			.once("tauri://error", event => finish(new Error(`Failed to create window '${label}': ${JSON.stringify(event.payload)}`)))
			.then(unlisten => {
				unlistenError = unlisten;
				if (settled) unlisten();
			}, finish);
	});
};

const dealCloseListener = async (dialog: WebviewWindow, label: string, beforeCloseFunc?: () => void | null) => {
	_listenersMaps[label]?.();
	_listenersMaps[label] = await dialog.onCloseRequested(async () => {
		_listenersMaps[label]?.();
		delete _listenersMaps[label];
		beforeCloseFunc && (await beforeCloseFunc());
	});
};
export default async (
	label: WebviewLabel,
	options?: Omit<WebviewOptions, "x" | "y" | "width" | "height"> & WindowOptions,
	afterCreatedFunc?: (webviewWindow: WebviewWindow, appWindow: Window) => void | null,
	beforeCloseFunc?: () => void | null
) => {
	if (_windowOperations[label]) return _windowOperations[label];
	let operation!: Promise<void>;
	operation = Promise.resolve().then(async () => {
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
				if (defaultOpts.x == 0 && defaultOpts.y == 0) {
					const logicalAppSize = {
						width: 340,
						height: 305
					};
					const factor = await appWindow.scaleFactor().catch(() => 1);
					const appPosition = await appWindow.outerPosition().catch(() => new PhysicalPosition(0, 0));
					let position = new PhysicalPosition(appPosition.x + Math.ceil((logicalAppSize.width + 5) * factor), appPosition.y);
					try {
						const monitor = await currentMonitor();
						if (monitor) {
							const area = monitor.workArea;
							const maxX = area.position.x + Math.max(0, area.size.width - Math.ceil((options?.width ?? 600) * factor));
							const maxY = area.position.y + Math.max(0, area.size.height - Math.ceil((options?.height ?? 380) * factor));
							position = new PhysicalPosition(
								Math.min(Math.max(position.x, area.position.x), maxX),
								Math.min(Math.max(position.y, area.position.y), maxY)
							);
						} else {
							position = appPosition;
						}
					} catch (error) {
						position = appPosition;
						console.warn("Unable to query the current monitor; using the parent window position", error);
					}
					const logicalPosition = position.toLogical(factor);
					defaultOpts.x = logicalPosition.x;
					defaultOpts.y = logicalPosition.y;
				}
			}
			dialog = new WebviewWindow(label, { ...defaultOpts, ...options, visible: false });
			await waitForWindowCreated(dialog, label);
			await dealCloseListener(dialog, label, beforeCloseFunc);
			if (options?.visible !== false) {
				await dialog.show();
				await dialog.setFocus();
			}
			afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
		} else {
			const visible = await dialog.isVisible();
			if (visible) {
				await dialog.close();
			} else {
				const appWindow = getCurrentWindow();
				await dealCloseListener(dialog, label, beforeCloseFunc);
				if (options?.visible !== false) {
					await dialog.show();
					await dialog.setFocus();
				}
				afterCreatedFunc && (await afterCreatedFunc(dialog, appWindow));
			}
		}
	});
	_windowOperations[label] = operation;
	try {
		await operation;
	} finally {
		if (_windowOperations[label] === operation) {
			delete _windowOperations[label];
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
