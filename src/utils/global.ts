import {MonitorOptions} from '@/types/monitor';
import { EVENTTYPES } from '@/common'

export interface MonitorTypes{
   silentFlag:{[key in EVENTTYPES]?:boolean}
}

// 全局变量绑定 __MONITOR__属性
export const globalThisMonitor=()=>{
    _globalThis.__MONITOR__ = _globalThis.__MONITOR__ || ({} as MonitorTypes);
    return  _globalThis.__MONITOR__;
}
// 全局变量
const _globalThis =globalThis;
const _globalMonitor = globalThisMonitor();
export {_globalThis,_globalMonitor};

const _silentFlag =_globalMonitor.silentFlag = {};
export const setSilent=(slientType:EVENTTYPES,bool:boolean):void=>{
    if(_silentFlag[slientType]) return ;
    _silentFlag[slientType] = bool;
}

export const getSilent=(slientType:EVENTTYPES):boolean=>{
    return !!_silentFlag[slientType];
}

export const setSilentHandler =(opitons:MonitorOptions ={}):void=>{
    setSilent(EVENTTYPES.XHR, !!opitons.silentXhr)
    setSilent(EVENTTYPES.FETCH, !!opitons.silentFetch)
    setSilent(EVENTTYPES.CONSOLE, !!opitons.silentConsole)
    setSilent(EVENTTYPES.DOM, !!opitons.silentDom)
    setSilent(EVENTTYPES.HISTORY, !!opitons.silentHistory)
    setSilent(EVENTTYPES.ERROR, !!opitons.silentError)
    setSilent(EVENTTYPES.HASHCHANGE, !!opitons.silentHashchange)
    setSilent(EVENTTYPES.UNHANDLEDREJECTION, !!opitons.silentUnhandledrejection)
    setSilent(EVENTTYPES.VUE, !!opitons.silentVue)
}