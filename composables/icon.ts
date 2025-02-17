import { basename, extname } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";

export const getIcon = async function (sourcePath: string, icoDirPath: string) {
	if(sourcePath.endsWith(".url")) return false;
	let res = await Command.create("ResourcesExtract", [
		"/Source",
		sourcePath,
		"/DestFolder",
		icoDirPath,
		"/ExtractIcons",
		"1",
		"/ExtractCursors",
		"0",
		"/OpenDestFolder",
		"0",
		"/MultiFilesMode",
		"1"
	]).execute();
	if (res.code == 0) {
		let icoPath = icoDirPath + "\\" + (await basename(sourcePath));
		icoPath = icoPath.replace(`.${await extname(sourcePath)}`, "_1.ico");
		if (await exists(icoPath)) {
			return icoPath;
		} else {
			return false;
		}
		return;
	} else {
		return false;
	}
};
