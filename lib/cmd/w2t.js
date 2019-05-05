'use strict';

const Command = require('common-bin');
const path = require('path');

const file = require('../../tool/file');
const tt = require('../../tool/tt');
const string = require('../../tool/string.js');


class WeChat2BaiduCommand extends Command {

  constructor(rawArgv) {
    super(rawArgv);
    this.options = {
      source: {
        description: '微信小程序目录',
        alias: 's',
      },
      output: {
        description: '头条小程序目录',
        alias: 'o',
      }
    }
  }

  async run(context) {

    await this.formatArgs(context);

    const {configObj} = context.argv;

    const {source, output, ignoreDirs} = configObj;

    const files = (await file.listDir(source, true, function (state, filePath) {

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
        let moduleName = null;
        for (let i = 0; i < appJson.subPackages.length; i++) {
          for (let j = 0; j < appJson.subPackages[i].pages.length; j++) {
            let component = appJson.subPackages[i].pages[j];
            moduleName = string.CamelCase(`${appJson.subPackages[i].root.replace('pkg_', '')}_${component.split('/')[1]}`);
            let f1 = `pages/${moduleName}/${moduleName}`;
            if (!f1.match(/Ui/g)) {
              appJson.pages.push(f1);
            }

            let f2 = `/${appJson.subPackages[i].root}/${component}`;
            if (!f2.match(/pkg_ui/g)) {
              tt.coverPages(source, output, `${f1}.js`, `${f2}.js`,);
              tt.coverPages(source, output, `${f1}.ttss`, `${f2}.wxss`,);
              tt.coverPages(source, output, `${f1}.ttml`, `${f2}.wxml`,);
              tt.coverPages(source, output, `${f1}.json`, `${f2}.json`,);
            }
          }
        }
        delete appJson.subPackages;
        await  file.writeFile(path.join(output, subFile), JSON.stringify(appJson, null, 2))

      } else if (subFile.endsWith('.js')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        let outStr = tt.fmtComponentJs(fileStr);

        if (subFile === 'utils/util.js') {
          outStr = outStr.replace('formatPath_tt', 'formatPath_default')
        }
        await  file.writeFile(path.join(output, subFile), outStr);
      } else if (subFile.endsWith('.json')) {

        let fileJSON = await file.readJSON(path.join(source, subFile));

        if (fileJSON.usingComponents) {
          var ukey = Object.keys(fileJSON.usingComponents);

          var ul = ukey.length;

          while (ul--) {
            let curl = fileJSON.usingComponents[ukey[ul]];
            if (!curl.startsWith('/')) {
              continue;
            }
            let scurl = `${source}${curl}.json`;
            let exist = await file.existFile(scurl)

            if (!exist) {
              // console.log(scurl)
            } else {
              // console.log(curl);
            }
          }

        }

        await  file.writeFile(path.join(output, subFile), JSON.stringify(fileJSON, null, 2));
      } else if (subFile.endsWith('.wxml')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile.replace(/\.wxml$/, '.ttml')), tt.fmtComponentXml(fileStr))
      } else if (subFile.endsWith('.wxss')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        fileStr = fileStr.replace(/\.wxss/g, '.ttss');
        let loginStr = '\n.submit-btn::after {\n' +
          '  display: none;\n' +
          '}';

        if (subFile === 'pages/login/login.wxss') {
          // console.log(subFile)
          fileStr += loginStr;
        }
        await  file.writeFile(path.join(output, subFile.replace(/\.wxss/, '.ttss')), fileStr);
      } else if (subFile.endsWith('.png')) {
        await  file.copyFile(path.join(source, subFile), path.join(output, subFile));
      } else if (subFile.endsWith('.css')) {
        let fileStr = await file.readFile(path.join(source, subFile));
        await  file.writeFile(path.join(output, subFile), fileStr)
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
        'project.config.json',
        'pages/index',
        'pkg_'
      ],
      source: argv.source,
      output: argv.output
    };
  }

  get description() {
    return '微信小程序->头条小程序'
  }
}

module.exports = WeChat2BaiduCommand;
