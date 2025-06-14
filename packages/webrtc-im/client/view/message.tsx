import { useAtom, useAtomValue } from "jotai";
import styles from "../styles/message.m.scss";
import type { FC } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalContext } from "../store/global";
import { CONNECT_DOT } from "../utils/connection";
import { Avatar } from "../component/avatar";
import { STEAM_TYPE, TRANSFER_FROM, TRANSFER_TYPE } from "../../types/transfer";
import { IconClose, IconFile, IconFolder, IconToBottom } from "@arco-design/web-react/icon";
import { SendIcon } from "../component/icons/send";
import { cs, Format, isNil, KEY_CODE, preventNativeEvent } from "@block-kit/utils";
import { Progress } from "@arco-design/web-react";

export const Message: FC = () => {
  const { message, store, rtc, transfer } = useGlobalContext();
  const list = useAtomValue(message.listAtom);
  const [peerId, setPeerId] = useAtom(store.peerIdAtom);
  const users = useAtomValue(store.userListAtom);
  const rtcState = useAtomValue(rtc.stateAtom);
  const [isDragging, setIsDragging] = useState(false);
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

  const sendTextMessage = () => {
    const textarea = textareaRef.current;
    const text = textarea && textarea.value.trim();
    if (isNil(text)) return void 0;
    transfer.sendTextMessage(text);
    textareaRef.current && (textareaRef.current.value = "");
  };

  const sendFileListMessage = (files: FileList) => {
    transfer.startSendFileList(files);
  };

  const onPressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === KEY_CODE.ENTER && !e.shiftKey) {
      sendTextMessage();
      e.preventDefault();
    }
  };

  const onPickFiles = () => {
    const KEY = "webrtc-file-input";
    const exist = document.querySelector(`body > [data-type='${KEY}']`) as HTMLInputElement;
    const input: HTMLInputElement = exist || document.createElement("input");
    input.value = "";
    input.hidden = true;
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
      files && sendFileListMessage(files);
    };
    input.click();
  };

  const onDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    files && sendFileListMessage(files);
  };

  const onDownloadFile = (id: string, fileName: string) => {
    const blob = transfer.fileMapper.get(id)
      ? new Blob(transfer.fileMapper.get(id), { type: STEAM_TYPE })
      : transfer.fileHandler.get(id) || new Blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className={styles.messageArea} ref={el => (message.scroll = el)}>
        {list.map((item, index) => (
          <div
            key={index}
            className={cs(
              styles.messageItem,
              item.from === TRANSFER_FROM.PEER && styles.peerMessage
            )}
          >
            {item.key === TRANSFER_TYPE.SYSTEM && (
              <div className={styles.systemMessage}>{item.data}</div>
            )}
            {item.key === TRANSFER_TYPE.TEXT && (
              <div className={cs(styles.basicMessage)}>{item.data}</div>
            )}
            {item.key === TRANSFER_TYPE.FILE && (
              <div className={cs(styles.basicMessage, styles.fileMessage)}>
                <div className={styles.fileInfo}>
                  <div>
                    <div className={styles.fileName}>
                      <IconFile className={styles.fileIcon} />
                      {item.name}
                    </div>
                    <div>{Format.bytes(item.size)}</div>
                  </div>
                  <div
                    className={cs(styles.fileDownload, item.progress < 100 && styles.disable)}
                    onClick={() => item.progress >= 100 && onDownloadFile(item.id, item.name)}
                  >
                    <IconToBottom />
                  </div>
                </div>
                <Progress color="#fff" trailColor="#aaa" percent={item.progress}></Progress>
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        className={styles.inputArea}
        onDragEnter={() => peerId && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDropFiles}
        onDragOver={preventNativeEvent}
      >
        {isDragging ? (
          <div className={styles.dragging}>Drop Files To Upload</div>
        ) : (
          <Fragment>
            <div
              className={styles.operation}
              onMouseDown={preventNativeEvent}
              onClick={onPickFiles}
            >
              <IconFolder />
            </div>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              onKeyDown={onPressEnter}
            ></textarea>
            <div className={styles.send} onMouseDown={preventNativeEvent} onClick={sendTextMessage}>
              {SendIcon}
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
};
