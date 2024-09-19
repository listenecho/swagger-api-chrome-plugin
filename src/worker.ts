// worker.js

self.onmessage = function (e) {
    if (e.data.type === 'processData') {
        const { swaggerData, swaggerApiType, template } = e.data;
        const result = processSwaggerData(swaggerData, swaggerApiType, template);
        console.log(result)
        self.postMessage({
            type: 'processedData',
            codes: result.codes,
            totals: result.totals
        });
    }

    if (e.data.type === 'updateSwaggerData') {
        const { swaggerData, template } = e.data;
        const result = getRenderData(swaggerData, template);
        if (result) {
            self.postMessage({
                type: 'processedData',
                codes: result.codes,
                totals: result.totals
            });
        } else {
            self.postMessage({
                type: 'processedData',
                codes: [],
                totals: 0
            });
        }
    }
};



function processSwaggerData(swaggerData, swaggerApiType, template) {
    // 实现数据处理逻辑
    const _swagger_data_ = JSON.parse(JSON.stringify(swaggerData));
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

    const result = getRenderData(_swagger_data_, template);
    if (result) {
        const { codes, totals } = result;
        return { codes, totals };
    }
    return { codes: [], totals: 0 };
}

function getRenderData(data, template) {
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
            codes.push(generateRequestCode(apiPath, method, apiData))
            count++;
        });
    });
    return {
        codes,
        totals: count
    }
}