
export const DEFAULT_TEMPLATE = {
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