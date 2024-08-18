import styles from "../styles/index.module.scss";
import type { FC } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { BufferType, ConnectionState, MessageType, TransferType } from "../../types/client";
import {
  CHUNK_SIZE,
  CONNECTION_STATE,
  MESSAGE_TYPE,
  TRANSFER_FROM,
  TRANSFER_TYPE,
} from "../../types/client";
import { Button, Input, Modal, Progress } from "@arco-design/web-react";
import { IconFile, IconSend, IconToBottom } from "@arco-design/web-react/icon";
import { useMemoFn } from "laser-utils";
import { cs, getUniqueId } from "laser-utils";
import { base64ToBlob, formatBytes, getChunkByIndex, scrollToBottom } from "../utils/format";
import type { SocketClient } from "../bridge/socket-server";
import type { ServerFn } from "../../types/websocket";
import { CLINT_EVENT, SERVER_EVENT } from "../../types/websocket";

export const TransferModal: FC<{
  client: React.MutableRefObject<SocketClient | null>;
  id: string;
  setId: (id: string) => void;
  peerId: string;
  setPeerId: (id: string) => void;
  state: ConnectionState;
  setState: (state: ConnectionState) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}> = ({ client, state, peerId, visible, setVisible, setState, id }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const fileSource = useRef<Record<string, Blob>>({});
  const fileMapper = useRef<Record<string, BufferType[]>>({});
  const [text, setText] = useState("");
  const [list, setList] = useState<TransferType[]>([]);

  const onCancel = () => {
    client.current?.emit(CLINT_EVENT.SEND_UNPEER, { target: peerId, origin: id });
    setState(CONNECTION_STATE.READY);
    setVisible(false);
  };

  const sendMessage = (message: MessageType) => {
    client.current?.emit(CLINT_EVENT.SEND_MESSAGE, { target: peerId, message, origin: id });
  };

  const updateFileProgress = (id: string, progress: number, newList = list) => {
    const last = newList.find(item => item.key === TRANSFER_TYPE.FILE && item.id === id);
    if (last && last.key === TRANSFER_TYPE.FILE) {
      last.progress = progress;
      setList([...newList]);
    }
  };

  const onMessage: ServerFn<typeof SERVER_EVENT.FORWARD_MESSAGE> = useMemoFn(event => {
    console.log("onMessage", event);
    if (event.origin !== peerId) return void 0;
    const data = event.message;
    if (data.key === MESSAGE_TYPE.TEXT) {
      // 收到 发送方 的文本消息
      setList([...list, { from: TRANSFER_FROM.PEER, ...data }]);
    } else if (data.key === MESSAGE_TYPE.FILE_START) {
      // 收到 发送方 传输起始消息 准备接收数据
      const { id, name, size, total } = data;
      fileMapper.current[id] = [];
      setList([
        ...list,
        { key: TRANSFER_TYPE.FILE, from: TRANSFER_FROM.PEER, name, size, progress: 0, id },
      ]);
      // 通知 发送方 发送首个块
      sendMessage({ key: MESSAGE_TYPE.FILE_NEXT, id, current: 0, size, total });
    } else if (data.key === MESSAGE_TYPE.FILE_CHUNK) {
      // 收到 接收方 的文件块数据
      const { id, current, total, size, chunk } = data;
      const progress = Math.floor((current / total) * 100);
      updateFileProgress(id, progress);
      if (current >= total) {
        // 数据接收完毕 通知 发送方 接收完毕
        sendMessage({ key: MESSAGE_TYPE.FILE_FINISH, id });
      } else {
        const mapper = fileMapper.current;
        if (!mapper[id]) mapper[id] = [];
        mapper[id][current] = base64ToBlob(chunk);
        // 通知 发送方 发送下一个序列块
        sendMessage({ key: MESSAGE_TYPE.FILE_NEXT, id, current: current + 1, size, total });
      }
    } else if (data.key === MESSAGE_TYPE.FILE_NEXT) {
      // 收到 接收方 的准备接收块数据消息
      const { id, current, total, size } = data;
      const progress = Math.floor((current / total) * 100);
      updateFileProgress(id, progress);
      const file = fileSource.current[id];
      if (file) {
        getChunkByIndex(file, current).then(chunk => {
          // 通知 接收方 发送块数据
          sendMessage({ key: MESSAGE_TYPE.FILE_CHUNK, id, current, total, size, chunk });
        });
      }
    } else if (data.key === MESSAGE_TYPE.FILE_FINISH) {
      // 收到 接收方 的接收完成消息
      const { id } = data;
      updateFileProgress(id, 100);
    }
    scrollToBottom(listRef);
  });

  useEffect(() => {
    const socket = client.current;
    socket?.on(SERVER_EVENT.FORWARD_MESSAGE, onMessage);
    return () => {
      socket?.off(SERVER_EVENT.FORWARD_MESSAGE, onMessage);
    };
  }, [client, onMessage]);

  const onSendText = () => {
    sendMessage({ key: MESSAGE_TYPE.TEXT, data: text });
    setList([...list, { key: MESSAGE_TYPE.TEXT, from: TRANSFER_FROM.SELF, data: text }]);
    setText("");
    scrollToBottom(listRef);
  };

  const sendFilesBySlice = async (files: FileList) => {
    const newList: TransferType[] = [...list];
    for (const file of files) {
      const name = file.name;
      const id = getUniqueId();
      const size = file.size;
      const total = Math.ceil(file.size / CHUNK_SIZE);
      sendMessage({ key: MESSAGE_TYPE.FILE_START, id, name, size, total });
      fileSource.current[id] = file;
      newList.push({
        key: TRANSFER_TYPE.FILE,
        from: TRANSFER_FROM.SELF,
        name,
        size,
        progress: 0,
        id,
      } as const);
    }
    setList(newList);
    scrollToBottom(listRef);
  };

  const onSendFile = () => {
    const KEY = "websocket-file-input";
    const exist = document.querySelector(`body > [data-type='${KEY}']`) as HTMLInputElement;
    const input: HTMLInputElement = exist || document.createElement("input");
    input.value = "";
    input.setAttribute("data-type", KEY);
    input.setAttribute("type", "file");
    input.setAttribute("class", styles.fileInput);
    input.setAttribute("accept", "*");
    input.setAttribute("multiple", "true");
    !exist && document.body.append(input);
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      document.body.removeChild(input);
      const files = target.files;
      files && sendFilesBySlice(files);
    };
    input.click();
  };

  const onDownloadFile = (id: string, fileName: string) => {
    const blob = fileMapper.current[id]
      ? new Blob(fileMapper.current[id], { type: "application/octet-stream" })
      : fileSource.current[id] || new Blob();
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
            className={cs(
              styles.messageItem,
              item.from === TRANSFER_FROM.SELF && styles.alignRight
            )}
          >
            <div className={styles.messageContent}>
              {item.key === TRANSFER_TYPE.TEXT ? (
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
