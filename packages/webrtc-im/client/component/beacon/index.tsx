import styles from "./index.m.scss";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { BoardCastIcon } from "../icons/board-cast";
import { useDarkTheme } from "../../hooks/use-dark-theme";
import { useMemoFn } from "@block-kit/utils/dist/es/hooks";
import { useIsMobile } from "../../hooks/use-is-mobile";

export const Beacon: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { isDarkMode } = useDarkTheme();
  const { isMobile } = useIsMobile();

  const drawing = useMemoFn(() => {
    const canvas = ref.current;
    const parent = canvas && canvas.parentElement;
    const ctx = canvas && canvas.getContext("2d");
    if (!canvas || !parent || !ctx) return void 0;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    const devicePixelRatio = Math.ceil(window.devicePixelRatio || 1);
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const x = width / 2;
    const y = height - 23;
    const degree = Math.max(width, height, 1000) / 20;

    const drawCircle = (radius: number) => {
      ctx.beginPath();
      const base = isDarkMode ? 1 : 0;
      const gradient = Math.abs(base - radius / Math.max(width, height));
      const color = Math.round(255 * gradient);
      ctx.strokeStyle = `rgba(${color}, ${color}, ${color}, 0.07)`;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.lineWidth = 1;
    };

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < 8; i++) {
      drawCircle(degree * i + i * i * 0.1 * 30);
    }
  });

  useEffect(() => {
    Promise.resolve().then(drawing);
  }, [isDarkMode, drawing, isMobile]);

  useEffect(() => {
    drawing();
    window.addEventListener("resize", drawing);
    return () => {
      window.removeEventListener("resize", drawing);
    };
  }, [drawing]);

  return (
    <div className={styles.container}>
      <div className={styles.prompt}>Open Another Device On The LAN To Transfer Files</div>
      <div className={styles.boardCastIcon}>{BoardCastIcon}</div>
      <canvas className={styles.canvas} ref={ref}></canvas>
    </div>
  );
};
