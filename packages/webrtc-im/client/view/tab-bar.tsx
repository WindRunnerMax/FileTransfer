import type { FC } from "react";
import styles from "../styles/tab-bar.m.scss";
import { Avatar } from "../component/avatar";
import { useGlobalContext } from "../store/global";
import { useAtom, useAtomValue } from "jotai";
import { CONNECT_DOT } from "../utils/connection";
import { IconCloud, IconUser } from "@arco-design/web-react/icon";
import { cs } from "@block-kit/utils";
import { NET_TYPE } from "../../types/client";
import { EllipsisTooltip } from "../component/ellipsis";
import { useIsMobile } from "../hooks/use-is-mobile";

export const TabBar: FC = () => {
  const { signal, store } = useGlobalContext();
  const { isMobile } = useIsMobile();
  const signalState = useAtomValue(signal.stateAtom);
  const [tab, setTab] = useAtom(store.netTypeAtom);

  return (
    <div className={styles.container}>
      <div className={styles.avatar}>
        <Avatar id={signal.id} size={isMobile ? 26 : void 0} square={isMobile ? 4 : void 0}>
          <div className={styles.dot} style={{ backgroundColor: CONNECT_DOT[signalState] }}></div>
        </Avatar>
        <div className={styles.name}>
          <EllipsisTooltip
            triggerProps={{ trigger: isMobile ? "click" : void 0, position: "top" }}
            text={signal.id || "..."}
            tooltip={signal.id}
          ></EllipsisTooltip>{" "}
        </div>
      </div>
      <div
        onClick={() => setTab(NET_TYPE.LAN)}
        className={cs(styles.netTab, tab === NET_TYPE.LAN && styles.active)}
      >
        <IconUser />
      </div>
      <div
        onClick={() => setTab(NET_TYPE.WAN)}
        className={cs(styles.netTab, tab === NET_TYPE.WAN && styles.active)}
      >
        <IconCloud />
      </div>
    </div>
  );
};
