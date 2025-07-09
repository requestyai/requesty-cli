import fs from 'fs';
import path from 'path';

export class PDFEncoder {
  static readAsBase64(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  }

  static createDataURL(filePath: string): string {
    const base64Data = this.readAsBase64(filePath);
    return `data:application/pdf;base64,${base64Data}`;
  }

  static createFileMessage(filePath: string, initialPrompt: string = 'Please analyze this PDF document and provide a summary.') {
    const filename = path.basename(filePath);
    const dataURL = this.createDataURL(filePath);

    return {
      role: 'user' as const,
      content: [
        {
          type: 'file' as const,
          file: {
            filename: filename,
            file_data: dataURL
          }
        },
        {
          type: 'text' as const,
          text: initialPrompt
        }
      ]
    };
  }
}