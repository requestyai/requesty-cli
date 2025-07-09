import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

export interface PDFContent {
  text: string;
  markdown: string;
  pages: number;
  filename: string;
}

export class PDFToMarkdownConverter {
  static async convertPDFToMarkdown(filePath: string): Promise<PDFContent> {
    try {
      // Read the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      
      // Parse PDF
      const data = await pdf(dataBuffer);
      
      // Extract text content
      const rawText = data.text;
      
      // Convert to markdown format
      const markdown = this.textToMarkdown(rawText);
      
      return {
        text: rawText,
        markdown,
        pages: data.numpages,
        filename: path.basename(filePath)
      };
    } catch (error) {
      throw new Error(`Failed to convert PDF to markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static textToMarkdown(text: string): string {
    // Clean up the text
    let markdown = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();

    // Split into lines for processing
    const lines = markdown.split('\n');
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        processedLines.push('');
        continue;
      }

      // Detect headings (lines that are all caps or have specific patterns)
      if (this.isHeading(line)) {
        processedLines.push(`## ${line}`);
      }
      // Detect bullet points
      else if (this.isBulletPoint(line)) {
        processedLines.push(`- ${line.replace(/^[-•*]\s*/, '')}`);
      }
      // Detect numbered lists
      else if (this.isNumberedList(line)) {
        processedLines.push(line);
      }
      // Regular paragraph
      else {
        processedLines.push(line);
      }
    }

    return processedLines.join('\n');
  }

  private static isHeading(line: string): boolean {
    // Check if line is likely a heading
    return (
      line.length > 0 &&
      line.length < 100 &&
      (
        line === line.toUpperCase() ||
        /^\d+\.\s/.test(line) ||
        /^(CHAPTER|SECTION|PART|INTRODUCTION|CONCLUSION|SUMMARY|ABSTRACT|REFERENCES|BIBLIOGRAPHY)/i.test(line)
      )
    );
  }

  private static isBulletPoint(line: string): boolean {
    return /^[-•*]\s/.test(line);
  }

  private static isNumberedList(line: string): boolean {
    return /^\d+\.\s/.test(line);
  }

  static formatForChat(content: PDFContent, userPrompt: string): string {
    return `I have a PDF document called "${content.filename}" with ${content.pages} pages. Here's the content in markdown format:

---

${content.markdown}

---

${userPrompt}`;
  }
}