/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss/plugin')} */

const plugin = require("tailwindcss/plugin");
module.exports = {
	content: ["./components/**/*.{js,vue,ts}", "./layouts/**/*.vue", "./pages/**/*.vue", "./plugins/**/*.{js,ts}", "./app.vue", "./error.vue"],
	theme: {
		extend: {}
	},
	plugins: [
		plugin(function ({ matchVariant, addUtilities, matchUtilities, theme }) {
			addUtilities({
				".app-drag": {
					"-webkit-app-region": "drag"
				},
				".app-nodrag": {
					"-webkit-app-region": "no-drag"
				}
			});
		})
	]
};
