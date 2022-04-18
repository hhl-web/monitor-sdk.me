import { EVENTTYPES, MonitorHttp } from '@/common';
import { getSilent, setSilent, throttle } from 'utils';

import {
  replaceXhr,
  replaceFetch,
  replaceConsole,
  replaceListenError,
  replaceHashChange,
  replaceHistory,
  replaceDom,
  replaceUnhandlerejection,
  replaceVue,
} from './replaceModule';
import { _globalMonitor } from 'utils';
interface ModuleHandler {
  cb: cbType;
  type: EVENTTYPES;
}
export type cbType = (data: any) => void;
type ModuleHandlersType = {
  [key in EVENTTYPES]?: cbType[];
};
const moduleHandlers: ModuleHandlersType = {};

export const triggerModuleHandler = (type: EVENTTYPES, data: any): void => {
  if (!type || !moduleHandlers[type]) return;
  moduleHandlers[type].forEach((cb: cbType) => {
    try {
      cb(data);
    } catch (e: any) {
      // todo sdk错误日志收集
      console.log('发生错误', e);
    }
  });
};
export const throttleTriggerModuleHandler = throttle(triggerModuleHandler, 600);

export const replace = (type: EVENTTYPES) => {
  switch (type) {
    case EVENTTYPES.XHR:
      replaceXhr();
      break;
    case EVENTTYPES.FETCH:
      replaceFetch();
      break;
    case EVENTTYPES.CONSOLE:
      replaceConsole();
      break;
    case EVENTTYPES.ERROR:
      replaceListenError();
      break;
    case EVENTTYPES.HASHCHANGE:
      replaceHashChange();
      break;
    case EVENTTYPES.HISTORY:
      replaceHistory();
      break;
    case EVENTTYPES.DOM:
      replaceDom();
      break;
    case EVENTTYPES.UNHANDLEDREJECTION:
      replaceUnhandlerejection();
      break;
    case EVENTTYPES.VUE:
      replaceVue();
      break;
  }
};
export const addModuleHandler = (handler: ModuleHandler) => {
  const { cb, type } = handler;
  if (getSilent(type)) return;
  // setSilent(type,true)
  moduleHandlers[type] = moduleHandlers[type] || [];
  moduleHandlers[type].push(cb);
  replace(type);
};

console.log(moduleHandlers);
