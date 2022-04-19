import { VoidFn,IPerCallback } from '@/common';
import { _globalThis } from './global';
export const replaceOld = (
  source: {
    [key: string]: any;
  },
  name: string,
  replaceFn: (...args: any[]) => any,
): void => {
  if (!(name in source)) return;
  const original = source[name];
  const wapper = replaceFn(original);
  if (typeof wapper === 'function') {
    source[name] = wapper;
  }
};

export const isString = (str: any): boolean => {
  return typeof str === 'string';
};

export const getTimestamp = (): number => {
  return Date.now();
};

export const on = (
  target: { addEventListener?: Function },
  eventName: string,
  handler: Function,
  opitons: boolean | unknown = false,
): void => {
  target.addEventListener(eventName, handler, opitons);
};

/**
 *
 * @param data
 *  Object.entries()方法返回一个给定对象自身可枚举属性的键值对数组,其排列与使用 for...in
 * 循环遍历该对象时返回的顺序一致（区别在于 for-in 循环还会枚举原型链中的属性）。
 * @returns
 */
export const splitObjToQuery = (data: Record<string, unknown>) => {
  if (!data) return;
  return Object.entries(data).reduce((result, [key, value], index) => {
    if (index !== 0) {
      result += '&';
    }
    result += `${key}=${value}`;
    return result;
  }, '');
};

export const getLocationHref = () => {
  if (typeof document === 'undefined' || document.location == null) return '';
  return document.location.href;
};

//防抖
export const debouce = (fn: VoidFn, delay: number, isFirst?: boolean) => {
  let timer = null;
  let isImmediate = isFirst || false;
  const _debouce = (...args: any[]) => {
    if (isImmediate) {
      fn.apply(fn, args);
      isImmediate = false;
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(fn, args);
      timer = null;
    }, delay);
  };
  _debouce.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return _debouce;
};

// 节流
export const throttle = (fn: Function, warting: number, isFirst?: boolean) => {
  let isImmediate = isFirst;
  let exceDate = +new Date();
  let timer = null;
  const _throttle = (...args: any[]) => {
    if (isImmediate) {
      fn.apply(fn, args);
      isImmediate = false;
      exceDate = +new Date();
    } else {
      const curDate = +new Date();
      if (curDate - exceDate >= warting) {
        fn.apply(fn, args);
        exceDate = +new Date();
      } else {
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

export const htmlPathAsInfo = (path: any[]) => {
  const html: HTMLElement = path[0];
  const { nodeName, baseURI, attributes, outerHTML } = html;
  return {
    nodeName,
    baseURI,
    attributes,
    outerHTML,
  };
};

export const isSupportPerformanceObserver=():boolean=>{
  return !!_globalThis.PerformanceObserver;
}

export const getObserver = (type: string, cb: IPerCallback) => {
  const perfObserver = new PerformanceObserver((entryList) => {
    cb(entryList.getEntries())
  })
  perfObserver.observe({ type, buffered: true })
}
export let hiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity

export const scores: Record<string, number[]> = {
  fcp: [2000, 4000],
  lcp: [2500, 4500],
  fid: [100, 300],
  tbt: [300, 600],
  cls: [0.1, 0.25],
}

export const scoreLevel = ['good', 'needsImprovement', 'poor']

export const getScore = (type: string, data: number) => {
  const score = scores[type]
  for (let i = 0; i < score.length; i++) {
    if (data <= score[i]) return scoreLevel[i]
  }

  return scoreLevel[2]
}
// 加载完毕
export const executeAfterLoad =(cb:VoidFn):void=>{
  if (document.readyState === 'complete') {
    cb();
} else {
    const onLoad = () => {
      cb()
        _globalThis.removeEventListener('load', onLoad, true)
    }
    _globalThis.addEventListener('load', onLoad, true)
  }
}