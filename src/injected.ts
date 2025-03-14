(function () {
  console.log("⏳ 劫持代码已执行");

  /** 劫持 fetch */
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    console.log("⏳ Fetch 请求:", args);

    try {
      const response = await originalFetch(...args);
      const clone = response.clone();
      clone.json().then(data => {
        console.log("✅ Fetch 响应数据:", data);
        window.postMessage({ type: "FETCH_DATA", data }, "*");
      }).catch(err => console.log("⚠️ Fetch 解析失败:", err));

      return response;
    } catch (error) {
      console.error("❌ Fetch 请求错误:", error);
      throw error;
    }
  };

  /** 劫持 XMLHttpRequest */
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    const [async = true, username, password] = rest;
    return originalXhrOpen.apply(this, [method, url, async, username, password]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    // console.log("⏳ XHR 请求:", this._requestInfo, "Body:", body);

    this.addEventListener("load", function () {
      if (this.readyState === 4) {
        console.log("✅ XHR 响应数据:",this.responseURL, JSON.parse(this.responseText));
        const  $dom = document.querySelector("#_dynamic_sales_rate__")
        if($dom){
          $dom.innerText = Math.random() * 10 + "%"
        }
        window.postMessage({ type: "XHR_DATA", data: this.responseText }, "*");
      }
    });

    return originalXhrSend.apply(this, [body]);
  };
})();

/**
 * 
 * 绘制一个全局可移动的弹窗
 * 
 * 
 */
(function () {
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.top = "50%";
  div.style.left = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.zIndex = "9999";
  div.style.background = "rgba(0,0,0,.5)";
  div.style.color = "#fff";
  div.style.padding = "10px 20px";
  div.style.borderRadius = "10px";
  div.style.cursor = "move";
  div.style.userSelect = "none";
  div.style.boxShadow = "0 0 10px rgba(0,0,0,.5)";
  div.id = "_dynamic_sales_rate__";
  div.innerText = "拖动我";

  let isDown = false;
  let disX = 0;
  let disY = 0;

  div.addEventListener("mousedown", function (e) {
    isDown = true;
    disX = e.clientX - div.offsetLeft;
    disY = e.clientY - div.offsetTop;
  });

  document.addEventListener("mousemove", function (e) {
    if (isDown) {
      div.style.left = e.clientX - disX + "px";
      div.style.top = e.clientY - disY + "px";
    }
  });

  document.addEventListener("mouseup", function () {
    isDown = false;
  });

  document.body.appendChild(div);
})();
// Compare this snippet from src/manifest.json:



