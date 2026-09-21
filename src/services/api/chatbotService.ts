import axiosClient from './axiosClient';
import type { ProductResponse } from './productService';

export interface ChatbotChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatbotChatResponse {
  reply: string;
  suggestedProducts: ProductResponse[];
  suggestions: string[];
  action?: string;
  actionProductId?: number;
}

export interface ChatbotConfig {
  id?: number;
  apiKey: string;
  provider: string; 
  systemPrompt: string;
  faqData: string;
  status?: number;
}

export interface TopQuestion {
  question: string;
  count: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  slug: string;
  thumbnail: string;
  count: number;
}

export interface ChatbotAnalytics {
  totalChats: number;
  totalSessions: number;
  conversionRate: number;
  topQuestions: TopQuestion[];
  topSuggestedProducts: TopProduct[];
}

export interface ChatbotMessage {
  id: number;
  sessionId: string;
  sender: 'USER' | 'AI';
  message: string;
  productSuggestedId?: number;
  createdAt: string;
}

const chatbotService = {
  // Base URL already includes /api — paths here must NOT repeat /api prefix.
  // axiosClient response interceptor already unwraps response.data, so we return the result directly.
  chat: (message: string, sessionId: string): Promise<ChatbotChatResponse> => {
    return axiosClient.post('/chatbot/chat', { message, sessionId });
  },

  getConfig: (): Promise<ChatbotConfig> => {
    return axiosClient.get('/admin/chatbot/config');
  },

  saveConfig: (config: ChatbotConfig): Promise<ChatbotConfig> => {
    return axiosClient.put('/admin/chatbot/config', config);
  },

  getAnalytics: (): Promise<ChatbotAnalytics> => {
    return axiosClient.get('/admin/chatbot/analytics');
  },

  getHistory: (): Promise<ChatbotMessage[]> => {
    return axiosClient.get('/admin/chatbot/history');
  },

  clearHistory: (): Promise<void> => {
    return axiosClient.delete('/admin/chatbot/history');
  }
};

export default chatbotService;
