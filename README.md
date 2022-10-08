## changeOrigin 到底改了啥

前端开发中经常要配置接口代理服务，用来解决开发阶段的跨域问题。

无论是 webpack-dev-server 中的 proxy，还是 vite 中的 proxy，内部都是使用了同一个库 [node-http-proxy](https://github.com/http-party/node-http-proxy)。



### 一个代理的例子

在配置 proxy 时，通常是这样的：

``` js
// vite.config.js

import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // 配置代理服务
    proxy: {
      // 以 /api 开头的请求，全部转发到 target 设置的地址
      '/api': {
        target: 'https://demo.com',
        changeOrigin: true
      }
    }
  }
})
```



设置 `target` 目标的同时，有时还会配置一个 `changeOrigin` 属性。看名字，它好像用来改变 `origin` 请求头的值，将其改为 `target` 的值。

真的如此吗？



### 先看文档

> - **changeOrigin**: true/false, Default: false - changes the origin of the host header to the target URL



也就是说，changeOrigin 的默认值为 false，用来**将 host 请求头修改为 target 的 URL**。



## 🌰 通过一个例子演示

准备两个服务：

- 后端：使用 koa 创建的接口服务
- 前端：使用 @vue/cli 创建的 vue 项目

示例代码已上传到 [Github 仓库](https://github.com/hsyq/changeOrigin-learn)。



### Koa

在本地 3000 端口启动一个接口服务：

``` js
// server.js

const Koa = require("koa")
const body = require("koa-body")
const Router = require("@koa/router")

const app = new Koa()
const router = new Router()

app.use(body())

// post请求，携带 origin 头
router.post('/api/list', async ctx => {
    console.log(ctx.headers)
    ctx.body = {
        code: 0,
        msg: 'ok'
    }
})

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log(`服务器已启动: 3000`);
})
```



### Vue

前端使用 `axios` 访问接口`/api/list`：

``` js
// main.js

import axios from 'axios'

axios.post('/api/list').then(res => {
  console.log(res)
})
```



#### 设置 changeOrigin 为 false

``` js
devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false
      }
    }
}
```

此时的 `origin`、`host` 头分别是：

``` bash
Host: localhost:8080

Origin: http://localhost:8080
```





![image-20221007233456329](https://static.kunwu.tech/images/2022-10/202210072335358.webp)



可以通过代理解决跨域问题：

![image-20221007233601051](https://static.kunwu.tech/images/2022-10/202210072336335.webp)





服务端接收到的请求头信息是：

``` bash
origin: 'http://localhost:8080'

host: 'localhost:8080'
```



![image-20221007233800986](https://static.kunwu.tech/images/2022-10/202210072338674.webp)





#### 设置 changeOrigin 为 true

``` js
devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
}
```



浏览器端查看请求头信息：

``` bash
Host: localhost:8080

Origin: http://localhost:8080
```





![image-20221007233901503](https://static.kunwu.tech/images/2022-10/202210072339856.webp)



服务端接收到的请求头信息：

``` bash
origin: 'http://localhost:8080'

host: 'localhost:3000'
```

![image-20221007233943164](https://static.kunwu.tech/images/2022-10/202210072339742.webp)



#### 发现

这一次，**host** 头的值变为 `localhost:3000` ，也就是 target 设置的接口服务器的地址了。

也就是，**`changeOrigin` 这个配置项，修改的不是 `origin` 头，而是 `host` 头。**



那么，修改 host 有什么特别的作用吗？

**答案是没有。**起码对于解决跨域问题没有。

换个角度看， `changeOrigin` 的默认值是 `false`，也就是不改，说明不改的适用场景更广泛一些。



那如果改了 `host` ，能发挥出什么作用吗？

那就先看看 `host` 这个头本身的作用是什么。



## host header

Host 请求头表示请求资源的网络主机和端口号， 比如我们访问上面的 localhost:8080 这个页面，那么它的 host 就是：

![image-20221008161006384](https://static.kunwu.tech/images/2022-10/202210081610769.webp)

该请求头在 HTTP/1.1 版本中推出，是为了解决虚拟主机的问题。在 HTTP/1.0 中，一个域名绑定一个 IP 地址，一台服务器对应一个 IP，因此一台服务器只能运行一个站点。随着虚拟主机技术的发展，有时候需要在一台服务器上运行多个虚拟主机，此时服务器就可以通过 host 头来做不同的处理。

在运行 HTTP/1.1 协议的网站中，请求头中要求携带 host 头。现在很多网站都已经支持了 HTTP/2 版本协议，它就不要求携带 host 请求了。

看下百度：

![image-20221008004414723](https://static.kunwu.tech/images/2022-10/202210080044669.webp)



看下主域名：

![image-20221008004535987](https://static.kunwu.tech/images/2022-10/202210080045116.webp)



掘金已经全部采用 HTTP/2 了：

![image-20221008004745061](https://static.kunwu.tech/images/2022-10/202210080047178.webp)

已经没有 `host` 请求头了：

![image-20221008005019850](https://static.kunwu.tech/images/2022-10/202210080050415.webp)



### 小结

配置 `changeOrigin` 修改 `host`，基本上没什么用。



## 🎀 关于 changeOrigin 的结论

通过上面的探究，基本可以得出以下结论：

1. **changeOrigin 配置项用来修改 host header，而非 origin header**
2. **Host header 用来处理虚拟主机的问题，和跨域无关**
3. **一般情况下，设置代理时可以忽略这个配置项，保持默认即可**
4. 特殊情况下，很可能后端服务就用 host 做校验了，此时根据实际情况去设置



## 另一个问题：为什么浏览器网络面板观察不到 host 的修改？

因为浏览器运行的 js 代码，发出了一个网络请求，这个请求的 host 就是 `localhost:8080`。

发出去之后，被本地的代理服务拦截到了，在这个地方将 `host` 修改了，再发往后端服务器。

也就是，`host` 修改时，浏览器已经将请求发出去了，所以观察不到。



## 🏁 最后

本文简单探讨了 `changeOrigin` 这个常见的配置项。用了这么多年，才发现一直“误会”了它。看来正应了那句老话：

纸上得来终觉浅，

绝知此事要躬行。

