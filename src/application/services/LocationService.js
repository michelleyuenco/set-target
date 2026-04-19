export class LocationService {
  constructor(locationPort) {
    this.locationPort = locationPort
  }

  getAll() {
    return this.locationPort.getAll()
  }

  add(name, abbr, currentCount) {
    return this.locationPort.add(name, abbr, currentCount)
  }

  update(id, name, abbr) {
    return this.locationPort.update(id, name, abbr)
  }

  remove(id) {
    return this.locationPort.remove(id)
  }

  updateOrder(orderedLocations) {
    return this.locationPort.updateOrder(orderedLocations)
  }

  setVisibility(id, visible) {
    return this.locationPort.setVisibility(id, visible)
  }
}
