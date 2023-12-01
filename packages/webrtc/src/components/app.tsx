import styles from "./index.module.scss";
import { FC, useLayoutEffect, useRef, useState } from "react";
import { IconGithub } from "@arco-design/web-react/icon";
import { BoardCastIcon, ComputerIcon, PhoneIcon } from "./icon";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { WebRTC } from "../core/webrtc";
import { Message } from "@arco-design/web-react";
import { WebRTCApi } from "../../types/webrtc";
import { SERVER_EVENT, ServerFn } from "../../types/signaling";
import { CONNECTION_STATE, DEVICE_TYPE, Member } from "../../types/client";

export const App: FC = () => {
  const rtc = useRef<WebRTCApi | null>(null);
  const [id, setId] = useState("");
  const [state, setState] = useState(CONNECTION_STATE.INIT);
  const [list, setList] = useState<Member[]>([]);

  const onOpen = useMemoizedFn(() => {
    setState(CONNECTION_STATE.LINKED);
  });
  const onMessage = useMemoizedFn((e: MessageEvent) => {
    Message.success(e.data as string);
  });
  const onClose = useMemoizedFn(() => {
    setState(CONNECTION_STATE.READY);
  });
  const onError = useMemoizedFn((e: Event) => {
    Message.error(String(e));
  });
  const onJoinRoom: ServerFn<typeof SERVER_EVENT.JOINED_ROOM> = useMemoizedFn(member => {
    setList([...list, member]);
  });
  const onJoinedMember: ServerFn<typeof SERVER_EVENT.JOINED_MEMBER> = useMemoizedFn(event => {
    const { initialization } = event;
    setList([...list, ...initialization]);
  });
  const onLeftRoom: ServerFn<typeof SERVER_EVENT.LEFT_ROOM> = useMemoizedFn(event => {
    const { id } = event;
    setList(list.filter(member => member.id !== id));
  });

  useLayoutEffect(() => {
    const connection = new WebRTC({ wss: location.host });
    connection.onOpen = onOpen;
    connection.onMessage = onMessage;
    connection.onClose = onClose;
    connection.onError = onError;
    connection.signaling.on(SERVER_EVENT.JOINED_ROOM, onJoinRoom);
    connection.signaling.on(SERVER_EVENT.JOINED_MEMBER, onJoinedMember);
    connection.signaling.on(SERVER_EVENT.LEFT_ROOM, onLeftRoom);
    connection.onReady = ({ rtc: instance }) => {
      rtc.current = instance;
      setState(CONNECTION_STATE.READY);
    };
    setId(connection.id);
    return () => {
      connection.signaling.off(SERVER_EVENT.JOINED_ROOM, onJoinRoom);
      connection.signaling.off(SERVER_EVENT.JOINED_MEMBER, onJoinedMember);
      connection.signaling.off(SERVER_EVENT.LEFT_ROOM, onLeftRoom);
      connection.destroy();
    };
  }, [onClose, onError, onJoinRoom, onJoinedMember, onLeftRoom, onMessage, onOpen]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.boardCastIcon}>{BoardCastIcon}</div>
        <div>Local ID: {id}</div>
        <div className={styles.manualEntry}>Request To Establish P2P Connection By ID</div>
      </div>
      {state === CONNECTION_STATE.READY && list.length === 0 && (
        <div className={styles.prompt}>Open another device on the LAN to transfer files</div>
      )}
      <div className={styles.deviceGroup}>
        {list.map(member => (
          <div key={member.id} className={styles.device}>
            <div className={styles.icon}>
              {member.device === DEVICE_TYPE.MOBILE ? PhoneIcon : ComputerIcon}
            </div>
            <div className={styles.name}>{member.id.slice(0, 7)}</div>
          </div>
        ))}
      </div>
      <a
        className={styles.github}
        href="https://github.com/WindrunnerMax/FileTransfer"
        target="_blank"
      >
        <IconGithub />
      </a>
    </div>
  );
};
