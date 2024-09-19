// 获取页面元素类名为 information-container 下的 a 标签 href 属性
async function getInformationContainerAHref() {
  const informationContainer = document.querySelector('.information-container');
  if (!informationContainer) return;
  const swaggerUrl = informationContainer.querySelector('a')?.href;
  if (!swaggerUrl) return;

  try {
    const response = await fetch(swaggerUrl);
    const swaggerData = await response.json();
    // 发送消息通知页面刷新
    chrome.runtime.sendMessage({ type: 'refresh' });
    // 将数据存储到本地
    chrome.storage.local.set({ swaggerData: JSON.stringify(swaggerData) });
  } catch (error) {
    console.error('Error fetching or parsing Swagger data:', error);
  }
}

// 创建一个 MutationObserver 实例
const observer = new MutationObserver(() => {
  if (document.querySelector('.information-container')) {
    observer.disconnect(); // 停止观察
    getInformationContainerAHref();
  }
});

// 监听 DOM 内容加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 开始观察 document.body 的变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 设置一个超时，以防元素never出现
  setTimeout(() => {
    observer.disconnect();
  }, 10000); // 10秒后停止观察
});