const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Chatbot Proxy Server is running' });
});

// 代理通义千问API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7 } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: { messages },
        parameters: { temperature }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000 // 30秒超时
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    
    if (error.response) {
      // 转发API的错误响应
      res.status(error.response.status).json({
        error: 'API request failed',
        details: error.response.data
      });
    } else if (error.request) {
      // 网络错误
      res.status(500).json({
        error: 'Network error',
        message: '无法连接到通义千问API'
      });
    } else {
      // 其他错误
      res.status(500).json({
        error: 'Server error',
        message: error.message
      });
    }
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: '服务器内部错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Chatbot Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});