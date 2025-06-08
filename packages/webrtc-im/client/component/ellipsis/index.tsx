import { cs } from "@block-kit/utils";
import type { FC } from "react";

export const Ellipsis: FC<{
  className?: string;
}> = props => {
  return <div className={cs(props.className)}></div>;
};
