export class StorageService {
  constructor(storagePort) {
    this.storagePort = storagePort
  }

  uploadImage(uid, day, shift, file) {
    return this.storagePort.uploadImage(uid, day, shift, file)
  }

  deleteImage(storagePath) {
    return this.storagePort.deleteImage(storagePath)
  }
}
