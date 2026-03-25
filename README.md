# React AI 聊天机器人

基于React和阿里通义千问模型的AI聊天机器人项目。

## 功能特性

- 与通义千问AI模型进行实时对话
- 响应式设计，适配不同设备屏幕
- 消息历史记录
- 加载状态显示
- 支持回车键发送消息

## 技术栈

- React 18
- Vite
- 通义千问API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API密钥

在`.env`文件中添加你的通义千问API密钥：

```
VITE_QWEN_API_KEY=your_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
react-ai-chatbot/
├── src/
│   ├── App.jsx          # 聊天机器人主组件
│   ├── main.jsx         # 应用入口
│   └── index.css        # 样式文件
├── .env                # 环境变量文件
├── index.html          # HTML模板
├── package.json        # 项目配置
├── vite.config.js      # Vite配置
└── README.md           # 项目说明
```

## 使用说明

1. 在输入框中输入你的问题或消息
2. 点击「发送」按钮或按回车键发送消息
3. 等待AI回复
4. 查看聊天历史记录

## 注意事项

- 确保你的API密钥有效且有足够的调用额度
- 通义千问API可能有请求频率限制，请合理使用
- 本项目仅用于学习和演示目的
