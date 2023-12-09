import styles from "./index.module.scss";
import React, { FC, useEffect, useRef, useState } from "react";
import {
  CONNECTION_STATE,
  ChunkType,
  SocketMessageType,
  TransferListItem,
} from "../../types/client";
import { Button, Input, Modal, Progress } from "@arco-design/web-react";
import { IconFile, IconSend, IconToBottom } from "@arco-design/web-react/icon";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { cs, getUniqueId, isString } from "laser-utils";
import { formatBytes } from "../utils/format";
import { SocketClient } from "../core/socket-server";
import { CLINT_EVENT, SERVER_EVENT, ServerFn } from "../../types/websocket";

export const TransferModal: FC<{
  client: React.MutableRefObject<SocketClient | null>;
  id: string;
  setId: (id: string) => void;
  peerId: string;
  setPeerId: (id: string) => void;
  state: CONNECTION_STATE;
  setState: (state: CONNECTION_STATE) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}> = ({ client, state, peerId, visible, setVisible, setState, id }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const fileMapper = useRef<Record<string, ChunkType[]>>({});
  const fileState = useRef<{ id: string; current: number; total: number }>();
  const [text, setText] = useState("");
  const [list, setList] = useState<TransferListItem[]>([]);

  const onCancel = () => {
    client.current?.emit(CLINT_EVENT.SEND_UNPEER, { target: peerId, origin: id });
    setState(CONNECTION_STATE.READY);
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

  const sendMessage = (message: SocketMessageType) => {
    client.current?.emit(CLINT_EVENT.SEND_MESSAGE, { target: peerId, message, origin: id });
  };

  const updateFileProgress = (id: string, progress: number, newList = list) => {
    const last = newList.find(item => item.type === "file" && item.id === id);
    if (last && last.type === "file") {
      last.progress = progress;
      setList([...newList]);
    }
  };

  const onMessage: ServerFn<typeof SERVER_EVENT.FORWARD_MESSAGE> = useMemoizedFn(event => {
    console.log("onMessage", event);
    onScroll();
  });

  useEffect(() => {
    const socket = client.current;
    socket?.on(SERVER_EVENT.FORWARD_MESSAGE, onMessage);
    return () => {
      socket?.off(SERVER_EVENT.FORWARD_MESSAGE, onMessage);
    };
  }, [client, onMessage]);

  const onSendText = () => {
    sendMessage({ type: "text", data: text });
    setList([...list, { type: "text", from: "self", data: text }]);
    setText("");
    onScroll();
  };

  const sendFilesBySlice = async (files: FileList) => {
    console.log("files", files);
  };

  const onSendFile = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("class", styles.fileInput);
    input.setAttribute("accept", "*");
    input.setAttribute("multiple", "true");
    document.body.append(input);
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      document.body.removeChild(input);
      const files = target.files;
      files && sendFilesBySlice(files);
    };
    input.click();
  };

  const onDownloadFile = (id: string, fileName: string) => {
    const data = fileMapper.current[id] || new Blob();
    const blob = new Blob(data, { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const enableTransfer = state === CONNECTION_STATE.CONNECTED;

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
          {state === CONNECTION_STATE.READY
            ? "Disconnected: " + peerId
            : state === CONNECTION_STATE.CONNECTING
            ? "Connecting: " + peerId
            : state === CONNECTION_STATE.CONNECTED
            ? "Connected: " + peerId
            : "Unknown State: " + peerId}
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
              {item.type === "text" ? (
                <span>{item.data}</span>
              ) : (
                <div className={styles.fileMessage}>
                  <div className={styles.fileInfo}>
                    <div>
                      <div className={styles.fileName}>
                        <IconFile className={styles.fileIcon} />
                        {item.name}
                      </div>
                      <div>{formatBytes(item.size)}</div>
                    </div>
                    <div
                      className={cs(styles.fileDownload, item.progress !== 100 && styles.disable)}
                      onClick={() => item.progress === 100 && onDownloadFile(item.id, item.name)}
                    >
                      <IconToBottom />
                    </div>
                  </div>
                  <Progress color="#fff" trailColor="#aaa" percent={item.progress}></Progress>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.modalFooter}>
        <Button
          disabled={!enableTransfer}
          type="primary"
          icon={<IconFile />}
          className={styles.sendFile}
          onClick={onSendFile}
        >
          File
        </Button>
        <Input
          value={text}
          onChange={setText}
          disabled={!enableTransfer}
          allowClear
          placeholder="Send Message"
          onPressEnter={onSendText}
        />
        <Button
          onClick={onSendText}
          disabled={!enableTransfer}
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
