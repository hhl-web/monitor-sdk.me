export enum EVENTTYPES {
  XHR = 'xhr',
  FETCH = 'fetch',
  CONSOLE = 'console',
  DOM = 'dom',
  HISTORY = 'history',
  ERROR = 'error',
  HASHCHANGE = 'hashchange',
  UNHANDLEDREJECTION = 'unhandledrejection',
  VUE = 'Vue',
  PAGEPERFORMANCE="pageperformance",
  RESOURCEPERFORMANCE="ResourcePerformance",
  RESOURCEPERFOR="resourceperfor",
  PAGEPERFOR="pageperfor",
  CUSTOMER="customer"
}

export enum ERRORLEVEL {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

export type EVENTS = keyof typeof EVENTTYPES;

export type VoidFn = () => void;

export enum HTTPTYPE {
  XHR = 'xhr',
  FETCH = 'fetch',
}
export interface MonitorHttp {
  type: HTTPTYPE;
  method?: string;
  url?: string;
  sTime?: number;
  eTime?: number;
  isSdkUrl?: boolean;
  reqData?: any;
  status?: number;
  statusText?: any;
  responseText?: any;
  elapsedTime?: number;
}

export enum ERRORTYPES {
  HTTPERROR = 'http_error',
  BUSSIONERROR = 'bussion_error',
  JAVASCRIPT_ERROR = 'javascript_error',
  RESOURCE_ERROR = 'resource_error',
  PROMISE_ERROR = 'promise_error',
  CUSTOMER_ERROR='customer_error'
}

export type IPerCallback = (entries: any[]) => void