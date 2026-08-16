import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);
app.use(express.json({ limit: '10mb' }));

app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages } = req.body;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!process.env.OPENAI_API_KEY) {
      const mockResponses = [
        "🐙 I'm Octo AI! Add your OpenAI API key in .env file to unlock AI power.",
        "Try me: Ask to build a website, create an ad, or generate images!",
        "What would you like to create today?"
      ];
      let index = 0;
      const interval = setInterval(() => {
        if (index < mockResponses.length) {
          res.write(`data: ${JSON.stringify({ content: mockResponses[index] + ' ' })}\n\n`);
          index++;
        } else {
          clearInterval(interval);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      }, 500);
      return;
    }

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/api/code/generate', async (req, res) => {
  try {
    const { prompt, language = 'typescript' } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        code: `// Code for: ${prompt}\n// Add OPENAI_API_KEY for real generation\nconsole.log("Hello from Octo AI! 🐙");`,
        language,
        mock: true
      });
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: `You are an expert ${language} developer.` },
        { role: 'user', content: prompt }
      ],
    });
    res.json({ code: response.choices[0]?.message?.content || '', language });
  } catch (error) {
    res.status(500).json({ error: 'Code generation failed' });
  }
});

app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        images: [{
          url: 'https://placehold.co/1024x1024/1a1a2e/8b5cf6?text=🐙+Octo+AI',
          prompt
        }],
        mock: true
      });
    }
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });
    res.json({ images: response.data.map(img => ({ url: img.url, prompt })) });
  } catch (error) {
    res.status(500).json({ error: 'Image generation failed' });
  }
});

app.post('/api/video/generate', async (req, res) => {
  try {
    const { concept, style = 'cinematic', duration = 30 } = req.body;
    const scenes = [
      { id: 1, description: `Opening: ${concept}`, duration: 5, camera: 'Wide shot', transition: 'Fade in' },
      { id: 2, description: `Main action: ${concept}`, duration: 15, camera: 'Medium shot', transition: 'Cross dissolve' },
      { id: 3, description: 'Key moment', duration: 5, camera: 'Close-up', transition: 'Cut' },
      { id: 4, description: 'Closing with CTA', duration: 5, camera: 'Wide pull back', transition: 'Fade out' }
    ];
    res.json({
      concept,
      style,
      duration,
      scenes,
      script: `SCENE 1: ${scenes[0].description}\nSCENE 2: ${scenes[1].description}\nSCENE 3: ${scenes[2].description}\nSCENE 4: ${scenes[3].description}`,
      mock: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Video generation failed' });
  }
});

app.post('/api/ad/generate', async (req, res) => {
  try {
    const { product, targetAudience, platform, goal, brandStyle } = req.body;
    const variants = [
      {
        headline: `Discover ${product}`,
        copy: `Revolutionize your ${targetAudience} with ${product}. ${goal} made easy.`,
        cta: 'Get Started',
        hooks: ['Innovation', 'Results']
      },
      {
        headline: `Transform with ${product}`,
        copy: `Join thousands of satisfied ${targetAudience} users. ${brandStyle} style.`,
        cta: 'Try Free',
        hooks: ['Trusted', 'Proven']
      }
    ];
    res.json({
      product,
      targetAudience,
      platform,
      goal,
      brandStyle,
      variants,
      strategy: `Target ${targetAudience} on ${platform} with ${brandStyle} approach.`,
      mock: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Ad generation failed' });
  }
});

let projects: any[] = [
  { id: '1', name: 'My Game', type: 'game', data: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'My Website', type: 'website', data: {}, createdAt: new Date(), updatedAt: new Date() },
];

app.get('/api/projects', (req, res) => res.json(projects));

app.post('/api/projects', (req, res) => {
  const { name, type, data = {} } = req.body;
  const project = { id: uuidv4(), name, type: type || 'general', data, createdAt: new Date(), updatedAt: new Date() };
  projects.push(project);
  res.json(project);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  project ? res.json(project) : res.status(404).json({ error: 'Not found' });
});

app.delete('/api/projects/:id', (req, res) => {
  projects = projects.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🐙 Octo AI Backend on http://localhost:${PORT}`);
  console.log(process.env.OPENAI_API_KEY ? '✅ OpenAI connected' : '⚠️ Mock mode (add OPENAI_API_KEY)');
});
