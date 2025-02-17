<template>
	<div class="relative flex h-full flex-col flex-wrap gap-[0] overflow-hidden">
		<div class="flex h-[40px] w-full flex-nowrap items-center gap-[0_5px]">
			<div class="ml-[5px] mr-auto flex flex-1">
				<ElInput
					size="small"
					v-model="searchValue"
					placeholder="请输入游戏名进行查询"
				></ElInput>
			</div>
			<div>
				<ElButton
					:icon="Plus"
					size="small"
					type="primary"
					class="mr-[5px]"
					@click="handleCreate"
				>
					新增游戏
				</ElButton>
				<ElButton
					size="small"
					class="!ml-[0px] mr-[5px]"
					@click="openCoverDir"
				>
					封面目录
				</ElButton>
			</div>
		</div>
		<div class="flex flex-1 flex-wrap gap-[0] overflow-auto">
			<div
				v-for="(item, idx) in computedGameList"
				:key="item.id"
				class="w-[25%] p-[4px]"
			>
				<div class="group/card relative">
					<ElCard>
						<template #header>
							<div class="flex flex-nowrap gap-[0_8px]">
								<ElTooltip :content="item.name" placement="top">
									<p class="ml-auto flex-1 truncate">
										<ElText
											size="default"
											type="info"
										>
											{{ item.name }}
										</ElText>
									</p>
								</ElTooltip>
							</div>
						</template>
						<img
							:src="showImgConvertFileSrc(item.showImg)"
							@error="handleImgError(item, idx)"
							class="aspect-[1] w-full object-cover"
						/>
					</ElCard>
					<div
						class="absolute left-0 top-[61px] z-[1] hidden h-[calc(100%-61px)] w-full flex-col items-center justify-center rounded-[5px] bg-[var(--el-mask-color)] group-hover/card:flex"
					>
						<ElButton
							size="large"
							type="success"
							:icon="VideoPlay"
							@click.stop="handleStartGame(item)"
						>
							启动游戏
						</ElButton>
						<div class="pt-[5px]">
							<ElButton
								size="small"
								type="info"
								:icon="EditPen"
								title="修改"
								@click.stop="handleEditItem(item)"
							/>
							<ElButton
								size="small"
								type="danger"
								:icon="DeleteFilled"
								title="删除"
								@click.stop="handleDeleteItem(item)"
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="w-[25%] p-[4px]">
				<ElTooltip content="新增本地游戏">
					<ElCard
						@click.stop="handleCreate"
						shadow="hover"
					>
						<div class="group/plus flex cursor-pointer flex-col items-center justify-center py-[25px]">
							<ElIcon class="!text-[80px] transition-all group-hover/plus:text-[color:var(--el-color-primary)]">
								<Plus></Plus>
							</ElIcon>
							<div>
								<ElText>支持从桌面拖放新增</ElText>
							</div>
						</div>
					</ElCard>
				</ElTooltip>
			</div>
		</div>
		<ElDialog
			width="95%"
			top="30px"
			append-to-body
			:z-index="10"
			class="!mb-0"
			v-model="createGameData.visible"
			:close-on-press-escape="false"
			:title="`${createGameData.isEdit ? '编辑' : '新建'}本地游戏`"
		>
			<ElForm
				hide-required-asterisk
				label-position="left"
				:model="createGameData.form"
				:rules="createGameData.rules"
				ref="formRef"
			>
				<ElFormItem
					label="游戏名字"
					prop="name"
				>
					<ElInput
						v-model="createGameData.form.name"
						placeholder="请输入游戏名字"
					></ElInput>
				</ElFormItem>
				<ElFormItem
					label="执行文件"
					prop="exePath"
				>
					<ElInput
						v-model="createGameData.form.exePath"
						placeholder="请选择游戏执行文件"
					>
						<template #append>
							<ElButton
								size="small"
								type="primary"
								@click.stop="handleBrowser('exePath')"
							>
								浏览
							</ElButton>
						</template>
					</ElInput>
				</ElFormItem>
				<ElFormItem
					label="游戏封面"
					prop="showImg"
				>
					<ElBadge :hidden="createGameData.form.showImg == defaultPng">
						<template #content="{ value }">
							<div
								class="cursor-pointer"
								@click.stop="handleBadgeDeleteCover"
							>
								<ElIcon>
									<DeleteFilled />
								</ElIcon>
							</div>
						</template>
						<img
							@click.stop="handleBrowser('showImg')"
							:src="showImgConvertFileSrc(createGameData.form.showImg)"
							class="aspect-[1] w-[120px] cursor-pointer object-cover"
						/>
					</ElBadge>
				</ElFormItem>
			</ElForm>
			<template #footer>
				<div><ElText type="warning">除了默认封面以外，自定义封面会集中保存在封面目录里</ElText></div>
				<ElButton
					size="default"
					type="primary"
					@click="handleSave"
				>
					保存
				</ElButton>
				<ElButton
					size="default"
					@click="createGameData.visible = false"
				>
					关闭
				</ElButton>
			</template>
		</ElDialog>
	</div>
</template>
<script lang="ts" setup>
	import { VideoPlay, DeleteFilled, EditPen, Plus, Delete } from "@element-plus/icons-vue";
	import { dataSubscribe } from "~/composables/windows";
	import { BaseDirectory, basename, extname, resourceDir as getResourceDir, join } from "@tauri-apps/api/path";
	import { convertFileSrc, Resource } from "@tauri-apps/api/core";
	import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from "vue";
	import useMainStore from "@/stores/index";
	import { uniqueId } from "lodash-es";
	import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
	import { ElMessage, type FormInstance } from "element-plus";
	import { ATJ, bounce } from "~/utils";
	import { ElConfirmDanger } from "~/utils/element";
	import { copyFile, exists, mkdir, readDir, remove } from "@tauri-apps/plugin-fs";
	import { Command, open } from "@tauri-apps/plugin-shell";
	import { listen, type UnlistenFn } from "@tauri-apps/api/event";

	const resourceDir = await getResourceDir();
	const gameListResourceDir = await join(resourceDir, import.meta.env.VITE_GAME_LIST_PATH);
	// const defaultLocalIconPath = await join(configPath, "icon.png");
	// const tauriPath = convertFileSrc(defaultLocalIconPath);
	const mainStore = useMainStore();
	const formEl = useTemplateRef<FormInstance>("formRef");
	const searchValue = ref("");
	const defaultPng = "/default.png";
	// const b = bounce(600);
	type gameItemType = { name: string; exePath: string; id: string; showImg: string };
	const createGameData = reactive({
		visible: false,
		isEdit: false,
		form: {
			id: "",
			name: "",
			exePath: "",
			showImg: defaultPng
		},
		rules: {
			name: [{ required: true, message: "请输入游戏名", trigger: "blur" }],
			exePath: [{ required: true, message: "请选择游戏执行文件", trigger: "blur" }]
		}
	});

	const computedGameList = computed(() => {
		if (!searchValue.value.trim()) return mainStore.gameList;
		return mainStore.gameList.filter(item => {
			return item.name.includes(searchValue.value); // 过滤
		});
	});

	const handleCreate = async () => {
		createGameData.isEdit = false;
		createGameData.form = {
			id: "",
			name: "",
			exePath: "",
			showImg: defaultPng
		};
		await nextTick();
		createGameData.visible = true;
	};

	const handleBrowser = async (type: "showImg" | "exePath") => {
		const filters = type === "showImg" ? [{ name: "", extensions: ["png", "jpg", "jpeg"] }] : [{ name: "", extensions: ["exe"] }];
		const file = await dialogOpen({
			multiple: false,
			directory: false,
			filters
		});
		if (file) {
			if (type === "showImg") {
				if (file) {
					if (!createGameData.form.id) {
						const time = new Date().getTime();
						createGameData.form.id = uniqueId(`${time}`);
					}
					let showImg = file;
					const game_list_path = import.meta.env.VITE_GAME_LIST_PATH;
					const isExists = await exists(game_list_path, { baseDir: BaseDirectory.Resource });
					if (!isExists) {
						try {
							await mkdir(game_list_path, { baseDir: BaseDirectory.Resource });
						} catch (err) {}
					}
					const toPath = await join(gameListResourceDir, createGameData.form.id);
					const suffix = showImg.split(".").pop();
					const toPathFileName = `${toPath}.${suffix}`;
					if (showImg != toPathFileName) {
						await copyFile(showImg, toPathFileName);
					}
					// console.log(toPathFileName);
					const isExistsToPath = await exists(toPathFileName);
					if (isExistsToPath) {
						const baseName = await basename(toPathFileName);
						createGameData.form = { ...createGameData.form, showImg: `${baseName}` }; // 如果复制正确，那就存储文件名即可
					}
				}
			}
			if (type === "exePath") {
				createGameData.form.exePath = file;
			}
		} else {
			ElMessage.error("获取文件路径失败");
		}
	};

	const openCoverDir = async () => {
		const game_list_path = import.meta.env.VITE_GAME_LIST_PATH;
		const isExists = await exists(game_list_path, { baseDir: BaseDirectory.Resource });
		if (!isExists) {
			try {
				await mkdir(game_list_path, { baseDir: BaseDirectory.Resource });
			} catch (err) {}
		}
		await Command.create("explorer", [gameListResourceDir]).execute();
	};

	const handleSave = async () => {
		const [error, _] = await ATJ(formEl.value?.validate() as Promise<boolean>);
		if (!error) {
			if (createGameData.form.showImg == defaultPng) {
				//删除本地封面图
				// const toPath = await join(gameListResourceDir, createGameData.form.id);
				// const imgPath = `${toPath}.${suffix}`;
				// await remove(imgPath);
			}

			const idx = mainStore.gameList.findIndex(i => i.id == createGameData.form.id);
			if (idx >= 0) {
				mainStore.gameList[idx] = { ...createGameData.form };
				mainStore.$patch({
					gameList: [...mainStore.gameList]
				});
			} else {
				mainStore.$patch({
					gameList: [...mainStore.gameList, createGameData.form]
				});
			}

			ElMessage.success("保存成功");
			createGameData.visible = false;
			// await Command.create("explorer", [gameListResourceDir]).execute();
		}
	};

	const handleBadgeDeleteCover = async () => {
		await removeFileById(createGameData.form.id);
		createGameData.form = { ...createGameData.form, showImg: defaultPng };
	};

	const removeFileById = async (id: string) => {
		if (!id) return;
		const isExists = await exists(gameListResourceDir);
		if (!isExists) return;
		const entries = await readDir(gameListResourceDir);
		if (entries.length > 0) {
			for (const entry of entries) {
				if (entry.name.includes(id + ".")) {
					const imgPath = await join(gameListResourceDir, entry.name);
					const isExists = await exists(imgPath);
					if (!isExists) continue;
					await remove(imgPath);
				}
			}
		}
	};

	const handleDeleteItem = async ({ id }: gameItemType) => {
		if (id) {
			const [error, _] = await ElConfirmDanger("确定要删除吗？");
			if (!error) {
				await removeFileById(id);
				mainStore.$patch({
					gameList: mainStore.gameList.filter(i => i.id !== id)
				});
			}
		}
	};

	const handleEditItem = async (item: gameItemType) => {
		createGameData.isEdit = true;
		createGameData.form = { ...item };
		createGameData.visible = true;
	};

	const handleStartGame = async (item: gameItemType) => {
		try {
			const isExists = await exists(item.exePath);
			if (!isExists) {
				return ElMessage.error("执行文件不存在");
			}
		} catch (err) {
			return ElMessage.error("执行文件不存在");
		}

		ElMessage.info("正在启动游戏，请稍后...");
		const _child = await open(item.exePath);
	};

	const handleImgError = (item: gameItemType, idx: number) => {
		item.showImg = defaultPng;
		mainStore.gameList[idx] = { ...item };
		mainStore.$patch({
			gameList: [...mainStore.gameList]
		});
	};

	const showImgConvertFileSrc = (showImg: string) => {
		if (showImg == defaultPng) return defaultPng;
		showImg = /^[a-z]\:/g.test(showImg.toLowerCase())
			? `${convertFileSrc(showImg)}?${new Date().getTime()}`
			: `${convertFileSrc(`${gameListResourceDir}\\${showImg}`)}?${new Date().getTime()}`;
		return showImg;
	};

	let unlistenDragDrop: UnlistenFn | null = null;
	const listenDragDrop = async () => {
		unlistenDragDrop = await listen<{ paths: string[]; position: { x: number; y: number } }>("tauri://drag-drop", async e => {
			const AllFiles = e.payload.paths;
			let result: Array<gameItemType> = [];
			const date = new Date().getTime();
			const showImg = defaultPng;
			const extUrls = [];
			const lnkFiles = [];
			for (const item of AllFiles) {
				if (item.endsWith(".url")) {
					extUrls.push(item);
				} else {
					lnkFiles.push(item);
				}
			}

			if (lnkFiles.length > 0) {
				// console.log(lnkFiles)
				let lnkFilesstr = "$lnkFiles = @(";
				for (let i = 0; i < lnkFiles.length; i++) {
					lnkFilesstr = lnkFilesstr + `\"${lnkFiles[i]}\"`;
					if (i == lnkFiles.length - 1) {
						lnkFilesstr = lnkFilesstr + ");";
					} else {
						lnkFilesstr = lnkFilesstr + ",";
					}
				}
				let forstr =
					lnkFilesstr +
					`
					$shell = New-Object -ComObject WScript.Shell;
					$results = @();
					foreach ($lnkFile in $lnkFiles) {
						$shortcut = $shell.CreateShortcut($lnkFile);
						$targetPath = $shortcut.TargetPath;
						$iconLocation = $shortcut.IconLocation;
						$results += [PSCustomObject]@{
							TargetPath = $targetPath
							LinkFile = $lnkFile
						};
					};
					$results | ConvertTo-Json
				`;
				let outputtarget = await Command.create("powershell", [`${forstr}`], {
					encoding: "GBK"
				}).execute();
				let res: {
					TargetPath: string;
					LinkFile: string;
				}[] = JSON.parse(outputtarget.stdout);
				if (res && !Array.isArray(res)) {
					res = [res];
				}
				if (res.length > 0) {
					for (const idx in res) {
						const item = res[idx];
						// console.log(item);
						const id = `${date}-${idx}`;
						const exePath = item.TargetPath || item.LinkFile;
						const namePath = item.LinkFile || item.TargetPath;
						const allName = await basename(namePath);
						const extName = await extname(namePath);
						result.push({
							exePath: exePath,
							name: allName.replace(`.${extName}`, ""),
							id,
							showImg
						});
					}
				}
			}
			if (extUrls.length > 0) {
				for (const idx in extUrls) {
					const TargetPath = extUrls[idx];
					const id = `${date}-${idx}-url`;
					const allName = await basename(TargetPath);
					const extName = await extname(TargetPath);
					result.push({
						exePath: TargetPath,
						name: allName.replace(`.${extName}`, ""),
						id,
						showImg
					});
				}
			}

			if (result.length > 0) {
				mainStore.$patch({
					gameList: [...mainStore.gameList, ...result]
				});
			}
		});
	};

	// 兼容新的存储方式
	const compatibleGameList = async () => {
		const gameList = [...mainStore.gameList];
		if(gameList.length <= 0) return;
		const newGameList = [];
		for(const item of gameList) {
			const newItem = {...item}
			if(newItem.showImg != defaultPng && /^[a-z]\:/g.test(newItem.showImg.toLowerCase())) {
				newItem.showImg = await basename(item.showImg);
				if(Reflect.has(newItem, "coverImg")) {
					delete newItem['coverImg'];
				}
			}
			newGameList.push(newItem);
		}
		mainStore.$patch({
			gameList: newGameList
		})
	}

	onMounted(async () => {
		await compatibleGameList();
		listenDragDrop(); //监听拖放
	});

	onBeforeUnmount(() =>{
		unlistenDragDrop && unlistenDragDrop();
	})


	dataSubscribe();
</script>
