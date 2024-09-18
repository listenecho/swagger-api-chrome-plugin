
import React, { useEffect,  useRef,  useState } from "react";


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

const CodeConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  updateTemplate: (template: Template) => void;
}> = ({ isOpen, onClose, updateTemplate }) => {

  /**
   * 模板数据
   */
  const [templates, setTemplate] = useState<Array<Template>>([DEFAULT_TEMPLATE]);

  /**
   * 当前选择模板
   */
  const [selectedItem, setSelectedItem] = useState<Template>(DEFAULT_TEMPLATE);

  /**
   * 表单数据
   */
  const [formData, setFormData] = useState({ name: '', header: '', code: '' })

  /**
   * form 缓存
   */
  const formRefCache = useRef<Template[]>([])
 
  /**
   * 选择模板
   * @param item 
   */
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


  /**
   * 删除模板
   */
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


  /**
   * 修改模板名称
   * @param e 
   */
  const handleFormChange = (e, key) => {
    if(key === "name" && !e.target.value) {
      return alert("模板名称不能为空")
    }
    setFormData({
      ...formData,
        [key]: e.target.value
    })
    // 检查缓存，并且更新已经缓存的数据
    const index = formRefCache.current.findIndex(item => item.id === selectedItem.id)
    if(index !== -1) {
      formRefCache.current[index][key] = e.target.value
    }
  }

  /**
   * 添加模板
   */
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


  /**
   * 更新模板
   */
  const handleUpdateApi = () => {
    setTemplate((old) => {
      const newTemplates = old.map(item => {
        if (item.id === selectedItem?.id) {
          return {
            ...item,
            name: formData.name,
            header: formData.header,
            code: formData.code
          }
        }
        return item
      })
      return newTemplates
    })
    updateTemplate({
      ...selectedItem,
      name: formData.name,
      header: formData.header,
      code: formData.code
    })
   }

  useEffect(() => {
    if (!isOpen) return
    /**
     * 如果有缓存则通过缓存更新数据
     * 如果没有缓存则通过selectedItem更新数据
     */
    const index = formRefCache.current.findIndex(item => item.id === selectedItem.id)
  
    if(index === -1) {
      formRefCache.current.push({
        id: selectedItem.id,
        name: selectedItem.name,
        header: selectedItem.header || '',
        code: selectedItem.code
      })
      setFormData({
        name: selectedItem.name,
        header: selectedItem.header || '',
        code: selectedItem.code
      })
    } else {
      setFormData({
        name: formRefCache.current[index].name,
        header: formRefCache.current[index].header || '',
        code: formRefCache.current[index].code
      })
    }

  }, [selectedItem.id])

  useEffect(() => {
    if (!isOpen) return
    updateTemplate(templates.find(item => item.active) as Template)
  }, [templates])
  /**
   * 获取模板
   */
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

  /**
   * 保存模板
   */
  useEffect(() => {
    if (!isOpen) return
    // 将数据存储到本地
    chrome.storage.local.set({ codeTemplate: JSON.stringify(templates) });
  }, [templates]);

  useEffect(() => {
    if(!isOpen) {
      setFormData({
        name: "",
        header: "",
        code: ""
      })
      formRefCache.current = []
    }
    return () => {
      setFormData({
        name: "",
        header: "",
        code: ""
      })
      formRefCache.current = []
    }
  }, [isOpen])
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
          <button style={{ marginTop: 10 }} onClick={handleAdd}>添加新模板</button>
        </div>
        {
          selectedItem?.id && <div className="modal-right">
            <input type="text" style={{ width: 280, marginBottom: 12, marginTop: 20 }} value={formData.name} onChange={(e) => handleFormChange(e, "name")} />
            <textarea
              value={formData.header}
              onChange={(e) => handleFormChange(e, "header")}
              style={{ height: 100, width: 400, marginBottom: 12 }}
            />
            <textarea
              value={formData.code}
              onChange={(e) => handleFormChange(e, "code")}
              style={{ height: 400, width: 400 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={handleDelete}>删除模板</button>
              <button style={{ marginLeft: 8 }} onClick={handleUpdateApi}>保存并更新API</button>
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default CodeConfigModal;