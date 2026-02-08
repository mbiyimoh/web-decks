import { NextResponse } from 'next/server';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import type { FileUploadResponse } from '@/lib/clarity-canvas/types';

// Must use Node.js runtime for pdf-parse and mammoth (use Buffer, fs, etc.)
export const runtime = 'nodejs';

const MAX_SIZE_PDF_DOC = 5 * 1024 * 1024; // 5MB for pdf/doc/docx
const MAX_SIZE_TEXT = 1 * 1024 * 1024; // 1MB for txt/md
const MAX_CHARS = 50000; // Maximum character count before truncation

const ALLOWED_EXTENSIONS = ['txt', 'md', 'pdf', 'doc', 'docx'];
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * POST /api/clarity-canvas/upload
 * Extract text from uploaded files (txt, md, pdf, doc, docx)
 */
export async function POST(request: Request): Promise<NextResponse<FileUploadResponse | { error: string }>> {
  // Auth check
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file MIME type' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = ['pdf', 'doc', 'docx'].includes(ext) ? MAX_SIZE_PDF_DOC : MAX_SIZE_TEXT;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Convert to Buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text based on file type
    let text: string;

    switch (ext) {
      case 'txt':
        text = buffer.toString('utf-8');
        break;

      case 'md': {
        const rawText = buffer.toString('utf-8');
        // Strip markdown formatting to plain text
        const removeMd = (await import('remove-markdown')).default;
        text = removeMd(rawText);
        break;
      }

      case 'pdf': {
        const { PDFParse } = await import('pdf-parse');
        try {
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          text = result.text;
        } catch (error) {
          console.error('[upload] PDF parsing failed:', error);
          return NextResponse.json(
            { error: 'Failed to parse PDF. The file may be corrupted or password-protected.' },
            { status: 400 }
          );
        }
        break;
      }

      case 'doc':
      case 'docx': {
        const mammoth = (await import('mammoth')).default;
        try {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } catch (error) {
          console.error('[upload] Word document parsing failed:', error);
          return NextResponse.json(
            { error: 'Failed to parse Word document. The file may be corrupted or password-protected.' },
            { status: 400 }
          );
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Validate extracted text is not empty
    const trimmedText = text.trim();
    if (!trimmedText) {
      // Special message for PDFs (likely scanned)
      if (ext === 'pdf') {
        return NextResponse.json(
          { error: "This PDF doesn't contain extractable text. Try a text-based PDF or convert scanned content using OCR." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'File appears to be empty or contains no readable text.' },
        { status: 400 }
      );
    }

    // Truncate if exceeds max characters
    let wasTruncated = false;
    let finalText = trimmedText;
    if (trimmedText.length > MAX_CHARS) {
      finalText = trimmedText.slice(0, MAX_CHARS);
      wasTruncated = true;
    }

    // Return extracted text
    return NextResponse.json({
      text: finalText,
      filename: file.name,
      charCount: finalText.length,
      fileType: file.type,
      wasTruncated,
    });

  } catch (error) {
    console.error('[upload] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process file. Please try again.' },
      { status: 500 }
    );
  }
}
