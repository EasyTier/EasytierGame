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

export const parsePeerInfo = (content: string) => {
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

export function isValidIP(ip: string) {
	const ipv4Pattern =
		/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	const ipv6Pattern = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/;
	return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}
