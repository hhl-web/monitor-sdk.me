import { ERRORTYPES } from '@/common';

export interface AuthInfo {
  apikey: string;
  version?: string;
}

// 上报的数据类型
export interface TransportDataType {
  authInfo: AuthInfo;
  data: ReportDataType;
}

export interface ReportDataType {
  type?: ERRORTYPES;
  message?: string;
  pageUrl: string;
  name?: string;
  time?: number;
  errorId?: number;
  level: number;
  stack?: any;
  // ajax
  elapsedTime?: number;
  request?: {
    httpType?: string;
    method: string;
    url: string;
    data: any;
  };
  response?: {
    status: number;
    statusText: string;
    description: string;
  };
  // vue
  componentName?: string;
  propsData?: any;
  info?: string;
}
