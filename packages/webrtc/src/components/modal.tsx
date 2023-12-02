import { WebRTCApi } from "../../types/webrtc";
import styles from "./index.module.scss";
import React, { FC, useEffect, useRef, useState } from "react";
import { CONNECTION_STATE, TransferListItem } from "../../types/client";
import { Button, Input, Modal } from "@arco-design/web-react";
import { IconDriveFile, IconSend } from "@arco-design/web-react/icon";
import { WebRTC } from "../core/webrtc";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { cs, isString } from "laser-utils";
import { decodeJSON, encodeJSON } from "../utils/json";

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
  const listRef = useRef<HTMLDivElement>(null);
  const fileSlice = useRef<ArrayBuffer[]>([]);
  const [transferring, setTransferring] = useState(false);
  const [text, setText] = useState("");
  const [list, setList] = useState<TransferListItem[]>([]);

  const onCancel = () => {
    rtc.current?.close();
    setVisible(false);
  };

  const onScroll = () => {
    if (listRef.current) {
      const el = listRef.current;
      Promise.resolve().then(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  };

  const onMessage = useMemoizedFn((event: MessageEvent<string | ArrayBuffer>) => {
    console.log("onMessage", event);
    if (isString(event.data)) {
      const data = decodeJSON(event.data);
      if (data && data.type === "text") {
        setList([...list, { from: "peer", ...data }]);
      } else if (data?.type === "file") {
        setTransferring(true);
        fileSlice.current = [];
        setList([...list, { from: "peer", progress: 0, ...data }]);
      }
    }
    onScroll();
  });

  useEffect(() => {
    const current = connection.current;
    current && (current.onMessage = onMessage);
    return () => {
      const noop = () => null;
      current && (current.onMessage = noop);
    };
  }, [connection, onMessage]);

  const onSendText = () => {
    const str = encodeJSON({ type: "text", data: text });
    if (str && rtc.current && text) {
      rtc.current?.send(str);
      setList([...list, { type: "text", from: "self", data: text }]);
      setText("");
      onScroll();
    }
  };

  //   const updateFileProgress = (progress: number) => {
  //     const last = list[list.length - 1];
  //     if (last && last.type === "file") {
  //       last.progress = progress;
  //       setList([...list]);
  //     }
  //   };

  const sendFilesBySlice = async (file: File) => {
    const channel = rtc.current?.getInstance()?.channel;
    if (!channel) return void 0;
    const chunkSize = 64000; // 64 KB
    const name = file.name;
    const size = Math.ceil(file.size / chunkSize);
    const info = { type: "file", from: "self", name, size, progress: 0 } as TransferListItem;
    channel.send(encodeJSON(info));
    setList([...list, info]);
    onScroll();
    setTransferring(true);
    let offset = 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      const buffer = await slice.arrayBuffer();
      if (channel.bufferedAmount > 65535) {
        await new Promise(resolve => {
          channel.onbufferedamountlow = () => {
            console.warn(`BufferedAmount: ${channel.bufferedAmount}`);
            resolve(0);
          };
        });
      }
      channel.send(buffer);
      offset = offset + buffer.byteLength;
    }
    setTransferring(false);
  };

  const onSendFile = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("class", styles.fileInput);
    input.setAttribute("accept", "*");
    document.body.append(input);
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      document.body.removeChild(input);
      const files = target.files;
      const file = files && files[0];
      file && sendFilesBySlice(file);
    };
    input.click();
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
      <div className={styles.modalContent} ref={listRef}>
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
          onClick={onSendFile}
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
