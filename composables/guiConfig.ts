import { BaseDirectory, exists, mkdir, readDir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import type { RoomProfile } from "@/stores/index";

const GUI_CONFIG_VERSION = 1;

type RoomGuiConfigFile = {
	version: number;
	savedAt: string;
	roomOrder?: number;
	room: RoomProfile;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isRoomGuiConfigFile = (value: unknown): value is RoomGuiConfigFile => {
	if (!isRecord(value) || value.version !== GUI_CONFIG_VERSION || !isRecord(value.room)) {
		return false;
	}
	const room = value.room;
	return (
		typeof value.savedAt === "string" &&
		Number.isFinite(Date.parse(value.savedAt)) &&
		(value.roomOrder === undefined || (typeof value.roomOrder === "number" && Number.isInteger(value.roomOrder))) &&
		typeof room.id === "string" &&
		Boolean(room.id) &&
		typeof room.name === "string" &&
		typeof room.rpcPortal === "number" &&
		isRecord(room.config)
	);
};

const ensureGuiConfigDirectory = async () => {
	const directoryPath = import.meta.env.VITE_GUI_CONFIG_PATH;
	if (!(await exists(directoryPath, { baseDir: BaseDirectory.Resource }))) {
		await mkdir(directoryPath, { baseDir: BaseDirectory.Resource, recursive: true });
	}
	return directoryPath;
};

const writeRoomGuiConfig = async (directoryPath: string, room: RoomProfile, roomOrder: number) => {
	const filePath = `${directoryPath}${room.id}.json`;
	const content = JSON.stringify(
		{
			version: GUI_CONFIG_VERSION,
			savedAt: new Date().toISOString(),
			roomOrder,
			room
		},
		null,
		4
	);
	await writeTextFile(filePath, content, { baseDir: BaseDirectory.Resource });
	return filePath;
};

export const saveRoomGuiConfig = async (room: RoomProfile, roomOrder: number) => {
	const directoryPath = await ensureGuiConfigDirectory();
	return writeRoomGuiConfig(directoryPath, room, roomOrder);
};

export const saveRoomGuiConfigs = async (rooms: RoomProfile[]) => {
	const directoryPath = await ensureGuiConfigDirectory();
	const writtenFilePaths: string[] = [];
	try {
		for (const [index, room] of rooms.entries()) {
			const filePath = `${directoryPath}${room.id}.json`;
			try {
				writtenFilePaths.push(await writeRoomGuiConfig(directoryPath, room, index));
			} catch (error) {
				writtenFilePaths.push(filePath);
				throw error;
			}
		}
		return writtenFilePaths;
	} catch (error) {
		// 首次迁移必须全量成功，避免下次启动把不完整目录误判为完整的多房间数据源。
		await Promise.allSettled(
			writtenFilePaths.map(filePath => remove(filePath, { baseDir: BaseDirectory.Resource }))
		);
		throw error;
	}
};

export const loadRoomGuiConfigs = async () => {
	const directoryPath = import.meta.env.VITE_GUI_CONFIG_PATH;
	if (!(await exists(directoryPath, { baseDir: BaseDirectory.Resource }))) {
		return [] as RoomProfile[];
	}

	const entries = await readDir(directoryPath, { baseDir: BaseDirectory.Resource });
	const configs = await Promise.all(
		entries
			.filter(entry => entry.isFile && entry.name.toLowerCase().endsWith(".json"))
			.map(async entry => {
				const filePath = `${directoryPath}${entry.name}`;
				try {
					const parsedConfig: unknown = JSON.parse(await readTextFile(filePath, { baseDir: BaseDirectory.Resource }));
					if (!isRoomGuiConfigFile(parsedConfig)) {
						throw new Error("文件结构或版本不受支持");
					}
					return parsedConfig;
				} catch (error) {
					console.error(`读取 GUI 房间配置“${entry.name}”失败`, error);
					return null;
				}
			})
	);

	const roomConfigById = new Map<string, RoomGuiConfigFile>();
	for (const config of configs) {
		if (!config) continue;
		const savedConfig = roomConfigById.get(config.room.id);
		if (!savedConfig || Date.parse(config.savedAt) >= Date.parse(savedConfig.savedAt)) {
			roomConfigById.set(config.room.id, config);
		}
	}

	return [...roomConfigById.values()]
		.sort(
			(a, b) =>
				(a.roomOrder ?? Number.MAX_SAFE_INTEGER) - (b.roomOrder ?? Number.MAX_SAFE_INTEGER) ||
				a.room.name.localeCompare(b.room.name, "zh-CN")
		)
		.map(config => config.room);
};

export const removeRoomGuiConfig = async (roomId: string) => {
	const filePath = `${import.meta.env.VITE_GUI_CONFIG_PATH}${roomId}.json`;
	if (await exists(filePath, { baseDir: BaseDirectory.Resource })) {
		await remove(filePath, { baseDir: BaseDirectory.Resource });
	}
};
