import ReactDOM from "react-dom";
import { App } from "./components/app";
import "@arco-design/web-react/es/style/index.less";
import { drawingBackdrop } from "./components/canvas";

window.addEventListener("DOMContentLoaded", drawingBackdrop);
ReactDOM.render(<App></App>, document.getElementById("root"));
