export const INITIAL_THEME_SCRIPT = `const root = document.documentElement;
const background = matchMedia("(prefers-color-scheme: dark)").matches
  ? root.dataset.backgroundDark
  : root.dataset.backgroundLight;

if (background) root.style.setProperty("--initial-background", background);
root.classList.add("js");
setTimeout(() => root.classList.remove("js"), 3000);`;
