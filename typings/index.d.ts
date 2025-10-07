interface ImportMetaEnv {
	readonly VITE_CONFIG_PATH: string;
	readonly VITE_CONFIG_FILE_NAME: string;
	readonly VITE_LOG_PATH: string;
	readonly VITE_CACHE_PATH: string;
	readonly VITE_AUTO_START_SERVICE_NAME: string;
	readonly VITE_GAME_LIST_PATH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// 节点数据类型定义
interface NodeItem {
	id: number;
	name: string;
	host: string;
	port: number;
	protocol: string;
	version: string;
	description: string;
	max_connections: number;
	current_connections: number;
	is_active: boolean;
	is_approved: boolean;
	allow_relay: boolean;
	network_name: string | null;
	network_secret: string | null;
	created_at: string;
	updated_at: string;
	address: string;
	usage_percentage: number;
	current_health_status: string;
	last_check_time: string;
	last_response_time: number;
	health_percentage_24h: number;
	health_record_total_counter_ring: number[];
	health_record_healthy_counter_ring: number[];
	ring_granularity: number;
	qq_number: string | null;
	wechat: string | null;
	mail: string | null;
}

interface NodesData {
	items: NodeItem[];
	total: number;
	page: number;
	per_page: number;
	total_pages: number;
}

interface NodesResponse {
	success: boolean;
	data: NodesData;
	error: string | null;
	message: string | null;
}
