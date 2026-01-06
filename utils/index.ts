import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { open } from "@tauri-apps/plugin-shell";
import { ElMessage } from "element-plus";
import { flatMap, map } from "lodash-es";
import { customRef, ref } from "vue";

export const ENV = import.meta.env;

export const mixedArray = (a: Array<string>, b: Array<string>, split: string = "") => {
	return flatMap(a, protocol => map(b, port => `${protocol}${split}${port}`));
};

//防抖
export const bounce = (time = 3000) => {
	let bounceTimer: number | null = null;
	return (cb: Function) => {
		bounceTimer && clearTimeout(bounceTimer);
		bounceTimer = setTimeout(() => {
			cb();
		}, time);
	};
};

export const inputBounceRef = (value: string, cb?: Function, delay = 650) => {
	let timeout: number | null = null;
	return customRef((track, trigger) => {
		return {
			get() {
				track();
				return value;
			},
			set(newValue) {
				value = newValue;
				trigger();
				timeout && clearTimeout(timeout);
				timeout = setTimeout(() => {
					cb?.(newValue);
				}, delay);
			}
		};
	});
};

/**
 *
 * @param {number} size  byte number
 * @param {number} fixed 小数点后几位
 */
export const SizeFormat = (size: number, fixed: number = 1) => {
	const _unit = ["B", "KB", "MB", "GB", "TB"];
	const max = _unit.length - 1;
	const endAdd = 8; //取小数点后 fixed + endAdd 位小数，目的是尽量保证不发生进位,endAdd越大，越可以保证不发生进位
	const c = 1024; // 1000或者1024
	let n = 0;
	for (; n < max; n++) {
		if (size < c) {
			break;
		}
		size = size / c;
	}
	const result = Number(size).toFixed(fixed + endAdd);
	return `${result.slice(0, result.length - endAdd)}${_unit[n]}`;
};

export const numAddZero = (num: Number) => {
	const newNum = Number(num);
	return String(newNum > 9 ? newNum : `0${newNum}`);
};

export const numRemoveZero = (num: Number) => {
	if (String(num).startsWith("0")) {
		const numArr = [].slice.call(num);
		numArr.splice(0, 1);
		return Number(numArr.join(""));
	}
	return Number(num);
};

// await-to-js
export const ATJ = (promise: Promise<any>, errorExt: string | undefined = undefined) => {
	return promise
		.then(data => [null, data])
		.catch(err => {
			if (errorExt) {
				if (typeof errorExt !== "object") {
					return [errorExt, undefined];
				} else {
					const parsedError = Object.assign({}, err, errorExt);
					return [parsedError, undefined];
				}
			}
			return [err, undefined];
		});
};

const _supportProtocols = ["tcp", "udp", "ws", "wss", "srv", "schema", "txt"];

export const supportProtocols = () => {
	return _supportProtocols.slice();
};

let _prevent_timer: number | null = null;
let _prevent_timer_count = 15; // 秒
export const preventSleep = () => {
	_prevent_timer && clearInterval(_prevent_timer);
	_prevent_timer = setInterval(async () => {
		const result = await invoke("prevent_sleep");
		// console.log(`trigger prevent sleep ${result}`);
	}, _prevent_timer_count * 1000);
};

export const stopPreventSleep = async () => {
	_prevent_timer && clearInterval(_prevent_timer);
	_prevent_timer = null;
	const _result = await invoke("allow_sleep");
};

export const parseCliInfo = (content: string) => {
	if (!content) return [];
	// 将表格字符串分割成行
	const lines = content.split("\n");

	// 提取表头（keys）
	const headers = lines[1]
		.split("│")
		.slice(1, -1)
		.map(h => h.trim());

	// 初始化结果数组
	const result: any[] = [];

	// 遍历数据行
	for (let i = 3; i < lines.length - 1; i += 2) {
		if (lines[i].trim() === "") continue; // 跳过空行

		// 分割每一行的数据
		const values = lines[i]
			.split("│")
			.slice(1, -1)
			.map(v => v.trim());

		// 创建对象并添加到结果数组
		const obj: any = {};
		headers.forEach((header, index) => {
			obj[header] = values[index] === "-" || values[index] === "" ? null : values[index];
		});

		// 每行数据都作为一个新对象添加到结果数组中
		result.push(obj);
	}

	return result;
};

export function isValidWindowsFileName(name: string) {
	if (name.length > 255) return false;
	const reserved_names = [
		"CON",
		"PRN",
		"AUX",
		"NUL",
		"COM1",
		"COM2",
		"COM3",
		"COM4",
		"COM5",
		"COM6",
		"COM7",
		"COM8",
		"COM9",
		"LPT1",
		"LPT2",
		"LPT3",
		"LPT4",
		"LPT5",
		"LPT6",
		"LPT7",
		"LPT8",
		"LPT9"
	];
	if (reserved_names.includes(name.toUpperCase())) {
		return false;
	}
	return /^[^<>:"/\\|?*\x00-\x1F]+[^<>:"/\\|?*\x00-\x1F .]$/g.test(name);
}

export const addQQGroup = () => {
	open("https://qm.qq.com/q/Yo3HmaEIWC");
};

export function isValidIP(ip: string) {
	const ipv4Pattern =
		/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	const ipv6Pattern = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/;
	return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

export const copyText = async (text: string, message: string = "复制成功") => {
	const [err, _] = await ATJ(writeText(text));

	if (!err) {
		ElMessage.success(message);
	} else {
		console.error(err);
		ElMessage.success("复制失败");
	}
};
