# AI Chatbot and Automated Testing Implementation

## Overview

This document describes the AI Chatbot feature and automated testing setup added to the TeaQnet application.

## 🤖 AI Chatbot Feature

### Backend Implementation

**Location:** `Tea_Region_Classifier/app.py`

**Endpoint:** `/api/chatbot` (POST)

**Features:**
- Rule-based intelligent chatbot with tea region classification knowledge
- Understands questions about:
  - Tea regions (Dimbula, Ruhuna, Sabaragamuwa, etc.)
  - Classification models (ResNet18, EfficientNet, MobileNet, etc.)
  - How to use the prediction system
  - Image types (raw vs preprocessed)
  - Polyphenol-based classification
  - Confidence scores and accuracy

**Knowledge Base:**
- All tea regions with descriptions, origins, and flavor notes
- Available models and their characteristics
- Classification methods and workflows
- Image processing information

### Frontend Implementation

**Location:** `TeaQnet/src/assets/components/layout/Chatbot.tsx`

**Features:**
- Modern chat interface with message bubbles
- Real-time conversation flow
- Quick question buttons for common queries
- Minimizable chat window
- Responsive design
- Auto-scrolling to latest messages
- Loading indicators

**Navigation:**
- Accessible via `/chatbot` route
- Added to Header navigation menu
- Available in user dropdown menu

### Usage

1. Navigate to `/chatbot` or click "AI Assistant" in the header
2. Type your question or click a quick question button
3. Receive intelligent responses about tea region classification
4. Continue the conversation with follow-up questions

**Example Questions:**
- "What regions can be classified?"
- "Which model should I use?"
- "Tell me about Dimbula region"
- "How do I predict tea regions?"
- "What is polyphenol classification?"

## 🧪 Automated Testing

### Setup

**Framework:** Playwright

**Configuration:** `TeaQnet/playwright.config.ts`

**Test Files:**
- `e2e/navigation.spec.ts` - Page navigation tests
- `e2e/tea-classification.spec.ts` - Classification functionality tests
- `e2e/example.spec.ts` - Basic homepage test

### Test Coverage

#### Navigation Tests
- ✅ Homepage to Login navigation
- ✅ Register page navigation
- ✅ Dashboard access after login
- ✅ Chatbot page navigation
- ✅ Multiple Predict page navigation
- ✅ Model Comparison page navigation
- ✅ Crop Images page navigation
- ✅ Polyphenol page navigation
- ✅ History page navigation

#### Tea Classification Tests
- ✅ Dashboard tea region classification
- ✅ Multiple predictions functionality
- ✅ Model comparison with multiple models
- ✅ Crop and predict workflow
- ✅ Chatbot interaction
- ✅ Prediction history viewing

### Running Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test navigation.spec.ts
```

### Test Configuration

- **Browsers:** Chromium, Firefox, WebKit
- **Base URL:** `http://localhost:5173`
- **Auto-start dev server:** Yes
- **Screenshots:** On failure
- **Reports:** HTML report generated

### Test Data

**Test User Credentials:**
- Email: `test@example.com`
- Password: `testpassword123`

**Note:** Update these in test files to match your test user account.

**Test Image:**
- Create `test-assets/test-tea-image.png` for image upload tests
- Tests will skip if image doesn't exist

## 📁 Files Added/Modified

### Backend
- ✅ `Tea_Region_Classifier/app.py` - Added `/api/chatbot` endpoint

### Frontend
- ✅ `TeaQnet/src/assets/components/layout/Chatbot.tsx` - New chatbot component
- ✅ `TeaQnet/src/App.tsx` - Added chatbot route
- ✅ `TeaQnet/src/assets/components/layout/Header.tsx` - Added chatbot navigation
- ✅ `TeaQnet/src/utils/api.ts` - Added chatbot API function

### Testing
- ✅ `TeaQnet/playwright.config.ts` - Playwright configuration
- ✅ `TeaQnet/e2e/navigation.spec.ts` - Navigation tests
- ✅ `TeaQnet/e2e/tea-classification.spec.ts` - Classification tests
- ✅ `TeaQnet/e2e/example.spec.ts` - Basic test
- ✅ `TeaQnet/e2e/README.md` - Testing documentation
- ✅ `TeaQnet/package.json` - Added Playwright dependencies and scripts

## 🚀 Next Steps

1. **Install Playwright:**
   ```bash
   cd TeaQnet
   npm install
   npx playwright install
   ```

2. **Create Test User:**
   - Register a test user with email `test@example.com` and password `testpassword123`
   - Or update test files with your test credentials

3. **Create Test Image:**
   - Create `TeaQnet/test-assets/test-tea-image.png` (any tea image will work)

4. **Run Tests:**
   ```bash
   npm run test:e2e
   ```

5. **Access Chatbot:**
   - Login to the application
   - Click "AI Assistant" in the header or navigate to `/chatbot`

## 📝 Notes

- The chatbot uses a rule-based system (no external AI API required)
- Tests require the backend server to be running (automatically started by Playwright)
- Some tests may skip if test assets are missing (graceful handling)
- Update test credentials in test files to match your environment

