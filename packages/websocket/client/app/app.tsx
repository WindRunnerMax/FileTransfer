import styles from "./index.module.scss";
import { FC, useLayoutEffect, useRef, useState } from "react";
import { IconGithub } from "@arco-design/web-react/icon";
import { BoardCastIcon, ComputerIcon, PhoneIcon } from "./icon";
import { useMemoFn } from "laser-utils";
import { CLINT_EVENT, SERVER_EVENT, ServerFn } from "../../types/websocket";
import { CONNECTION_STATE, DEVICE_TYPE, Member } from "../../types/client";
import { TransferModal } from "./modal";
import { SocketClient } from "../channel/socket-server";
import { ERROR_TYPE, SHAKE_HANDS } from "../../types/server";
import { Message } from "@arco-design/web-react";

export const App: FC = () => {
  const client = useRef<SocketClient | null>(null);
  const [id, setId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [visible, setVisible] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [state, setState] = useState(CONNECTION_STATE.READY);

  // === WebSocket Connection Event ===
  const onJoinRoom: ServerFn<typeof SERVER_EVENT.JOINED_ROOM> = useMemoFn(member => {
    console.log("JOIN ROOM", member);
    setMembers([...members, member]);
  });
  const onJoinedMember: ServerFn<typeof SERVER_EVENT.JOINED_MEMBER> = useMemoFn(event => {
    const { initialization } = event;
    console.log("JOINED MEMBER", initialization);
    setMembers([...initialization]);
  });
  const onLeftRoom: ServerFn<typeof SERVER_EVENT.LEFT_ROOM> = useMemoFn(event => {
    const { id } = event;
    console.log("LEFT ROOM", id);
    if (id === peerId) {
      setVisible(false);
      setPeerId("");
    }
    setMembers(members.filter(member => member.id !== id));
  });
  const onReceiveRequest: ServerFn<typeof SERVER_EVENT.FORWARD_REQUEST> = useMemoFn(event => {
    console.log("RECEIVE REQUEST", event);
    const { origin } = event;
    if (!peerId && !visible) {
      setPeerId(origin);
      setVisible(true);
      setState(CONNECTION_STATE.CONNECTED);
      client.current?.emit(CLINT_EVENT.SEND_RESPONSE, {
        target: origin,
        origin: id,
        code: SHAKE_HANDS.ACCEPT,
      });
    } else {
      client.current?.emit(CLINT_EVENT.SEND_RESPONSE, {
        target: origin,
        origin: id,
        code: SHAKE_HANDS.REJECT,
        reason: `The Device ${id} is Busy`,
      });
    }
  });
  const onReceiveResponse: ServerFn<typeof SERVER_EVENT.FORWARD_RESPONSE> = useMemoFn(event => {
    console.log("RECEIVE RESPONSE", event);
    const { code, reason } = event;
    if (code === SHAKE_HANDS.ACCEPT) {
      setState(CONNECTION_STATE.CONNECTED);
    } else {
      setState(CONNECTION_STATE.READY);
      Message.error(reason || "Peer Rejected");
    }
  });
  const onUnpeer: ServerFn<typeof SERVER_EVENT.FORWARD_UNPEER> = useMemoFn(event => {
    console.log("UNPEER", event);
    if (event.target === id && event.origin === peerId) {
      setVisible(false);
      setPeerId("");
      setState(CONNECTION_STATE.READY);
    }
  });

  // === WebSocket Connection INIT ===
  useLayoutEffect(() => {
    const socket = new SocketClient(location.host);
    socket.on(SERVER_EVENT.JOINED_ROOM, onJoinRoom);
    socket.on(SERVER_EVENT.JOINED_MEMBER, onJoinedMember);
    socket.on(SERVER_EVENT.LEFT_ROOM, onLeftRoom);
    socket.on(SERVER_EVENT.FORWARD_REQUEST, onReceiveRequest);
    socket.on(SERVER_EVENT.FORWARD_RESPONSE, onReceiveResponse);
    socket.on(SERVER_EVENT.FORWARD_UNPEER, onUnpeer);
    setId(socket.id);
    client.current = socket;
    return () => {
      socket.off(SERVER_EVENT.JOINED_ROOM, onJoinRoom);
      socket.off(SERVER_EVENT.JOINED_MEMBER, onJoinedMember);
      socket.off(SERVER_EVENT.LEFT_ROOM, onLeftRoom);
      socket.off(SERVER_EVENT.FORWARD_REQUEST, onReceiveRequest);
      socket.off(SERVER_EVENT.FORWARD_RESPONSE, onReceiveResponse);
      socket.off(SERVER_EVENT.FORWARD_UNPEER, onUnpeer);
    };
  }, [onJoinRoom, onJoinedMember, onLeftRoom, onReceiveRequest, onReceiveResponse, onUnpeer]);

  const onPeerConnection = (member: Member) => {
    if (client.current) {
      client.current.emit(CLINT_EVENT.SEND_REQUEST, { target: member.id, origin: id }, state => {
        if (state.code !== ERROR_TYPE.NO_ERROR && state.message) {
          Message.error(state.message);
        }
      });
      setVisible(true);
      setPeerId(member.id);
      setState(CONNECTION_STATE.CONNECTING);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.boardCastIcon}>{BoardCastIcon}</div>
        <div>Local ID: {id}</div>
      </div>
      {state === CONNECTION_STATE.READY && members.length === 0 && (
        <div className={styles.prompt}>Open Another Device To Transfer Files</div>
      )}
      <div className={styles.deviceGroup}>
        {members.map(member => (
          <div key={member.id} className={styles.device} onClick={() => onPeerConnection(member)}>
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
      {visible && peerId && (
        <TransferModal
          client={client}
          id={id}
          setId={setId}
          peerId={peerId}
          setPeerId={setPeerId}
          state={state}
          setState={setState}
          visible={visible}
          setVisible={setVisible}
        ></TransferModal>
      )}
    </div>
  );
};
