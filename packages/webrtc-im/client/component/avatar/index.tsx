import { Skeleton } from "@arco-design/web-react";
import type { FC } from "react";
import { useMemo } from "react";
import styles from "./index.m.scss";
import { cs } from "@block-kit/utils";

export const Avatar: FC<{
  /** id 标识 */
  id: string;
  /** 长宽 */
  size?: number;
  /** 小方块长宽 */
  square?: number;
  className?: string;
}> = props => {
  const { square = 7, size = 40, id } = props;

  const colorMap = useMemo(() => {
    let num = 0;
    for (let i = 0; i < id.length; i++) {
      num = num + id.charCodeAt(i);
    }
    const colorList = ["#FE9E9F", "#93BAFF", "#D999F9", "#81C784", "#FFCA62", "#FFA477"];
    const color = colorList[num % colorList.length];
    const map: string[][] = [];
    const rows = Math.ceil(size / square);
    const halfRows = Math.ceil(rows / 2);
    for (let i = 0; i < rows; i++) {
      map[i] = [];
      for (let k = 0; k < halfRows; k++) {
        map[i][k] = num % (i * k + 1) > 1 ? color : "";
      }
      for (let k = halfRows; k < rows; k++) {
        map[i][k] = map[i][rows - 1 - k];
      }
    }
    return map;
  }, [id, size, square]);

  return (
    <div style={{ width: size, height: size }} className={cs(styles.avatar, props.className)}>
      {!id ? (
        <Skeleton
          className={styles.skeleton}
          animation
          image={{ shape: "circle" }}
          text={false}
        ></Skeleton>
      ) : (
        <div className={styles.squareAvatar} style={{ width: size, height: size }}>
          {colorMap.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((color, colIndex) => (
                <div
                  key={colIndex}
                  style={{ backgroundColor: color, width: square, height: square }}
                ></div>
              ))}
            </div>
          ))}
        </div>
      )}
      {props.children}
    </div>
  );
};
