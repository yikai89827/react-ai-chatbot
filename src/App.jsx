import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredText, setHoveredText] = useState('');
  const [suggestions, setSuggestions] = useState({});
  const messagesEndRef = useRef(null);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息到代理服务器
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API请求失败: ${response.status} - ${errorData.error || errorData.message}`);
      }

      const data = await response.json();
      if (data.output && data.output.text) {
        const assistantMessage = data.output.text;
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        
        // 提取建议关键词
        extractSuggestions(assistantMessage);
      } else {
        throw new Error('API响应格式错误');
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `错误: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理回车键发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 提取AI回复中的建议关键词
  const extractSuggestions = (text) => {
    const foundSuggestions = {};
    
    // 查找"如果需要"或"需要"后面的内容
    const needPatterns = [
      /如果需要([^。，！？\n]*？)/g,
      /需要([^。，！？\n]*？)/g,
      /如果需要([^。，！？\n]*。)/g,
      /需要([^。，！？\n]*。)/g
    ];

    // 从"如果需要"或"需要"后面的内容中提取关键词
    needPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      if (matches) {
        matches.forEach(match => {
          const content = match[1];
          
          // 提取加粗文本 **text**
          const boldMatches = content.matchAll(/\*\*([^*]+)\*\*/g);
          if (boldMatches) {
            boldMatches.forEach(boldMatch => {
              foundSuggestions[boldMatch[1]] = true;
            });
          }
          
          // 提取引号内容 "text" 或 'text'
          const quoteMatches = content.matchAll(/["']([^"']+)["']/g);
          if (quoteMatches) {
            quoteMatches.forEach(quoteMatch => {
              foundSuggestions[quoteMatch[1]] = true;
            });
          }
        });
      }
    });

    setSuggestions(foundSuggestions);
  };

  // 处理点击建议关键词自动发送消息
  const handleSuggestionClick = (text) => {
    setInputValue(text);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  // 自定义粗体渲染组件
  const BoldRenderer = ({ children }) => {
    const text = children[0];
    const isSuggestion = suggestions[text];
    
    return (
      <span 
        className={isSuggestion ? 'clickable-bold' : ''}
        onClick={isSuggestion ? () => handleSuggestionClick(text) : undefined}
        onMouseEnter={isSuggestion ? () => setHoveredText(text) : undefined}
        onMouseLeave={isSuggestion ? () => setHoveredText('') : undefined}
        title={isSuggestion ? `点击发送给AI: ${text}` : ''}
      >
        {children}
      </span>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>易凯的AI聊天机器人</h1>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    strong: BoldRenderer
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">正在思考...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {hoveredText && (
        <div className="hover-tooltip">
          💡 点击发送给AI: {hoveredText}
        </div>
      )}
      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          发送
        </button>
      </div>
    </div>
  );
}

export default App;