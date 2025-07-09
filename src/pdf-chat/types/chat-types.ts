export interface PDFContent {
  text: string;
  markdown: string;
  pages: number;
  filename: string;
  wordCount: number;
  characterCount: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'system' | 'pdf_upload' | 'user_question' | 'assistant_response';
    pdfIncluded?: boolean;
    messageLength?: number;
  };
}

export interface PDFChatSession {
  id: string;
  pdfPath: string;
  pdfContent: PDFContent;
  messages: ChatMessage[];
  model: string;
  created: Date;
  lastActivity: Date;
  status: 'initializing' | 'ready' | 'processing' | 'error' | 'completed';
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
}

export interface PDFChatConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  includeSystemPrompt: boolean;
  conversationHistory: boolean;
}