import { WebRTCApi } from "../../types/webrtc";
import styles from "./index.module.scss";
import React, { FC, useEffect, useRef, useState } from "react";
import { CONNECTION_STATE, TextMessageType, TransferListItem } from "../../types/client";
import { Button, Input, Modal } from "@arco-design/web-react";
import { IconDriveFile, IconSend } from "@arco-design/web-react/icon";
import { WebRTC } from "../core/webrtc";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { cs, decodeJSON, encodeJSON, isString } from "laser-utils";

export const TransferModal: FC<{
  connection: React.MutableRefObject<WebRTC | null>;
  rtc: React.MutableRefObject<WebRTCApi | null>;
  id: string;
  setId: (id: string) => void;
  peerId: string;
  setPeerId: (id: string) => void;
  state: CONNECTION_STATE;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}> = ({ connection, rtc, state, peerId, visible, setVisible }) => {
  const [transferring, setTransferring] = useState(false);
  const [text, setText] = useState("");
  const [list, setList] = useState<TransferListItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const onCancel = () => {
    rtc.current?.close();
    setVisible(false);
  };

  const onScroll = () => {
    if (ref.current) {
      const el = ref.current;
      Promise.resolve().then(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  };

  const onMessage = useMemoizedFn((event: MessageEvent<string | ArrayBuffer>) => {
    console.log("onMessage", event);
    if (isString(event.data)) {
      const data = decodeJSON<TextMessageType>(event.data);
      if (data && data.type === "text") {
        setList([...list, { type: "text", from: "peer", data: data.data }]);
      }
    }
    onScroll();
  });

  useEffect(() => {
    const current = connection.current;
    console.log("current", current);
    current && (current.onMessage = onMessage);
    return () => {
      const noop = () => null;
      current && (current.onMessage = noop);
    };
  }, [connection, onMessage]);

  const onSendText = () => {
    const str = encodeJSON({ type: "text", data: text } as TextMessageType);
    if (str && rtc.current && text) {
      rtc.current?.send(str);
      setList([...list, { type: "text", from: "self", data: text }]);
      setText("");
      onScroll();
    }
  };

  return (
    <Modal
      className={styles.modal}
      title={
        <div className={styles.title}>
          <div
            className={styles.dot}
            style={{
              backgroundColor:
                state === CONNECTION_STATE.READY
                  ? "rgb(var(--red-6))"
                  : state === CONNECTION_STATE.CONNECTING
                  ? "rgb(var(--orange-6))"
                  : state === CONNECTION_STATE.CONNECTED
                  ? "rgb(var(--green-6))"
                  : "rgb(var(--gray-6))",
            }}
          ></div>
          {peerId ? "Connect: " + peerId : "Please Establish Connection"}
        </div>
      }
      visible={visible}
      footer={null}
      onCancel={onCancel}
      maskClosable={false}
    >
      <div className={styles.modalContent} ref={ref}>
        {list.map((item, index) => (
          <div
            key={index}
            className={cs(styles.messageItem, item.from === "self" && styles.alignRight)}
          >
            <div className={styles.messageContent}>
              {item.type === "text" ? <span>{item.data}</span> : <></>}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.modalFooter}>
        <Button
          disabled={transferring}
          type="primary"
          icon={<IconDriveFile />}
          className={styles.sendFile}
        >
          File
        </Button>
        <Input
          value={text}
          onChange={setText}
          disabled={transferring}
          allowClear
          placeholder="Send Message"
          onPressEnter={onSendText}
        />
        <Button
          onClick={onSendText}
          disabled={transferring}
          type="primary"
          status="success"
          icon={<IconSend />}
        >
          Send
        </Button>
      </div>
    </Modal>
  );
};
