import ReactDOM from "react-dom";
import { App } from "./app/app";
import "@arco-design/web-react/es/style/index.less";
import { drawingBackdrop } from "@ft/webrtc/client/layout/canvas";

window.addEventListener("DOMContentLoaded", drawingBackdrop);
ReactDOM.render(<App></App>, document.getElementById("root"));
