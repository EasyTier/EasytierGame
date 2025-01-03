interface ImportMetaEnv {
	readonly VITE_CONFIG_PATH: string;
	readonly VITE_CONFIG_FILE_NAME: string;
	readonly VITE_LOG_PATH: string;
	readonly VITE_CACHE_PATH: string;
	readonly VITE_AUTO_START_SERVICE_NAME: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
