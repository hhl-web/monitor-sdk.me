import { MonitorOptions } from '@/types/monitor';
import { setSilentHandler } from 'utils';
import { loadModule } from './module';
import { transportData } from 'core';
import {perforProcessor} from 'performance'
class Monitor {
  private monitorOpts: MonitorOptions = {};
  constructor(options: MonitorOptions = {}) {
    this.monitorOpts = options;
    this.init();
  }
  private init() {
    if (this.monitorOpts.disabled) return;
    this.bindOptions();
    loadModule(this.monitorOpts.timeout);
  }
  private bindOptions() {
    setSilentHandler(this.monitorOpts);
    transportData.bindOptions(this.monitorOpts);
    perforProcessor.bindOptions(this.monitorOpts);
  }
}

export default Monitor;
