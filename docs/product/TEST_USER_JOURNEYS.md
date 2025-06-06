# StoryHouse User Journey Testing Plan

## 🎯 **Test Environment**

- **Network**: Story Protocol Aeneid Testnet (Chain ID: 1315)
- **Frontend**: http://localhost:3001
- **Explorer**: https://aeneid.storyscan.xyz
- **Faucet**: https://aeneid.faucet.story.foundation/

## 📋 **Prerequisites for Testing**

1. ✅ MetaMask wallet installed
2. ✅ Story Protocol Aeneid testnet added to MetaMask
3. ✅ Test IP tokens for gas fees (from faucet)
4. ✅ Frontend running on localhost:3001
5. ✅ All 6 contracts deployed and operational

---

## 🚀 **User Journey 1: Wallet Connection & Network Setup**

### **Test Steps:**

1. **Visit Application**

   - Navigate to `http://localhost:3001`
   - Verify homepage loads correctly
   - Check that "Connect Wallet" button is visible

2. **Connect Wallet**

   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Verify wallet address displays correctly
   - Check network auto-switch to Story Protocol Aeneid

3. **Verify Balances**
   - Confirm IP token balance shows (for gas)
   - Confirm TIP token balance shows (initially 0)
   - Check wallet details popup functionality

### **Expected Results:**

- ✅ Wallet connects successfully
- ✅ Network switches to Aeneid testnet automatically
- ✅ Balances display correctly
- ✅ Wallet address truncated and copyable

### **Test Data to Record:**

- Wallet address: `________________`
- IP balance: `________________`
- TIP balance: `________________`

---

## 🎨 **User Journey 2: Story Creation & Rewards**

### **Test Steps:**

1. **Navigate to Create Story**

   - Go to `/create` page
   - Verify story creation form loads
   - Check AI assistance functionality

2. **Create a Test Story**

   - Fill in story details:
     - Title: "Test Story for Rewards"
     - Content: Sample story content
     - Theme/Genre selection
   - Submit story creation

3. **Navigate to Rewards Dashboard**

   - Go to `/rewards` page
   - Connect wallet if not already connected
   - Navigate to "Claim Rewards" tab

4. **Claim Story Creation Reward**

   - Enter story title: "Test Story for Rewards"
   - Click "Claim Story Creation Reward (50 TIP)"
   - Approve MetaMask transaction
   - Wait for transaction confirmation

5. **Verify Reward Received**
   - Check TIP balance increased by 50
   - Verify transaction on StoryScan explorer
   - Check "Stories Created" counter updated

### **Expected Results:**

- ✅ Story creation form works correctly
- ✅ Reward claiming transaction succeeds
- ✅ TIP balance increases by 50 tokens
- ✅ User stats update correctly

### **Test Data to Record:**

- Story title: `________________`
- Transaction hash: `________________`
- TIP balance before: `________________`
- TIP balance after: `________________`

---

## 📚 **User Journey 3: Reading & Chapter Rewards**

### **Test Steps:**

1. **Simulate Reading Session**

   - Stay on `/rewards` page, "Claim Rewards" tab
   - Click "Start Reading (Demo)" button
   - Approve MetaMask transaction for reading session
   - Wait for confirmation

2. **Claim Chapter Reading Reward**

   - Click "Claim Chapter Reward (10 TIP)" button
   - Approve MetaMask transaction
   - Wait for transaction confirmation

3. **Verify Reading Rewards**

   - Check TIP balance increased by 10
   - Verify transaction on StoryScan explorer
   - Check reading streak counter (should be 1)

4. **Test Multiple Chapter Reads**
   - Repeat reading/claiming process 2-3 times
   - Verify each claim works correctly
   - Check streak bonuses (if implemented)

### **Expected Results:**

- ✅ Reading session starts successfully
- ✅ Chapter reward claiming works
- ✅ TIP balance increases by 10 per chapter
- ✅ Reading streak updates correctly

### **Test Data to Record:**

- Reading session tx: `________________`
- Chapter reward tx: `________________`
- TIP balance change: `________________`
- Reading streak: `________________`

---

## 📊 **User Journey 4: Dashboard Analytics & Stats**

### **Test Steps:**

1. **Overview Tab Testing**

   - Navigate to "Overview" tab in rewards dashboard
   - Verify all balance cards display correctly:
     - TIP Balance (should show current balance)
     - Total Earned (should show cumulative rewards)
     - Reading Streak (should show current streak)

2. **Activity Summary Verification**

   - Check "Stories Created" count
   - Check "Chapters Read" count
   - Verify "Global TIP Distributed" shows network total
   - Confirm "Active Contracts" shows 6

3. **Quick Links Testing**

   - Click "View TIP Token Contract" link
   - Verify StoryScan opens with correct contract
   - Click "Get Test Tokens" link
   - Verify faucet opens correctly

4. **Statistics Tab Testing**
   - Navigate to "Statistics" tab
   - Verify "Live Contract Statistics":
     - Total TIP Supply
     - Rewards Distributed
     - Network info
   - Check "Your Performance" section updates

### **Expected Results:**

- ✅ All stats display current/accurate data
- ✅ Links open correct external pages
- ✅ Real-time data updates properly
- ✅ Loading states work correctly

### **Test Data to Record:**

- Total TIP supply: `________________`
- Global rewards distributed: `________________`
- Your total earned: `________________`
- Stories created: `________________`

---

## 🔗 **User Journey 5: Contract Integration Verification**

### **Test Steps:**

1. **Contract Address Verification**

   - Verify all 6 contract addresses in technical details section
   - Click each "View on StoryScan" link
   - Confirm contracts exist and have transaction history

2. **Transaction Verification**

   - For each transaction made during testing:
   - Copy transaction hash from success messages
   - Open in StoryScan explorer
   - Verify transaction details are correct

3. **Real-time Updates Testing**

   - Keep dashboard open in one tab
   - Make transactions in another tab/session
   - Verify dashboard updates automatically
   - Check balance changes reflect immediately

4. **Error Handling Testing**
   - Try claiming same reward twice
   - Test with insufficient gas
   - Test network disconnection scenarios
   - Verify appropriate error messages

### **Expected Results:**

- ✅ All contract links work correctly
- ✅ Transactions appear in explorer
- ✅ Real-time updates function properly
- ✅ Error handling is graceful

### **Contract Addresses to Verify:**

- TIP Token: `0xe5Cd6E2392eB0854F207Ad474ee9FB98d80C934E`
- Rewards Manager: `0xf5ae031ba92295c2ae86a99e88f09989339707e5`
- Creator Controller: `0x8e2d21d1b9c744f772f15a7007de3d5757eea333`
- Read Controller: `0x04553ba8316d407b1c58b99172956d2d5fe100e5`
- Access Control: `0x41e2db0d016e83ddc3c464ffd260d22a6c898341`
- Remix Licensing: `0x16144746a33d9a172039efc64bc2e12445fbbef2`

---

## 🎯 **User Journey 6: End-to-End Story Lifecycle**

### **Test Steps:**

1. **Complete Story Creation Flow**

   - Create story with AI assistance
   - Publish to IPFS
   - Register IP asset (if implemented)
   - Claim creation reward

2. **Reading & Engagement Flow**

   - Read own or others' stories
   - Claim reading rewards
   - Build reading streak
   - Check reward accumulation

3. **Community Features Testing**

   - Test remix functionality (if available)
   - Check quality assessment features
   - Verify community engagement rewards

4. **Portfolio Management**
   - Review all created stories
   - Check total earnings summary
   - Verify reward history
   - Test withdrawal/transfer (if implemented)

### **Expected Results:**

- ✅ Complete story lifecycle works
- ✅ All rewards accumulate correctly
- ✅ User can track progress/earnings
- ✅ Community features functional

---

## 📈 **Success Metrics & KPIs**

### **Technical Metrics:**

- [ ] All transactions complete successfully
- [ ] No contract interaction errors
- [ ] Real-time updates work properly
- [ ] Gas costs reasonable (<0.001 ETH per transaction)

### **User Experience Metrics:**

- [ ] Wallet connection under 30 seconds
- [ ] Transaction confirmations under 2 minutes
- [ ] Dashboard loads under 5 seconds
- [ ] All error states handled gracefully

### **Business Logic Metrics:**

- [ ] Reward amounts match specifications (50 TIP creation, 10 TIP reading)
- [ ] Anti-gaming mechanisms work (no double-claiming)
- [ ] Streak bonuses calculate correctly
- [ ] User statistics update accurately

---

## 🐛 **Common Issues & Troubleshooting**

### **Wallet Connection Issues:**

- Ensure MetaMask is unlocked
- Check network is set to Aeneid testnet
- Clear browser cache if needed
- Refresh page and retry connection

### **Transaction Failures:**

- Check sufficient IP tokens for gas
- Verify not claiming same reward twice
- Wait for previous transaction to confirm
- Try increasing gas limit if needed

### **Data Not Loading:**

- Refresh page to reload contract data
- Check network connection
- Verify contract addresses are correct
- Check for any console errors

### **Balance Not Updating:**

- Wait 1-2 blocks for confirmation
- Refresh dashboard
- Check transaction succeeded on StoryScan
- Verify wallet is on correct network

---

## 📋 **Test Completion Checklist**

- [ ] **Journey 1**: Wallet connection & setup
- [ ] **Journey 2**: Story creation & rewards
- [ ] **Journey 3**: Reading & chapter rewards
- [ ] **Journey 4**: Dashboard analytics
- [ ] **Journey 5**: Contract integration
- [ ] **Journey 6**: End-to-end lifecycle

### **Final Verification:**

- [ ] All 6 contracts working correctly
- [ ] Total TIP earned matches expectations
- [ ] No duplicate reward claims possible
- [ ] All links and external integrations work
- [ ] Error handling provides clear feedback
- [ ] Real-time updates function properly

---

## 🎉 **Testing Complete!**

**Total Test Time:** `_______ minutes`
**Total TIP Earned:** `_______ TIP tokens`
**Transactions Made:** `_______ transactions`
**Gas Used:** `_______ IP tokens`

**Overall Assessment:** `[Pass/Fail]`
**Notes:** `_________________________________`
