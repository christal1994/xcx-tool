const parse5 = require('parse5');

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
      // console.log(value);
    } else if (node.nodeName === '#comment') {
      return -1;
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

const fmtComponentXml = function (html) {

  const documentFragment = parse5.parseFragment(html);

  convert2BD(documentFragment);

  html = parse5.serialize(documentFragment).trim().replace(new RegExp('&amp;', 'g'), '&');
  let htmlArr = html.split('\n');
  let hl = htmlArr.length;
  while (hl--) {
    let line = htmlArr[hl];
    if (!line.trim()) {
      htmlArr.splice(hl, 1);
    } else if (line.indexOf('<input') > -1 && !line.endsWith('/>')) {
      htmlArr[hl] = line.replace(/>$/, '/>');
    }
  }

  htmlArr = htmlArr.join('\n');
  htmlArr = htmlArr.replace(/\{\{[\s]inputValue[\s]\}\}/, '{= inputValue =}');
  return htmlArr;
};

const fmtComponentJs = function (script) {

  script = script.replace(/wx\./g, 'swan.');
  script = script.replace(/TYC-XCX-WX/g, 'TYC-XCX-BD');
  script = script.replace(/this\.Payment_WeiXin/g, 'this.Payment_BaiDu');
  script = script.replace(/this\.pay_WeiXin/g, 'this.pay_BaiDu');
  script = script.replace(/xcxPlatform:[\s]'wx'/g, 'xcxPlatform: \'bd\'');
  script = script.replace(/getSystemInfoWX\('WX'/g, 'getSystemInfoWX(\'BD\'');
  script = script.replace(/showVipBtnWX\('WX'\)/g, 'showVipBtnWX(\'BD\')');
  script = script.replace(/obj\.goToAppDef\(\)/g, 'obj.goToAppTT()');

  return script;

};

const fmtComponentCss = function (css) {
  // 由于所有页面page样式不渲染，将样式赋予container
  css = css.replace(/page[\s]\{([\n\s](.*?)){0,}\}/g, function ($1) {
    $1 = $1.replace('page', '.container');
    $1 = $1.replace(/height:[\s]100%/g,'min-height: 100vh');
    return $1
  });

  return css;
};

module.exports = {
  fmtComponentXml,
  fmtComponentJs,
  fmtComponentCss
};