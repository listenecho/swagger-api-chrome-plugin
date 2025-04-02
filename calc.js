const data = {
    "query_result": {
      "id": 164362,
      "query_hash": "161cdedd8e43741fc929a7a4a0de9f8f",
      "query": "SELECT ...",  // SQL 语句
      "data": {
        "columns": [
          { "name": "month", "friendly_name": "month", "type": "string" },
          { "name": "注册用户", "friendly_name": "注册用户", "type": "integer" },
          { "name": "订单数", "friendly_name": "订单数", "type": "integer" },
          { "name": "购买用户数", "friendly_name": "购买用户数", "type": "integer" },
          { "name": "购买金额", "friendly_name": "购买金额", "type": "float" },
          { "name": "折扣金额", "friendly_name": "折扣金额", "type": "float" },
          { "name": "商品+物流+服务费总金额", "friendly_name": "商品+物流+服务费总金额", "type": "float" },
          { "name": "客单价", "friendly_name": "客单价", "type": "float" },
          { "name": "当月注册购买用户", "friendly_name": "当月注册购买用户", "type": "string" },
          { "name": "当月注册用户购买订单数", "friendly_name": "当月注册用户购买订单数", "type": "string" },
          { "name": "当月注册用户购买金额", "friendly_name": "当月注册用户购买金额", "type": "string" }
        ],
        "rows": [
          {
            "month": "2025-01",
            "注册用户": 127257,
            "订单数": 309099,
            "购买用户数": 49660,
            "购买金额": 1930334919.0,
            "折扣金额": 110236117.0,
            "商品+物流+服务费总金额": 2115907958.0,
            "客单价": 38871.0,
            "当月注册购买用户": "6,135",
            "当月注册用户购买订单数": "18,495",
            "当月注册用户购买金额": "104,932,343"
          },
          {
            "month": "2025-02",
            "注册用户": 168938,
            "订单数": 343215,
            "购买用户数": 57871,
            "购买金额": 2182630893.0,
            "折扣金额": 127618454.0,
            "商品+物流+服务费总金额": 2419114990.0,
            "客单价": 37715.0,
            "当月注册购买用户": "7,763",
            "当月注册用户购买订单数": "23,134",
            "当月注册用户购买金额": "134,605,902"
          },
          {
            "month": "2025-03",
            "注册用户": 69097,
            "订单数": 171013,
            "购买用户数": 37338,
            "购买金额": 972573822.0,
            "折扣金额": 59446107.0,
            "商品+物流+服务费总金额": 1094676055.0,
            "客单价": 26048.0,
            "当月注册购买用户": "2,896",
            "当月注册用户购买订单数": "8,008",
            "当月注册用户购买金额": "42,360,135"
          }
        ]
      },
      "data_source_id": 1,
      "runtime": 234.637125492096,
      "retrieved_at": "2025-03-14T13:16:54.800Z"
    }
  }


  function calculateMoM(data) {
    const results = [];

    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const prev = i > 0 ? data[i - 1] : null;
        function calcRate(currentValue, prevValue) {
            const _currentValue = typeof currentValue === "number" ? currentValue : Number(currentValue.replace(/,/g, ""))
            const _prevValue = typeof prevValue === "number" ? prevValue : Number(prevValue.replace(/,/g, ""))

            if (_prevValue === 0 || _prevValue === null) return "N/A"; // 避免除以0
            return ((_currentValue - _prevValue) / _prevValue * 100).toFixed(4) + "%";
        }

        results.push({
            month: current.month,
            注册用户: prev ? calcRate(current["注册用户"], prev["注册用户"]) : "N/A",
            订单数: prev ? calcRate(current["订单数"], prev["订单数"]) : "N/A",
            购买用户数: prev ? calcRate(current["购买用户数"], prev["购买用户数"]) : "N/A",
            购买金额: prev ? calcRate(current["购买金额"], prev["购买金额"]) : "N/A",
            客单价: prev ? calcRate(current["客单价"], prev["客单价"]) : "N/A",
            当月注册用户购买订单数: prev ? calcRate(current["当月注册用户购买订单数"], prev["当月注册用户购买订单数"]) : "N/A",
            当月注册用户购买金额: prev ? calcRate(current["当月注册用户购买金额"], prev["当月注册用户购买金额"]) : "N/A",
            折扣金额: prev ? calcRate(current["折扣金额"], prev["折扣金额"]) : "N/A",
            注册用户: prev ? calcRate(current["注册用户"], prev["注册用户"]) : "N/A",
            购买用户数: prev ? calcRate(current["购买用户数"], prev["购买用户数"]) : "N/A",
        });
    }
    return results

  }

// 计算环比数据
console.log(calculateMoM(data?.query_result?.data?.rows));


 // 创建弹窗元素




 