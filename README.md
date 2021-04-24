# 承接gitlab的hook服务

## 项目配置

| 名称           | 作用                                                         |
| -------------- | ------------------------------------------------------------ |
| COMMAND_PREFIX | 命令的命名空间，如 /filez tag，该字段影响 "filez"，如果命令的命名空间不正确，则会直接提示错误 |
| GITLAB_HOST    | 私有部署的 gitlab 地址                                       |
| GITLAB_TOKEN   | 管理员账号的 access token                                    |
| PORT           | 服务启动的端口                                               |



## 使用

在项目根目录安装依赖

```npm install```

建议使用 pm2 管理应用

```npm install pm2 -g```

启动应用

```pm2 start index.js```



## 日志

服务会有一定的日志输出，位于 ```log``` 目录下，当天的日志：fe_deploy.log

其余日期的日志都会被自动添加日期归档，方便排查错误



## 开发调试

直接使用 node 运行 index.js 即可

如果想要打断点调试，现在也是直接支持的，已经配置好了 `.vscode/launch.json` 文件，跟调试其他 node 应用一样直接用即可





## 注意事项

本服务仅提供与 gitlab 的交互，想要添加/修改命令，请了解 gitlab-ci 相关内容之后再对服务代码进行调整