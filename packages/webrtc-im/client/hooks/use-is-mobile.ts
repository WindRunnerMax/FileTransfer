import { IS_BROWSER_ENV, IS_MOBILE } from "@block-kit/utils";
import { useEffect, useState } from "react";

const MAX_SCREEN_WIDTH = 768;
const SETTER_SET = new Set<React.Dispatch<React.SetStateAction<boolean>>>();

const inspectMobile = () => {
  return IS_BROWSER_ENV ? window.innerWidth <= MAX_SCREEN_WIDTH || IS_MOBILE : IS_MOBILE;
};

if (IS_BROWSER_ENV) {
  window.addEventListener("resize", () => {
    const value = inspectMobile();
    SETTER_SET.forEach(setter => setter(value));
  });
}

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(inspectMobile);

  useEffect(() => {
    SETTER_SET.add(setIsMobile);
    return () => {
      SETTER_SET.delete(setIsMobile);
    };
  }, []);

  return { isMobile, inspectMobile };
};
