'use strict';

const Command = require('common-bin');
const path = require('path');

const file = require('../../tool/file');
const ali = require('../../tool/ali');


class WeChat2AliCommand extends Command {

  constructor(rawArgv) {
    super(rawArgv);
    this.options = {
      source: {
        description: '微信小程序目录',
        alias: 's',
      },
      output: {
        description: '支付宝小程序目录',
        alias: 'o',
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
          sub.pages.forEach((page) => {
            page = `${sub.root}/${page}`;
            appJson.pages.push(page);
          });
          if (sbl === 0) {
            delete appJson.subPackages;
          }
        }

        appJson.tabBar.textColor = appJson.tabBar.color;
        appJson.tabBar.items = appJson.tabBar.list;

        delete appJson.tabBar.color;
        delete appJson.tabBar.list;

        appJson.tabBar.items.forEach((item) => {
          item.name = item.text;
          item.icon = item.iconPath;
          item.activeIcon = item.selectedIconPath;
          delete item.text;
          delete item.iconPath;
          delete item.selectedIconPath;
        });

        await  file.writeFile(path.join(output, subFile), JSON.stringify(ali.fmtComponentJson(appJson), null, 2))
      } else if (subFile.endsWith('.js')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile), ali.fmtComponentJs(fileStr));
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
              console.log(scurl)
            }else{
            }
          }

        }

        await  file.writeFile(path.join(output, subFile), JSON.stringify(ali.fmtComponentJson(fileJSON), null, 2));
      } else if (subFile.endsWith('.wxml')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile.replace(/\.wxml$/, '.axml')), ali.fmtComponentXml(fileStr))
      } else if (subFile.endsWith('.wxss')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        fileStr = fileStr.replace(/\.wxss/g, '.acss');
        fileStr = fileStr.replace(/\.css/g, '.acss');
        await  file.writeFile(path.join(output, subFile.replace(/\.wxss/, '.acss')), fileStr)
      } else if (subFile.endsWith('.png')) {
        await  file.copyFile(path.join(source, subFile), path.join(output, subFile));
      }
    }

  }

  async formatArgs(context) {

    const {cwd, argv} = context;

    if (argv.source && !path.isAbsolute(argv.source)) argv.source = path.join(cwd, argv.source);

    if (argv.output && !path.isAbsolute(argv.output)) argv.output = path.join(cwd, argv.output);

    argv.configObj = {
      ignoreDirs: [
        '.git',
        '.idea',
        '.DS_Store',
        'project.config.json'
      ],
      source: argv.source,
      output: argv.output
    };

  }

  get description() {
    return '微信小程序->支付宝小程序'
  }
}

module.exports = WeChat2AliCommand;
