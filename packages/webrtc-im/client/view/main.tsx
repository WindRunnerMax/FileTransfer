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
import { GlobalContext } from "../store/global";
import { IconGithub } from "@arco-design/web-react/icon";
import { StoreService } from "../service/store";
import { ConfigProvider } from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US";
import { MessageService } from "../service/message";
import { Message } from "./message";

export const App: FC = () => {
  const context = useMemo(() => {
    const signal = new SignalService(location.host);
    const rtc = new WebRTCService(signal);
    const transfer = new TransferService(signal, rtc);
    const store = new StoreService();
    const message = new MessageService(signal, rtc);
    return { signal, rtc, transfer, store, message };
  }, []);

  useEffect(() => {
    window.context = context;
    return () => {
      window.context = null;
      context.rtc.destroy();
      context.signal.destroy();
      context.message.destroy();
    };
  }, [context]);

  return (
    <ConfigProvider locale={enUS}>
      <Provider store={atoms.store}>
        <GlobalContext.Provider value={context}>
          <div className={styles.main}>
            <TabBar></TabBar>
            <Contacts></Contacts>
            <Message></Message>
          </div>
          <a
            className={styles.github}
            href="https://github.com/WindrunnerMax/FileTransfer"
            target="_blank"
          >
            <IconGithub />
          </a>
        </GlobalContext.Provider>
      </Provider>
    </ConfigProvider>
  );
};
