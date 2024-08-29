const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 创建 Anthropic 客户端实例
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 设置内容类型头
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

const validModels = ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;

    // 模型验证
    if (!validModels.includes(model)) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    const response = await client.messages.create({
      model: model,
      //model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
      temperature: 0,
      system: "Respond concisely.",
    });

    // 添加令牌使用信息
    const usage = response.usage;
    res.setHeader('X-Input-Tokens', usage.input_tokens);
    res.setHeader('X-Output-Tokens', usage.output_tokens);

    // 添加请求ID
    if (response.id) {
      res.setHeader('X-Request-ID', response.id);
    }

    res.json({ reply: response.content[0].text });
  } catch (error) {
    console.error('Error:', error);
    
    if (error instanceof Anthropic.APIError) {
      console.log(error.status);
      console.log(error.name);
      console.log(error.headers);
      
      if (error.status === 401) {
        res.status(401).json({ error: 'Authentication error' });
      } else if (error.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
      }
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 添加一些调试信息
console.log("API Key:", process.env.ANTHROPIC_API_KEY ? "Set" : "Not set");
console.log("API Version:", client.apiVersion);