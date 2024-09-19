
// 监听url的改变
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = tab.url;
    const apiType = url?.split('#/')[1] || "";
    chrome.runtime.sendMessage(
      {
        type: 'urlChange',
        data: decodeURIComponent(apiType)
      }
    )
  }
});

/**
 * 打开侧边栏
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});


// 监听消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'refresh') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id as any, { type: 'refresh' });
    });
  }
});