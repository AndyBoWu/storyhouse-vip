import { NextRequest, NextResponse } from 'next/server'
import { BookOwnershipService } from '@/lib/services/bookOwnershipService'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const bookId = params.bookId
    console.log('🔍 Checking book ownership for:', bookId)
    
    // Get requester address from header
    const userAddress = request.headers.get('x-user-address')
    
    // Get ownership info
    const ownershipInfo = await BookOwnershipService.determineBookOwner(bookId)
    
    // Check if requester can register book IP
    let canRegisterBookIP = false
    if (userAddress) {
      canRegisterBookIP = await BookOwnershipService.canAuthorRegisterBookIP(
        bookId, 
        userAddress.toLowerCase()
      )
    }
    
    // Check if IP registration is pending
    const isPending = await BookOwnershipService.isBookIPRegistrationPending(bookId)
    
    return NextResponse.json({
      success: true,
      data: {
        ...ownershipInfo,
        canRegisterBookIP,
        isPending,
        requesterAddress: userAddress
      }
    })
    
  } catch (error) {
    console.error('Error checking book ownership:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check book ownership'
    }, { status: 500 })
  }
}