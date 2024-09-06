

// 获取页面元素类名为 information-container 下的 a 标签 href 属性
function getInformationContainerAHref() {
  setTimeout(async () => {
    const informationContainer = document.getElementsByClassName('information-container')[0]
    const swaggerUrl = informationContainer?.querySelector('a')?.href;
    if (!swaggerUrl) return
    const response = await fetch(swaggerUrl);
    const swaggerData = await response.json();
    // 将数据存储到本地
    chrome.storage.local.set({ swaggerData: JSON.stringify(swaggerData) });
  }, 1000)
}
getInformationContainerAHref()


