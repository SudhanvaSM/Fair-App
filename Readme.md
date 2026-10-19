# FAIR — Fair And Intelligent Reconciliation

FAIR (Fair And Intelligent Reconciliation) is a mobile-first expense-sharing application focused on turning receipt images into structured, item-level data so groups can assign items, compute accurate shares, and reconcile debts.

> This README documents the implementation found in the repository and highlights verified features, required environment configuration, and known limitations. It does not invent functionality not present in the codebase.

---

## Overview

Splitting bills in groups is time-consuming and error-prone. FAIR reduces this friction by providing a mobile client (Expo / React Native) that uploads receipt images to a FastAPI backend. The backend runs OCR and a coordinate-aware parser to extract itemized lines and basic totals which the client can use for assignment and reconciliation.

What is implemented (verified):
- Expo React Native frontend scaffold and dependencies (frontend/package.json).
- FastAPI backend with an upload endpoint (`POST /upload`) that validates images, enforces rate limits, runs OCR, and parses receipts (`backend/app/api/routes.py`).
- OCR implementations and helpers in `backend/app/services`:
  - `ocr_remote.py` — sends image to a remote Gradio OCR service (requires OCR_SERVICE_URL and HF_TOKEN).
  - `ocr_paddleocr.py` — local PaddleOCR helper (present but may require additional native dependencies if used).
  - `parser.py` — coordinate-aware receipt parser that converts OCR word arrays into item rows and totals.
- Supabase client initialization in `backend/app/database.py` (requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY).
- Authentication dependency that validates a Bearer token via Supabase claims (`backend/app/auth/authentication.py`).

What is present in the repo but requires confirmation in the frontend source code before claiming full feature support:
- Local SQLite persistence on the client (expo-sqlite is in dependencies — implementation should be confirmed by inspecting `frontend/src`).
- UI flows for creating groups, assigning items, tracking debts, and simplifying settlements — these are described in the original README and implied by dependencies, but the exact implementation and persistence flow live in the frontend code.

---

## Key features (explicitly verified in code)

- Upload endpoint with image validation and size/dimension checks (JPEG/PNG/WebP supported).
- Rate limiting and basic request throttling (slowapi + custom rate limiter).
- Remote OCR support via a Gradio service (`ocr_remote.py`) and a local PaddleOCR helper (`ocr_paddleocr.py`).
- Coordinate-aware parsing that extracts item name, quantity, unit price, total price, and basic receipt totals (`parser.py`).
- Supabase integration scaffolded in the backend (`database.py`).
- Frontend scaffold using Expo / React Native with TypeScript (package.json, tsconfig.json).

Planned / documented features (present in README.md but to be confirmed in source):
- Item assignment UI and debt calculation logic (check frontend source for implementation).
- Pairwise debt simplification and payment integrations.
- Full offline-first synchronization across devices (expo-sqlite dependency suggests local storage but the sync logic must be confirmed).

---

## How it works (runtime flow — verified)

1. User (mobile app) captures or chooses a receipt image and sends it to the backend `POST /upload` as multipart/form-data.
2. Backend validates the image format, file size, and image dimensions.
3. Backend enforces rate limits and concurrency control.
4. Backend obtains OCR text by calling the configured OCR path:
   - By default the repository contains `ocr_remote.py` which forwards the image to a Gradio-hosted OCR service using `OCR_SERVICE_URL` and `HF_TOKEN`.
   - A local PaddleOCR implementation (`ocr_paddleocr.py`) is present if you prefer running OCR locally (requires PaddleOCR & OpenCV native dependencies).
5. The OCR result is parsed with `parser.parse_receipt` into structured items and totals and returned as JSON to the client.
6. The mobile client can display parsed items for review and (where implemented) allow assignment to group members for debt computation.

---

## Technical architecture

- Languages: TypeScript (frontend), Python 3.12 (backend).
- Frontend framework: Expo / React Native (expo-router entry in package.json).
- Backend framework: FastAPI (ASGI) with uvicorn recommended as the server.
- Database / services: Supabase client is initialized in the backend (backend/app/database.py). The repository also includes frontend dependencies for `expo-sqlite` for local storage.
- OCR: `ocr_remote.py` (remote Gradio client) and `ocr_paddleocr.py` (local PaddleOCR helper).
- Parsing: `backend/app/services/parser.py` — a coordinate-aware receipt parser that expects PaddleOCR-style word arrays.

Mermaid architecture diagram (based on repository code):

```mermaid
flowchart LR
  Mobile[Expo React Native app (frontend)] -->|POST /upload (image)| Backend[FastAPI backend (backend/app/main.py)]
  Backend -->|run_remote_ocr(image bytes)| OCR[Remote Gradio OCR Service (OCR_SERVICE_URL)]
  Backend -->|parse_receipt(ocr_text)| Parser[parser.py]
  Backend -->|supabase client| Supabase[(Supabase) - SUPABASE_URL]
  Mobile -->|local DB (if implemented)| LocalDB[(expo-sqlite)]
```

Responsibilities:
- Frontend: capture/select images, present parsed items, implement item assignment and UI flows (actual implementation located in `frontend/app` and `frontend/src`).
- Backend: validate uploads, run OCR (remote or local), parse receipts, enforce rate limits, and provide authenticated endpoints.

---

## Technology stack (verified)

- Frontend
  - Expo / React Native (mobile UI and navigation)
  - TypeScript (static types)
  - @supabase/supabase-js (client-side Supabase integration)
  - expo-sqlite (local storage dependency present)
  - expo-image-picker / expo-image-manipulator (image capture/manipulation)

- Backend
  - Python 3.12 (see backend/.python-version)
  - FastAPI (HTTP API)
  - uvicorn (ASGI server)
  - Pillow (image validation)
  - slowapi (rate limiting)
  - supabase (supabase-py client)
  - python-dotenv (env loading)
  - gradio_client (used by ocr_remote.py to call a remote OCR service)

Note: Some technologies mentioned in the old README (for example, pytesseract or OpenCV-based pipelines) are not present as required Python dependencies in backend/requirements.txt. A local PaddleOCR helper file exists but will require native dependencies not listed in requirements.txt.

---

## Installation & setup (verified commands)

Prerequisites
- Git
- Node.js and npm (for frontend / Expo)
- Python 3.12 and pip (for backend)

From a fresh clone:

1) Backend

```bash
cd backend
python -m pip install -r requirements.txt
# Provide required environment variables (see below) then run:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2) Frontend

```bash
cd frontend
npm install
# Start the Expo dev server
npm start
# or
npx expo start
```

Notes:
- The backend will fail to start if `SUPABASE_URL` or `SUPABASE_PUBLISHABLE_KEY` are not set (see `backend/app/database.py`).
- The upload endpoint uses bearer authentication; configure your client to set `Authorization: Bearer <token>` per the authentication implementation (the backend verifies Supabase claims).

---

## Environment variables (verified in repository)

Backend (server-side / required)
- SUPABASE_URL — Supabase project URL used by the backend client. Example placeholder: `https://your-project.supabase.co`.
- SUPABASE_PUBLISHABLE_KEY — The Supabase publishable key required at backend startup. The code treats this as required; do not commit this value to the repo.
- OCR_SERVICE_URL — URL of the remote Gradio OCR service used by `ocr_remote.py` (if using remote OCR).
- HF_TOKEN — Token used when creating the Gradio client in `ocr_remote.py`. Keep this secret.
- CORS_ORIGINS — Optional comma-separated list of allowed origins for CORS (used by `backend/app/main.py`).
- ENV — If set to `production`, the FastAPI docs endpoints are disabled by `app = FastAPI(docs_url=None ...)`.

Frontend (client-side / public variables)
- EXPO_PUBLIC_SUPABASE_URL — Frontend Supabase URL (public). Defined in `frontend/.env-example`.
- EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY — Frontend publishable key (public) — see `frontend/.env-example`.
- EXPO_PUBLIC_API_URL — Backend API base URL used by the mobile client.

Security notes on environment variables
- Treat HF_TOKEN and SUPABASE service keys as secrets and keep them server-side where appropriate.
- Publishable Supabase keys (those prefixed with `EXPO_PUBLIC_`) are intended to be client-visible; do not store any non-public keys in the frontend config.

---

## Usage (verified)

Upload a receipt to the backend (the backend requires a Bearer token — see authentication section):

```bash
curl -X POST "http://localhost:8000/upload" \
  -H "Authorization: Bearer <SUPABASE_JWT_OR_TOKEN>" \
  -F "file=@/path/to/receipt.jpg"
```

Successful response: JSON object with parsed `items` and numeric totals as produced by `parser.parse_receipt`.

Health check endpoint (verified):

```bash
GET http://localhost:8000/health
# -> {"status":"ok"}
```

Authentication
- The backend uses an authentication dependency (`backend/app/auth/authentication.py`) that expects a Bearer token in the `Authorization` header. It validates the token with Supabase (`supabase.auth.get_claims(token)`) and expects a non-anonymous, `authenticated` role.
- Confirm client-side token acquisition and header injection by inspecting the frontend authentication flow.

---

## Project structure (important directories)

```
Fair-App/
├── frontend/           # Expo React Native app (UI, navigation, local DB code)
│   ├── app/            # Screens & routing (Expo Router)
│   ├── src/            # App source modules (services, db, features)
│   └── package.json
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── api/        # API router(s) (routes.py)
│   │   ├── auth/       # Authentication helper (authentication.py)
│   │   ├── services/   # OCR & parsing implementations (ocr_remote.py, ocr_paddleocr.py, parser.py)
│   │   ├── limiter/    # Rate limiting helpers
│   │   ├── main.py     # FastAPI app setup and middleware
│   │   └── database.py # Supabase client setup
│   └── requirements.txt
└── Readme.md
```

---

## Data storage & privacy (verified details)

- Runtime uploads: backend creates an `uploads/` directory at startup (used for temporary files in some OCR flows). Images passed to `ocr_remote.py` are written to a temporary file and removed after sending.
- OCR transit: `ocr_remote.py` forwards the receipt image to a remote Gradio service specified by `OCR_SERVICE_URL` and authenticated with `HF_TOKEN`. If you will process sensitive images, review and control the remote OCR service's privacy and retention policy.
- Local storage: `expo-sqlite` is present as a frontend dependency indicating intent for local persistence. Confirm the exact keys and schemas by reviewing `frontend/src`.
- Supabase: backend initializes a Supabase client with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Confirm what data (if any) is persisted to Supabase by inspecting calls to `supabase` in the backend code.

---

## Security (what the repository shows)

- Do not commit secrets. Keep `HF_TOKEN`, Supabase service keys, and OCR service URLs out of version control.
- The backend enforces upload size and pixel limits and applies rate limiting to the `/upload` endpoint.
- Authentication: backend validates Bearer tokens via Supabase claims. Review and harden token handling and role checks before deploying to production.
- The code does not include evidence of a security audit; do not claim the project is audited or production-secure without an independent assessment.

---

## Limitations (established from the code)

- The backend requires `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` at startup; missing values will raise a startup error.
- `ocr_remote.py` requires `OCR_SERVICE_URL` and `HF_TOKEN` environment variables; if not configured, remote OCR will fail.
- Upload constraints: `MAX_BYTES = 8 MB` in `routes.py` and middleware checks for content-length > 9 MB in `main.py`.
- Rate limiting: upload endpoint has a decorator `@limiter.limit("5/minute;50/day")`.
- No LICENSE file present in the repository — licensing is unspecified.

---

## Roadmap

Planned items mentioned in the repository README (carry-forward from project docs):
- Pairwise debt simplification.
- ML-based receipt parsing for higher accuracy.
- Authentication & user accounts (server-side integration present but additional features may be planned).
- Cloud storage & database integration.
- Payment integration.

(These items are documented in the project README but may require additional implementation work; verify frontend/back-end code for progress.)

---

## Contributing

1. Fork the repository and create a topic branch for your change.
2. Run and test both backend and frontend locally (see Installation & setup).
3. Keep commits focused and provide tests for backend logic where appropriate (pytest appears in backend requirements).
4. Open a pull request describing the problem and the change. Reference related issues if available.

Developer commands (examples):

Backend tests (if any):
```bash
cd backend
pytest
```

Frontend lint:
```bash
cd frontend
npm run lint
```

---

## License

No LICENSE file was found in the repository root. The project currently does not specify an open-source license. Add a LICENSE file if you wish to publish under a specific license.

---

## Acknowledgements

- FastAPI — backend framework
- Expo / React Native — mobile client
- Supabase — backend client integration
- Pillow, slowapi — image validation and rate-limiting helpers

---

## Next steps I can take for you

- Inspect the frontend `frontend/app` and `frontend/src` to confirm the UI flows for item assignment, local DB schema, and debt computation and then update this README with concrete usage screenshots and precise client commands.
- Inspect `backend/app/services/ocr_remote.py` and the Gradio OCR endpoint (if you provide the URL or a description of the service) to confirm privacy/retention and update the privacy section.

If you want me to commit this README.md into the repository, I have updated the existing file in this commit.