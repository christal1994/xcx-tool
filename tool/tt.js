const path = require('path');
const file = require('./file');
const string = require('./string');

const convertBDAttr = (node) => {

  let attrNames = node.attrs.map(a => a.name);

  let al = attrNames.length;

  let wxForIndex = node.attrs.find(function (el) {
    return el.name === 'wx:for-index';
  });
  let wxForItem = node.attrs.find(function (el) {
    return el.name === 'wx:for-item';
  });

  while (al--) {
    let attr = node.attrs[al];
    if (attr.name.startsWith('wx:')) {
      switch (attr.name) {
        case 'wx:if':
          attr.name = 's-if';
          attr.value = attr.value.replace('{{', '').replace('}}', '').trim();
          break;
        case "wx:elif":
          attr.name = 's-elif';
          attr.value = attr.value.replace('{{', '').replace('}}', '').trim();
          break;
        case "wx:else":
          attr.name = 's-else';
          break;
        case "wx:for":
          attr.name = 's-for';
          let value = attr.value.replace('{{', '').replace('}}', '');
          let item = null;
          if (wxForItem) {
            item = wxForItem.value.replace('{{', '').replace('}}', '');
          }
          if (wxForIndex && wxForIndex.value !== 'index') {
            item += `,${wxForIndex.value.replace('{{', '').replace('}}', '')}`;
          }

          if (item) {
            attr.value = `${item} in ${value}`.trim();
          } else {
            attr.value = `${value}`.trim();
          }

          break;
        case "wx:key":
          node.attrs.splice(al, 1);
          break;
        case "wx:for-index":
          node.attrs.splice(al, 1);
          break;
        case "wx:for-item":
          node.attrs.splice(al, 1);
          break;
        default:
          // console.log(attr.name);
          break;
      }
    }
  }

};

const convert2BD = function (node) {

  if (node.tagName === 'view') {
  } else if (!node.tagName) {
    if (node.value) {
      let value = String(node.value.replace(/\n/g, '')).trim();
    } else if (node.nodeName === '#comment') {
      // delete node return;
      return -1;
    } else {
    }
  } else if (node.tagName === 'img') {
    node.tagName = 'image';
  }


  if (node.attrs) {
    convertBDAttr(node);
  }

  if (node.childNodes) {
    let nl = node.childNodes.length;
    while (nl--) {
      let child = node.childNodes[nl];
      let state = convert2BD(child);
      if (state === -1) {
        node.childNodes.splice(nl, 1);
      }
    }
  }

  return 0;
};

const coverPages = async function (source, output, outputFilePath, sourceFilePath) {
  let fileStr = await file.readFile(path.join(source, `${sourceFilePath}`));
  await file.touchPatentDir(path.join(output, `${(outputFilePath)}`));
  if (sourceFilePath.endsWith('js')) {
    await file.writeFile(path.join(output, `${outputFilePath}`), this.fmtComponentJs(fileStr));
  } else if (sourceFilePath.endsWith('wxml')) {
    await file.writeFile(path.join(output, `${outputFilePath}`), this.fmtComponentXml(fileStr));
  } else if (sourceFilePath.endsWith('wxss')) {
    await file.writeFile(path.join(output, `${outputFilePath}`), this.fmtComponentCss(fileStr));
  } else {
    await file.writeFile(path.join(output, `${outputFilePath}`), fileStr);
  }
};

const fmtComponentXml = function (html) {

  html = html.replace(/wxss/g, 'ttss');
  return html;
};

const fmtComponentJs = function (script) {

  script = script.replace(/wx\./g, 'tt.');
  script = script.replace(/wxss/g, 'ttss');
  script = script.replace(/require\(\'\.\.\/\.\.\/\.\./g, 'require(\'../..');
  script = script.replace(/TYC-XCX-WX/g, 'TYC-XCX-TT');
  script = script.replace(/this\.Payment_WeiXin/g, 'this.Payment_TouTiao');
  script = script.replace(/this\.pay_WeiXin/g, 'this.pay_TouTiao');
  script = script.replace(/formatPath_default/g, 'formatPath_tt');
  script = script.replace(/this\.infoWX/g, 'this.infoTT');
  script = script.replace(/obj\.goToAppDef\(\)/g, 'obj.goToAppTT()');
  script = script.replace(/\.callWx/g, '');
  script = script.replace(/请登录微信后使用/g, '请登录今日头条后使用');
  script = script.replace(/obj\.showWeChatDef\(\)/g, 'obj.showWeChatTT()');
  script = script.replace(/obj\.showCardDef\(\)/g, 'obj.showCardTT()');


  // 去掉分享
  // script = script.replace(/Share\.showShareMenu/g, 'Share.hideShareMenu');
  // script = script.replace(/onShareAppMessage(.*?)([\n\s](.*?)){0,}\},/, '');
  script = script.replace('/*back home*/', `goToIndex: function () {
     Router.switchTab('/pages/index/index');
  }`);

  // 修改分享路径
  let shareMessage = script.match(/path:[\s]\`\/pkg_(.*?)\`/);
  if (shareMessage) {
    shareMessage = script.match(/path:[\s]\`\/pkg_(.*?)\`/)[0];
    let sourcePath = shareMessage.split('`')[1];
    let moduleName = string.CamelCase(`${sourcePath.split('/')[1].replace('pkg_', '')}_${sourcePath.split('/')[3]}`);
    let outPath = `pages/${moduleName}/${moduleName}?${sourcePath.split('?')[1]}`;
    script = script.replace(/path:[\s]\`\/pkg_(.*?)\`/g, function () {
      return `path: \`/${outPath}\``
    })
  };

  return script;

};

const fmtComponentCss = function (css) {
  css = css.replace(/wxss/g, 'ttss');

  // 更换底部logo图片
  // css = css.replace('logo-bottom.png', 'logo-bottom-tt.png');

  // 去掉分享
  css = css.replace(/\.header-logo[\s]\{([\n\s](.*?)){0,}\}/g, function ($1) {
    return '.header-logo {\n' +
      'width: 170rpx;\n' +
      'height: 40rpx;\n' +
      'margin-bottom: 16rpx;\n}'
  });

  return css;
};

module.exports = {
  coverPages,
  fmtComponentXml,
  fmtComponentJs,
  fmtComponentCss
};