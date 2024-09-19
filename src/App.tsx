import React, { useEffect, useMemo, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import CodeConfigModal from "./components/CodeConfigModal";
import CodeDisplay from "./components/CodeDisplay";
import "./index.css"
import { DEFAULT_TEMPLATE } from "./contant";


function App() {
  const [swaggerData, setSwaggerData] = useState<any>(null);
  const swaggerDataRef = React.useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [template, setTemplate] = useState<Template>({} as Template);
  const [totals, setTotals] = useState(0);
  const [renderCounts, setRenderCounts] = useState(10);
  const [codes, setCodes] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const [alltemplates, setAppAllTemplates] = useState<Array<Template>>([DEFAULT_TEMPLATE]);


  useEffect(() => {
    const workerURL = chrome.runtime.getURL('./worker.js');
    workerRef.current = new Worker(workerURL);
    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'processedData') {
        setCodes(event.data.codes);
        setTotals(event.data.totals);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    // 监听消息
    chrome.runtime.onMessage.addListener(function (message) {
      if (message.type === 'refresh') {
        window.location.reload();
      }
    });
  }, [])


  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'updateSwaggerData',
      swaggerData: swaggerData,
      template: template
    });
  }, [swaggerData, template])


  useEffect(() => {
    // 从chrome stroage 中获取数据
    chrome.storage.local.get(['swaggerData', "codeTemplate", "renderCounts"], function (result) {
      const { swaggerData, codeTemplate } = result;
      if (swaggerData) {
        const sourceData = JSON.parse(swaggerData);
        setSwaggerData(sourceData)
        swaggerDataRef.current = sourceData;
      }
      if (result.renderCounts) {
        setRenderCounts(result.renderCounts);
      }

      if (codeTemplate) {
        const ts = JSON.parse(codeTemplate);
        if(ts.length === 0 ) {
          setTemplate(DEFAULT_TEMPLATE);
          setAppAllTemplates([DEFAULT_TEMPLATE]);
        } else {
          setTemplate(ts.find(item => item.active));
          setAppAllTemplates(ts);
        }
      } else {
        setTemplate(DEFAULT_TEMPLATE);
        setAppAllTemplates([DEFAULT_TEMPLATE]);
      }
    });
  }, [])


  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === 'urlChange' && workerRef.current) {
        workerRef.current.postMessage({
          type: 'processData',
          swaggerData: swaggerDataRef.current,
          swaggerApiType: message.data,
          template: template
        });
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [template]);


  // 将渲染数量缓存到本地
  useEffect(() => {
    chrome.storage.local.set({ renderCounts: renderCounts });
  }, [renderCounts])


  const handleChangeRenderCount = (e) => {
    setRenderCounts(e.target.value)
  }

  const renderCodeStr = useMemo(() => {
    const header = template?.header ? template.header + '\n\n\n\n' : ""
    return (header + codes.slice(0, renderCounts).join("\n\n\n\n")) + `\n\n\n\n`
  }, [renderCounts, codes, template])


  return <div className="apps">
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: 60,
      paddingTop: 20,
      paddingLeft: 20,
      width: '100%',
      backgroundColor: '#f0f0f0',
    }}>
      <div>
        <strong>当前模板： {template.name}</strong>
        <button style={{ marginLeft: 8, marginRight: 8 }} onClick={() => {
          window.location.reload();
        }}>刷新</button>
        <button onClick={() => setIsModalOpen(true)}>配置</button>

        <button style={{ marginLeft: 8, }} onClick={() => {
          chrome.storage.local.clear();
          window.location.reload();
        }}>清除缓存</button>

        <CopyToClipboard text={renderCounts}>
          <button style={{ marginLeft: 8 }}>复制代码</button>
        </CopyToClipboard>

      </div>
      <div style={{ display: "flex", gap: 12, }}>
        <p><strong>接口总数</strong> <span>{totals}</span></p>
        <p><strong>渲染请求方法数：</strong> <span><input value={renderCounts} onChange={handleChangeRenderCount} /></span></p>
      </div>
    </div>
    {isModalOpen && <CodeConfigModal
      isOpen={isModalOpen}
      alltemplates={alltemplates}
      onClose={() => setIsModalOpen(false)}
      updateTemplate={setTemplate}
      updateTemplates={setAppAllTemplates}
    />}
    <div className="codes" style={{
      marginTop: 70
    }}>
      <div style={{
        height: '90vh',
        overflow: 'auto',
      }} >
        <CodeDisplay code={renderCodeStr} language={"javascript"} />
      </div>
    </div>
  </div>;
}

export default App;
