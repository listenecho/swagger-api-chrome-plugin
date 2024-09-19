
import React, { useEffect,  useRef,  useState } from "react";
import { DEFAULT_TEMPLATE } from "../contant";


const CodeConfigModal: React.FC<{
  isOpen: boolean;
  alltemplates: Template[];
  onClose: () => void;
  updateTemplate: (template: Template) => void;
  updateTemplates: (templates: Template[]) => void;
}> = ({ isOpen, onClose, updateTemplate, updateTemplates, alltemplates }) => {


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
    const newTemplates = alltemplates.map((i) => {
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
    });
    updateTemplates(newTemplates)
  };


  /**
   * 删除模板
   */
  const handleDelete = () => {
    if (selectedItem.id === "-1") return alert("示例模板不可删除")
    const newTemplates = alltemplates.filter(item => item.id !== selectedItem?.id)
    updateTemplates(newTemplates.map((item, index) => {
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
    updateTemplates([
      ...alltemplates.map(item => ({ ...item, active: false })),
      newTemplate
    ]);
  };


  /**
   * 更新模板
   */
  const handleUpdateApi = () => {
    const newTemplates = alltemplates.map(item => {
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
    updateTemplates(newTemplates)
      chrome.storage.local.set({ codeTemplate: JSON.stringify(newTemplates) });

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
    updateTemplate(alltemplates.find(item => item.active) as Template)
  }, [alltemplates])

 
  useEffect(() => {
    if (!isOpen) return
    const activeIndex = alltemplates.findIndex(item => item.active)
    const index = activeIndex === -1 ? 0 : activeIndex
    setSelectedItem(alltemplates?.[index] || {}); // 选择第一个条目或为空
  }, [alltemplates, selectedItem])



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
            {alltemplates?.map(item => (
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