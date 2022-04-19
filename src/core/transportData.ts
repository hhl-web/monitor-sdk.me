import { Queue, splitObjToQuery } from 'utils';
import { MonitorHttp } from '@/common';
import { SERVER_URL } from '@/config';
import { ReportDataType, TransportDataType } from '@/types/transportData';
import { MonitorOptions } from '@/types/monitor';
class TransportData {
  static img = new Image();
  private queue: Queue;
  private apiKey = '';
  private beforeSend: unknown = null;
  private configXhr: unknown = null;
  constructor(private url: string) {
    this.queue = new Queue();
  }
  imgPort(data: Record<string, unknown>): void {
    TransportData.img.src = `${this.url}?${splitObjToQuery(data)}`;
  }
  xhrPost(data: ReportDataType): void {
    const handler = (): void => {
      if (typeof XMLHttpRequest === 'undefined') return;
      // todo 在发送请求之前做些什么事情
      if (typeof this.beforeSend === 'function') {
        data = this.beforeSend(data);
        if (!data) return;
      }
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.url);
      xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
      // xhr.withCredentials = true;
      if (typeof this.configXhr === 'function') {
        this.configXhr(xhr);
      }
      // todo  对当前的xhr做配置
      // const errorID  =createErrorID(data)
      xhr.send(JSON.stringify(this.getTransportData(data)));
    };
    this.queue.addFn(handler);
  }
  getTransportData(data: ReportDataType): TransportDataType {
    return {
      authInfo: {
        apikey: this.apiKey,
      },
      data,
    };
  }
  isSdkTransportUrl(url: string): boolean {
    return url.includes(this.url);
  }
  bindOptions(options: MonitorOptions): void {
    const { dsn, beforeSend, apikey, configXhr } = options;
    this.apiKey = options.apikey;
  }
}

const transportData = new TransportData(SERVER_URL);

export { transportData };
