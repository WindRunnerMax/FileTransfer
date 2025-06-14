import { useAtomValue } from "jotai";
import styles from "../styles/message.m.scss";
import type { FC } from "react";
import { useMemo } from "react";
import { useGlobalContext } from "../store/global";
import { CONNECT_DOT } from "../utils/connection";
import { Avatar } from "../component/avatar";

export const Message: FC = () => {
  const { message, store, rtc } = useGlobalContext();
  const list = useAtomValue(message.listAtom);
  const peerId = useAtomValue(store.peerIdAtom);
  const users = useAtomValue(store.userListAtom);
  const rtcState = useAtomValue(rtc.stateAtom);

  const peerUser = useMemo(() => {
    if (!peerId) return null;
    return users.find(user => user.id === peerId) || null;
  }, [peerId, users]);

  if (!peerId || !peerUser) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.captainArea}>
        <Avatar id={peerUser.id} size={20} square={4}></Avatar>
        <div className={styles.captainName}>{peerUser.id}</div>
        <div className={styles.dot} style={{ backgroundColor: CONNECT_DOT[rtcState] }}></div>
      </div>
      <div className={styles.messageArea}>
        {list.map((item, index) => (
          <div key={index} style={{ fontSize: 12 }}>
            {item.key !== "FILE" && item.data}
          </div>
        ))}
      </div>
      <div className={styles.inputArea}></div>
    </div>
  );
};
