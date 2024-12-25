import { ElMessageBox } from "element-plus";
import { ATJ } from "./index";
import { h, type VNode } from "vue";
type Opt = { action?: string; confirmButtonText?: string; cancelButtonText?: string; VNode?: VNode | null, showCancelButton?:boolean }
export const ElConfirmDanger = (
	content: string,
	title: string,
	opt: Opt = {
		action: "",
		confirmButtonText: "确定",
		cancelButtonText: "取消",
		VNode: null
	}
): Promise<any | [any, any]> => {
	const { action = "", confirmButtonText = "确定", cancelButtonText = "取消", VNode = null } = opt;
	const formatContentArr = content.split("{action}");
	const action_length = formatContentArr.length - 1;
	const messageArr = [];
	if (action_length > 0) {
		for (let i = 0; i < action_length; i++) {
			messageArr.push(`${formatContentArr[i]}`);
			messageArr.push(h("span", { class: "text-[var(--el-color-danger)]" }, action));
		}
	}
	messageArr.push(`${formatContentArr[action_length]}`);
	let message = h("p", null, messageArr);
	if (VNode) {
		message = h("div", null, [message, VNode]);
	}
	return ATJ(
		ElMessageBox.confirm(message, title, {
			closeOnClickModal: false, // 点击遮罩层不关闭弹窗
			closeOnPressEscape: false, // 按下Esc键不关闭弹窗
			cancelButtonText,
			confirmButtonText,
			confirmButtonClass: "el-button--danger"
		})
	);
};

export const ElConfirmSucces = (
	content: string,
	title: string,
	opt: Opt = {
		action: "",
		confirmButtonText: "确定",
		cancelButtonText: "取消",
		VNode: null
	}
): Promise<any | [any, any]> => {
	const { action = "", confirmButtonText = "确定", cancelButtonText = "取消", VNode = null } = opt;
	const formatContentArr = content.split("{action}");
	const action_length = formatContentArr.length - 1;
	const messageArr = [];
	if (action_length > 0) {
		for (let i = 0; i < action_length; i++) {
			messageArr.push(`${formatContentArr[i]}`);
			messageArr.push(h("span", { class: "text-[var(--el-color-success)]" }, action));
		}
	}
	messageArr.push(`${formatContentArr[action_length]}`);
	let message = h("p", null, messageArr);
	if (VNode) {
		message = h("div", null, [message, VNode]);
	}
	return ATJ(
		ElMessageBox.confirm(message, title, {
			closeOnClickModal: false, // 点击遮罩层不关闭弹窗
			closeOnPressEscape: false, // 按下Esc键不关闭弹窗
			cancelButtonText,
			confirmButtonText,
			confirmButtonClass: "el-button--success"
		})
	);
};

export const ElConfirmPrimary = (
	content: string,
	title: string,
	opt: Opt = {
		action: "",
		confirmButtonText: "确定",
		cancelButtonText: "取消",
		showCancelButton: true,
		VNode: null
	}
): Promise<any | [any, any]> => {
	const { action = "", confirmButtonText = "确定", cancelButtonText = "取消", VNode = null, showCancelButton = true } = opt;
	const formatContentArr = content.split("{action}");
	const action_length = formatContentArr.length - 1;
	const messageArr = [];
	if (action_length > 0) {
		for (let i = 0; i < action_length; i++) {
			messageArr.push(`${formatContentArr[i]}`);
			messageArr.push(h("span", { class: "text-[var(--el-color-primary)]" }, action));
		}
	}
	messageArr.push(`${formatContentArr[action_length]}`);
	let message = h("p", null, messageArr);
	if (VNode) {
		message = h("div", null, [message, VNode]);
	}
	return ATJ(
		ElMessageBox.confirm(message, title, {
			closeOnClickModal: false, // 点击遮罩层不关闭弹窗
			closeOnPressEscape: false, // 按下Esc键不关闭弹窗
			showCancelButton,
			cancelButtonText,
			confirmButtonText,
			confirmButtonClass: "el-button--primary"
		})
	);
};
