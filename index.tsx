import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

let rootElement = document.getElementById("root");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "webpersona-root";
  rootElement.style.position = "fixed";
  rootElement.style.top = "0";
  rootElement.style.left = "0";
  rootElement.style.width = "100%";
  rootElement.style.height = "100%";
  rootElement.style.zIndex = "9999";
  rootElement.style.pointerEvents = "none"; // Allow interaction with page
  document.body.appendChild(rootElement);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
