import { PDFParse } from 'pdf-parse'

/**
 * Parse PDF file and extract text content
 * @param file - PDF file to parse
 * @returns Extracted text content
 */
export async function parsePdfFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const parser = new PDFParse({ data: uint8Array })
    const textResult = await parser.getText()
    return textResult.text
  } catch (error) {
    console.error('Failed to parse PDF:', error)
    throw new Error('PDF 解析失败')
  }
}

/**
 * Validate file type for upload
 * @param file - File to validate
 * @returns true if file type is allowed
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = ['.txt', '.md', '.pdf']
  return allowedTypes.some(type => file.name.toLowerCase().endsWith(type))
}

/**
 * Get file extension
 * @param filename - File name
 * @returns File extension including dot
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot >= 0 ? filename.slice(lastDot) : ''
}
