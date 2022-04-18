export interface MonitorOptions extends SilentEventTyps, HooksTypes {
  disabled?: boolean;
  dsn?: string;
  timeout?: number; //自定义定义多久算超时
  apikey?: string; //每个项目都有一个
  configXhr?: () => void;
}
// 静默配置，为true是表示静默 ，false表示需要监控
export interface SilentEventTyps {
  silentXhr?: boolean; // Xhr事件
  silentFetch?: boolean; //fetch事件
  silentConsole?: boolean; //console事件
  silentDom?: boolean; //Dom事件
  silentHistory?: boolean; //history事件
  silentError?: boolean; //error事件
  silentUnhandledrejection?: boolean; //unhandledrejection事件
  silentHashchange?: boolean; //监控hashchange事件
  silentVue?: boolean; //监控Vue.warn函数
}

export interface HooksTypes {
  beforeSend?: () => void;
}
