
import { ElMessage } from "element-plus";
import Clipboard from "vue-clipboard3";

export const ENV = import.meta.env;

export const clipBoardCopy = async (text: string) => {
	const { toClipboard } = Clipboard();
	try {
		await toClipboard(text);
		ElMessage.success("复制成功");
	} catch (e) {
		ElMessage.error("复制失败");
	}
};

//防抖
export const bounce = (time = 3000) => {
	let bounceTimer: NodeJS.Timeout | null = null;
	return (cb: Function) => {
		bounceTimer && clearTimeout(bounceTimer);
		bounceTimer = setTimeout(() => {
			cb();
		}, time);
	};
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

export const openBrowser = (key: string) => {
	// logger.info(`${import.meta.env.VITE_BROWSER_JOB_URL}${key}`)
	// _launcherApi.openBrowser(`${import.meta.env.VITE_BROWSER_JOB_URL}${key}`);
};