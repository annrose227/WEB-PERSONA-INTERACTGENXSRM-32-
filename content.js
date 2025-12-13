// Inject JS
const script = document.createElement("script");
script.src = chrome.runtime.getURL("dist/assets/index-mr-D7yjZ.js");
document.head.appendChild(script);

console.log("✅ WebPersona content script injected");

// Add a visible indicator that the extension is active
const widget = document.createElement("div");
widget.innerText = "🧠 WebPersona";
widget.style.position = "fixed";
widget.style.bottom = "20px";
widget.style.right = "20px";
widget.style.zIndex = "999999";
widget.style.background = "black";
widget.style.color = "white";
widget.style.padding = "10px";
widget.style.borderRadius = "50%";
widget.style.cursor = "pointer";

document.body.appendChild(widget);
