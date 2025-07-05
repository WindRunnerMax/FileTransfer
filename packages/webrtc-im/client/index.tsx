import "@arco-design/web-react/es/style/index.less";
import ReactDOM from "react-dom";
import type { FC } from "react";
import { useEffect, useMemo } from "react";
import { SignalService } from "./service/signal";
import { WebRTCService } from "./service/webrtc";
import { TransferService } from "./service/transfer";
import { StoreService } from "./service/store";
import { MessageService } from "./service/message";
import enUS from "@arco-design/web-react/es/locale/en-US";
import { atoms } from "./store/atoms";
import { ConfigProvider } from "@arco-design/web-react";
import { Provider } from "jotai";
import { GlobalContext } from "./store/global";
import { Main } from "./view/main";
import { useDarkTheme } from "./hooks/use-dark-theme";

const App: FC = () => {
  const context = useMemo(() => {
    const signal = new SignalService(location.host);
    const rtc = new WebRTCService(signal);
    const transfer = new TransferService(rtc);
    const store = new StoreService();
    const message = new MessageService(signal, rtc, store, transfer);
    return { signal, rtc, transfer, store, message };
  }, []);

  useDarkTheme();

  useEffect(() => {
    window.context = context;
    return () => {
      window.context = null;
      context.rtc.destroy();
      context.signal.destroy();
      context.message.destroy();
      context.transfer.destroy();
    };
  }, [context]);

  return (
    <ConfigProvider locale={enUS}>
      <Provider store={atoms.store}>
        <GlobalContext.Provider value={context}>
          <Main />
        </GlobalContext.Provider>
      </Provider>
    </ConfigProvider>
  );
};

ReactDOM.render(<App></App>, document.getElementById("root"));
