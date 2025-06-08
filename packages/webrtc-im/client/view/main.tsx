import { Provider } from "jotai/react";
import type { FC } from "react";
import { useEffect, useMemo } from "react";
import { atoms } from "../store/atoms";
import { SignalService } from "../service/signal";
import { WebRTCService } from "../service/webrtc";
import { TransferService } from "../service/transfer";
import styles from "../styles/main.m.scss";
import { TabBar } from "./tab-bar";
import { Contacts } from "./contacts";

export const App: FC = () => {
  const context = useMemo(() => {
    const signal = new SignalService(location.host);
    const rtc = new WebRTCService(signal);
    const transfer = new TransferService(signal, rtc);
    return { signal, rtc, transfer };
  }, []);

  useEffect(() => {
    return () => {
      context.rtc.destroy();
      context.signal.destroy();
    };
  }, [context]);

  return (
    <Provider store={atoms.store}>
      <div className={styles.main}>
        <TabBar></TabBar>
        <Contacts></Contacts>
      </div>
    </Provider>
  );
};
