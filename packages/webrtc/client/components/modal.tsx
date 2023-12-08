import { WebRTCApi } from "../../types/webrtc";
import styles from "./index.module.scss";
import React, { FC, useEffect, useRef, useState } from "react";
import { CONNECTION_STATE, ChunkType, TransferListItem } from "../../types/client";
import { Button, Input, Modal, Progress } from "@arco-design/web-react";
import { IconFile, IconRight, IconSend, IconToBottom } from "@arco-design/web-react/icon";
import { WebRTC } from "../core/webrtc";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { cs, getUniqueId, isString } from "laser-utils";
import { decodeJSON, encodeJSON } from "../utils/json";
import { formatBytes } from "../utils/format";

export const TransferModal: FC<{
  connection: React.MutableRefObject<WebRTC | null>;
  rtc: React.MutableRefObject<WebRTCApi | null>;
  id: string;
  setId: (id: string) => void;
  peerId: string;
  setPeerId: (id: string) => void;
  state: CONNECTION_STATE;
  setState: (state: CONNECTION_STATE) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}> = ({ connection, rtc, state, peerId, visible, setVisible, setPeerId, setState }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const fileMapper = useRef<Record<string, ChunkType[]>>({});
  const fileState = useRef<{ id: string; current: number; total: number }>();
  const [transferring, setTransferring] = useState(false);
  const [text, setText] = useState("");
  const [toConnectId, setToConnectId] = useState("");
  const [list, setList] = useState<TransferListItem[]>([]);

  const onCancel = () => {
    rtc.current?.close();
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

  const updateFileProgress = (id: string, progress: number, newList = list) => {
    const last = newList.find(item => item.type === "file" && item.id === id);
    if (last && last.type === "file") {
      last.progress = progress;
      setList([...newList]);
    }
  };

  const onMessage = useMemoizedFn((event: MessageEvent<string | ChunkType>) => {
    console.log("onMessage", event);
    if (isString(event.data)) {
      const data = decodeJSON(event.data);
      if (data && data.type === "text") {
        setList([...list, { from: "peer", ...data }]);
      } else if (data?.type === "file") {
        setTransferring(true);
        fileState.current = { id: data.id, current: 0, total: data.total };
        setList([...list, { from: "peer", progress: 0, ...data }]);
      } else if (data?.type === "file-finish") {
        updateFileProgress(data.id, 100);
        setTransferring(false);
      }
    } else {
      const state = fileState.current;
      if (state) {
        const mapper = fileMapper.current;
        if (!mapper[state.id]) mapper[state.id] = [];
        mapper[state.id].push(event.data);
        state.current++;
        const progress = Math.floor((state.current / state.total) * 100);
        updateFileProgress(state.id, progress);
        if (progress === 100) {
          setTransferring(false);
          fileState.current = void 0;
          rtc.current?.send(encodeJSON({ type: "file-finish", id: state.id }));
        }
      }
    }
    onScroll();
  });

  const onConnectionStateChange = useMemoizedFn((pc: RTCPeerConnection) => {
    switch (pc.connectionState) {
      case "new":
      case "connecting":
        setState(CONNECTION_STATE.CONNECTING);
        break;
      case "connected":
        setState(CONNECTION_STATE.CONNECTED);
        break;
      case "disconnected":
      case "closed":
      case "failed":
        setState(CONNECTION_STATE.READY);
        break;
    }
  });

  useEffect(() => {
    const current = connection.current;
    if (current) {
      current.onMessage = onMessage;
      current.onConnectionStateChange = onConnectionStateChange;
    }
    return () => {
      const noop = () => null;
      if (current) {
        current.onMessage = noop;
        current.onConnectionStateChange = noop;
      }
    };
  }, [connection, onConnectionStateChange, onMessage]);

  const onSendText = () => {
    const str = encodeJSON({ type: "text", data: text });
    if (str && rtc.current && text) {
      rtc.current?.send(str);
      setList([...list, { type: "text", from: "self", data: text }]);
      setText("");
      onScroll();
    }
  };

  const sendFilesBySlice = async (file: File) => {
    const instance = rtc.current?.getInstance();
    const channel = instance?.channel;
    if (!channel) return void 0;
    const chunkSize = instance.connection.sctp?.maxMessageSize || 64000; // 64 KB
    const name = file.name;
    const id = getUniqueId();
    const size = file.size;
    const total = Math.ceil(file.size / chunkSize);
    channel.send(encodeJSON({ type: "file", name, id, size, total }));
    const newList = [...list, { type: "file", from: "self", name, size, progress: 0, id } as const];
    setList(newList);
    onScroll();
    setTransferring(true);
    let offset = 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      const buffer = await slice.arrayBuffer();
      if (channel.bufferedAmount >= chunkSize) {
        await new Promise(resolve => {
          channel.onbufferedamountlow = () => resolve(0);
        });
      }
      const arrayBuffer = await slice.arrayBuffer();
      fileMapper.current[id] = [...(fileMapper.current[id] || []), arrayBuffer];
      channel.send(buffer);
      offset = offset + buffer.byteLength;
      updateFileProgress(id, Math.floor((offset / size) * 100), newList);
    }
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

  const enableTransfer = state === CONNECTION_STATE.CONNECTED && !transferring;

  const onConnectPeer = () => {
    if (toConnectId && rtc.current) {
      rtc.current.connect(toConnectId);
      setPeerId(toConnectId);
      setState(CONNECTION_STATE.CONNECTING);
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
          {peerId
            ? state === CONNECTION_STATE.READY
              ? "Disconnected: " + peerId
              : state === CONNECTION_STATE.CONNECTING
              ? "Connecting: " + peerId
              : state === CONNECTION_STATE.CONNECTED
              ? "Connected: " + peerId
              : "Unknown State: " + peerId
            : "Please Establish Connection"}
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
        {peerId ? (
          <>
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
          </>
        ) : (
          <>
            <Input
              value={toConnectId}
              disabled={state === CONNECTION_STATE.CONNECTING}
              onChange={setToConnectId}
              allowClear
              placeholder="Peer ID"
              onPressEnter={onSendText}
            />
            <Button
              onClick={onConnectPeer}
              disabled={!toConnectId || state === CONNECTION_STATE.CONNECTING}
              type="primary"
              icon={<IconRight />}
            >
              Connect
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};
