import { createPersistedState } from "pinia-plugin-persistedstate";
import { defineNuxtPlugin } from "nuxt/app";
export default defineNuxtPlugin((nuxtApp: any) => {
	nuxtApp.$pinia.use(
		createPersistedState({
			storage: localStorage,
			key: id => `__glj_persisted_${id}`
		})
	);
});
