const parse5 = require('parse5');

const convertZFBAttr = (node) => {

  let attrNames = node.attrs.map(a => a.name);

  let al = attrNames.length;

  while (al--) {
    let attr = node.attrs[al];
    if (attr.name.startsWith('wx:')) {
      switch (attr.name) {
        case 'wx:if':
          attr.name = 'a:if';
          break;
        case "wx:elif":
          attr.name = 'a:elif';
          break;
        case "wx:else":
          attr.name = 'a:else';
          break;
        case "wx:for":
          attr.name = 'a:for';
          break;
        case "wx:key":
          attr.name = 'a:key';
          break;
        default:
          console.log(attr.name);
          break;
      }
    } else if (attr.name.startsWith('bind') || attr.name.startsWith('catch')) {

      if (attr.name === 'bindtap') {
        attr.name = 'onTap';
      } else if (attr.name === 'binderror') {
        attr.name = 'onError';
      } else if (attr.name === 'bindinput') {
        attr.name = 'onInput';
      } else if (attr.name === 'bindblur') {
        attr.name = 'onBlur';
      } else if (attr.name === 'bindfocus') {
        attr.name = 'onFocus';
      } else if (attr.name === 'bindchange') {
        attr.name = 'onChange';
      } else if (attr.name === 'bindconfirm') {
        attr.name = 'onConfirm';
      } else if (attr.name.startsWith('bind:')) {
        if (attr.name === 'bind:eventhandler') {
          attr.name = 'onEventhandler';
        } else {
          attr.name = attr.name.replace('bind:', 'on');
        }
      } else if (attr.name === 'catchtap') {
        attr.name = 'catchTap';
      } else if (attr.name === 'catch:tap') {
        attr.name = 'catchTap';
      } else if (attr.name === 'bindscroll') {
        attr.name = 'onScroll';
      } else {
        // console.log(attr.name);
      }

    }
  }

};

const convert2ZFB = function (node) {

  if (node.tagName === 'view') {
  } else if (!node.tagName) {
    if (node.value) {
      let value = String(node.value.replace(/\n/g, '')).trim();
    } else if (node.nodeName === '#comment') {
      return -1;
    } else {
    }
  } else if (node.tagName === 'img') {
    node.tagName = 'image';
  }


  if (node.attrs) {
    convertZFBAttr(node);
  }

  if (node.childNodes) {
    let nl = node.childNodes.length;
    while (nl--) {
      let child = node.childNodes[nl];
      let state = convert2ZFB(child);
      if (state === -1) {
        node.childNodes.splice(nl, 1);
      }
    }
  }

  return 0;
};

const fmtComponentXml = function (html) {

  const documentFragment = parse5.parseFragment(html);

  convert2ZFB(documentFragment);

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

  htmlArr = htmlArr.replace(/ongetauthorize/g, 'onGetAuthorize')

  return htmlArr;
};

const fmtPagesJs = function (script) {
  // 替换onload/onshow
  if (/onLoad/.test(script)) {
    if (/onShow/.test(script)) {
      script = script.replace(/onLoad/g, `
      onLoad: function (query) {
        this._onLoad(query);
        if (query) {
          this.setData({
            query
          });
          getApp().globalData.options = query;
        }
      },
      onHide: function() {
        getApp().globalData.options = [];
      },
      onUnload: function() {
        getApp().globalData.options = [];
      },
      _onLoad`);
      script = script.replace(/onShow/, `
        onShow: function () {
          this._onShow();
        },
        _onShow`)
    } else {
      script = script.replace(/onLoad/g, `
      onLoad: function (query) {
        this._onLoad(query);
        if (query) {
          this.setData({
            query
          });
          getApp().globalData.options = query;
        }
      },
      onShow: function () {
        getApp().globalData.options = this.data.query;
      },
      onHide: function() {
        getApp().globalData.options = [];
      },
      onUnload: function() {
        getApp().globalData.options = [];
      },
      _onLoad`);
    }
  }

  // 替换saveimage函数
  if (/saveimg:/.test(script)) {
    script = script.replace(/saveimg:/g, `
    saveimg: function (e) {
      Modal.showLoading({
        title: '保存中'
      });
      let args = Utils.getArgs(e, arguments);
      let url = args.arga;
      my.saveImage({
        url,
        success: function () {
          Modal.hideLoading();
          Modal.showToast({
            title: '保存成功',
            duration: 2000
          })
        },
        fail: function () {
          Modal.hideLoading();
          Modal.showToast({
            title: '保存失败',
            duration: 2000
          })
        }
      });
    },
    saveimg_wx:`);
  }


  return script;
};

const fmtComponentJs = function (script) {
  script = fmtPagesJs(script);

  script = script.replace(/wx\./g, 'my.');
  script = script.replace(/TYC-XCX-WX/g, 'TYC-XCX-ALI');
  script = script.replace(/this\.Payment_WeiXin/g, 'this.Payment_ZhiFuBao');
  script = script.replace(/this\.pay_WeiXin/g, 'this.pay_ZhiFuBao');
  script = script.replace(/this\.triggerEvent\('eventhandler',[\s]args\)/g, 'this.props.onEventhandler(args)');

  script = script.replace(/this\.setNavigationBarTitle_WX/g, 'this.setNavigationBarTitle_ZFB');
  script = script.replace(/this\.setNavigationBarColor_WX/g, 'this.setNavigationBarColor_ZFB');
  script = script.replace(/this\.showToast_WX/g, 'this.showToast_ZFB');
  script = script.replace(/this\.showLoading_WX/g, 'this.showLoading_ZFB');
  script = script.replace(/this\.showModal_WX/g, 'this.showModal_ZFB');
  script = script.replace(/this\.SelectorQuery_wx/g, 'this.SelectorQuery_ZFB');
  script = script.replace(/this\.getCurrentPage_WX/g, 'this.getCurrentPage_ZFB');
  script = script.replace(/this\.makePhoneCall_WX/g, 'this.makePhoneCall_ZFB');
  script = script.replace(/this\.login_WX/g, 'this.login_ZFB');

  script = script.replace(/xcxPlatform:[\s]'wx'/g, 'xcxPlatform: \'zfb\'');
  script = script.replace(/res\.data\.callWx/g, 'res.data');

  script = script.replace(/getSystemInfoWX\('WX'/g, 'getSystemInfoWX(\'BD\'');
  script = script.replace(/obj\.showWeChatDef\(\)/g, 'obj.showWeChatTT()');

  return script;

};

const fmtComponentJson = function (json) {
  json = JSON.stringify(json);

  json = json.replace('navigationBarTitleText', 'defaultTitle');
  json = json.replace('navigationBarBackgroundColor', 'titleBarColor');
  json = json.replace('enablePullDownRefresh', 'pullRefresh');

  json = JSON.parse(json);

  return json;

};

module.exports = {
  fmtComponentXml,
  fmtComponentJs,
  fmtComponentJson
};