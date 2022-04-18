import { ReportDataType } from '@/types/transportData';
import { MonitorHttp, ERRORTYPES, ERRORLEVEL } from '@/common';
import { getLocationHref, getTimestamp } from 'utils';
import { ResourceErrorTarget } from 'core';

export function httpTransform(data: MonitorHttp): ReportDataType {
  let description = data.responseText;
  if (data.status === 0) {
    description = data.elapsedTime <= 1000 ? '接口失败原因为:跨域' : '接口失败原因为:超时';
  } else {
    description = '接口上报原因：接口响应慢';
  }
  return {
    type: ERRORTYPES.HTTPERROR,
    pageUrl: getLocationHref(),
    time: data.eTime,
    elapsedTime: data.elapsedTime,
    level: ERRORLEVEL.HIGH,
    request: {
      httpType: data.type,
      method: data.method,
      url: data.url,
      data: data.reqData || '',
    },
    response: {
      status: data.status,
      statusText: data.statusText,
      description,
    },
  };
}

const resourceMap = {
  img: '图片',
  script: '脚本',
};
export function resourceTransform(target: ResourceErrorTarget): ReportDataType {
  return {
    type: ERRORTYPES.RESOURCE_ERROR,
    pageUrl: getLocationHref(),
    message: '资源地址: ' + (target.src || target.href),
    level: ERRORLEVEL.LOW,
    time: getTimestamp(),
    name: `${resourceMap[target.localName] || target.localName} failed to load`,
  };
}
