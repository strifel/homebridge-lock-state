import * as http from 'http';
/* eslint-disable @typescript-eslint/semi */
module.exports = (api) => {
  api.registerAccessory('HttpLockState', HTTPLockState);
}

class HTTPLockState {
  log: any;
  config: any;
  api: any;
  informationService: any;
  name: any;
  lockService: any;

  lockState = 3;

  /**
   * REQUIRED - This is the entry point to your plugin
   */
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.log.debug('Lock State Plugin Loaded');

    // your accessory must have an AccessoryInformation service
    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'HTTP Lock Manufactor')
      .setCharacteristic(this.api.hap.Characteristic.Model, 'HTTP Lock');

    this.lockService = new this.api.hap.Service.LockMechanism(this.name);


    this.lockService.getCharacteristic(this.api.hap.Characteristic.LockCurrentState)
      .onGet(this.getOnHandler.bind(this));

    this.lockService.getCharacteristic(this.api.hap.Characteristic.LockTargetState)
      .onGet(this.getOnTargetHandler.bind(this))
      .onSet(this.setOnHandler.bind(this));

    this.refresh();
  }

  /**
   * REQUIRED - This must return an array of the services you want to expose.
   * This method must be named "getServices".
   */
  getServices() {
    return [
      this.informationService,
      this.lockService,
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setOnHandler(value) {
    // This is the whole point of the plugin
    this.lockState = 3;
    this.refresh(false);
  }

  refresh(callSetTimeout = true) {
    if (!this.api) {
      return;
    }
    this.log.info('Getting lock state');
    const req = http.request(this.config.url, res => {
      let data = ''

      res.on('data', d => {
        data += d
      })
      res.on('end', () => {
        this.log.log('Got awnser for Lock: ' + data);
        if (data === '1' || data === 'true') {
        //this.api.hap.Characteristic.LockCurrentState.SECURED
          this.lockState = 1;
        } else {
        //this.api.hap.Characteristic.LockCurrentState.UNSECURED
          this.lockState = 0;
        }
        this.lockService.updateCharacteristic(this.api.hap.Characteristic.LockCurrentState, this.lockState);
      })
    });
    req.on('error', err => {
      this.log.error(err);
      this.lockState = 0;
    });
    if (callSetTimeout) {
      setTimeout(this.refresh, this.config.interval ? this.config.interval : 30 * 1000);
    }
    req.end();
  }

  getOnHandler() {
    return this.lockState;
  }

  getOnTargetHandler() {
    return this.lockState < 2 ? this.lockState : 1;
  }
}