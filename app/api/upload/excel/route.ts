import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const username = await getUserFromCookie()
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    const sheetsData: Record<string, unknown[]> = {}
    const sheetsSummary: { name: string; rowCount: number; columns: string[] }[] = []

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      sheetsData[sheetName] = jsonData
      
      const columns = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : []
      sheetsSummary.push({
        name: sheetName,
        rowCount: jsonData.length,
        columns
      })
    }

    const formattedContext = formatForAIContext(sheetsData, sheetsSummary)

    return NextResponse.json({
      success: true,
      fileName: file.name,
      sheets: sheetsSummary,
      formattedContext,
      rawData: sheetsData
    })
  } catch (error) {
    console.error('Excel parsing error:', error)
    return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 500 })
  }
}

function formatForAIContext(
  data: Record<string, unknown[]>,
  summary: { name: string; rowCount: number; columns: string[] }[]
): string {
  let context = '=== UPLOADED DATA CONTEXT ===\n\n'

  for (const sheet of summary) {
    const sheetData = data[sheet.name]
    context += `## ${sheet.name.toUpperCase()} DATA\n`
    context += `Columns: ${sheet.columns.join(', ')}\n`
    context += `Total Records: ${sheet.rowCount}\n\n`

    if (sheetData && sheetData.length > 0) {
      const maxRows = Math.min(sheetData.length, 10)
      for (let i = 0; i < maxRows; i++) {
        const row = sheetData[i] as Record<string, unknown>
        const rowStr = Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ')
        context += `- ${rowStr}\n`
      }
      
      if (sheetData.length > 10) {
        context += `... and ${sheetData.length - 10} more records\n`
      }
    }
    context += '\n'
  }

  return context.trim()
}
