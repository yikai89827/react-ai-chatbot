const http = require('http');
const https = require('https');

const PORT = 3001;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 只处理POST请求到/api/chat
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        
        // 转发请求到通义千问API
        const apiKey = 'sk-65ca4b5a5e8e4e8bb79f1b84ee6d335f';
        const options = {
          hostname: 'dashscope.aliyuncs.com',
          port: 443,
          path: '/api/v1/services/aigc/text-generation/generation',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let apiBody = '';
          
          apiRes.on('data', (chunk) => {
            apiBody += chunk;
          });
          
          apiRes.on('end', () => {
            res.writeHead(apiRes.statusCode, {
              'Content-Type': 'application/json'
            });
            res.end(apiBody);
          });
        });

        apiReq.on('error', (error) => {
          console.error('API请求错误:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: '代理服务器错误',
            message: error.message
          }));
        });

        // 发送请求到通义千问API
        apiReq.write(JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: requestData.messages
          },
          parameters: {
            temperature: requestData.temperature || 0.7
          }
        }));
        
        apiReq.end();

      } catch (error) {
        console.error('解析请求错误:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: '请求格式错误',
          message: error.message
        }));
      }
    });
  } else {
    // 处理其他请求
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: '接口不存在',
      message: `找不到路径: ${req.url}`
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 简单代理服务器运行在端口 ${PORT}`);
  console.log(`💬 聊天接口: http://localhost:${PORT}/api/chat`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});