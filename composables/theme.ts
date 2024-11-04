import { useDark, useToggle, usePreferredDark } from "@vueuse/core";
import { isFunction } from "lodash-es";
const isDark = usePreferredDark();
const darkConfig = useDark({
	selector: "html",
	attribute: "class",
	valueDark: "dark",
	valueLight: "",
});
const toggleDark = useToggle(darkConfig);
export const initTheme = () => {
	if (isDark && isFunction(toggleDark)) {
		toggleDark(isDark.value);
	}
};

export const setTheme = (dark: boolean) => {
    if (isFunction(toggleDark)) {
		toggleDark(dark);
	}
}
