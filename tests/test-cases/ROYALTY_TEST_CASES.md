# 🧪 Royalty Distribution System Test Cases

Comprehensive test cases for StoryHouse.vip's royalty distribution system including chapter-level claiming, TIP token integration, analytics, and UI/UX validation.

## 🎯 Test Environment Setup

### Prerequisites
- Frontend: http://localhost:3001
- Backend: http://localhost:3002  
- MetaMask wallet connected
- Test wallet with sufficient balance
- Sample books with chapters created

### Test Data Requirements
```json
{
  "testAuthor": "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2",
  "testBook": "test-detective-portal-001",
  "testChapters": [
    {
      "number": 1,
      "licenseTier": "Free",
      "expectedRoyalty": 0,
      "readReward": 0.05
    },
    {
      "number": 4, 
      "licenseTier": "Premium",
      "unlockPrice": 0.5,
      "expectedRoyalty": 10
    },
    {
      "number": 7,
      "licenseTier": "Exclusive", 
      "unlockPrice": 1.0,
      "expectedRoyalty": 25
    }
  ]
}
```

---

## 🔗 API Endpoint Test Cases

### 1. Royalty Claiming API (`POST /api/royalties/claim`)

#### Test Case 1.1: Valid Royalty Claim
```bash
curl -X POST http://localhost:3002/api/royalties/claim \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "0x1234567890abcdef",
    "authorAddress": "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
  }'
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes `claimId`, `amountClaimed`, `tipTokens`, `transactionHash`
- ✅ TIP token balance increases by claimed amount
- ✅ Response time < 5 seconds

#### Test Case 1.2: Invalid Chapter ID
```bash
curl -X POST http://localhost:3002/api/royalties/claim \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "invalid-chapter-id",
    "authorAddress": "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
  }'
```

**Expected Results:**
- ❌ Status: 400 Bad Request
- ❌ Error message: "Invalid chapter ID format"
- ❌ Includes troubleshooting suggestions

#### Test Case 1.3: Unauthorized Author
```bash
curl -X POST http://localhost:3002/api/royalties/claim \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "0x1234567890abcdef",
    "authorAddress": "0x0000000000000000000000000000000000000000"
  }'
```

**Expected Results:**
- ❌ Status: 403 Forbidden
- ❌ Error: "Not authorized to claim royalties for this chapter"

#### Test Case 1.4: No Claimable Amount
```bash
curl -X POST http://localhost:3002/api/royalties/claim \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "0xfreechapter123",
    "authorAddress": "0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
  }'
```

**Expected Results:**
- ❌ Status: 400 Bad Request  
- ❌ Error: "No claimable royalties available"
- ❌ Amount should be 0 for free chapters

#### Test Case 1.5: Rate Limiting
Execute 11 rapid requests within 1 hour:

**Expected Results:**
- ✅ First 10 requests: 200 OK
- ❌ 11th request: 429 Too Many Requests
- ❌ Error: "Rate limit exceeded: 10 claims per hour"

### 2. Claimable Royalties API (`GET /api/royalties/claimable/[chapterId]`)

#### Test Case 2.1: Check Premium Chapter
```bash
curl -X GET "http://localhost:3002/api/royalties/claimable/0x1234567890abcdef"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes `claimableAmount`, `totalRevenue`, `royaltyPercentage`
- ✅ `licenseTier` matches chapter configuration  
- ✅ Calculation: `claimableAmount = totalRevenue * (royaltyPercentage/100) - previouslyClaimed`

#### Test Case 2.2: Check Free Chapter
```bash
curl -X GET "http://localhost:3002/api/royalties/claimable/0xfreechapter123"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ `claimableAmount` = 0
- ✅ `royaltyPercentage` = 0
- ✅ `licenseTier` = "Free"

#### Test Case 2.3: Non-existent Chapter
```bash
curl -X GET "http://localhost:3002/api/royalties/claimable/0xnonexistent"
```

**Expected Results:**
- ❌ Status: 404 Not Found
- ❌ Error: "Chapter not found"

#### Test Case 2.4: Caching Validation
Execute same request twice within 30 seconds:

**Expected Results:**
- ✅ First request: Fresh data from calculation
- ✅ Second request: Cached data (same response, faster)
- ✅ Response time difference > 200ms

### 3. Royalty History API (`GET /api/royalties/history/[authorAddress]`)

#### Test Case 3.1: Complete History
```bash
curl -X GET "http://localhost:3002/api/royalties/history/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes `totalClaimed`, `totalPending`, `claimCount`, `history[]`
- ✅ History sorted by `claimedAt` (newest first)
- ✅ Analytics includes `averageClaimAmount`, `monthlyTrend`

#### Test Case 3.2: Pagination
```bash
curl -X GET "http://localhost:3002/api/royalties/history/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2?limit=10&offset=20"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Returns exactly 10 items (or remaining if less)
- ✅ Items are different from first 20

#### Test Case 3.3: Filtering by Status
```bash
curl -X GET "http://localhost:3002/api/royalties/history/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2?status=completed"
```

**Expected Results:**
- ✅ All returned items have `status: "completed"`
- ✅ No pending or failed claims included

#### Test Case 3.4: Date Range Filtering
```bash
curl -X GET "http://localhost:3002/api/royalties/history/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2?startDate=2024-01-01&endDate=2024-12-31"
```

**Expected Results:**
- ✅ All claims within specified date range
- ✅ Date validation for ISO format

### 4. Royalty Preview API (`GET /api/royalties/preview`)

#### Test Case 4.1: Economic Analysis
```bash
curl -X GET "http://localhost:3002/api/royalties/preview?authorAddress=0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ `totalClaimable` matches sum of all claimable chapters
- ✅ `projectedEarnings` includes next week/month with confidence scores
- ✅ `recommendations[]` provides actionable insights
- ✅ `tier_analysis` compares Free/Premium/Exclusive performance

#### Test Case 4.2: Optimization Recommendations
Verify recommendation logic:

**Expected Results:**
- ✅ Low-performing free chapters suggest Premium upgrade
- ✅ High-engagement Premium chapters suggest Exclusive upgrade  
- ✅ Recommendations include revenue projections
- ✅ Risk assessment considers market conditions

---

## 🎨 Frontend UI/UX Test Cases

### 5. Royalty Dashboard (`/creator/royalties`)

#### Test Case 5.1: Dashboard Loading
1. Navigate to `/creator/royalties`
2. Connect wallet with test author address

**Expected Results:**
- ✅ Page loads within 3 seconds
- ✅ All tabs visible: Claimable, History, Analytics, Derivatives
- ✅ Wallet connection status shown
- ✅ Loading states for data fetching

#### Test Case 5.2: Claimable Tab Functionality
1. Click "Claimable" tab
2. Verify chapter list displays

**Expected Results:**
- ✅ Shows all chapters with claimable amounts > 0
- ✅ Each chapter shows: title, claimable amount, license tier
- ✅ "Claim" buttons enabled for valid amounts
- ✅ "Claim All" button shows total claimable

#### Test Case 5.3: Individual Chapter Claiming
1. Click "Claim" button for specific chapter
2. Confirm transaction in MetaMask
3. Wait for completion

**Expected Results:**
- ✅ Loading state during transaction
- ✅ Success notification on completion
- ✅ Chapter removed from claimable list  
- ✅ Balance updates immediately
- ✅ Transaction hash displayed

#### Test Case 5.4: Claim All Functionality
1. Click "Claim All" button
2. Confirm batch transaction

**Expected Results:**
- ✅ Batch transaction initiated
- ✅ Progress indicator for multiple claims
- ✅ Success summary with total claimed
- ✅ All claimable chapters cleared

#### Test Case 5.5: History Tab
1. Click "History" tab
2. Verify claim history displays

**Expected Results:**
- ✅ Chronological list of past claims
- ✅ Each entry shows: date, chapter, amount, transaction hash
- ✅ Pagination for large datasets
- ✅ Filter options: date range, chapter, status

#### Test Case 5.6: Analytics Tab
1. Click "Analytics" tab
2. Verify charts and metrics display

**Expected Results:**
- ✅ Revenue overview chart
- ✅ License tier performance comparison
- ✅ Monthly trends visualization
- ✅ Optimization recommendations panel
- ✅ ROI analysis with break-even projections

#### Test Case 5.7: Error Handling
1. Disconnect wallet during claim process
2. Try claiming with insufficient gas

**Expected Results:**
- ❌ Clear error messages displayed
- ❌ Retry options provided
- ❌ No partial state corruption
- ❌ Graceful fallback to previous state

---

## 💰 TIP Token Integration Test Cases

### 6. TIP Token Balance & Transfers

#### Test Case 6.1: Balance Validation
```bash
curl -X GET "http://localhost:3002/api/debug/tip-balance/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
```

**Expected Results:**
- ✅ Returns current TIP token balance
- ✅ Balance format: decimal with 18 precision
- ✅ Caching works (30-second TTL)

#### Test Case 6.2: Transfer Execution
Trigger royalty claim and verify transfer:

**Expected Results:**
- ✅ TIP tokens transferred from platform to author
- ✅ 1:1 ratio maintained (1 ETH = 1 TIP)
- ✅ Gas fees calculated correctly
- ✅ Platform fee (5%) deducted properly

#### Test Case 6.3: Batch Transfer Optimization
Claim multiple chapters simultaneously:

**Expected Results:**  
- ✅ Single batch transaction instead of multiple
- ✅ Gas savings compared to individual claims
- ✅ All transfers execute atomically

---

## 📊 Economic Calculation Test Cases

### 7. License Tier Economics

#### Test Case 7.1: Royalty Rate Validation
For each license tier, verify royalty calculations:

**Free License:**
- ✅ Royalty rate: 0%
- ✅ Claimable amount: Always 0
- ✅ Reader reward: 0.05 TIP per read

**Premium License:**  
- ✅ Royalty rate: 10%
- ✅ Calculation: `revenue * 0.10 - platform_fee`
- ✅ Commercial use allowed

**Exclusive License:**
- ✅ Royalty rate: 25% 
- ✅ Calculation: `revenue * 0.25 - platform_fee`
- ✅ Full rights granted

#### Test Case 7.2: Revenue Breakdown
For a chapter with 100 TIP revenue:

**Expected Results:**
- ✅ Platform fee: 5 TIP (5%)
- ✅ Premium royalty: 9.5 TIP (10% of 95 TIP)  
- ✅ Exclusive royalty: 23.75 TIP (25% of 95 TIP)

#### Test Case 7.3: Economic Projections
Test 12-month forecasting:

**Expected Results:**
- ✅ Conservative, optimistic, realistic scenarios
- ✅ Growth rate calculations based on historical data
- ✅ Break-even analysis for license tier upgrades
- ✅ Risk assessment and confidence intervals

---

## 🔔 Notification System Test Cases

### 8. Royalty Notifications

#### Test Case 8.1: Claim Ready Notifications
```bash
curl -X GET "http://localhost:3002/api/royalties/notifications/0x3873c0d1bcfa245773b13b694a49dac5b3f03ca2"
```

**Expected Results:**
- ✅ Notifications for chapters with claimable amounts > threshold
- ✅ Real-time delivery < 2 seconds
- ✅ Proper categorization and priority levels

#### Test Case 8.2: Optimization Notifications  
When analytics detects optimization opportunities:

**Expected Results:**
- ✅ Suggestions for license tier upgrades
- ✅ Revenue projections included
- ✅ User preferences respected

---

## 🧪 Performance & Load Test Cases

### 9. System Performance

#### Test Case 9.1: Response Time Requirements
- ✅ API endpoints: < 2 seconds
- ✅ Blockchain operations: < 5 seconds  
- ✅ Dashboard loading: < 3 seconds
- ✅ Cached requests: < 500ms

#### Test Case 9.2: Concurrent Claims
Simulate 10 simultaneous claims:

**Expected Results:**
- ✅ All transactions process successfully
- ✅ No race conditions in balance updates
- ✅ Proper error handling for conflicts

#### Test Case 9.3: Large Dataset Handling
Test with author having 1000+ claim history:

**Expected Results:**
- ✅ Pagination works efficiently
- ✅ No memory leaks in frontend
- ✅ Database queries optimized

---

## 🔒 Security Test Cases

### 10. Security & Authorization

#### Test Case 10.1: Authorization Validation
Attempt to claim royalties for different author:

**Expected Results:**
- ❌ Blocked with 403 Forbidden
- ❌ Wallet verification enforced
- ❌ No data leakage in error responses

#### Test Case 10.2: Input Validation
Send malformed requests:

**Expected Results:**
- ❌ All inputs sanitized and validated
- ❌ SQL injection attempts blocked
- ❌ XSS prevention in frontend

#### Test Case 10.3: Rate Limiting
Exceed API limits:

**Expected Results:**
- ❌ 429 status for rate limit violations
- ❌ Proper cooldown periods enforced
- ❌ No service degradation

---

## 📝 Test Execution Checklist

### Pre-Test Setup
- [ ] Development servers running (frontend:3001, backend:3002)
- [ ] MetaMask configured with testnet
- [ ] Test wallet has sufficient balance
- [ ] Sample books and chapters created
- [ ] Database/storage cleaned for fresh test data

### API Test Execution  
- [ ] All royalty claiming endpoints tested
- [ ] Claimable amount calculations verified
- [ ] History and analytics APIs validated
- [ ] Error handling and edge cases covered
- [ ] Rate limiting and security tests passed

### Frontend Test Execution
- [ ] Dashboard functionality verified
- [ ] All tabs and features tested
- [ ] Error states and loading handled
- [ ] Mobile responsiveness checked
- [ ] Cross-browser compatibility verified

### Integration Test Execution
- [ ] End-to-end claim workflows tested
- [ ] TIP token integration verified  
- [ ] Blockchain operations validated
- [ ] Notification system tested
- [ ] Performance requirements met

### Post-Test Validation
- [ ] No data corruption detected
- [ ] All balances reconciled correctly
- [ ] Error logs reviewed and addressed
- [ ] Performance metrics within targets
- [ ] Security vulnerabilities addressed

---

## 🎯 Success Criteria

**✅ All test cases must pass with:**
- Correct functional behavior
- Performance within specified limits  
- Proper error handling and user feedback
- Security and authorization enforcement
- Data consistency and integrity maintained

**📊 Key Metrics:**
- API response times < 2s (95th percentile)
- UI loading times < 3s
- Zero critical security vulnerabilities
- 99.9% uptime during testing period
- Error rates < 0.1%

This comprehensive test suite ensures the royalty distribution system meets all functional, performance, security, and user experience requirements for production deployment.