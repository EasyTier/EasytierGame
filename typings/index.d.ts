interface ImportMetaEnv {
	readonly VITE_CONFIG_PATH: string;
	readonly VITE_CONFIG_FILE_NAME: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
