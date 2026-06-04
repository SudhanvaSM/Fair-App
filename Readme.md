# Fair — Smart Bill Splitting App

Fair is a expense splitting mobile application that automates bill splitting by extracting receipt data using OCR, parses line items automatically, and computing real-time debt settlements between group members.

### **Turn restaurant receipts into item-level settlements in under 30 seconds.**  

Problem: Groups waste time manually calculating who owes whom.  

Solution: FAIR uses OCR, receipt parsing, item ownership assignment, and debt computation to generate settlement-ready balances automatically.  

---

## Key Features
* **Receipt Scanning**

  * OCR-based receipt scanning
  * Upload or capture receipt images
  * OCR extracts raw text from images

* **Smart Parsing Engine**

  * Automatic receipt parsing
  * Converts raw OCR text into structured items
  * Handles prices, quantities, and item grouping

* **Fair Splitting Logic**

  * Group-based expense splitting
  * Assign items to individuals
  * Automatically calculates fair share per person
  * Multi-member item assignment
  * Debt tracking and settlements

* **Review & Edit**

  * Modify parsed items before finalizing
  * Adjust assignments dynamically

* **History Tracking**

  * View past splits and summaries
  * Share & clipboard export
  * Analytics dashboard

* **Other Features**
  * Offline-first SQLite storage
  * Local-first architecture

---

## Tech Stack

### Frontend

* React Native
* Expo Router
* TypeScript

### Backend

* FastAPI (Python)
* PyTesseract and CV2
* REST APIs

### Database
* SQLite

### Core Processing

* Open CV2 and PyTesseract OCR (image preprocessing)
* Rule-based receipt parsing using regex and heuristic extraction logic
* Transactional debt computation and balance aggregation logic

---

## Project Structure

```
Fair-App/
│
├── frontend/          # React Native app (Expo)
│   ├── app/           # Screens & navigation
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom hook for Image Picker 
│   ├── utils/         # Core logic (splitting, assignment)
|   ├── src/db         # SQLite initialization and schema definition
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

## Architecture
Fair follows a layered local-first architecture:

 Frontend (React Native) → Service Layer → SQLite Persistence  

OCR and receipt parsing logic are separated into backend processing services using FastAPI, while transactional financial data is persisted using SQLite for offline-first functionality and reduced infrastructure complexity  

SQLite was intentionally kept local to support offline-first usage, low-latency queries, and simplified infrastructure for a single-user mobile workflow.

---

## Database Schema

### Core Tables
#### groups
- id
- name
- created_at

#### members
- id
- group_id
- name  

#### receipts
- id
- title
- group_id
- payer_member_id
- subtotal
- tax
- final_tip
- service_charge
- total
- created_at
- receipt_image_uri

#### items
- id
- receipt_id
- name
- qty
- unit_price
- total_price

#### debts
- id
- receipt_id
- group_id
- from_member_id
- to_member_id
- amount
- status

#### item_assignments
- id
- member_id
- item_id
---

## Debt Calculation

FAIR stores transactional debts per receipt instead of only storing final balances. This allows:
- receipt-level traceability
- reversible settlements
- accurate historical tracking
- dynamic balance recomputation

Member balances are computed using aggregate SQL queries over pending debts.

---

## How It Works

1. User uploads a receipt image
2. Backend performs OCR → extracts text
3. Parsing service converts text → structured items
4. Frontend displays items for review
5. Users assign items to people
6. Split logic computes final balances   
---
## Data Flow

Receipt Image   
&emsp;&emsp;&emsp;↓  
OCR Engine   
&emsp;&emsp;&emsp;↓   
Parsing Service   
&emsp;&emsp;&emsp;↓   
Structured Items  
&emsp;&emsp;&emsp;↓   
Assignment Engine   
&emsp;&emsp;&emsp;↓   
Debt Calculation   
&emsp;&emsp;&emsp;↓   
SQLite Persistence

---

## Setup

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

## Performance 
* Processes typical receipts in under 2s.
* Handles digitally generated receipts reliably.
* Scanned/noisy receipts may require manual correction during review.

---
## Challenges Faced

- OCR inconsistencies across receipt formats
- Handling multi-member shared item assignments
- Maintaining transactional debt integrity
- Managing state synchronization after database mutations
- Persisting receipt images locally
- Designing efficient aggregate SQL queries for balances and analytics
---

## Future Improvements

* Pairwise debt simplification
* ML-based receipt parsing for higher accuracy
* Authentication & user accounts
* Cloud storage & database integration
* Payment integration

---
## Problem It Solves

Splitting bills manually is:
* error-prone
* time-consuming
* frustrating in groups

Fair eliminates this by turning receipts into instant, accurate splits.

---
## Author 
Developed By Sudhanva S M  

---

## License

MIT License

---

