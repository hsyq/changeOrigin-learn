const Koa = require("koa");
const body = require("koa-body");
const Router = require("@koa/router");

const app = new Koa();
const router = new Router();

// 注册中间件，解析 post 请求
app.use(body())

// post请求，携带origin
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
});
