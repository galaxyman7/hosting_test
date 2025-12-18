/**
 * Save and load entire JSON session. Hidden info remains hidden by UI filtering.
 */
export class Storage {
  constructor(bus, state) {
    this.bus = bus;
    this.state = state;
  }
}
