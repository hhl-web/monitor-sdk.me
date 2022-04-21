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
      EVENTTYPES["PAGEPERFORMANCE"] = "pageperformance";
      EVENTTYPES["RESOURCEPERFORMANCE"] = "ResourcePerformance";
      EVENTTYPES["RESOURCEPERFOR"] = "resourceperfor";
      EVENTTYPES["PAGEPERFOR"] = "pageperfor";
      EVENTTYPES["CUSTOMER"] = "customer";
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
      ERRORTYPES["CUSTOMER_ERROR"] = "customer_error";
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
      setSilent(EVENTTYPES.DOM, !!opitons.silentDom);
      setSilent(EVENTTYPES.HISTORY, !!opitons.silentHistory);
      setSilent(EVENTTYPES.ERROR, !!opitons.silentError);
      setSilent(EVENTTYPES.HASHCHANGE, !!opitons.silentHashchange);
      setSilent(EVENTTYPES.UNHANDLEDREJECTION, !!opitons.silentUnhandledrejection);
      setSilent(EVENTTYPES.VUE, !!opitons.silentVue);
      setSilent(EVENTTYPES.PAGEPERFORMANCE, !!opitons.slientPagePerformance);
      setSilent(EVENTTYPES.RESOURCEPERFORMANCE, !!opitons.slientResourcePerformance);
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
      const html = path[0];
      const { nodeName, baseURI, attributes, outerHTML } = html;
      return {
          nodeName,
          baseURI,
          attributes,
          outerHTML,
      };
  };
  const isSupportPerformanceObserver = () => {
      return !!_globalThis.PerformanceObserver;
  };
  const getObserver = (type, cb) => {
      const perfObserver = new PerformanceObserver((entryList) => {
          cb(entryList.getEntries());
      });
      perfObserver.observe({ type, buffered: true });
  };
  let hiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;
  const scores = {
      fcp: [2000, 4000],
      lcp: [2500, 4500],
      fid: [100, 300],
      tbt: [300, 600],
      cls: [0.1, 0.25],
  };
  const scoreLevel = ['good', 'needsImprovement', 'poor'];
  const getScore = (type, data) => {
      const score = scores[type];
      for (let i = 0; i < score.length; i++) {
          if (data <= score[i])
              return scoreLevel[i];
      }
      return scoreLevel[2];
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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var ttiPolyfill$1 = {exports: {}};

  (function (module) {
  (function(){var h="undefined"!=typeof window&&window===this?this:"undefined"!=typeof commonjsGlobal&&null!=commonjsGlobal?commonjsGlobal:this,k="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value);};function l(){l=function(){};h.Symbol||(h.Symbol=m);}var n=0;function m(a){return "jscomp_symbol_"+(a||"")+n++}
  function p(){l();var a=h.Symbol.iterator;a||(a=h.Symbol.iterator=h.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&k(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return q(this)}});p=function(){};}function q(a){var b=0;return r(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})}function r(a){p();a={next:a};a[h.Symbol.iterator]=function(){return this};return a}function t(a){p();var b=a[Symbol.iterator];return b?b.call(a):q(a)}
  function u(a){if(!(a instanceof Array)){a=t(a);for(var b,c=[];!(b=a.next()).done;)c.push(b.value);a=c;}return a}var v=0;function w(a,b){var c=XMLHttpRequest.prototype.send,d=v++;XMLHttpRequest.prototype.send=function(f){for(var e=[],g=0;g<arguments.length;++g)e[g-0]=arguments[g];var E=this;a(d);this.addEventListener("readystatechange",function(){4===E.readyState&&b(d);});return c.apply(this,e)};}
  function x(a,b){var c=fetch;fetch=function(d){for(var f=[],e=0;e<arguments.length;++e)f[e-0]=arguments[e];return new Promise(function(d,e){var g=v++;a(g);c.apply(null,[].concat(u(f))).then(function(a){b(g);d(a);},function(a){b(a);e(a);});})};}var y="img script iframe link audio video source".split(" ");function z(a,b){a=t(a);for(var c=a.next();!c.done;c=a.next())if(c=c.value,b.includes(c.nodeName.toLowerCase())||z(c.children,b))return !0;return !1}
  function A(a){var b=new MutationObserver(function(c){c=t(c);for(var b=c.next();!b.done;b=c.next())b=b.value,"childList"==b.type&&z(b.addedNodes,y)?a(b):"attributes"==b.type&&y.includes(b.target.tagName.toLowerCase())&&a(b);});b.observe(document,{attributes:!0,childList:!0,subtree:!0,attributeFilter:["href","src"]});return b}
  function B(a,b){if(2<a.length)return performance.now();var c=[];b=t(b);for(var d=b.next();!d.done;d=b.next())d=d.value,c.push({timestamp:d.start,type:"requestStart"}),c.push({timestamp:d.end,type:"requestEnd"});b=t(a);for(d=b.next();!d.done;d=b.next())c.push({timestamp:d.value,type:"requestStart"});c.sort(function(a,b){return a.timestamp-b.timestamp});a=a.length;for(b=c.length-1;0<=b;b--)switch(d=c[b],d.type){case "requestStart":a--;break;case "requestEnd":a++;if(2<a)return d.timestamp;break;default:throw Error("Internal Error: This should never happen");
  }return 0}function C(a){a=a?a:{};this.w=!!a.useMutationObserver;this.u=a.minValue||null;a=window.__tti&&window.__tti.e;var b=window.__tti&&window.__tti.o;this.a=a?a.map(function(a){return {start:a.startTime,end:a.startTime+a.duration}}):[];b&&b.disconnect();this.b=[];this.f=new Map;this.j=null;this.v=-Infinity;this.i=!1;this.h=this.c=this.s=null;w(this.m.bind(this),this.l.bind(this));x(this.m.bind(this),this.l.bind(this));D(this);this.w&&(this.h=A(this.B.bind(this)));}
  C.prototype.getFirstConsistentlyInteractive=function(){var a=this;return new Promise(function(b){a.s=b;"complete"==document.readyState?F(a):window.addEventListener("load",function(){F(a);});})};function F(a){a.i=!0;var b=0<a.a.length?a.a[a.a.length-1].end:0,c=B(a.g,a.b);G(a,Math.max(c+5E3,b));}
  function G(a,b){!a.i||a.v>b||(clearTimeout(a.j),a.j=setTimeout(function(){var b=performance.timing.navigationStart,d=B(a.g,a.b),b=(window.a&&window.a.A?1E3*window.a.A().C-b:0)||performance.timing.domContentLoadedEventEnd-b;if(a.u)var f=a.u;else performance.timing.domContentLoadedEventEnd?(f=performance.timing,f=f.domContentLoadedEventEnd-f.navigationStart):f=null;var e=performance.now();null===f&&G(a,Math.max(d+5E3,e+1E3));var g=a.a;5E3>e-d?d=null:(d=g.length?g[g.length-1].end:b,d=5E3>e-d?null:Math.max(d,
  f));d&&(a.s(d),clearTimeout(a.j),a.i=!1,a.c&&a.c.disconnect(),a.h&&a.h.disconnect());G(a,performance.now()+1E3);},b-performance.now()),a.v=b);}
  function D(a){a.c=new PerformanceObserver(function(b){b=t(b.getEntries());for(var c=b.next();!c.done;c=b.next())if(c=c.value,"resource"===c.entryType&&(a.b.push({start:c.fetchStart,end:c.responseEnd}),G(a,B(a.g,a.b)+5E3)),"longtask"===c.entryType){var d=c.startTime+c.duration;a.a.push({start:c.startTime,end:d});G(a,d+5E3);}});a.c.observe({entryTypes:["longtask","resource"]});}C.prototype.m=function(a){this.f.set(a,performance.now());};C.prototype.l=function(a){this.f.delete(a);};
  C.prototype.B=function(){G(this,performance.now()+5E3);};h.Object.defineProperties(C.prototype,{g:{configurable:!0,enumerable:!0,get:function(){return [].concat(u(this.f.values()))}}});var H={getFirstConsistentlyInteractive:function(a){a=a?a:{};return "PerformanceLongTaskTiming"in window?(new C(a)).getFirstConsistentlyInteractive():Promise.resolve(null)}};
  module.exports?module.exports=H:window.ttiPolyfill=H;})();

  }(ttiPolyfill$1));

  var ttiPolyfill = ttiPolyfill$1.exports;

  let tbt = 0;
  const getResourceTime = () => {
      getObserver('resource', (entries) => {
          entries.forEach((entry) => {
              if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch')
                  return;
              console.log(entry);
              return transportData.xhrPost({
                  name: entry.name,
                  type: entry.entryType,
                  sourceType: entry.initiatorType,
                  dns: entry.domainLookupEnd - entry.domainLookupStart,
                  tcp: entry.connectEnd - entry.connectStart,
                  redirect: entry.redirectEnd - entry.redirectStart,
                  duration: entry.duration,
                  protocol: entry.nextHopProtocol,
                  responseHeaderSize: entry.transferSize - entry.encodedBodySize,
                  responseBodySize: entry.encodedBodySize,
              });
          });
      });
  };
  const getNetworkInfo = () => {
      if ('connection' in _globalThis.navigator) {
          const connection = _globalThis.navigator['connection'] || {};
          const { effectiveType, downlink, rtt, saveData } = connection;
          console.log(connection, '--connection');
          return {
              effectiveType,
              downlink,
              rtt,
              saveData,
          };
      }
      return {};
  };
  const getPaintTime = () => {
      getObserver('paint', (entries) => {
          entries.forEach((entry) => {
              const time = entry.startTime;
              const name = entry.name;
              if (name === 'first-contentful-paint') {
                  getLongTask(time);
                  console.log('FCP', {
                      time,
                      score: getScore('fcp', time),
                  });
              }
              else {
                  console.log('FP', {
                      time,
                  });
              }
          });
      });
  };
  const getFID = () => {
      getObserver('first-input', (entries) => {
          entries.forEach((entry) => {
              if (entry.startTime < hiddenTime) {
                  const time = entry.processingStart - entry.startTime;
                  console.log(entry, 'entryFID', getScore('fid', time));
                  console.log('FID', {
                      time,
                      score: getScore('fid', time),
                  });
                  console.log('TBT', {
                      time: tbt,
                      score: getScore('tbt', tbt),
                  });
              }
          });
      });
  };
  const getLCP = () => {
      getObserver('largest-contentful-paint', (entries) => {
          entries.forEach((entry) => {
              if (entry.startTime < hiddenTime) {
                  const { startTime, renderTime, size } = entry;
                  console.log('LCP Update', {
                      time: renderTime | startTime,
                      size,
                      score: getScore('lcp', renderTime | startTime),
                  });
              }
          });
      });
  };
  const getCLS = () => {
      getObserver('layout-shift', (entries) => {
          let value = 0;
          entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                  value += entry.value;
              }
          });
          console.log('CLS Update', {
              value,
              score: getScore('cls', value),
          });
      });
  };
  const getLongTask = (fcp) => {
      _globalThis.__tti = { e: [] };
      getObserver('longtask', (entries) => {
          _globalThis.__tti.e = _globalThis.__tti.e.concat(entries);
          entries.forEach((entry) => {
              if (entry.name !== 'self' || entry.startTime < fcp) {
                  return;
              }
              const blockingTime = entry.duration - 50;
              if (blockingTime > 0)
                  tbt += blockingTime;
          });
      });
  };
  const getTTI = () => {
      ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
          console.log('TTI', {
              value: tti,
          });
      });
  };

  class PeforProcessor {
      constructor() {
          this.queue = new Queue();
      }
      peforResource() {
          if (this.resourceFlag)
              return;
          if (!isSupportPerformanceObserver())
              return;
          getResourceTime();
          getNetworkInfo();
      }
      perforPage() {
          if (this.pageFlag)
              return;
          if (!isSupportPerformanceObserver())
              return;
          getPaintTime();
          getFID();
          getLCP();
          getCLS();
          getTTI();
      }
      bindOptions(options) {
          const { slientPagePerformance, slientResourcePerformance } = options;
          this.pageFlag = slientPagePerformance || false;
          this.resourceFlag = slientResourcePerformance || false;
      }
  }
  const perforProcessor = _globalThis._perforProcessor = new PeforProcessor();

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
      perforProcessor.perforPage();
      perforProcessor.peforResource();
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
          perforProcessor.bindOptions(this.monitorOpts);
      }
  }

  return Monitor;

})();
