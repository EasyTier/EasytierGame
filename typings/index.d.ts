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

type Member = {
	cidr: string;
	ipv4: string;
	hostname: string;
	cost: string;
	lat_ms: string;
	loss_rate: string;
	rx_bytes: string;
	tx_bytes: string;
	tunnel_proto: string;
	nat_type: string;
	id: string;
	version: string;
	connections_addrs: string[];
	proxy?: [string, "Connected" | "Closed"];
};

type ConnectionsType = {
	route: {
		peer_id: number;
		ipv4_addr: string | null;
		next_hop_peer_id: number;
		cost: number;
		path_latency: number;
		proxy_cidrs: string[];
		hostname: string;
		stun_info: {
			udp_nat_type: number;
			tcp_nat_type: number;
			last_update_time: number;
			public_ip: string[];
			min_port: number;
			max_port: number;
		};
	};
	peer: {
		peer_id: number;
		conns: {
			conn_id: string;
			my_peer_id: number;
			peer_id: number;
			features: string[];
			tunnel: {
				tunnel_type: string;
				local_addr: {
					url: string;
				};
				remote_addr: {
					url: string;
				};
			};
		}[];
	};
};
type Proxy = {
	src: string;
	dst: string;
	start_time: string;
	state: "Connected" | "Closed";
	transport_type: string;
};
