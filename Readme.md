# Fair — Smart Bill Splitting App

Fair is a full-stack application that automates bill splitting by extracting structured data from receipt images and calculating fair shares for each individual.

Instead of manually reading receipts and doing calculations, Fair converts raw images into clean, actionable splits.

---

## 🚀 Key Features

* 📸 **Receipt Scanning**

  * Upload or capture receipt images
  * OCR extracts raw text from images

* 🧠 **Smart Parsing Engine**

  * Converts raw OCR text into structured items
  * Handles prices, quantities, and item grouping

* ⚖️ **Fair Splitting Logic**

  * Assign items to individuals
  * Automatically calculates fair share per person

* 📝 **Review & Edit**

  * Modify parsed items before finalizing
  * Adjust assignments dynamically

* 📊 **History Tracking**

  * View past splits and summaries

---

## 🏗️ Tech Stack

### Frontend

* React Native (Expo)
* TypeScript

### Backend

* FastAPI (Python)
* REST APIs

### Core Processing

* Open CV and Tesseract OCR (image preprocessing)
* Custom rule-based parsing (extensible to ML)
* Custom bill-splitting algorithms

---

## 📂 Project Structure

```
Fair-App/
│
├── frontend/          # React Native app (Expo)
│   ├── app/           # Screens & navigation
│   ├── components/    # Reusable UI components
│   ├── utils/         # Core logic (splitting, assignment)
|   ├── src/db         # SQLite entry and schema 
|   ├── src/services   # SQLite queries to handle app calls and CRUD work
│
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # Routes
│   │   ├── services/  # OCR, parsing, splitting logic
│   │
│   ├── uploads/       # Runtime image storage (ignored in git)
│
└── .gitignore
```

---

## ⚙️ How It Works

1. User uploads a receipt image
2. Backend performs OCR → extracts text
3. Parsing service converts text → structured items
4. Frontend displays items for review
5. Users assign items to people
6. Split logic computes final balances

## 🛠️ Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

### Frontend

```bash
cd frontend
npm install
npx expo start
```
---

## 💪 Performance 
* Processes typical receipts in under 2s
* High accuracy on digitally generated receipts (clear text input)
* -70-75% parsing accuracy on scanned receipts with noise/irregular formatting

---

## 🧪 Future Improvements

* ML-based receipt parsing for higher accuracy
* Authentication & user accounts
* Cloud storage & database integration
* Group management (similar to messaging apps)
* Payment integration

---
## 🎯 Problem It Solves

Splitting bills manually is:
* error-prone
* time-consuming
* frustrating in groups

Fair eliminates this by turning receipts into instant, accurate splits.

---

## 📄 License

MIT License

---

