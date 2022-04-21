import {getObserver,getScore,hiddenTime,_globalThis} from 'utils'
import ttiPolyfill from 'tti-polyfill';
import {transportData} from 'core'
import { ERRORTYPES, EVENTTYPES } from '@/common';
let tbt = 0

// 资源性能上报
export const getResourceTime = () => {
  getObserver('resource', (entries) => {
    entries.forEach((entry) => {
      // todo 什么资源不上报
      if(entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') return;
      console.log(entry);
      return transportData.xhrPost({
          name:entry.name,
          type:entry.entryType,
          sourceType:entry.initiatorType,
          dns: entry.domainLookupEnd - entry.domainLookupStart, // DNS 耗时
          tcp: entry.connectEnd - entry.connectStart, // 建立 tcp 连接耗时
          redirect: entry.redirectEnd - entry.redirectStart, // 重定向耗时
          duration: entry.duration, // 资源加载耗时
          protocol: entry.nextHopProtocol, // 请求协议
          responseHeaderSize: entry.transferSize - entry.encodedBodySize, // 响应头部大小
          responseBodySize: entry.encodedBodySize, // 响应内容大小
      });
    })
  })
}
// 网络信息 todo设备信息
export const getNetworkInfo = () => {
  if ('connection' in _globalThis.navigator) {
    const connection = _globalThis.navigator['connection'] || {}
    const { effectiveType, downlink, rtt, saveData } :any= connection
    console.log(connection,'--connection')
    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
    }
  }
  return {}
}
// fp & fcp
export const getPaintTime = () => {
  getObserver('paint', (entries) => {
    entries.forEach((entry) => {
      const time = entry.startTime
      const name = entry.name;
      // todo 将差的性能指标上报
      if (name === 'first-contentful-paint') {
        getLongTask(time);
        console.log('FCP',{
            time,
            score: getScore('fcp', time),
        })
      } else {
        console.log('FP',{
            time,
           
        })
      }
    })
  })
}

export const getFID = () => {
  getObserver('first-input', (entries) => {
    entries.forEach((entry) => {
      if (entry.startTime < hiddenTime) {
        const time = entry.processingStart - entry.startTime
        console.log(entry,'entryFID',getScore('fid', time));
        // todo 将差的性能指标上报
        console.log('FID', {
          time,
          score: getScore('fid', time),
        })
        // TBT is in fcp -> tti
        // This data may be inaccurate, because fid >= tti
        console.log('TBT', {
          time: tbt,
          score: getScore('tbt', tbt),
        })
      }
    })
  })
}
// lcp
export const getLCP = () => {
  getObserver('largest-contentful-paint', (entries) => {
    entries.forEach((entry) => {
      if (entry.startTime < hiddenTime) {
        const { startTime, renderTime, size } = entry
        console.log('LCP Update', {
          time: renderTime | startTime,
          size,
          score: getScore('lcp', renderTime | startTime),
        })
      }
    })
  })
}

export const getCLS = () => {
  getObserver('layout-shift', (entries) => {
    let value = 0
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        value += entry.value
      }
    })
    console.log('CLS Update', {
      value,
      score: getScore('cls', value),
    })
  })
}

export const getLongTask = (fcp: number) => {
  _globalThis.__tti = { e: [] }
  getObserver('longtask', (entries) => {
    _globalThis.__tti.e = _globalThis.__tti.e.concat(entries)
    entries.forEach((entry) => {
      if (entry.name !== 'self' || entry.startTime < fcp) {
        return
      }
      // long tasks mean time over 50ms
      const blockingTime = entry.duration - 50
      if (blockingTime > 0) tbt += blockingTime
    })
  })
}

export const getTTI = () => {
  ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
    console.log('TTI', {
      value: tti,
    })
  })
}
