import { ERRORTYPES, MonitorHttp, ERRORLEVEL } from '@/common';
import { httpTransform, transportData, resourceTransform } from 'core';
import { ReportDataType } from '@/types/transportData';
import { getLocationHref, getTimestamp, htmlPathAsInfo } from 'utils';
export interface ResourceErrorTarget {
  src?: string;
  href?: string;
  localName?: string;
}
export const handleEvents = {
  handleHttp(data: MonitorHttp, timeout?: number) {
    // 1 接口自身错误，跨域，超时等问题
    // 2 todo接口没有问题就不上报？可以自定义接口超时时间，接口响应超过某个限定值就可以上报。(反应接口慢的问题)
    const isError = data.status >= 400 || data.status === 0 || (timeout && data.elapsedTime >= timeout); //接口错误 （包含超时）
    if (isError) {
      //todo  接口错误上报
      const result = httpTransform(data);
      transportData.xhrPost(result);
    }
  },
  handleError(errorEvent: ErrorEvent) {
    const target = errorEvent.target as ResourceErrorTarget;
    // 资源加载错误
    if (target.localName) {
      const result = resourceTransform(target);
      return transportData.xhrPost(result);
    }
    // js code error
    const { message, filename, lineno, colno, error } = errorEvent;
    console.log(error);
    const url = filename || getLocationHref();
    let result: ReportDataType = {
      type: ERRORTYPES.JAVASCRIPT_ERROR,
      message,
      pageUrl: url,
      level: ERRORLEVEL.HIGH,
      time: getTimestamp(),
      stack: {
        line: lineno,
        col: colno,
        url,
      },
    };
    transportData.xhrPost(result);
  },
  handleUnhandlerejection(errorEvent: PromiseRejectionEvent) {
    let result: ReportDataType = {
      type: ERRORTYPES.PROMISE_ERROR,
      message: JSON.stringify(errorEvent.reason),
      pageUrl: getLocationHref(),
      name: errorEvent.type,
      time: getTimestamp(),
      level: ERRORLEVEL.NORMAL,
    };
    transportData.xhrPost(result);
  },
  handleDom(event: PointerEvent) {
    const { path }: any = event;
    const data = htmlPathAsInfo(path);
    console.log(data, '---');

    let result = {
      message: '埋点',
      pageUrl: getLocationHref(),
      time: getTimestamp(),
      level: ERRORLEVEL.NORMAL,
      stack: data,
    };
    transportData.xhrPost(result);
  },
  handleHashchange(event: HashChangeEvent) {
    const { newURL, oldURL } = event;
    console.log(newURL, oldURL);
  },
  handleHistory(data: { to: string; from: string }) {
    console.log(data);
  },
};
