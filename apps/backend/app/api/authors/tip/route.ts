import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// Request schema for tip recording
const TipRecordSchema = z.object({
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  authorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tipperAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  bookId: z.string().optional(),
  chapterNumber: z.number().optional(),
  message: z.string().optional()
})

// Tip storage interface
interface TipRecord {
  transactionHash: string
  authorAddress: string
  tipperAddress: string
  amount: string
  bookId?: string
  chapterNumber?: number
  message?: string
  timestamp: string
}

// File to store tips (in production, this would be a database)
const TIPS_FILE = join(process.cwd(), 'data', 'tips.json')

// Helper to read tips from file
async function readTips(): Promise<TipRecord[]> {
  try {
    const data = await readFile(TIPS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist yet
    return []
  }
}

// Helper to write tips to file
async function writeTips(tips: TipRecord[]): Promise<void> {
  const dir = join(process.cwd(), 'data')
  await writeFile(join(dir, 'tips.json'), JSON.stringify(tips, null, 2))
}

/**
 * POST /api/authors/tip
 * Record a tip transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = TipRecordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }
    
    const tipData = validationResult.data
    
    // Create tip record
    const tipRecord: TipRecord = {
      ...tipData,
      timestamp: new Date().toISOString()
    }
    
    // Read existing tips
    const tips = await readTips()
    
    // Check if transaction already recorded (prevent duplicates)
    const existingTip = tips.find(tip => tip.transactionHash === tipData.transactionHash)
    if (existingTip) {
      return NextResponse.json({
        success: false,
        error: 'Tip already recorded'
      }, { status: 409 })
    }
    
    // Add new tip
    tips.push(tipRecord)
    
    // Save to file
    await writeTips(tips)
    
    console.log('💰 Tip recorded:', {
      from: tipData.tipperAddress,
      to: tipData.authorAddress,
      amount: tipData.amount,
      bookId: tipData.bookId,
      chapterNumber: tipData.chapterNumber
    })
    
    return NextResponse.json({
      success: true,
      data: tipRecord
    })
    
  } catch (error) {
    console.error('Failed to record tip:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record tip' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/authors/tip?authorAddress=0x...
 * Get tips for a specific author
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorAddress = searchParams.get('authorAddress')
    const bookId = searchParams.get('bookId')
    const chapterNumber = searchParams.get('chapterNumber')
    
    // Read all tips
    const tips = await readTips()
    
    // Filter tips based on query parameters
    let filteredTips = tips
    
    if (authorAddress) {
      filteredTips = filteredTips.filter(
        tip => tip.authorAddress.toLowerCase() === authorAddress.toLowerCase()
      )
    }
    
    if (bookId) {
      filteredTips = filteredTips.filter(tip => tip.bookId === bookId)
    }
    
    if (chapterNumber) {
      filteredTips = filteredTips.filter(
        tip => tip.chapterNumber === parseInt(chapterNumber)
      )
    }
    
    // Calculate total tips
    const totalAmount = filteredTips.reduce((sum, tip) => {
      return sum + parseFloat(tip.amount)
    }, 0)
    
    // Get unique tippers count
    const uniqueTippers = new Set(filteredTips.map(tip => tip.tipperAddress)).size
    
    return NextResponse.json({
      success: true,
      data: {
        tips: filteredTips.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        totalAmount: totalAmount.toFixed(2),
        totalCount: filteredTips.length,
        uniqueTippers
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch tips:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tips' },
      { status: 500 }
    )
  }
}