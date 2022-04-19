import {getObserver,getScore,hiddenTime,_globalThis} from 'utils'
import ttiPolyfill from 'tti-polyfill';
import {transportData} from 'core'
let tbt = 0

export const getResourceTime = () => {
  getObserver('resource', (entries) => {
    entries.forEach((entry) => {
      const data =entry.getEntries();
      console.log(data);
      // todo 什么资源不上报
      return transportData.xhrPost({});
    })
  })
}

export const getNetworkInfo = () => {
  if ('connection' in _globalThis.navigator) {
    const connection = _globalThis.navigator['connection'] || {}
    const { effectiveType, downlink, rtt, saveData } :any= connection
    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
    }
  }
  return {}
}

export const getPaintTime = () => {
  getObserver('paint', (entries) => {
    entries.forEach((entry) => {
      const time = entry.startTime
      const name = entry.name
      if (name === 'first-contentful-paint') {
        getLongTask(time);
        console.log('FCP',{
            time,
            score: getScore('fcp', time),
        })
      } else {
        console.log('FCP',{
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
      // get long task time in fcp -> tti
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
