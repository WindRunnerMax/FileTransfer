import { cs } from "@block-kit/utils";
import type { FC } from "react";
import { useState } from "react";
import styles from "./index.m.scss";
import { Tooltip } from "@arco-design/web-react";

export const EllipsisTooltip: FC<{
  /** 样式 */
  className?: string;
  /** 内部文本 */
  text: string;
  /** ToolTip 文本/节点 */
  tooltip: React.ReactNode;
}> = props => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const onRef = (el: HTMLSpanElement | null) => {
    if (!el) return;
    const isOverflowing = el.scrollWidth > el.clientWidth;
    setTooltipVisible(isOverflowing);
  };

  return (
    <Tooltip disabled={!tooltipVisible} content={props.tooltip}>
      <span ref={onRef} className={cs(styles.text, props.className)}>
        {props.text}
      </span>
    </Tooltip>
  );
};
