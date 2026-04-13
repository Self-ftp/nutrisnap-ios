import axios from 'axios';
import { AnalysisResult, DailyInsight, Meal, UserProfile, Workout } from "../types";

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  
  // If we're on a web origin (not file:// or localhost), use it
  if (typeof window !== 'undefined' && 
      window.location.origin && 
      !window.location.origin.startsWith('file://') && 
      !window.location.origin.includes('localhost') &&
      !window.location.origin.includes('127.0.0.1')) {
    return window.location.origin;
  }
  
  return 'https://ais-dev-5g3inc7rlu5obs2ydne53m-27627784540.europe-west2.run.app';
};

export const API_BASE_URL = getBaseUrl();

console.log('AI Service initialized with API_BASE_URL:', API_BASE_URL);

export async function analyzeFoodImage(
  base64Image: string, 
  customCredentials?: string, 
  customScope?: string
): Promise<AnalysisResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ai/analyze-image`, {
      image_base64: base64Image,
      user_credentials: customCredentials,
      user_scope: customScope
    }, {
      headers: {
        'x-user-api-key': customCredentials || ''
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("AI image analysis failed:", error);
    const data = error.response?.data || {};
    const message = data.error || "Ошибка анализа изображения. Попробуйте еще раз.";
    const err: any = new Error(message);
    if (data.isLimit) err.isLimit = true;
    throw err;
  }
}

export async function analyzeFoodText(
  query: string, 
  customCredentials?: string, 
  customScope?: string
): Promise<AnalysisResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ai/analyze-text`, {
      query,
      user_credentials: customCredentials,
      user_scope: customScope
    }, {
      headers: {
        'x-user-api-key': customCredentials || ''
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("AI text analysis failed:", error);
    const data = error.response?.data || {};
    const message = data.error || "Ошибка анализа текста.";
    const err: any = new Error(message);
    if (data.isLimit) err.isLimit = true;
    throw err;
  }
}

export async function getDailyInsight(
  meals: Meal[], 
  profile: UserProfile | null, 
  workouts: Workout[] = [],
  customCredentials?: string,
  customScope?: string
): Promise<DailyInsight> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ai/daily-insight`, {
      meals,
      profile,
      workouts,
      user_credentials: customCredentials,
      user_scope: customScope
    }, {
      headers: {
        'x-user-api-key': customCredentials || ''
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("AI insight failed:", error);
    const data = error.response?.data || {};
    const message = data.error || "Не удалось получить рекомендации.";
    const err: any = new Error(message);
    if (data.isLimit) err.isLimit = true;
    throw err;
  }
}

export async function fetchFoodImage(query: string): Promise<string> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/images/search?q=${encodeURIComponent(query)}`);
    return response.data.url;
  } catch (error) {
    console.error("Failed to fetch food image:", error);
    return `https://images.unsplash.com/photo-1495195134817-a1a280e01170?w=400&q=80`;
  }
}
