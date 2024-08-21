
// 监听url的改变
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = tab.url;
    const apiType = url?.split('#/')[1];
    if (!apiType) return
    chrome.runtime.sendMessage(
      {
        type: 'urlChange',
        data: decodeURIComponent(apiType)
      }
    )
  }
});