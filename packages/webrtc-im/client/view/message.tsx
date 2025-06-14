import { useAtom, useAtomValue } from "jotai";
import styles from "../styles/message.m.scss";
import type { FC } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useGlobalContext } from "../store/global";
import { CONNECT_DOT } from "../utils/connection";
import { Avatar } from "../component/avatar";
import { TRANSFER_TYPE } from "../../types/transfer";
import { IconClose, IconFolder } from "@arco-design/web-react/icon";
import { SendIcon } from "../component/icons/send";
import { preventNativeEvent } from "@block-kit/utils";

export const Message: FC = () => {
  const { message, store, rtc } = useGlobalContext();
  const list = useAtomValue(message.listAtom);
  const [peerId, setPeerId] = useAtom(store.peerIdAtom);
  const users = useAtomValue(store.userListAtom);
  const rtcState = useAtomValue(rtc.stateAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const peerUser = useMemo(() => {
    if (!peerId) return null;
    return users.find(user => user.id === peerId) || null;
  }, [peerId, users]);

  useEffect(() => {
    textareaRef.current && textareaRef.current.focus();
  }, [peerId]);

  if (!peerId || !peerUser) {
    return null;
  }

  const onDisconnect = () => {
    setPeerId("");
    rtc.disconnect();
  };

  return (
    <div className={styles.container}>
      <div className={styles.captainArea}>
        <div className={styles.captain}>
          <Avatar id={peerUser.id} size={20} square={4}></Avatar>
          <div className={styles.captainName}>{peerUser.id}</div>
          <div className={styles.dot} style={{ backgroundColor: CONNECT_DOT[rtcState] }}></div>
        </div>
        <div className={styles.disconnect} onClick={onDisconnect}>
          <IconClose></IconClose>
        </div>
      </div>
      <div className={styles.messageArea}>
        {list.map((item, index) => (
          <div key={index} className={styles.messageItem}>
            {item.key === TRANSFER_TYPE.SYSTEM && (
              <div className={styles.systemMessage}>{item.data}</div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.inputArea}>
        <div className={styles.operation} onMouseDown={preventNativeEvent}>
          <IconFolder />
        </div>
        <textarea ref={textareaRef} className={styles.textarea}></textarea>
        <div className={styles.send} onMouseDown={preventNativeEvent}>
          {SendIcon}
        </div>
      </div>
    </div>
  );
};
