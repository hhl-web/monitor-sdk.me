import { EVENTTYPES, VoidFn, HTTPTYPE, MonitorHttp } from '@/common';
import { cbType, triggerModuleHandler, transportData, throttleTriggerModuleHandler } from 'core';
import { _globalThis, isString, getTimestamp, replaceOld, on, getLocationHref } from 'utils';

export interface MonitorXMLHttpRequest extends XMLHttpRequest {
  [key: string]: any;
  monitor_xhr: MonitorHttp;
}
// xhr
export const replaceXhr = (): void => {
  if (!('XMLHttpRequest' in _globalThis)) return;
  const originalXhrProto = XMLHttpRequest.prototype;
  replaceOld(originalXhrProto, 'open', (originalOpen: VoidFn): VoidFn => {
    return function (this: MonitorXMLHttpRequest, ...args: any[]): void {
      const url = args[1];
      this.monitor_xhr = {
        method: isString(args[0]) ? args[0].toUpperCase() : args[0],
        url: args[1],
        sTime: getTimestamp(),
        type: HTTPTYPE.XHR,
      };
      //  todo 判断是否是监控本身的请求，需要做标记，不发送请求
      if (this.monitor_xhr.method === 'POST' && transportData.isSdkTransportUrl(url)) {
        this.monitor_xhr.isSdkUrl = true;
      }
      originalOpen.apply(this, args);
    };
  });
  replaceOld(originalXhrProto, 'send', (originalSend: VoidFn): VoidFn => {
    return function (this: MonitorXMLHttpRequest, ...args: any[]): void {
      on(this, 'loadend', function (this: MonitorXMLHttpRequest) {
        if (this.monitor_xhr?.isSdkUrl) return;
        this.monitor_xhr.reqData = args[0];
        this.monitor_xhr.eTime = getTimestamp();
        this.monitor_xhr.status = this.status;
        this.monitor_xhr.statusText = this.statusText;
        this.monitor_xhr.responseText = this.responseText;
        this.monitor_xhr.elapsedTime = this.monitor_xhr.eTime - this.monitor_xhr.sTime;

        triggerModuleHandler(EVENTTYPES.XHR, this.monitor_xhr);
      });
      originalSend.apply(this, args);
    };
  });
};
// fetch
export const replaceFetch = (): void => {
  if (!('fetch' in _globalThis)) return;
  replaceOld(_globalThis, EVENTTYPES.FETCH, (originalFetch: VoidFn) => {
    return function (url: string, config: Request): void {
      const sTime = getTimestamp();
      originalFetch
        .apply(_globalThis, [url, config])
        .then((res: Response) => {
          console.log(res, '----');
          const eTime = getTimestamp();
          const tempRes = res.clone();
          const handlerData: MonitorHttp = {
            eTime,
            sTime,
            url,
            method: (config && config.method) || 'GET',
            type: HTTPTYPE.FETCH,
            status: tempRes.status,
            statusText: tempRes.statusText,
            elapsedTime: eTime - sTime,
          };
          tempRes.text().then((data) => {
            handlerData.responseText = data;
            triggerModuleHandler(EVENTTYPES.FETCH, handlerData);
          });
        })
        .catch((err: Error) => {
          const eTime = getTimestamp();
          const handlerData: MonitorHttp = {
            eTime,
            sTime,
            url,
            method: (config && config.method) || 'GET',
            type: HTTPTYPE.FETCH,
            status: 0,
            statusText: err.name + err.message,
            elapsedTime: eTime - sTime,
          };
          triggerModuleHandler(EVENTTYPES.FETCH, handlerData);
          throw err;
        });
    };
  });
};
// console
export const replaceConsole = (): void => {
  // if (!('console' in _globalThis)) return;
  // const types = ['assert', 'log', 'warn', 'debug', 'error', 'info'];
  // types.forEach((type: string): void => {
  //   if (!(type in _globalThis.console)) return;
  //   replaceOld(_globalThis.console, type, (originalConsole: () => any): Function => {
  //     return function (...args: any[]): void {
  //       if (originalConsole) {
  //         triggerModuleHandler(EVENTTYPES.CONSOLE, { args, level: type });
  //         originalConsole.apply(_globalThis.console, args);
  //       }
  //     };
  //   });
  // });
};
// error
export const replaceListenError = (): void => {
  on(
    _globalThis,
    'error',
    function (e: Error) {
      triggerModuleHandler(EVENTTYPES.ERROR, e);
    },
    true,
  );
};
// hashChange
export const replaceHashChange = (): void => {
  if (_globalThis.hasOwnProperty('onpopstate')) return;
  on(
    _globalThis,
    EVENTTYPES.HASHCHANGE,
    function (ev: HashChangeEvent) {
      triggerModuleHandler(EVENTTYPES.HASHCHANGE, ev);
    },
    false,
  );
};
// history
let lastHref: string;
lastHref = getLocationHref();
export const replaceHistory = (): void => {
  // 重写 onpopstate事件 ,pushState ,replaceState方法
  const historyReplaceFn = (originPopstate: VoidFn) => {
    return function (this: WindowEventHandlers, ...args: any[]): void {
      const to = getLocationHref();
      const from = lastHref;
      lastHref = to;
      triggerModuleHandler(EVENTTYPES.HISTORY, {
        to,
        from,
      });
      originPopstate && originPopstate.apply(this, args);
    };
  };
  replaceOld(_globalThis, 'popstate', historyReplaceFn);
  replaceOld(_globalThis.history, 'pushState', historyReplaceFn);
  replaceOld(_globalThis.history, 'replaceState', historyReplaceFn);
  on(
    _globalThis,
    'click',
    function (ev: Event) {
      const dom: any = ev.target;
      if (dom.tagName.toUpperCase() === 'A' && dom.getAttribute('href')) {
        ev.preventDefault();
        const to = dom.getAttribute('href');
        triggerModuleHandler(EVENTTYPES.HISTORY, {
          to: to,
          from: lastHref,
        });
        lastHref = to;
      }
    },
    false,
  );
};
// dom
export const replaceDom = (): void => {
  if (!('document' in _globalThis)) return;
  on(
    _globalThis.document,
    'click',
    function (ev: Event) {
      throttleTriggerModuleHandler(EVENTTYPES.DOM, ev);
    },
    false,
  );
  // 不需要事件监听的重写
  // const proto = EventTarget && EventTarget.prototype;
  // if (!proto || !proto.hasOwnProperty || !proto.hasOwnProperty('addEventListener')) return;
  // replaceOld(proto, 'addEventListener', (originalProto: VoidFn): Function => {
  //   return function (eventName: string, fn: EventListenerOrEventListenerObject, opitons?: boolean | AddEventListenerOptions) {
  //     const wrapperListener = (...args) => {
  //       console.log(this, '------ttt');
  //       // triggerModuleHandler(EVENTTYPES.DOM, this);
  //       (fn as Function).apply(this, args);
  //       try {
  //       } catch (err) {
  //         console.log(err);
  //       }
  //     };
  //     originalProto.call(this, eventName, wrapperListener, opitons);
  //   };
  // });
};
// unhandlerejection
export const replaceUnhandlerejection = (): void => {
  on(_globalThis, EVENTTYPES.UNHANDLEDREJECTION, function (ev: PromiseRejectionEvent) {
    triggerModuleHandler(EVENTTYPES.UNHANDLEDREJECTION, ev);
  });
};
export const replaceVue = () => {};
