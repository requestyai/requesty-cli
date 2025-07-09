import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { PDFContent } from '../types/chat-types';

export class PDFConverter {
  static async convertToMarkdown(filePath: string): Promise<PDFContent> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      
      const rawText = pdfData.text;
      const markdown = this.formatAsMarkdown(rawText);
      
      return {
        text: rawText,
        markdown,
        pages: pdfData.numpages,
        filename: path.basename(filePath),
        wordCount: this.countWords(rawText),
        characterCount: rawText.length
      };
    } catch (error) {
      throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static formatAsMarkdown(text: string): string {
    let markdown = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const lines = markdown.split('\n');
    const formattedLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        formattedLines.push('');
        continue;
      }

      if (this.isHeading(trimmedLine)) {
        formattedLines.push(`## ${trimmedLine}`);
      } else if (this.isBulletPoint(trimmedLine)) {
        formattedLines.push(`- ${trimmedLine.replace(/^[-•*]\s*/, '')}`);
      } else if (this.isNumberedItem(trimmedLine)) {
        formattedLines.push(trimmedLine);
      } else {
        formattedLines.push(trimmedLine);
      }
    }

    return formattedLines.join('\n');
  }

  private static isHeading(line: string): boolean {
    return (
      line.length > 0 &&
      line.length < 120 &&
      (
        line === line.toUpperCase() ||
        /^\d+\.\s/.test(line) ||
        /^(CHAPTER|SECTION|PART|INTRODUCTION|CONCLUSION|SUMMARY|ABSTRACT|REFERENCES|BIBLIOGRAPHY|METHODOLOGY|RESULTS|DISCUSSION|APPENDIX)/i.test(line)
      )
    );
  }

  private static isBulletPoint(line: string): boolean {
    return /^[-•*]\s/.test(line);
  }

  private static isNumberedItem(line: string): boolean {
    return /^\d+\.\s/.test(line);
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}