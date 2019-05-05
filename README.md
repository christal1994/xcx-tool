# 小程序转换工具

>   微信小程序转百度小程序／头条小程序／支付宝小程序。

## 安装
### npm下载
```
npm install -g xcx-tool
```

### git clone 整个工程，根据实际场景修改tool使得符合自己的项目要求
```
git clone git@github.com:christal1994/xcx-tool.git
```

```
npm link
```

## 微信小程序转百度小程序
   ```
   xcx-tool w2b -s ../weChat -o ../baidu
   ```
* weChat: 微信小程序目录
* baidu: 百度小程序目录
   
## 微信小程序转头条小程序
  ```
  xcx-tool w2t -s ../weChat -o ../toutiao
  ```
* weChat: 微信小程序目录
* toutiao: 头条小程序目录   
   
## 微信小程序转支付宝小程序
   ```
   xcx-tool w2f -s ../weChat -o ../ali
   ```
* weChat: 微信小程序目录
* ali: 支付宝小程序目录  