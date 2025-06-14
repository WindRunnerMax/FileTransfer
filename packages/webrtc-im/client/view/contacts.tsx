import type { FC } from "react";
import { Fragment, useEffect, useState } from "react";
import styles from "../styles/contacts.m.scss";
import type {
  ServerJoinRoomEvent,
  ServerLeaveRoomEvent,
  ServerSendOfferEvent,
} from "../../types/signaling";
import { SERVER_EVENT } from "../../types/signaling";
import { Empty, Input } from "@arco-design/web-react";
import { useGlobalContext } from "../store/global";
import { useMemoFn } from "@block-kit/utils/dist/es/hooks";
import { Avatar } from "../component/avatar";
import { DEVICE_TYPE, NET_TYPE } from "../../types/client";
import { PhoneIcon } from "../component/icons/phone";
import { PCIcon } from "../component/icons/pc";
import { IconSearch } from "@arco-design/web-react/icon";
import { useAtom, useAtomValue } from "jotai";
import { cs } from "@block-kit/utils";

export const Contacts: FC = () => {
  const { signal, store, message, rtc } = useGlobalContext();
  const [search, setSearch] = useState("");
  const netType = useAtomValue(store.netTypeAtom);
  const [peerId, setPeerId] = useAtom(store.peerIdAtom);
  const [list, setList] = useAtom(store.userListAtom);

  const onInitUser = useMemoFn(() => {
    setList([]);
  });

  const onJoinRoom = useMemoFn((users: ServerJoinRoomEvent) => {
    console.log("Join Room", users);
    setList(prev => [...prev, ...users]);
  });

  const onLeaveRoom = useMemoFn((user: ServerLeaveRoomEvent) => {
    console.log("Leave Room", user);
    setList(prev => prev.filter(u => u.id !== user.id));
    if (user.id === peerId) {
      rtc.disconnect();
      setPeerId("");
    }
  });

  const filteredList = list.filter(user => {
    const isMatchSearch = !search || user.id.toLowerCase().includes(search.toLowerCase());
    if (netType === NET_TYPE.WAN) {
      return isMatchSearch;
    }
    let isLan = signal.hash === user.hash;
    // 本地部署应用时, ip 地址可能是 ::1 或 ::ffff:
    if (
      signal.ip === ":*:*" ||
      signal.ip.startsWith("192.168") ||
      signal.ip.startsWith("10.") ||
      signal.ip.startsWith("172.") ||
      signal.ip.startsWith("::ffff:192.168")
    ) {
      isLan = true;
    }
    return isLan && isMatchSearch;
  });

  const connectUser = async (userId: string) => {
    if (peerId === userId) return void 0;
    rtc.disconnect();
    message.clearEntries();
    setPeerId(userId);
    message.addSystemEntry("Connecting " + userId);
    await signal.isConnected();
    rtc.connect(userId);
  };

  const onReceiveOffer = useMemoFn(async (event: ServerSendOfferEvent) => {
    const { from } = event;
    // 这个实际上是先于实际 setRemoteDescription 的, 事件调用优先级会更高
    if (
      peerId === from ||
      rtc.connection.connectionState === "new" ||
      rtc.connection.connectionState === "failed" ||
      rtc.connection.connectionState === "disconnected" ||
      rtc.connection.connectionState === "closed"
    ) {
      setPeerId(from);
      message.clearEntries();
      message.addSystemEntry("Connecting " + from);
    }
  });

  useEffect(() => {
    signal.on(SERVER_EVENT.INIT_USER, onInitUser);
    signal.on(SERVER_EVENT.JOIN_ROOM, onJoinRoom);
    signal.on(SERVER_EVENT.LEAVE_ROOM, onLeaveRoom);
    signal.on(SERVER_EVENT.SEND_OFFER, onReceiveOffer, 10);
    return () => {
      signal.off(SERVER_EVENT.INIT_USER, onInitUser);
      signal.off(SERVER_EVENT.JOIN_ROOM, onJoinRoom);
      signal.off(SERVER_EVENT.LEAVE_ROOM, onLeaveRoom);
      signal.off(SERVER_EVENT.SEND_OFFER, onReceiveOffer);
    };
  }, [onInitUser, onJoinRoom, onLeaveRoom, onReceiveOffer, signal]);

  return (
    <div className={styles.container}>
      <Input
        value={search}
        onChange={setSearch}
        className={styles.search}
        prefix={<IconSearch />}
        size="small"
        placeholder="Search"
      ></Input>
      <div className={styles.users}>
        {filteredList.map(user => (
          <Fragment key={user.id}>
            <div
              onClick={() => connectUser(user.id)}
              className={cs(styles.user, peerId === user.id && styles.active)}
            >
              <div className={styles.avatar}>
                <Avatar id={user.id}></Avatar>
              </div>
              <div className={styles.userInfo}>
                <div className={styles.captain}>
                  <span className={styles.name}>{user.id}</span>
                  {user.device === DEVICE_TYPE.MOBILE ? PhoneIcon : PCIcon}
                </div>
                <div className={styles.ip}>{user.ip}</div>
              </div>
            </div>
            <div className={styles.divide}></div>
          </Fragment>
        ))}
      </div>
      {!filteredList.length && <Empty className={styles.empty} description="No User"></Empty>}
    </div>
  );
};
