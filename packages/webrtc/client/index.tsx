import ReactDOM from "react-dom";
import { App } from "./components/app";
import "@arco-design/web-react/es/style/index.less";
import { drawingBackdrop } from "./components/canvas";
import { isMobile } from "./utils/is";
import VConsole from "vconsole";

if (process.env.NODE_ENV === "development" && isMobile()) {
  new VConsole();
}

window.addEventListener("DOMContentLoaded", drawingBackdrop);
ReactDOM.render(<App></App>, document.getElementById("root"));
