//@ts-nocheck

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
      try {
        if (this.readyState === 4) {
          if (this.responseURL && this.responseURL.includes("results")) {
            const $dom = document.querySelector("#_dynamic_sales_rate__")
            if ($dom) {
              const res = calcRate(this.responseURL, JSON.parse(this.responseText))
              //@ts-ignore
              $dom.innerText = res
            }
          }
  
          if(this.responseURL.includes('queries/394/results')) {
            const result = calculateMoM( JSON.parse(this.responseText)?.query_result?.data?.rows)  
            renderToolTips(result)
          }
           
        }
      } catch(e) {
        console.log(e)
      }
    });

    return originalXhrSend.apply(this, [body]);
  };
})();




function calcRate(url: string, resJson) {
  
  const INCOME_KEY = "销售总额"
  const SALE_KEY = "收益总额"
  const { query_result = {} } = resJson || {}
  const { data = {} } = query_result
  const { rows = [] } = data

  let incomeTotal = 0
  let saleTotal = 0

  rows.forEach(_ => {
    incomeTotal += _[INCOME_KEY]
    saleTotal += _[SALE_KEY]
  })
  if(!incomeTotal || !saleTotal ) return 0
  return  ((saleTotal / incomeTotal) * 100).toFixed(4) + "%" 
}

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


  var tooltip = createTooltip()
  function createTooltip() {
     const tooltip_ =  document.getElementById("__tooltip__")
     if(tooltip_) {
         tooltip_.remove()
     }
     const tooltip = document.createElement("div");
     tooltip.id = "__tooltip__"
     tooltip.style.position = "absolute";
     tooltip.style.padding = "8px 12px";
     tooltip.style.background = "rgba(0, 0, 0, 0.65)";
     tooltip.style.color = "#fff";
     tooltip.style.borderRadius = "6px";
     tooltip.style.fontSize = "14px";
     tooltip.style.whiteSpace = "nowrap";
     tooltip.style.display = "none"; // 默认隐藏
     tooltip.style.zIndex = "9999";
     document.body.appendChild(tooltip);
     return tooltip
  }
 
 
  function getTag (number) {
     if(number > 0) {
         return "📈"
     } else if (number < 0){
         return "📉"
     } else {
         return "👍"
     }
 }
 
 function renderModal(obj) {
     if( !obj || !Object.keys(obj).length) return ""
     const frag =  document.createElement("div")
       Object.keys(obj).forEach(key => {
           const curValue = obj[key]
           if(curValue.includes("%")) {
               const d = Number(curValue.replace("%", ""))
               const tag = getTag(d)
               const p = document.createElement("p")
               p.innerHTML =  `${key}: ${curValue} ${tag}`
               frag.appendChild(p)
           }
       })
       return frag
   }
 



   function calculateMoM(data) {

    const results = [];

    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const prev = i > 0 ? data[i - 1] : null;
        function calcRate(currentValue, prevValue) {
            const _currentValue = typeof currentValue === "number" ? currentValue : Number(currentValue.replace(/,/g, ""))
            const _prevValue = typeof prevValue === "number" ? prevValue : Number(prevValue.replace(/,/g, ""))

            if (_prevValue === 0 || _prevValue === null) return "N/A"; // 避免除以0
            return ((_currentValue - _prevValue) / _prevValue * 100).toFixed(4) + "%";
        }

        results.push({
            month: current.month,
            注册用户: prev ? calcRate(current["注册用户"], prev["注册用户"]) : "N/A",
            订单数: prev ? calcRate(current["订单数"], prev["订单数"]) : "N/A",
            购买用户数: prev ? calcRate(current["购买用户数"], prev["购买用户数"]) : "N/A",
            购买金额: prev ? calcRate(current["购买金额"], prev["购买金额"]) : "N/A",
            客单价: prev ? calcRate(current["客单价"], prev["客单价"]) : "N/A",
            当月注册用户购买订单数: prev ? calcRate(current["当月注册用户购买订单数"], prev["当月注册用户购买订单数"]) : "N/A",
            当月注册用户购买金额: prev ? calcRate(current["当月注册用户购买金额"], prev["当月注册用户购买金额"]) : "N/A",
            折扣金额: prev ? calcRate(current["折扣金额"], prev["折扣金额"]) : "N/A",
        });
    }
    return results

  }
 
   function renderToolTips(data) {

     [...document.querySelectorAll(".ant-table-tbody > tr")].forEach(tr => {
 
         const month =  tr.querySelector("td > div").innerText
      
          const curMonthData = data.find(m => m.month === month)
      
          tr.setAttribute("data", JSON.stringify(curMonthData))
      
          tr.addEventListener("click", function (event) {
              const data = JSON.parse( tr.getAttribute("data"))
              tooltip.innerHTML = ""
              const renderHtml= renderModal(data)

              if(!renderHtml) {
                 tooltip.style.display = "none";
                 return
              }
              tooltip.appendChild(renderHtml)
              tooltip.style.display = "block";
      
              // 设置弹窗位置（相对鼠标）
              tooltip.style.left = event.pageX + 10 + "px";
              tooltip.style.top = event.pageY + 10 + "px";
          });
      
          tr.addEventListener("mousemove", function (event) {
             
              // 让弹窗跟随鼠标
              tooltip.style.left = event.pageX + 10 + "px";
              tooltip.style.top = event.pageY + 10 + "px";
          });
      
          tr.addEventListener("mouseleave", function () {
              tooltip.style.display = "none"; // 鼠标移出隐藏弹窗
              tooltip.innerHTML = ""
          });
      
          
          
          
      })
      
   }



