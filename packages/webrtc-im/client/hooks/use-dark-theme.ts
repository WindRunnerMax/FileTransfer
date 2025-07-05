import { IS_BROWSER_ENV } from "@block-kit/utils";
import { useEffect, useState } from "react";

const SETTER_SET = new Set<React.Dispatch<React.SetStateAction<boolean>>>();

const media = IS_BROWSER_ENV && window.matchMedia("(prefers-color-scheme: dark)");

if (IS_BROWSER_ENV && media) {
  const onDarkThemeInspect = (e?: MediaQueryListEvent) => {
    const mediaQuery = e || media;
    if (mediaQuery.matches) {
      document.body.setAttribute("arco-theme", "dark");
      SETTER_SET.forEach(setter => setter(true));
    } else {
      document.body.removeAttribute("arco-theme");
      SETTER_SET.forEach(setter => setter(false));
    }
  };
  media.onchange = onDarkThemeInspect;
  onDarkThemeInspect();
}

export const useDarkTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => (media ? media.matches : false));

  useEffect(() => {
    SETTER_SET.add(setIsDarkMode);
    return () => {
      SETTER_SET.delete(setIsDarkMode);
    };
  }, []);

  return { isDarkMode };
};
