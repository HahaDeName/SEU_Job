# 技术实现总流程（只讲实现逻辑，不带多余操作教程）
## 前提约束
仓库：`HahaDeName/SEU_Job` → **项目仓库，非用户主页仓库**，部署后资源路径自带前缀 `/SEU_Job/`
托管平台：GitHub Pages（纯静态资源托管，无后端、无URL重定向服务）
目标效果：`https://hahadename.github.io/SEU_Job/#/`，和示例站点一样 SPA‑hash 路由。

## 1. 前端工程两处核心代码修改
### ① 路由层：启用 Hash 模式
放弃 History 模式，使用哈希路由。
原理：路由状态存放于 URL `#` 之后；`#` 后的内容**不会发送给服务器**，全部由浏览器前端 JS 接管；刷新页面不会发起新路由请求，规避 GitHub Pages 404。

Vue3示例：
```js
history: createWebHashHistory()
```

### ② 构建工具：配置资源基础路径 base
原理：打包时所有静态资源（js、css、图片）引用路径拼接前缀 `/SEU_Job/`；
若不配置，上线后资源请求路径为根路径 `/`，文件404，页面白屏。

Vite：
```js
base: '/SEU_Job/'
```

> 本地开发服务器会自动忽略 base，开发环境不受影响。

## 2. 产物构建
执行打包命令，编译生成纯静态输出目录 `dist`：包含 index.html + js + css + 静态资源，**无后端代码**。

## 3. CI/CD 自动部署实现（GitHub‑Actions 方案，推荐）
1. 在源码仓库内新增 workflow 配置文件，存放路径 `.github/workflows/deploy.yml`
2. 触发条件：推送代码到 `main` 分支时自动运行流水线
3. 流水线执行步骤：
    1. 拉取仓库源代码
    2. 安装指定版本 Node.js
    3. 安装 npm 依赖包
    4. 执行 `npm run build` 生成 dist
    5. 将 dist 打包为 Pages 部署制品(artifact)上传
    6. GitHub Pages 服务拉取制品、部署静态站点
4. 仓库 Pages 设置项：部署源选择 `GitHub Actions`。

## 4. 静态站点访问原理
浏览器访问 `https://hahadename.github.io/SEU_Job/#/`
1. GitHub 服务器返回 `/SEU_Job/` 下的 index.html
2. 前端 JS 读取 `#/` 后的路由路径，在客户端渲染对应页面
3. 页面跳转全程前端控制，无服务端路由转发。

## 可选手动部署实现方案（无CI）
本地打包出 dist → 将 dist 内全部静态文件提交至仓库指定目录(main分支/docs) → Pages 设置选择分支+目录，GitHub读取目录文件托管。

如果你需要，我可以只给你**最小化可运行配置代码片段**。