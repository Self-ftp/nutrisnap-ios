import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import CryptoJS from 'crypto-js';
import https from 'https';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_CACHE_FILE = path.join(__dirname, 'ai_cache.json');
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function searchFoodImage(q: string): Promise<string> {
  const foodMap: Record<string, string> = {
    'овсянка': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80',
    'гречка': 'https://images.unsplash.com/photo-1584946700201-389369399898?w=600&q=80',
    'хлопья': 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=600&q=80',
    'яйцо': 'https://images.unsplash.com/photo-1582722872445-44c56bb62741?w=600&q=80',
    'творог': 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=600&q=80',
    'хлеб': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    'сыр': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80',
    'рис': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',
    'макароны': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80',
    'курица': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
    'суп': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    'огурец': 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=600&q=80',
    'помидор': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
    'кофе': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80',
    'чай': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80',
    'молоко': 'https://images.unsplash.com/photo-1550583724-b2692b85b15f?w=600&q=80',
    'банан': 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&q=80',
    'яблоко': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=600&q=80',
    'пицца': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    'бургер': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    'салат': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    'стейк': 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&q=80',
    'рыба': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    'лосось': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
    'доширак': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    'лапша': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    'пюре': 'https://images.unsplash.com/photo-1514516348920-f319999a5e5f?w=600&q=80',
    'борщ': 'https://images.unsplash.com/photo-1594759071442-5fe5022603a5?w=600&q=80',
    'плов': 'https://images.unsplash.com/photo-1512058560366-cd242959b4fe?w=600&q=80',
    'запеканка': 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&q=80',
    'перцы': 'https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?w=600&q=80',
    'картофель': 'https://images.unsplash.com/photo-1518013031637-61c453967b3f?w=600&q=80',
    'омлет': 'https://images.unsplash.com/photo-1510629954389-c1e0da47d415?w=600&q=80',
    'каша': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80',
    'кефир': 'https://images.unsplash.com/photo-1528750955925-53f5a3bc4428?w=600&q=80',
    'йогурт': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80'
  };

  const lowerQ = q.toLowerCase();
  for (const [key, url] of Object.entries(foodMap)) {
    if (lowerQ.includes(key)) return url;
  }

  try {
    const searchUrl = `https://yandex.ru/images/search?text=${encodeURIComponent(q + " еда готовое блюдо на тарелке фуд-фотография")}&type=photo`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 5000
    });

    const matches = response.data.match(/"img_url":"(https:\/\/[^"]+)"/g);
    if (matches && matches.length > 0) {
      let url = matches[0].match(/"img_url":"(https:\/\/[^"]+)"/)[1];
      url = url.replace(/\\u[\dA-F]{4}/gi, (m: string) => String.fromCharCode(parseInt(m.replace(/\\u/g, ''), 16)));
      
      // Use weserv.nl to proxy and resize
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=600&h=400&fit=cover&output=jpg&q=80`;
    }
  } catch (error) {
    console.error("Image search error:", error);
  }

  // Fallback to LoremFlickr (better than nothing)
  return `https://loremflickr.com/600/400/food,${encodeURIComponent(q.split(' ')[0])}`;
}

// Simple in-memory cache with file persistence
let aiCache: Record<string, any> = {};
try {
  if (fs.existsSync(AI_CACHE_FILE)) {
    aiCache = JSON.parse(fs.readFileSync(AI_CACHE_FILE, 'utf-8'));
  }
} catch (e) {
  console.error("Failed to load AI cache", e);
}

function saveCache() {
  try {
    fs.writeFileSync(AI_CACHE_FILE, JSON.stringify(aiCache));
  } catch (e) {
    console.error("Failed to save AI cache", e);
  }
}

// Rate limiter for free AI requests
const freeAiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: "Вы исчерпали лимит. Оформите подписку в нашем Telegram-канале.", isLimit: true },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting if the user provides their own API key
    return !!req.headers['x-user-api-key'];
  }
});


function saveTokens(tokens: Map<string, string>) {
  try {
    const data = Object.fromEntries(tokens);
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save tokens", e);
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.set('trust proxy', 1);
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Economic AI Architecture - Level 3: Caching
  app.post("/api/ai/analyze-image", freeAiLimiter, async (req, res) => {
    const { image_base64, user_credentials, user_scope } = req.body;
    const userApiKey = req.headers['x-user-api-key'] as string;

    if (!image_base64) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Hash the image to check cache
    const imageHash = CryptoJS.SHA256(image_base64).toString();
    if (aiCache[imageHash]) {
      console.log("Serving from cache for image hash:", imageHash);
      return res.json(aiCache[imageHash]);
    }

    try {
      // Level 2: Use GigaChat-Max
      let credentials = userApiKey || user_credentials || process.env.GIGACHAT_CREDENTIALS;
      
      console.log(`AI Request: creds length: ${credentials?.length || 0}, userApiKey: ${!!userApiKey}, user_credentials: ${!!user_credentials}, env: ${!!process.env.GIGACHAT_CREDENTIALS}`);
      const isValidFormat = (creds: string) => {
        if (!creds || creds === 'undefined' || creds === 'null' || creds.length < 50) return false;
        return true;
      };

      if (!isValidFormat(credentials)) {
        console.warn(`Frontend provided invalid credentials (length: ${credentials?.length}). Falling back to ENV.`);
        credentials = process.env.GIGACHAT_CREDENTIALS;
      }
      
      if (!credentials || credentials === 'undefined' || credentials === 'null' || credentials === '') {
        credentials = process.env.GIGACHAT_CREDENTIALS;
      }
      const scope = user_scope || process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

      if (!credentials) {
        console.error("AI Error: No credentials provided");
        return res.status(500).json({ error: "AI credentials not configured" });
      }

      // 1. Get Token
      let authCreds = credentials.trim().replace(/^["']|["']$/g, '');
      if (authCreds.toLowerCase().startsWith('basic ')) {
        authCreds = authCreds.substring(6).trim();
      }
      if (authCreds.includes(':')) {
        authCreds = Buffer.from(authCreds).toString('base64');
      }

      console.log(`Requesting GigaChat token with scope: ${scope}, auth length: ${authCreds.length}`);
      const tokenResponse = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', 
        new URLSearchParams({ scope }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': uuidv4(),
            'Authorization': `Basic ${authCreds}`
          },
          httpsAgent
        }
      );
      const token = tokenResponse.data.access_token;

      // 2. Upload File
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      const buffer = Buffer.from(image_base64.split(',')[1] || image_base64, 'base64');
      console.log('Uploading image to GigaChat, buffer size:', buffer.length);
      form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
      form.append('purpose', 'general');

      const fileResponse = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/files', form, {
        headers: { ...form.getHeaders(), 'Authorization': `Bearer ${token}` },
        httpsAgent
      });
      console.log('Image uploaded, fileId:', fileResponse.data.id);
      const fileId = fileResponse.data.id;

      // 3. Analyze
      const prompt = `Проанализируй это изображение еды. 
      1. Назови блюдо целиком.
      2. Оцени калорийность и БЖУ (белки, жиры, углеводы) для ВСЕЙ порции на фото.
      3. Если это напиток, учти добавки.
      4. Перечисли ингредиенты.
      5. Укажи список распространенных аллергенов, которые могут присутствовать в этом блюде (например: лактоза, глютен, орехи, яйца, соя и т.д.).
      Ответ СТРОГО в формате JSON: {"name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "description": "...", "ingredients": ["..."], "allergens": ["..."]}`;

      const completionResponse = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', 
        {
          model: 'GigaChat-Max',
          messages: [{ role: 'user', content: prompt, attachments: [fileId] }],
          response_format: { type: 'json_object' }
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          httpsAgent
        }
      );

      let content = completionResponse.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let result;
      try {
        result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch (e) {
        console.error("Failed to parse GigaChat JSON response:", content);
        result = {
          name: "Неизвестное блюдо",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          description: "Не удалось распознать блюдо",
          ingredients: [],
          allergens: []
        };
      }
      
      // Ensure name exists
      if (!result.name) result.name = "Блюдо";

      // Fetch a clean image for the identified food
      result.imageUrl = await searchFoodImage(result.name);

      // Cache the result
      aiCache[imageHash] = result;
      saveCache();

      res.json(result);
    } catch (error: any) {
      console.error("AI Analysis Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Ошибка анализа. Попробуйте позже." });
    }
  });

  app.post("/api/ai/analyze-text", freeAiLimiter, async (req, res) => {
    const { query, user_credentials, user_scope } = req.body;
    const userApiKey = req.headers['x-user-api-key'] as string;

    if (!query) return res.status(400).json({ error: "Query is required" });

    const cacheKey = `text_${query.toLowerCase().trim()}`;
    if (aiCache[cacheKey]) return res.json(aiCache[cacheKey]);

    try {
      let credentials = userApiKey || user_credentials || process.env.GIGACHAT_CREDENTIALS;
      
      const isValidFormat = (creds: string) => {
        if (!creds || creds === 'undefined' || creds === 'null' || creds.length < 50) return false;
        return true;
      };

      if (!isValidFormat(credentials)) {
        console.warn(`Frontend provided invalid credentials for text analysis. Falling back to ENV.`);
        credentials = process.env.GIGACHAT_CREDENTIALS;
      }

      if (!credentials || credentials === 'undefined' || credentials === 'null' || credentials === '') {
        credentials = process.env.GIGACHAT_CREDENTIALS;
      }
      const scope = user_scope || process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

      if (!credentials) {
        console.error("AI Text Error: No credentials provided");
        return res.status(500).json({ error: "AI credentials not configured" });
      }

      // Token logic
      let authCreds = credentials.trim().replace(/^["']|["']$/g, '');
      if (authCreds.toLowerCase().startsWith('basic ')) {
        authCreds = authCreds.substring(6).trim();
      }
      if (authCreds.includes(':')) {
        authCreds = Buffer.from(authCreds).toString('base64');
      }
      
      const tokenResponse = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', 
        new URLSearchParams({ scope }).toString(),
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': uuidv4(), 
            'Authorization': `Basic ${authCreds}` 
          },
          httpsAgent
        }
      );
      const token = tokenResponse.data.access_token;

      const prompt = `Проанализируй продукт: "${query}". Укажи калории и БЖУ на 100г. Также укажи список распространенных аллергенов, которые могут присутствовать в этом продукте. Ответ СТРОГО JSON: {"name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "description": "...", "ingredients": ["..."], "allergens": ["..."]}`;

      let completionResponse;
      try {
        completionResponse = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', 
          { model: 'GigaChat-Max', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } },
          { headers: { 'Authorization': `Bearer ${token}` }, httpsAgent }
        );
      } catch (e) {
        console.warn("GigaChat-Max failed, falling back to GigaChat");
        completionResponse = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', 
          { model: 'GigaChat', messages: [{ role: 'user', content: prompt }] },
          { headers: { 'Authorization': `Bearer ${token}` }, httpsAgent }
        );
      }

      let content = completionResponse.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let result;
      try {
        result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        // Fetch image in parallel or immediately after
        result.imageUrl = await searchFoodImage(result.name || query);
      } catch (parseError) {
        console.error("Failed to parse GigaChat JSON response:", content);
        result = {
          name: query,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          description: content.substring(0, 200) + "...",
          ingredients: [],
          imageUrl: await searchFoodImage(query)
        };
      }

      aiCache[cacheKey] = result;
      saveCache();
      res.json(result);
    } catch (error: any) {
      console.error("AI Text Analysis Error:", error.response?.data || error.message);
      const errorMessage = error.response?.status === 401 
        ? "Ошибка авторизации GigaChat. Проверьте ваш API ключ." 
        : "Ошибка анализа текста.";
      res.status(500).json({ error: errorMessage, details: error.response?.data || error.message });
    }
  });

  app.post("/api/ai/daily-insight", freeAiLimiter, async (req, res) => {
    const { meals, profile, workouts, user_credentials, user_scope } = req.body;
    const userApiKey = req.headers['x-user-api-key'] as string;

    try {
      let credentials = userApiKey || user_credentials || process.env.GIGACHAT_CREDENTIALS;
      
      const isValidFormat = (creds: string) => {
        if (!creds || creds === 'undefined' || creds === 'null' || creds.length < 50) return false;
        return true;
      };

      if (!isValidFormat(credentials)) {
        console.warn(`Frontend provided invalid credentials for insight. Falling back to ENV.`);
        credentials = process.env.GIGACHAT_CREDENTIALS;
      }

      if (!credentials || credentials === 'undefined' || credentials === 'null' || credentials === '') {
        credentials = process.env.GIGACHAT_CREDENTIALS;
      }
      const scope = user_scope || process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

      if (!credentials) {
        console.error("AI Insight Error: No credentials provided");
        return res.status(500).json({ error: "AI credentials not configured" });
      }

      // Token logic
      let authCreds = credentials.trim().replace(/^["']|["']$/g, '');
      if (authCreds.toLowerCase().startsWith('basic ')) {
        authCreds = authCreds.substring(6).trim();
      }
      if (authCreds.includes(':')) {
        authCreds = Buffer.from(authCreds).toString('base64');
      }
      
      const tokenResponse = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', 
        new URLSearchParams({ scope }).toString(),
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': uuidv4(), 
            'Authorization': `Basic ${authCreds}` 
          },
          httpsAgent
        }
      );
      const token = tokenResponse.data.access_token;

      const safeMeals = Array.isArray(meals) ? meals : [];
      const safeWorkouts = Array.isArray(workouts) ? workouts : [];

      const mealsSummary = safeMeals.map((m: any) => `${m.name}: ${m.calories}ккал`).join(", ");
      const workoutsSummary = safeWorkouts.map((w: any) => `${w.name}: ${w.caloriesBurned}ккал`).join(", ");
      const profileContext = profile 
        ? `Профиль: ${profile.age} лет, ${profile.gender}, ${profile.weight}кг, цель: ${profile.goal}.`
        : "";

      const prompt = `На основе еды: ${mealsSummary || "нет"}. Тренировки: ${workoutsSummary || "нет"}. ${profileContext} Дай обзор, совет и оценку здоровья (1-100). Ответ СТРОГО JSON: {"summary": "...", "advice": "...", "score": 0}`;

      let completionResponse;
      try {
        completionResponse = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', 
          { model: 'GigaChat-Max', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } },
          { headers: { 'Authorization': `Bearer ${token}` }, httpsAgent }
        );
      } catch (e) {
        console.warn("GigaChat-Max failed for insight, falling back to GigaChat");
        completionResponse = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', 
          { model: 'GigaChat', messages: [{ role: 'user', content: prompt }] },
          { headers: { 'Authorization': `Bearer ${token}` }, httpsAgent }
        );
      }

      let content = completionResponse.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let result;
      try {
        result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        // Add a relevant image for the insight (e.g., based on the advice or summary)
        result.imageUrl = await searchFoodImage(result.advice.split('.')[0] || "здоровое питание");
      } catch (parseError) {
        console.error("Failed to parse GigaChat insight JSON:", content);
        result = {
          summary: "Не удалось сформировать детальный отчет.",
          advice: content.substring(0, 300) + "...",
          score: 50,
          imageUrl: await searchFoodImage("здоровое питание")
        };
      }

      res.json(result);
    } catch (error: any) {
      console.error("AI Insight Error:", error.response?.data || error.message);
      const errorMessage = error.response?.status === 401 
        ? "Ошибка авторизации GigaChat. Проверьте ваш API ключ." 
        : "Ошибка получения рекомендаций.";
      res.status(500).json({ error: errorMessage, details: error.response?.data || error.message });
    }
  });

  // ... existing GigaChat Proxy (keep for backward compatibility if needed, but we'll migrate) ...

  // Persistent storage for demo purposes

  // GigaChat Proxy
  app.post("/api/gigachat/token", async (req, res) => {
    const { credentials: bodyCredentials, scope: bodyScope } = req.body;
    let credentials = bodyCredentials || process.env.GIGACHAT_CREDENTIALS;
    const scope = bodyScope || process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

    if (!credentials) {
      return res.status(500).json({ error: "GIGACHAT_CREDENTIALS is not configured" });
    }

    // Trim whitespace
    credentials = credentials.trim();

    // If credentials contain a colon, encode them
    if (credentials.includes(':')) {
      credentials = Buffer.from(credentials).toString('base64');
    }

    try {
      const response = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', 
        new URLSearchParams({ scope }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': uuidv4(),
            'Authorization': `Basic ${credentials}`
          },
          // GigaChat requires Sber's certificates or ignoring SSL for demo/dev
          httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
        }
      );
      res.json(response.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("GigaChat Token Error Details:", JSON.stringify(errorData, null, 2) || error.message);
      res.status(error.response?.status || 500).json(errorData || { error: error.message });
    }
  });

  app.post("/api/gigachat/completion", async (req, res) => {
    const { token, model, messages, response_format } = req.body;

    if (!token) {
      return res.status(401).json({ error: "GigaChat token is required" });
    }

    try {
      const response = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', 
        {
          model: model || 'GigaChat',
          messages,
          ...(response_format ? { response_format } : {})
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
        }
      );
      res.json(response.data);
    } catch (error: any) {
      console.error("GigaChat completion error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "GigaChat request failed" });
    }
  });

  app.post("/api/gigachat/files", async (req, res) => {
    const { token, file_base64, purpose } = req.body;

    if (!token || !file_base64) {
      return res.status(400).json({ error: "Token and file are required" });
    }

    try {
      // GigaChat requires multipart/form-data for file upload
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      
      // Convert base64 to buffer
      const buffer = Buffer.from(file_base64.split(',')[1] || file_base64, 'base64');
      form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
      form.append('purpose', purpose || 'general');

      const response = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/files', 
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false })
        }
      );
      res.json(response.data);
    } catch (error: any) {
      console.error("GigaChat file upload error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "File upload failed" });
    }
  });

  app.get("/api/images/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    try {
      const url = await searchFoodImage(q.toString());
      return res.json({ url });
    } catch (error) {
      console.error("Image search error:", error);
      res.json({ url: `https://images.unsplash.com/photo-1495195134817-a1a280e01170?w=400&q=80` });
    }
  });

  app.get("/api/images/redirect", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).send("Query is required");

    try {
      const url = await searchFoodImage(q.toString());
      return res.redirect(url);
    } catch (error) {
      console.error("Image search error:", error);
      res.redirect(`https://images.unsplash.com/photo-1495195134817-a1a280e01170?w=400&q=80`);
    }
  });

  // Subscription generation for Telegram Bot
  app.post("/api/subscription/generate", async (req, res) => {
    const { secret_key, days = 30 } = req.body;
    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

    if (!INTERNAL_API_KEY || secret_key !== INTERNAL_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const code = `NUTRI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Use 'subscription_keys' table and 'code' column
        const { error } = await supabase
          .from('subscription_keys')
          .insert([
            { 
              code: code, 
              is_active: true, 
              duration_days: days 
            }
          ]);

        if (error) throw error;
      }

      res.json({ 
        code, 
        expires_in_days: days,
        message: "Code generated and saved to database."
      });
    } catch (error: any) {
      console.error("Failed to generate subscription code:", error);
      res.status(500).json({ error: "Failed to generate code", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
