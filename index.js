'use strict';

const Command = require('common-bin');
const path = require('path');

let config = require('./package.json');

class XCXTools extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    this.usage = 'Usage: xcx-tool [command] [options]';

    this.load(path.join(__dirname, 'lib/cmd'))
  }

  get version() {
    return config.version;
  }
}

module.exports = XCXTools;