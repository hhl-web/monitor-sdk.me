import { addModuleHandler, handleEvents } from 'core';
import { EVENTTYPES } from '@/common';
import { perforProcessor } from 'performance';
export const loadModule = (timeout?: number): void => {
  // xhr
  addModuleHandler({
    cb: (data: any): void => {
      handleEvents.handleHttp(data, timeout);
    },
    type: EVENTTYPES.XHR,
  });
  // fetch
  addModuleHandler({
    cb: (data: any): void => {
      handleEvents.handleHttp(data);
    },
    type: EVENTTYPES.FETCH,
  });
  // errors
  addModuleHandler({
    cb: (data: any) => {
      handleEvents.handleError(data);
    },
    type: EVENTTYPES.ERROR,
  });
  // dom
  addModuleHandler({
    cb: (data: any) => {
      handleEvents.handleDom(data);
    },
    type: EVENTTYPES.DOM,
  });
  // hashChange
  addModuleHandler({
    cb: (data: any) => {
      handleEvents.handleHashchange(data);
    },
    type: EVENTTYPES.HASHCHANGE,
  });
  // history
  addModuleHandler({
    cb: (data: any) => {
      handleEvents.handleHistory(data);
    },
    type: EVENTTYPES.HISTORY,
  });
  // unhandleRejection
  addModuleHandler({
    cb: (data: any) => {
      handleEvents.handleUnhandlerejection(data);
    },
    type: EVENTTYPES.UNHANDLEDREJECTION,
  });
  // vue
  addModuleHandler({
    cb: (data: any) => {},
    type: EVENTTYPES.VUE,
  });
  // 性能监控
  perforProcessor.perforPage();
  perforProcessor.peforResource();
};
