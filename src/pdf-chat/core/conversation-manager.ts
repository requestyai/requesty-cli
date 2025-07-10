import { PDF_EXPERT_SYSTEM_PROMPT } from '../prompts/system-prompt';
import { ChatMessage, PDFChatSession } from '../types/chat-types';

export class ConversationManager {
  private session: PDFChatSession;

  constructor(session: PDFChatSession) {
    this.session = session;
  }

  initializeConversation(): void {
    // Add system prompt
    this.addMessage({
      role: 'system',
      content: PDF_EXPERT_SYSTEM_PROMPT,
      timestamp: new Date(),
      metadata: {
        type: 'system',
        messageLength: PDF_EXPERT_SYSTEM_PROMPT.length,
      },
    });
  }

  addUserQuestionWithPDF(question: string): void {
    const pdfContextMessage = this.formatPDFWithQuestion(question);

    this.addMessage({
      role: 'user',
      content: pdfContextMessage,
      timestamp: new Date(),
      metadata: {
        type: 'pdf_upload',
        pdfIncluded: true,
        messageLength: pdfContextMessage.length,
      },
    });
  }

  addUserQuestion(question: string): void {
    this.addMessage({
      role: 'user',
      content: question,
      timestamp: new Date(),
      metadata: {
        type: 'user_question',
        pdfIncluded: false,
        messageLength: question.length,
      },
    });
  }

  addAssistantResponse(response: string): void {
    this.addMessage({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        type: 'assistant_response',
        messageLength: response.length,
      },
    });
  }

  private addMessage(message: ChatMessage): void {
    this.session.messages.push(message);
    this.session.lastActivity = new Date();
  }

  private formatPDFWithQuestion(question: string): string {
    const { pdfContent } = this.session;

    return `I have a PDF document that I need your expert analysis on. Here are the document details:

**Document**: ${pdfContent.filename}
**Pages**: ${pdfContent.pages}
**Word Count**: ${pdfContent.wordCount.toLocaleString()}
**Character Count**: ${pdfContent.characterCount.toLocaleString()}

**DOCUMENT CONTENT:**
---
${pdfContent.markdown}
---

**MY QUESTION:**
${question}

Please provide your expert analysis based on the document content above.`;
  }

  getMessagesForAPI(): Array<{ role: string; content: string }> {
    return this.session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  getConversationSummary(): {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    totalCharacters: number;
    pdfIncluded: boolean;
  } {
    const messages = this.session.messages;

    return {
      totalMessages: messages.length,
      userQuestions: messages.filter((m) => m.role === 'user').length,
      assistantResponses: messages.filter((m) => m.role === 'assistant').length,
      totalCharacters: messages.reduce((sum, m) => sum + m.content.length, 0),
      pdfIncluded: messages.some((m) => m.metadata?.pdfIncluded),
    };
  }

  getLastMessage(): ChatMessage | null {
    return this.session.messages.length > 0
      ? this.session.messages[this.session.messages.length - 1]
      : null;
  }

  hasMessages(): boolean {
    return this.session.messages.length > 0;
  }

  getMessageCount(): number {
    return this.session.messages.length;
  }
}
