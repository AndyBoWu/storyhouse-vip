# V2 Implementation Plan

## Phase 1: Chapter IP Registration (Week 1)
- [ ] Register each chapter as Story Protocol IP
- [ ] Author owns all chapter IPs
- [ ] Set PIL terms allowing derivatives

## Phase 2: Translation System (Week 2)
- [ ] Translation opportunity posting UI
- [ ] AI quality verification backend
- [ ] Register translations as derivative IPs (author-owned)
- [ ] Configure HybridRevenueController for translator payments

## Phase 3: Payment Integration (Week 3)
- [ ] Adapt HybridRevenueController for translations
- [ ] Translator = "curator" getting 75% (adjust from 20%)
- [ ] Author gets remaining 25%
- [ ] Test TIP token flows

## Phase 4: Audio Support (Week 4)
- [ ] Audio upload interface
- [ ] Register audio as derivatives of chapters/translations
- [ ] Configure narrator revenue shares
- [ ] Quality verification

## Technical Notes:
- Keep existing contracts, adapt for new model
- All IPs owned by authors
- Service providers get contract-based revenue shares
- No Story Protocol royalties (use HybridRevenueController)