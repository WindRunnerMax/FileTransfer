import styles from "./index.module.scss";
import React, { FC, useEffect, useRef, useState } from "react";
import {
  CHUNK_SIZE,
  CONNECTION_STATE,
  ChunkType,
  SocketMessageType,
  TransferListItem,
} from "../../types/client";
import { Button, Input, Modal, Progress } from "@arco-design/web-react";
import { IconFile, IconSend, IconToBottom } from "@arco-design/web-react/icon";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { cs, getUniqueId } from "laser-utils";
import { base64ToBlob, formatBytes, getChunkByIndex, onScroll } from "../utils/format";
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
  const fileSource = useRef<Record<string, Blob>>({});
  const fileMapper = useRef<Record<string, ChunkType[]>>({});
  const [text, setText] = useState("");
  const [list, setList] = useState<TransferListItem[]>([]);

  const onCancel = () => {
    client.current?.emit(CLINT_EVENT.SEND_UNPEER, { target: peerId, origin: id });
    setState(CONNECTION_STATE.READY);
    setVisible(false);
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
    if (event.origin !== peerId) return void 0;
    const data = event.message;
    if (data.type === "text") {
      setList([...list, { from: "peer", ...data }]);
    } else if (data.type === "file-start") {
      const { id, name, size, total } = data;
      fileMapper.current[id] = [];
      setList([...list, { type: "file", from: "peer", name, size, progress: 0, id }]);
      sendMessage({ type: "file-next", id, current: 0, size, total });
    } else if (data.type === "file-chunk") {
      const { id, current, total, size, chunk } = data;
      const progress = Math.floor((current / total) * 100);
      updateFileProgress(id, progress);
      if (current >= total) {
        sendMessage({ type: "file-finish", id });
      } else {
        const mapper = fileMapper.current;
        if (!mapper[id]) mapper[id] = [];
        mapper[id][current] = base64ToBlob(chunk);
        sendMessage({ type: "file-next", id, current: current + 1, size, total });
      }
    } else if (data.type === "file-next") {
      const { id, current, total, size } = data;
      const progress = Math.floor((current / total) * 100);
      updateFileProgress(id, progress);
      const file = fileSource.current[id];
      if (file) {
        getChunkByIndex(file, current).then(chunk => {
          sendMessage({ type: "file-chunk", id, current, total, size, chunk });
        });
      }
    } else if (data.type === "file-finish") {
      const { id } = data;
      const progress = Math.floor(100);
      updateFileProgress(id, progress);
    }
    onScroll(listRef);
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
    onScroll(listRef);
  };

  const sendFilesBySlice = async (files: FileList) => {
    console.log("files", files);
    const newList = [...list];
    for (const file of files) {
      const name = file.name;
      const id = getUniqueId();
      const size = file.size;
      const total = Math.ceil(file.size / CHUNK_SIZE);
      sendMessage({ type: "file-start", id, name, size, total });
      fileSource.current[id] = file;
      newList.push({ type: "file", from: "self", name, size, progress: 0, id } as const);
    }
    setList(newList);
    onScroll(listRef);
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
