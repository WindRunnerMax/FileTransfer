import { useAtom } from "jotai";
import styles from "../styles/message.m.scss";
import type { FC } from "react";
import { useGlobalContext } from "../store/global";

export const Message: FC = () => {
  const { message, store } = useGlobalContext();
  const [list] = useAtom(message.listAtom);
  const [peerId] = useAtom(store.peerIdAtom);

  if (!peerId) {
    return null;
  }

  return (
    <div className={styles.container}>
      {list.map((item, index) => (
        <div key={index}>{item.key !== "FILE" && item.data}</div>
      ))}
    </div>
  );
};
