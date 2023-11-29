import styles from "./index.module.scss";
import React, { FC } from "react";
import { IconGithub } from "@arco-design/web-react/icon";

export const App: FC = () => {
  return (
    <div className={styles.container}>
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
