import styles from "./index.module.scss";
import { FC, useLayoutEffect, useRef, useState } from "react";
import { IconGithub } from "@arco-design/web-react/icon";
import { BoardCastIcon, ComputerIcon, PhoneIcon } from "./icon";
import { useMemoizedFn } from "../hooks/use-memoized-fn";
import { WebRTC } from "../core/webrtc";
import { WebRTCApi } from "../../types/webrtc";
import { SERVER_EVENT, ServerFn } from "../../types/signaling";
import { CONNECTION_STATE, DEVICE_TYPE, Member } from "../../types/client";
import { TransferModal } from "./modal";

export const App: FC = () => {
  const rtc = useRef<WebRTCApi | null>(null);
  const connection = useRef<WebRTC | null>(null);
  const [id, setId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [visible, setVisible] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [state, setState] = useState(CONNECTION_STATE.INIT);

  // === RTC Connection Event ===
  const onOpen = useMemoizedFn(event => {
    console.log("OnOpen", event);
    setVisible(true);
    setState(CONNECTION_STATE.CONNECTED);
  });
  const onClose = useMemoizedFn((event: Event) => {
    console.log("OnClose", event);
    setVisible(false);
    setPeerId("");
    setState(CONNECTION_STATE.READY);
  });
  const onError = useMemoizedFn((event: RTCErrorEvent) => {
    console.log("OnError", event);
  });
  const onJoinRoom: ServerFn<typeof SERVER_EVENT.JOINED_ROOM> = useMemoizedFn(member => {
    console.log("JOIN ROOM", member);
    setMembers([...members, member]);
  });
  const onJoinedMember: ServerFn<typeof SERVER_EVENT.JOINED_MEMBER> = useMemoizedFn(event => {
    const { initialization } = event;
    console.log("JOINED MEMBER", initialization);
    setMembers([...members, ...initialization]);
  });
  const onLeftRoom: ServerFn<typeof SERVER_EVENT.LEFT_ROOM> = useMemoizedFn(event => {
    const { id } = event;
    console.log("LEFT ROOM", id);
    if (id === peerId) rtc.current?.close();
    setMembers(members.filter(member => member.id !== id));
  });
  const onReceiveOffer: ServerFn<typeof SERVER_EVENT.FORWARD_OFFER> = useMemoizedFn(event => {
    const { origin } = event;
    setPeerId(origin);
  });

  // === RTC Connection INIT ===
  useLayoutEffect(() => {
    const webrtc = new WebRTC({ wss: location.host });
    webrtc.onOpen = onOpen;
    webrtc.onClose = onClose;
    webrtc.onError = onError;
    webrtc.signaling.on(SERVER_EVENT.JOINED_ROOM, onJoinRoom);
    webrtc.signaling.on(SERVER_EVENT.JOINED_MEMBER, onJoinedMember);
    webrtc.signaling.on(SERVER_EVENT.LEFT_ROOM, onLeftRoom);
    webrtc.signaling.on(SERVER_EVENT.FORWARD_OFFER, onReceiveOffer);
    webrtc.onReady = ({ rtc: instance }) => {
      rtc.current = instance;
      setState(CONNECTION_STATE.READY);
    };
    setId(webrtc.id);
    connection.current = webrtc;
    return () => {
      webrtc.signaling.off(SERVER_EVENT.JOINED_ROOM, onJoinRoom);
      webrtc.signaling.off(SERVER_EVENT.JOINED_MEMBER, onJoinedMember);
      webrtc.signaling.off(SERVER_EVENT.LEFT_ROOM, onLeftRoom);
      webrtc.signaling.off(SERVER_EVENT.FORWARD_OFFER, onReceiveOffer);
      webrtc.destroy();
    };
  }, [onClose, onError, onJoinRoom, onJoinedMember, onLeftRoom, onOpen, onReceiveOffer]);

  const onPeerConnection = (member: Member) => {
    if (rtc.current) {
      rtc.current.connect(member.id);
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
        <div className={styles.manualEntry}>Request To Establish P2P Connection By ID</div>
      </div>
      {state === CONNECTION_STATE.READY && members.length === 0 && (
        <div className={styles.prompt}>Open another device on the LAN to transfer files</div>
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
      {visible && (
        <TransferModal
          connection={connection}
          rtc={rtc}
          id={id}
          setId={setId}
          peerId={peerId}
          setPeerId={setPeerId}
          state={state}
          visible={visible}
          setVisible={setVisible}
        ></TransferModal>
      )}
    </div>
  );
};
