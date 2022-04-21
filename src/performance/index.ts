import {MonitorOptions} from '@/types/monitor';
import {_globalThis,Queue,isSupportPerformanceObserver} from 'utils';
import {getResourceTime,getNetworkInfo,getPaintTime,getFID,getLCP,getCLS,getTTI} from './observer'
class PeforProcessor{
    private pageFlag:boolean;
    private resourceFlag:boolean;
    private queue: Queue;
    constructor(){
        this.queue =new Queue();
    }
    // 资源性能监控
    peforResource(){
        if(this.resourceFlag) return;
        if(!isSupportPerformanceObserver()) return;
        getResourceTime();
        getNetworkInfo();
    }
    // 页面性能
    perforPage(){
        if(this.pageFlag) return;
        if(!isSupportPerformanceObserver()) return;
        getPaintTime();
        getFID();
        getLCP();
        getCLS();
        getTTI()
    }

    bindOptions(options:MonitorOptions){
        const {slientPagePerformance,slientResourcePerformance } =options;
        this.pageFlag = slientPagePerformance || false;
        this.resourceFlag = slientResourcePerformance|| false;
    }
}

const perforProcessor =_globalThis._perforProcessor =new PeforProcessor();
export {perforProcessor};