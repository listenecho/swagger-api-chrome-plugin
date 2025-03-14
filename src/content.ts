function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js'); // 确保 injected.js 在插件的 web_accessible_resources 中
  script.onload = function () {
   console.log('⏳ 劫持代码已执行');
  };
  document.documentElement.appendChild(script);
}

document.addEventListener("DOMContentLoaded", injectScript);


