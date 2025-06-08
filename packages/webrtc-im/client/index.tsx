import ReactDOM from "react-dom";
import "@arco-design/web-react/es/style/index.less";
import { App } from "./view/main";

const darkThemeMatch = window.matchMedia("(prefers-color-scheme: dark)");
if (darkThemeMatch.matches) {
  document.body.setAttribute("arco-theme", "dark");
}

ReactDOM.render(<App></App>, document.getElementById("root"));
