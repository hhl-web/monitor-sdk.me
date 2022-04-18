var Monitor = (function () {
  'use strict';

  var EVENTTYPES;
  (function (EVENTTYPES) {
      EVENTTYPES["XHR"] = "xhr";
      EVENTTYPES["FETCH"] = "fetch";
      EVENTTYPES["CONSOLE"] = "console";
      EVENTTYPES["DOM"] = "dom";
      EVENTTYPES["HISTORY"] = "history";
      EVENTTYPES["ERROR"] = "error";
      EVENTTYPES["HASHCHANGE"] = "hashchange";
      EVENTTYPES["UNHANDLEDREJECTION"] = "unhandledrejection";
      EVENTTYPES["VUE"] = "Vue";
  })(EVENTTYPES || (EVENTTYPES = {}));
  var ERRORLEVEL;
  (function (ERRORLEVEL) {
      ERRORLEVEL[ERRORLEVEL["CRITICAL"] = 1] = "CRITICAL";
      ERRORLEVEL[ERRORLEVEL["HIGH"] = 2] = "HIGH";
      ERRORLEVEL[ERRORLEVEL["NORMAL"] = 3] = "NORMAL";
      ERRORLEVEL[ERRORLEVEL["LOW"] = 4] = "LOW";
  })(ERRORLEVEL || (ERRORLEVEL = {}));
  var HTTPTYPE;
  (function (HTTPTYPE) {
      HTTPTYPE["XHR"] = "xhr";
      HTTPTYPE["FETCH"] = "fetch";
  })(HTTPTYPE || (HTTPTYPE = {}));
  var ERRORTYPES;
  (function (ERRORTYPES) {
      ERRORTYPES["HTTPERROR"] = "http_error";
      ERRORTYPES["BUSSIONERROR"] = "bussion_error";
      ERRORTYPES["JAVASCRIPT_ERROR"] = "javascript_error";
      ERRORTYPES["RESOURCE_ERROR"] = "resource_error";
      ERRORTYPES["PROMISE_ERROR"] = "promise_error";
  })(ERRORTYPES || (ERRORTYPES = {}));

  const globalThisMonitor = () => {
      _globalThis.__MONITOR__ = _globalThis.__MONITOR__ || {};
      return _globalThis.__MONITOR__;
  };
  const _globalThis = globalThis;
  const _globalMonitor = globalThisMonitor();
  const _silentFlag = _globalMonitor.silentFlag = {};
  const setSilent = (slientType, bool) => {
      if (_silentFlag[slientType])
          return;
      _silentFlag[slientType] = bool;
  };
  const getSilent = (slientType) => {
      return !!_silentFlag[slientType];
  };
  const setSilentHandler = (opitons = {}) => {
      setSilent(EVENTTYPES.XHR, !!opitons.silentXhr);
      setSilent(EVENTTYPES.FETCH, !!opitons.silentFetch);
      setSilent(EVENTTYPES.CONSOLE, !!opitons.silentConsole);
      setSilent(EVENTTYPES.DOM, !!opitons.silentDom);
      setSilent(EVENTTYPES.HISTORY, !!opitons.silentHistory);
      setSilent(EVENTTYPES.ERROR, !!opitons.silentError);
      setSilent(EVENTTYPES.HASHCHANGE, !!opitons.silentHashchange);
      setSilent(EVENTTYPES.UNHANDLEDREJECTION, !!opitons.silentUnhandledrejection);
      setSilent(EVENTTYPES.VUE, !!opitons.silentVue);
  };

  const replaceOld = (source, name, replaceFn) => {
      if (!(name in source))
          return;
      const original = source[name];
      const wapper = replaceFn(original);
      if (typeof wapper === 'function') {
          source[name] = wapper;
      }
  };
  const isString = (str) => {
      return typeof str === 'string';
  };
  const getTimestamp = () => {
      return Date.now();
  };
  const on = (target, eventName, handler, opitons = false) => {
      target.addEventListener(eventName, handler, opitons);
  };
  const splitObjToQuery = (data) => {
      if (!data)
          return;
      return Object.entries(data).reduce((result, [key, value], index) => {
          if (index !== 0) {
              result += '&';
          }
          result += `${key}=${value}`;
          return result;
      }, '');
  };
  const getLocationHref = () => {
      if (typeof document === 'undefined' || document.location == null)
          return '';
      return document.location.href;
  };
  const throttle = (fn, warting, isFirst) => {
      let isImmediate = isFirst;
      let exceDate = +new Date();
      let timer = null;
      const _throttle = (...args) => {
          if (isImmediate) {
              fn.apply(fn, args);
              isImmediate = false;
              exceDate = +new Date();
          }
          else {
              const curDate = +new Date();
              if (curDate - exceDate >= warting) {
                  fn.apply(fn, args);
                  exceDate = +new Date();
              }
              else {
                  timer && clearTimeout(timer);
                  const delay = warting - (+new Date() - exceDate);
                  timer = setTimeout(() => {
                      fn.apply(fn, args);
                      exceDate = +new Date();
                  }, delay);
              }
          }
      };
      _throttle.cancel = () => {
          timer = null;
          clearTimeout(null);
          exceDate = 0;
      };
      return _throttle;
  };
  const htmlPathAsInfo = (path) => {
      console.log(path);
      const html = path[0];
      const { nodeName, baseURI, attributes, outerHTML } = html;
      return {
          nodeName,
          baseURI,
          attributes,
          outerHTML,
      };
  };

  class Queue {
      constructor() {
          this.stack = [];
          this.isFlushing = false;
          this.micro = Promise.resolve();
      }
      addFn(handler) {
          if (typeof handler !== 'function')
              return;
          this.stack.push(handler);
          if (this.isFlushing)
              return;
          this.isFlushing = true;
          this.micro.then(() => this.flushStack());
      }
      flushStack() {
          const temp = this.stack.slice(0);
          this.stack.length = 0;
          this.isFlushing = false;
          for (let i = 0; i < temp.length; i++) {
              temp[i]();
          }
      }
  }

  const replaceXhr = () => {
      if (!('XMLHttpRequest' in _globalThis))
          return;
      const originalXhrProto = XMLHttpRequest.prototype;
      replaceOld(originalXhrProto, 'open', (originalOpen) => {
          return function (...args) {
              const url = args[1];
              this.monitor_xhr = {
                  method: isString(args[0]) ? args[0].toUpperCase() : args[0],
                  url: args[1],
                  sTime: getTimestamp(),
                  type: HTTPTYPE.XHR,
              };
              if (this.monitor_xhr.method === 'POST' && transportData.isSdkTransportUrl(url)) {
                  this.monitor_xhr.isSdkUrl = true;
              }
              originalOpen.apply(this, args);
          };
      });
      replaceOld(originalXhrProto, 'send', (originalSend) => {
          return function (...args) {
              on(this, 'loadend', function () {
                  if (this.monitor_xhr?.isSdkUrl)
                      return;
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
  const replaceFetch = () => {
      if (!('fetch' in _globalThis))
          return;
      replaceOld(_globalThis, EVENTTYPES.FETCH, (originalFetch) => {
          return function (url, config) {
              const sTime = getTimestamp();
              originalFetch
                  .apply(_globalThis, [url, config])
                  .then((res) => {
                  console.log(res, '----');
                  const eTime = getTimestamp();
                  const tempRes = res.clone();
                  const handlerData = {
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
                  .catch((err) => {
                  const eTime = getTimestamp();
                  const handlerData = {
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
  const replaceListenError = () => {
      on(_globalThis, 'error', function (e) {
          triggerModuleHandler(EVENTTYPES.ERROR, e);
      }, true);
  };
  const replaceHashChange = () => {
      if (_globalThis.hasOwnProperty('onpopstate'))
          return;
      on(_globalThis, EVENTTYPES.HASHCHANGE, function (ev) {
          triggerModuleHandler(EVENTTYPES.HASHCHANGE, ev);
      }, false);
  };
  let lastHref;
  lastHref = getLocationHref();
  const replaceHistory = () => {
      const historyReplaceFn = (originPopstate) => {
          return function (...args) {
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
      on(_globalThis, 'click', function (ev) {
          const dom = ev.target;
          if (dom.tagName.toUpperCase() === 'A' && dom.getAttribute('href')) {
              ev.preventDefault();
              const to = dom.getAttribute('href');
              triggerModuleHandler(EVENTTYPES.HISTORY, {
                  to: to,
                  from: lastHref,
              });
              lastHref = to;
          }
      }, false);
  };
  const replaceDom = () => {
      if (!('document' in _globalThis))
          return;
      on(_globalThis.document, 'click', function (ev) {
          throttleTriggerModuleHandler(EVENTTYPES.DOM, ev);
      }, false);
  };
  const replaceUnhandlerejection = () => {
      on(_globalThis, EVENTTYPES.UNHANDLEDREJECTION, function (ev) {
          triggerModuleHandler(EVENTTYPES.UNHANDLEDREJECTION, ev);
      });
  };

  const moduleHandlers = {};
  const triggerModuleHandler = (type, data) => {
      if (!type || !moduleHandlers[type])
          return;
      moduleHandlers[type].forEach((cb) => {
          try {
              cb(data);
          }
          catch (e) {
              console.log('发生错误', e);
          }
      });
  };
  const throttleTriggerModuleHandler = throttle(triggerModuleHandler, 600);
  const replace = (type) => {
      switch (type) {
          case EVENTTYPES.XHR:
              replaceXhr();
              break;
          case EVENTTYPES.FETCH:
              replaceFetch();
              break;
          case EVENTTYPES.CONSOLE:
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
              break;
      }
  };
  const addModuleHandler = (handler) => {
      const { cb, type } = handler;
      if (getSilent(type))
          return;
      moduleHandlers[type] = moduleHandlers[type] || [];
      moduleHandlers[type].push(cb);
      replace(type);
  };
  console.log(moduleHandlers);

  const handleEvents = {
      handleHttp(data, timeout) {
          const isError = data.status >= 400 || data.status === 0 || (timeout && data.elapsedTime >= timeout);
          if (isError) {
              const result = httpTransform(data);
              transportData.xhrPost(result);
          }
      },
      handleError(errorEvent) {
          const target = errorEvent.target;
          if (target.localName) {
              const result = resourceTransform(target);
              return transportData.xhrPost(result);
          }
          const { message, filename, lineno, colno, error } = errorEvent;
          console.log(error);
          const url = filename || getLocationHref();
          let result = {
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
      handleUnhandlerejection(errorEvent) {
          let result = {
              type: ERRORTYPES.PROMISE_ERROR,
              message: JSON.stringify(errorEvent.reason),
              pageUrl: getLocationHref(),
              name: errorEvent.type,
              time: getTimestamp(),
              level: ERRORLEVEL.NORMAL,
          };
          transportData.xhrPost(result);
      },
      handleDom(event) {
          const { path } = event;
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
      handleHashchange(event) {
          const { newURL, oldURL } = event;
          console.log(newURL, oldURL);
      },
      handleHistory(data) {
          console.log(data);
      },
  };

  function httpTransform(data) {
      let description = data.responseText;
      if (data.status === 0) {
          description = data.elapsedTime <= 1000 ? '接口失败原因为:跨域' : '接口失败原因为:超时';
      }
      else {
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
  function resourceTransform(target) {
      return {
          type: ERRORTYPES.RESOURCE_ERROR,
          pageUrl: getLocationHref(),
          message: '资源地址: ' + (target.src || target.href),
          level: ERRORLEVEL.LOW,
          time: getTimestamp(),
          name: `${resourceMap[target.localName] || target.localName} failed to load`,
      };
  }

  const SERVER_URL = 'http://localhost:3009/api/error/error.gif';

  class TransportData {
      constructor(url) {
          this.url = url;
          this.apiKey = '';
          this.beforeSend = null;
          this.configXhr = null;
          this.queue = new Queue();
      }
      imgPort(data) {
          TransportData.img.src = `${this.url}?${splitObjToQuery(data)}`;
      }
      xhrPost(data) {
          const handler = () => {
              if (typeof XMLHttpRequest === 'undefined')
                  return;
              if (typeof this.beforeSend === 'function') {
                  data = this.beforeSend(data);
                  if (!data)
                      return;
              }
              const xhr = new XMLHttpRequest();
              xhr.open('POST', this.url);
              xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
              if (typeof this.configXhr === 'function') {
                  this.configXhr(xhr);
              }
              xhr.send(JSON.stringify(this.getTransportData(data)));
              xhr.addEventListener('loadend', function () {
                  console.log(this, 111);
              });
              console.log(xhr);
          };
          this.queue.addFn(handler);
      }
      getTransportData(data) {
          return {
              authInfo: {
                  apikey: this.apiKey,
              },
              data,
          };
      }
      isSdkTransportUrl(url) {
          return url.includes(this.url);
      }
      bindOptions(options) {
          this.apiKey = options.apikey;
      }
  }
  TransportData.img = new Image();
  const transportData = new TransportData(SERVER_URL);

  const loadModule = (timeout) => {
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleHttp(data, timeout);
          },
          type: EVENTTYPES.XHR,
      });
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleHttp(data);
          },
          type: EVENTTYPES.FETCH,
      });
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleError(data);
          },
          type: EVENTTYPES.ERROR,
      });
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleDom(data);
          },
          type: EVENTTYPES.DOM,
      });
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleHashchange(data);
          },
          type: EVENTTYPES.HASHCHANGE,
      });
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleHistory(data);
          },
          type: EVENTTYPES.HISTORY,
      });
      addModuleHandler({
          cb: (data) => {
              handleEvents.handleUnhandlerejection(data);
          },
          type: EVENTTYPES.UNHANDLEDREJECTION,
      });
      addModuleHandler({
          cb: (data) => { },
          type: EVENTTYPES.VUE,
      });
  };

  class Monitor {
      constructor(options = {}) {
          this.monitorOpts = {};
          this.monitorOpts = options;
          this.init();
      }
      init() {
          if (this.monitorOpts.disabled)
              return;
          this.bindOptions();
          loadModule(this.monitorOpts.timeout);
      }
      bindOptions() {
          setSilentHandler(this.monitorOpts);
          transportData.bindOptions(this.monitorOpts);
      }
  }

  return Monitor;

})();
