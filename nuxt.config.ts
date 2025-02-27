import { defineNuxtConfig } from "nuxt/config";
import path from "path";
import vueJSX from "@vitejs/plugin-vue-jsx";

export default defineNuxtConfig({
	ssr: false,

	devServer: {
		port: 5000
	},

	telemetry: false,

	imports: {
		autoImport: false
	},

	css: ["~/assets/css/main.css", "element-plus/theme-chalk/dark/css-vars.css"],
	modules: [
		"@element-plus/nuxt",
		"@pinia/nuxt",
		[
			"pinia-plugin-persistedstate/nuxt",
			{
				key: "__glj_persisted_%id",
				storage: "localStorage"
			}
		],
		"@nuxtjs/tailwindcss"
	],

	alias: {
		"@": path.resolve(__dirname, "./")
	},

	experimental: {
		payloadExtraction: false
	},

	devtools: {
		enabled: false
	},

	router: {
		options: {
			hashMode: true
		}
	},

	vite: {
		plugins: [vueJSX({})],
		envDir: "env",
		optimizeDeps: {
			// include: [...optimizeDepsElementPlusIncludes]
		},
		// prevent vite from obscuring rust errors
		clearScreen: false,
		// Tauri expects a fixed port, fail if that port is not available
		server: {
			strictPort: true
		},
		// to access the Tauri environment variables set by the CLI with information about the current target
		envPrefix: ["VITE_", "TAURI_"],
		build: {
			// minify: "esbuild",
			chunkSizeWarningLimit: 1500,
			// Tauri uses Chromium on Windows and WebKit on macOS and Linux
			target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
			// don't minify for debug builds
			minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
			// 为调试构建生成源代码映射 (sourcemap)
			sourcemap: !!process.env.TAURI_DEBUG
		},
		esbuild: {
			// pure: ["console.log"],
			drop: ["debugger"]
		}
	},

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {}
		}
	},

	app: {
		rootId: "__easytier",
		cdnURL: "./",
		buildAssetsDir: "__easytier/",
		head: {
			meta: [
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{
					charset: "utf-8"
				}
			],
			title: "easytier-game"
			// link: [],
			// style: [],
			// script: [],
			// noscript: []
		}
	},
	compatibilityDate: "2024-11-12"
});
