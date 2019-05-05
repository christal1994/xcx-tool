'use strict';

const Command = require('common-bin');
const path = require('path');

const file = require('../../tool/file');
const bd = require('../../tool/bd');

class Wechat2BaiduCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    this.options = {
      source: {
        description: '微信小程序目录',
        alias: 's',
        demandOption: true
      },
      output: {
        description: '微信小程序目录',
        alias: 'o',
        demandOption: true
      }
    }
  }

  async run(context) {
    await this.formatArgs(context);

    const {configObj} = context.argv;

    const {source, output, ignoreDirs} = configObj;

    const files = ( await file.listDir(source, true, function (state, filePath) {

      let ignore = false;
      ignoreDirs.forEach(function (match) {
        if (ignore) {
          return
        }
        if (filePath.match(match)) {
          ignore = true;
        }
      });
      return !ignore && file.filterFile(state, filePath);
    })).map(function (ff) {
      return path.relative(source, ff);
    });

    for (var i = 0; i < files.length; i++) {

      let subFile = files[i];

      await file.touchPatentDir(path.join(output, subFile));

      if (subFile === 'app.json') {
        let appJson = await file.readJSON(path.join(source, subFile));

        let sbl = appJson.subPackages.length;
        while (sbl--) {
          let sub = appJson.subPackages[sbl];
          if (!sub.pages.length) {
            appJson.subPackages.splice(sbl, 1);
          }
        }

        await  file.writeFile(path.join(output, subFile), JSON.stringify(appJson, null, 2))
      } else if (subFile.endsWith('.js')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile), bd.fmtComponentJs(fileStr));
      } else if (subFile.endsWith('.json')) {

        let fileJSON = await file.readJSON(path.join(source, subFile));

        if (fileJSON.usingComponents) {
          var ukey = Object.keys(fileJSON.usingComponents);

          var ul = ukey.length;

          while (ul--) {
            let curl = fileJSON.usingComponents[ukey[ul]];
            if(!curl.startsWith('/')){
              continue;
            }
            let scurl=`${source}${curl}.json`;
            let exist = await file.existFile(scurl);

            if(!exist){
              // console.log(scurl)
            }
          }
        }

        await  file.writeFile(path.join(output, subFile), JSON.stringify(fileJSON, null, 2));
      } else if (subFile.endsWith('.wxml')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile.replace(/\.wxml$/, '.swan')), bd.fmtComponentXml(fileStr))
      } else if (subFile.endsWith('.wxss')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        fileStr = fileStr.replace(/\.wxss/g, '.css');
        await  file.writeFile(path.join(output, subFile.replace(/\.wxss/, '.css')), bd.fmtComponentCss(fileStr))
      } else if (subFile.endsWith('.png') || subFile.endsWith('.gif') || subFile.endsWith('.jpg')) {
        await  file.copyFile(path.join(source, subFile), path.join(output, subFile));
      } else if (subFile.endsWith('.css')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile), fileStr);
      }
    }
  }

  async formatArgs(context) {
    const {cwd, argv} = context;

    if (argv.source && !path.isAbsolute(argv.source)) {
      argv.source = path.join(cwd, argv.source);
    }

    if (argv.output && !path.isAbsolute(argv.output)) {
      argv.output = path.join(cwd, argv.output);
    }

    argv.configObj = {
      ignoreDirs: [
        '.git',
        '.idea',
        '.DS_Store',
        'project.config.json'
      ],
      source: argv.source,
      output: argv.output
    }
  }

  get description() {
    return '微信小程序-->百度小程序'
  }
}

module.exports = Wechat2BaiduCommand;