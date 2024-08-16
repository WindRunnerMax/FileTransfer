import ReactDOM from "react-dom";
import { App } from "./app/app";
import "@arco-design/web-react/es/style/index.less";
import { drawingBackdrop } from "./app/canvas";
import { IS_MOBILE } from "laser-utils";
import VConsole from "vconsole";

if (process.env.NODE_ENV === "development" && IS_MOBILE) {
  new VConsole();
}

window.addEventListener("DOMContentLoaded", drawingBackdrop);
ReactDOM.render(<App></App>, document.getElementById("root"));
