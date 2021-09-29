'use strict';

/** Helper class for manifest data */
class Manifest {
  constructor(data) {
    this.data = data;
  }

  get file() {
    return this.data.file || this.data.files;
  }

  get data_file() {
    return this.data.data_file || this.data.data_files;
  }

  get client_script() {
    return this.data.client_script || this.data.client_scripts;
  }

  get server_script() {
    return this.data.server_script || this.data.server_scripts;
  }
}

module.exports = Manifest;
