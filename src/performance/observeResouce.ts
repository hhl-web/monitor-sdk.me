import {isSupportPerformanceObserver} from 'utils';
import { _globalThis } from 'utils';
import {transportData} from 'core'
export enum ENTRYTYPE{
    RESOURCE ="resource",
    NAVIGATION="navigation"
}

export const observeEvent =(entryType:ENTRYTYPE,)=>{
    const resourceHandler =(list:any)=>{
        const data = list.getEntries ? list.getEntries() : list
        for (const entry of data) {
            console.log(entry,'entry');
            // todo  排除那些资源不用上报
            return transportData.xhrPost({
                name:entry.name,
                sourceType:entry.initiatorType,
                dns: entry.domainLookupEnd - entry.domainLookupStart, // DNS 耗时
                tcp: entry.connectEnd - entry.connectStart, // 建立 tcp 连接耗时
                redirect: entry.redirectEnd - entry.redirectStart, // 重定向耗时
                duration: entry.duration, // 资源加载耗时
                protocol: entry.nextHopProtocol, // 请求协议
                responseHeaderSize: entry.transferSize - entry.encodedBodySize, // 响应头部大小
                responseBodySize: entry.encodedBodySize, // 响应内容大小
            })
        }
    }
    let observer:PerformanceObserver;
    if(isSupportPerformanceObserver()){
        observer = new PerformanceObserver(resourceHandler)
        observer.observe({ type: entryType, buffered: true })
    }else{
        const data = _globalThis.performance.getEntriesByType(entryType);
        resourceHandler(data)
    }
}
