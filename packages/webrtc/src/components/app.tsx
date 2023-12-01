import styles from "./index.module.scss";
import { FC } from "react";
import { IconGithub } from "@arco-design/web-react/icon";
import { BoardCastIcon } from "./icon";
import { getUniqueId } from "laser-utils";

export const App: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.boardCastIcon}>{BoardCastIcon}</div>
        <div>Local ID: {getUniqueId(20)}</div>
        <div className={styles.manualEntry}>Request To Establish P2P Connection By ID</div>
      </div>
      <div className={styles.prompt}>Open another device on the LAN to transfer files</div>
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
