import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";
import { SonosManager } from '@svrooij/sonos';

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("AnnouncerSwitch", AnnouncerSwitch);
};

class AnnouncerSwitch implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private switchOn = false;

  private readonly switchService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;

    const manager = new SonosManager();

    manager.InitializeWithDiscovery(10)
      .then(console.log)
      .then(() => {
        manager.Devices.forEach(d => log('Device %s (%s) is joined in %s', d.Name, d.GroupName))
      })
      .catch(console.error)

    this.switchService = new hap.Service.Switch(this.name);
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Current state of the switch was returned: " + (this.switchOn? "ON": "OFF"));

 
        callback(undefined, this.switchOn);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.switchOn = value as boolean;
        log.info("Switch state was set to: " + (this.switchOn? "ON": "OFF"));

        if (this.switchOn) {
        /*
          manager.PlayTTS({
            text: 'Someone at the front-door',
            lang: 'en-US',
            gender: 'female',
            volume: 50,
            endpoint: 'https://your.tts.endpoint/api/generate'
          })
          */

          manager.PlayNotification({
            // trackUri: 'https://cdn.smartersoft-group.com/various/pull-bell-short.mp3', // Can be any uri sonos understands
            trackUri: 'https://cdn.smartersoft-group.com/various/someone-at-the-door.mp3', // Cached text-to-speech file.
            // onlyWhenPlaying: true, // make sure that it only plays when you're listening to music. So it won't play when you're sleeping.
            timeout: 10, // If the events don't work (to see when it stops playing) or if you turned on a stream, it will revert back after this amount of seconds.
            volume: 65, // Set the volume for the notification (and revert back afterwards)
            delayMs: 100 // Pause between commands in ms, (when sonos fails to play notification often).
          });
        }

        callback();
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
      .setCharacteristic(hap.Characteristic.Model, "Custom Model");

    log.info("Switch finished initializing!");
  }

  identify() {
    this.log("Sonos Announcer Switch Identified");
  }

  getServices() {
    return [
      this.informationService,
      this.switchService,
    ];
  }
}