import React, { useEffect, useMemo, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import CodeConfigModal from "./components/CodeConfigModal";
import CodeDisplay from "./components/CodeDisplay";
import "./index.css"


function App() {
  const [swaggerData, setSwaggerData] = useState<any>(null);
  const swaggerDateRef = React.useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [template, setTemplate] = useState<Template>({} as Template);
  const [totals, setTotals] = useState(0);
  const [renderCounts, setRenderCounts] = useState(500);
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    // 从chrome stroage 中获取数据
    chrome.storage.local.get(['swaggerData', "codeTemplate", "renderCounts"], function (result) {
      const { swaggerData, codeTemplate } = result;
      if (swaggerData) {
        const sourceData = JSON.parse(swaggerData);
        setSwaggerData(sourceData)
        swaggerDateRef.current = sourceData;
      }
      if (result.renderCounts) {
        setRenderCounts(result.renderCounts);
      }
      if (codeTemplate) {
        const t = JSON.parse(codeTemplate).find(item => item.active);
        setTemplate(t);
      }
    });
  }, [])


  useEffect(() => {
    // 监听chrome 消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'urlChange') {
        const swaggerApiType = message.data;
        const _swagger_data_ = JSON.parse(JSON.stringify(swaggerDateRef.current));
        let newpath = {}
        // 判断url 是否含有api
        const apis = swaggerApiType.split("/")
        const [apiType, apiStr] = apis;
        // 移除path对象中的api 下面 get 对象或者 post 对象 tag 数组中不存在 swaggerApiType 的对象
        Object.keys(_swagger_data_.paths).forEach(path => {
          const method = _swagger_data_.paths[path];
          const newMethod = {};
          Object.keys(method).forEach(m => {
            const api = method[m];
            if (api.tags.includes(apiType) || !apiType) {
              newMethod[m] = api;
            }
          })
          if (Object.keys(newMethod).length) {
            newpath[path] = newMethod;
          }
        })

        if (apiStr) {
          const newpath2 = {}
          Object.keys(newpath).forEach(path => {
            const method = newpath[path];
            const newMethod = {};
            Object.keys(method).forEach(m => {
              const api = method[m];
              if (api.operationId === apiStr) {
                newMethod[m] = api;
              }
            })
            if (Object.keys(newMethod).length) {
              newpath2[path] = newMethod;
            }
          })
          newpath = newpath2;
        } 
        _swagger_data_.paths = newpath;
        getRenderData(_swagger_data_);

      }
    }
    )
  }, [template])



  function getRenderData(data: any) {
    if (!data || !Object.keys(data).length || !template?.code) return
    // 生成请求代码的函数
    function generateRequestCode(path, method, apiData) {
      const data = {
        apiSummary: apiData.summary,
        apiOperationId: apiData.operationId,
        apiPath: path,
        apiMethod: method.toLowerCase(),
        apiReplaceDefault: `${method.toLowerCase() === 'post' ? 'data' : 'params'}: params`
      }
      if (["put", "delete", "update"].includes(method.toLowerCase())) {
        data.apiReplaceDefault = ""
      }
      // 去除apipath上的{xx}，提取出xx 这个属性
      const key = path.match(/\{(\w+)\}/g)
      if (key?.length) {
        data.apiPath = data.apiPath.replace(/{\w+}/g, "") + '${params.' + key?.[0].replace(/{|}/g, "") + '}'
      }
      const code = template.code.replace(/\$(\w+)\$/g, (match, key) => {
        return data[key]
      })
      return code
    }
    const codes: string[] = []
    let count = 0;
    // 找到所有API并生成代码
    Object.keys(data.paths).forEach(apiPath => {
      Object.keys(data.paths[apiPath]).forEach(method => {
        const apiData = data.paths[apiPath][method];
        // 增加code 换行
        // code += generateRequestCode(apiPath, method, apiData) + '\n\n\n\n';
        codes.push(generateRequestCode(apiPath, method, apiData))
        count++;
      });
    });
    setCodes(codes);
    setTotals(count);
  }

  const handleChangeRenderCount = (e) => {
    setRenderCounts(e.target.value)
  }

  // 将渲染数量缓存到本地
  useEffect(() => {
    chrome.storage.local.set({ renderCounts: renderCounts });
  }, [renderCounts])

  useEffect(() => {
    getRenderData(swaggerData)
  }, [swaggerData, template])


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
        <CopyToClipboard text={renderCounts}>
          <button style={{ marginLeft: 8 }}>复制代码</button>
        </CopyToClipboard>
      </div>
      <div style={{ display: "flex", gap: 12, }}>
        <p><strong>接口总数</strong> <span>{totals}</span></p>
        <p><strong>渲染请求方法数：</strong> <span><input value={renderCounts} onChange={handleChangeRenderCount} /></span></p>
      </div>
    </div>
    {isModalOpen && <CodeConfigModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} updateTemplate={setTemplate} />}
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
