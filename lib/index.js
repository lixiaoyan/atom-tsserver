"use babel";

import Client from "./client";
import Provider from "./provider";

class Plugin {
  constructor() {
    this.client = new Client();
    this.provider = new Provider(this.client);
  }

  activate() {
    this.client.start();
  }

  deactivate() {
    this.client.stop();
  }

  getProvider() {
    return this.provider;
  }
}

export default new Plugin();
