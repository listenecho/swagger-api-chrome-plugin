import React, { useEffect, useMemo, useRef, useState } from "react";
import { Highlight, themes } from "prism-react-renderer"
import { CopyToClipboard } from "react-copy-to-clipboard";
import Textarea from 'rc-textarea';

import "./index.css"

type Template = {
  id: string;
  name: string;
  code: string;
  active?: boolean;
  header?: string;
}

const DEFAULT_TEMPLATE = {
  id: "-1",
  name: '示例模板',
  active: true,
  code: `
    配置解释：

    apiSummary ：        接口描述
    apiOperationId：     接口ID
    apiPath：            接口路径
    apiMethod：          接口方法
    apiReplaceDefault:   默认参数用于设置get与post请求参数

    示例代码：
    注：api相关参数需要被$包裹

  /**
   * $apiSummary$
   * @method $apiMethod$
   * @path $apiPath$
   */
    export const $apiOperationId$ = (params: any) => {
      return request({
        url: '$apiPath$',
        method: '$apiMethod$',
        $apiReplaceDefault$
    });
  `,
  header: `
   /**  头部公共代码 **/
    import { request } from '@/utils/request';
  `
}


const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  updateTemplate: (template: Template) => void;
}> = ({ isOpen, onClose, updateTemplate }) => {
  const [templates, setTemplate] = useState<Array<Template>>([DEFAULT_TEMPLATE]);
  const [selectedItem, setSelectedItem] = useState<Template>(DEFAULT_TEMPLATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleItemClick = (item) => {
    setTemplate((old) => old.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          active: true,
        };
      }
      return {
        ...i,
        active: false,
      };
    }));
  };

  const handleDelete = () => {
    if (selectedItem.id === "-1") return alert("示例模板不可删除")
    const newTemplates = templates.filter(item => item.id !== selectedItem?.id)
    setTemplate(newTemplates.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          active: true,
        }
      }
      return item
    }));
  };
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setTemplate((old) => old.map(item => {
      if (item.id === selectedItem?.id) {
        return {
          ...item,
          code: newValue,
        }
      }
      return item;
    }));

    // Move cursor to the preserved position
    if (textareaRef.current) {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursorPosition;
    }
  };

  const handleCommonHeaderChange = (e) => {
    setTemplate((old) => old.map(item => {
      if (item.id === selectedItem?.id) {
        return {
          ...item,
          header: e.target.value,
        }
      }
      return item;
    }));
  }

  const handleNameChange = (e) => {
    setTemplate((old) => old.map(item => {
      if (item.id === selectedItem?.id) {
        return {
          ...item,
          name: e.target.value,
        }
      }
      return item
    }
    ));
  }

  const handleAdd = () => {
    const newTemplate = {
      id: Math.random().toString(36).substring(2, 12),
      name: "新模板",
      code: "",
      active: true,
      header: ""
    }
    setTemplate([
      ...templates.map(item => ({ ...item, active: false })),
      newTemplate
    ]);
  };

  const handleUpdateApi = () => {
    updateTemplate(selectedItem)
  }

  useEffect(() => {
    if (!isOpen) return
    chrome.storage.local.get(['codeTemplate'], function (result) {
      const data = result.codeTemplate ? JSON.parse(result.codeTemplate) : [];
      if (data.length > 0) {
        setTemplate(data);
      }
    });
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const activeIndex = templates.findIndex(item => item.active)
    const index = activeIndex === -1 ? 0 : activeIndex
    setSelectedItem(templates?.[index] || {}); // 选择第一个条目或为空
  }, [templates, selectedItem])

  useEffect(() => {
    if (!isOpen) return
    // 将数据存储到本地
    chrome.storage.local.set({ codeTemplate: JSON.stringify(templates) });
  }, [templates]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>关闭</button>
        <div className="modal-left">
          <ul>
            {templates?.map(item => (
              <li
                key={item.id}
                className={item.active ? 'selected' : ''}
                onClick={() => handleItemClick(item)}
              >
                {item.name}
              </li>
            ))}
          </ul>
          <button className="delete-button" onClick={handleAdd}>添加新模板</button>
        </div>
        {
          selectedItem?.id && <div className="modal-right">
            <input type="text" style={{ width: 280, marginBottom: 12, marginTop: 20 }} value={selectedItem.name} onChange={handleNameChange} />
            <Textarea
              value={selectedItem.header}
              onChange={handleCommonHeaderChange}
              style={{ height: 100, width: 400, marginBottom: 12 }}
            />
            <Textarea
              ref={textareaRef}
              value={selectedItem.code}
              onChange={handleInputChange}
              style={{ height: 400, width: 400 }}
            />
            <div>
              <button className="save-button" onClick={handleDelete}>删除模板</button>
              <button className="save-button" style={{ marginLeft: 8 }} onClick={handleUpdateApi}>更新API</button>
            </div>
          </div>
        }
      </div>
    </div>
  );
};


const CodeDisplay: React.FC<{
  code: string;
  language: string;
}> = ({ code, language }) => {
  return <Highlight
    code={code}
    theme={themes.oneDark}
    language={language}
  >
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <pre style={{
        ...style,
        fontSize: 14,
        paddingTop: 20,
        paddingLeft: 20,
      }} className={className}>
        {tokens.map((line, i) => (
          <div key={i} {...getLineProps({ line })}>
            {line.map((token, key) => (
              <span key={key} {...getTokenProps({ token })} />
            ))}
          </div>
        ))}
      </pre>
    )}
  </Highlight>
};


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
    {isModalOpen && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} updateTemplate={setTemplate} />}
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
