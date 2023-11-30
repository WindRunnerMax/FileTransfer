import styles from "./index.module.scss";
import React, { FC } from "react";
import { IconGithub, IconRight } from "@arco-design/web-react/icon";
import { BoardCastIcon } from "./icon";
import { Input } from "@arco-design/web-react";
import { getUniqueId } from "laser-utils";

export const App: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.boardCastIcon}>{BoardCastIcon}</div>
        <div>Local ID: {getUniqueId(20)}</div>
        <div className={styles.manualEntry}>
          <Input.Search
            size="mini"
            searchButton={<IconRight />}
            placeholder="Enter Another ID To Connect"
          ></Input.Search>
        </div>
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
