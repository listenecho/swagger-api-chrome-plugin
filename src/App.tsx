import React, { useEffect, useRef, useState } from "react";
import Prism from 'prismjs';
import 'prismjs/themes/prism-twilight.css'
import 'prismjs/components/prism-javascript';
import "./index.css"


type Template = {
  id: string;
  name: string;
  code: string;
  active?: boolean;
}

const DEFAULT_TEMPLATE = {
  id: "-1",
  name: '示例模板',
  active: false,
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
  `
}

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  updateTemplate: (template: Template) => void;
}> = ({ isOpen, onClose, updateTemplate }) => {
  const [templates, setTemplate] = useState<Array<Template>>([DEFAULT_TEMPLATE]);
  const [selectedItem, setSelectedItem] = useState<Template>(DEFAULT_TEMPLATE);
  const [inputValue, setInputValue] = useState(DEFAULT_TEMPLATE.code);
  const [nameValue, setNameValue] = useState(DEFAULT_TEMPLATE.name);



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
    setSelectedItem(item);
    setInputValue(item.code); // 将选中的条目填充到文本框
    setNameValue(item.name); // 将选中的条目填充到文本框
  };

  const handleDelete = () => {
    if(selectedItem.id === "-1") return alert("示例模板不可删除")
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
    setSelectedItem(newTemplates?.[0] || {}); // 选择第一个条目或为空
    setInputValue(newTemplates?.[0]?.code || ""); // 清空文本框
    setNameValue(newTemplates?.[0]?.name || ""); // 清空文本框
  };

  const handleInputChange = (e) => {
    setTemplate((old) => old.map(item => {
      if (item.id === selectedItem?.id) {
        return {
          ...item,
          code: e.target.value,
        }
      }
      return item;
    }));
    setInputValue(e.target.value);
  };

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
    setNameValue(e.target.value);
  }

  const handleAdd = () => {
    const newTemplate = {
      id: Math.random().toString(36).substring(2, 12),
      name: "新模板",
      code: "",
      active: false
    }
    setTemplate([
      ...templates,
      newTemplate
    ]);
    setSelectedItem(newTemplate);
    setInputValue(newTemplate.code);
    setNameValue(newTemplate.name);
  };

const handleUpdateApi = () => {
  updateTemplate(selectedItem)
}

  useEffect(() => {
    if (!isOpen) return
    // chrome.storage.local.get(['codeTemplate'], function (result) {
    //   const data = result.codeTemplate ? JSON.parse(result.codeTemplate) : [];
    //   if (data.length > 0) {
    //     const activeIndex = data.findIndex(item => item.active) 
    //     setTemplate(data);
    //     setInputValue(data?.[activeIndex]?.code || ''); // 将第一个条目填充到文本框
    //     setSelectedItem(data?.[activeIndex] || ''); // 选择第一个条目
    //     setNameValue(data?.[activeIndex]?.name || ''); // 将第一个条目填充到文本框
    //   }
    // });
  }, [])


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
            <input type="text" style={{ width: 280, marginBottom: 12, marginTop: 20 }} value={nameValue} onChange={handleNameChange} />
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              style={{ height: 400, width: 400 }}
            />
            <div>
              <button className="save-button" onClick={handleDelete}>删除模板</button>
              <button className="save-button" style={{ marginLeft: 8}} onClick={handleUpdateApi}>更新API</button>
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
  const ref = useRef(null);
  useEffect(() => {
    if (ref && ref.current) {
      Prism.highlightElement(ref.current);
    }
  }, [code]);

  return (
    <pre >
      <code ref={ref} className={`prism-code language-${language}`}>
        {code}
      </code>
    </pre>
  );

};


function App() {
  const [code, setCode] = useState('');
  const [swaggerData, setSwaggerData] = useState<any>(null);
  const swaggerDateRef = React.useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [template, setTemplate] = useState<Template>({} as Template);

  useEffect(() => {
    // 从chrome stroage 中获取数据
    chrome.storage.local.get(['swaggerData', "codeTemplate"], function (result) {
      const { swaggerData, codeTemplate } = result;
      if (swaggerData) {
        const sourceData = JSON.parse(swaggerData);
        setSwaggerData(sourceData)
        swaggerDateRef.current = sourceData;
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
            if (api.tags.includes(apiType)) {
              newMethod[m] = api;
            }
          })
          if (Object.keys(newMethod).length) {
            newpath[path] = newMethod;
          }
        })

        if(apiStr) {
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
        apiMethod: method.toLowerCase()
      }
      const replaceDate = `${data?.apiMethod === 'post' ? 'data' : 'params'}: params`
      const code = template.code.replace(/\$(\w+)\$/g, (match, key) => {
        return data[key]
      }).replace(/apiReplaceDefault/g, replaceDate)
      return code
    }


    let code = ""
    // 找到所有API并生成代码
    Object.keys(data.paths).forEach(apiPath => {
      Object.keys(data.paths[apiPath]).forEach(method => {
        const apiData = data.paths[apiPath][method];
        // 增加code 换行
        code += generateRequestCode(apiPath, method, apiData) + '\n\n';
      });
    });
    setCode(code);
  }

  useEffect(() => {
    getRenderData(swaggerData)
  }, [swaggerData, template])




  return <div className="apps">
    <button onClick={() => {
      window.location.reload();
    }}>刷新</button>
    <button style={{ marginLeft: 8}} onClick={() => setIsModalOpen(true)}>配置</button>
    {isModalOpen && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} updateTemplate={setTemplate}/>}
    <div className="codes">
      <CodeDisplay code={code} language={"javascript"}  />
    </div>
  </div>;
}

export default App;
