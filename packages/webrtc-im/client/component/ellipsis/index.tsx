import { cs } from "@block-kit/utils";
import type { FC } from "react";
import { useState } from "react";
import styles from "./index.m.scss";
import type { TriggerProps } from "@arco-design/web-react";
import { Tooltip } from "@arco-design/web-react";

export const EllipsisTooltip: FC<{
  /** 样式 */
  className?: string;
  /** 内部文本 */
  text: string;
  /** ToolTip 文本/节点 */
  tooltip: React.ReactNode;
  /** 触发器属性 */
  triggerProps?: Partial<TriggerProps>;
}> = props => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const onRef = (el: HTMLSpanElement | null) => {
    if (!el) return;
    const isOverflowing = el.scrollWidth > el.clientWidth;
    setTooltipVisible(isOverflowing);
  };

  return (
    <Tooltip disabled={!tooltipVisible} content={props.tooltip} triggerProps={props.triggerProps}>
      <span ref={onRef} className={cs(styles.text, props.className)}>
        {props.text}
      </span>
    </Tooltip>
  );
};
