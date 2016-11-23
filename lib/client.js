"use babel";

import { fork } from "child_process";
import subject from "most-subject";

const TSSERVER = require.resolve("typescript/lib/tsserver");

class Client {
  seq = 0;
  responses = subject.async();

  start() {
    const observable = subject.async();
    this.server = fork(TSSERVER, { silent: true });
    this.server.stdout.on("data", (buffer) => {
      observable.next(buffer.toString());
    });
    this.server.stdout.on("end", () => {
      observable.complete();
    });
    this.server.stdout.on("error", () => {
      observable.error();
    });
    this.process(observable);
  }

  stop() {
    this.server.kill();
  }

  restart() {
    this.stop();
    this.start();
  }

  async process(observable) {
    let buffered = "";
    observable.forEach((content) => {
      buffered += content;
      const lines = buffered.split("\n");
      if (lines.length > 3) {
        const response = JSON.parse(lines[2]);
        this.responses.next(response);
        buffered = lines.slice(3).join("");
      }
    });
  }

  nextSeq() {
    return this.seq++;
  }

  waitFor(seq) {
    return new Promise((resolve) => {
      this.responses
        .skipWhile(response => !(
          response.request_seq === seq
        ))
        .take(1)
        .forEach(resolve);
    }).then((response) => {
      if (response.success) {
        return response;
      } else {
        throw response;
      }
    });
  }

  send(command, args, hasResponse = false) {
    const seq = this.nextSeq();
    this.server.stdin.write(JSON.stringify({
      seq,
      command,
      arguments: args,
    }));
    this.server.stdin.write("\n");
    if (hasResponse) {
      return this.waitFor(seq);
    }
    return null;
  }
}

export default Client;
