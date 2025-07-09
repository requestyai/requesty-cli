import { PDFChatMessage } from './pdf-chat';

export class ConversationManager {
  private messages: PDFChatMessage[] = [];
  private pdfPath: string;
  private pdfFilename: string;

  constructor(pdfPath: string, pdfFilename: string) {
    this.pdfPath = pdfPath;
    this.pdfFilename = pdfFilename;
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  getMessages(): PDFChatMessage[] {
    return [...this.messages];
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  getLastMessage(): PDFChatMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  buildAPIMessages(): any[] {
    const { PDFEncoder } = require('../utils/pdf-encoder');
    
    // First message includes the PDF
    const initialMessage = PDFEncoder.createFileMessage(
      this.pdfPath,
      'Please analyze this PDF document and provide a summary.'
    );

    // Add subsequent conversation messages
    const conversationMessages = this.messages.slice(1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    return [initialMessage, ...conversationMessages];
  }

  getSessionInfo() {
    return {
      pdfPath: this.pdfPath,
      pdfFilename: this.pdfFilename,
      messageCount: this.messages.length,
      lastMessageTime: this.getLastMessage()?.timestamp
    };
  }
}