# FAIR — Fair And Intelligent Reconciliation

FAIR is a mobile expense-sharing app that helps groups split bills more accurately. It combines receipt scanning, item-level assignment, expense calculation, and debt settlement, with local SQLite storage for core expense data.

Group members do not need their own accounts or the app. They are added as members of a group inside the app of the person organizing the expense.

The repository also includes a static website that introduces FAIR, documents its features, and hosts its Privacy Policy and Terms and Conditions.

Receipt scanning requires an internet connection because receipt images are processed by a remote backend. If scanning fails or is unavailable, items can be entered manually.

**Website:** [FAIR — Fair And Intelligent Reconciliation](https://fair-app.getfair.workers.dev/)

## Download

The latest release is **v1.0.0**, available as an Android APK from the [Releases page](https://github.com/SudhanvaSM/Fair-App/releases).

To install:

1. Download the APK from the Releases page of this repository.
2. Open the downloaded file on your Android device.
3. If prompted, allow installation from your browser or file manager (Android's "install unknown apps" setting), then continue the installation.

The APK is distributed directly through GitHub, not through an app store, so download it only from this repository's Releases page. Receipt scanning requires an internet connection and a signed-in account.

## Features

- **Receipt scanning:** Upload receipt images for OCR and structured item extraction. Requires an internet connection and a signed-in user.
- **Receipt parsing:** Extract item names, quantities, prices, and receipt totals using OCR output and custom coordinate-based parsing.
- **Manual fallback:** Enter items manually when receipt scanning is unavailable or does not produce usable results.
- **Item-level assignment:** Assign individual items to group members.
- **Expense splitting:** Calculate individual shares from assigned items.
- **Debt reconciliation:** Calculate balances and record settlements between group members.
- **No accounts for group members:** The people you split with do not need accounts or the app.
- **Local persistence:** Store core expense and group data in SQLite on the device.
- **Authentication:** Supabase handles sign-in, and the backend validates the bearer token on receipt uploads.

## Architecture

FAIR has four main components:

1. **Mobile app:** React Native, Expo, and TypeScript provide the user interface, expense workflows, and local persistence.
2. **FastAPI backend:** Receives receipt images, validates uploads, invokes OCR, parses the result, and returns structured receipt data.
3. **External services:** The backend uses a configured remote Gradio OCR service. Supabase provides authentication and the app's other remote integrations.
4. **Static website:** Built with HTML, CSS, and JavaScript. It introduces FAIR, explains its features, and hosts the Privacy Policy and Terms and Conditions.

```mermaid
flowchart LR
    User[User] --> Mobile[Expo / React Native app]
    Mobile --> SQLite[(Local SQLite)]
    Mobile -->|Authenticated receipt upload| API[FastAPI backend]
    API --> Validate[Upload validation and rate limiting]
    Validate --> OCR[Configured remote OCR service]
    OCR --> Parser[Receipt parser]
    Parser --> Result[Structured receipt data]
    Result --> Mobile
    Mobile --> Supabase[Supabase services]
    API --> Supabase
```

Receipt scanning depends on network access and on the availability of the backend and the configured OCR service. Core expense workflows use local data, but exact offline behavior can still depend on the individual screen or operation.

## Technology Stack

| Area | Technologies |
|------|--------------|
| Mobile app | React Native, Expo, Expo Router, TypeScript |
| Local storage | SQLite through `expo-sqlite` |
| Authentication | Supabase |
| Backend API | Python, FastAPI, Uvicorn |
| Receipt processing | OCR through a configured remote Gradio service; coordinate-based parsing |
| Backend utilities | Pillow, `python-dotenv`, `slowapi`, `gradio_client` |
| Static website | HTML, CSS, JavaScript |
| Website hosting | Cloudflare Pages |

The repository also contains a local PaddleOCR helper. Its dependencies and runtime requirements may differ from the default remote OCR path.

## Project Structure

```text
Fair-App/
├── backend/
│   ├── app/
│   │   ├── api/              # Upload and health routes
│   │   ├── auth/             # Bearer-token authentication
│   │   ├── limiter/          # Request throttling
│   │   ├── services/         # OCR and receipt parsing
│   │   ├── database.py       # Supabase client setup
│   │   └── main.py           # FastAPI app and middleware
│   ├── .env-example
│   ├── .python-version
│   └── requirements.txt
│
├── frontend/
│   ├── app/                  # App screens and navigation
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom hooks
│   ├── src/db/               # SQLite setup and schema
│   ├── src/services/         # Data-access services
│   ├── utils/                # Expense and splitting logic
│   ├── .env-example
│   ├── app.json
│   └── package.json
│
├── website/
│   ├── index.html            # Website landing page
│   ├── styles.css            # Website styles
│   ├── script.js             # Website interactions
│   ├── assets/               # Logos, icons, screenshots, and images
│   ├── privacy/              # Privacy Policy
│   └── terms/                # Terms and Conditions
│
├── .gitignore
├── backendPingCron.js        # Pings the backend every 10 minutes
├── LICENSE
└── README.md
```

## Prerequisites

- Git
- Python 3.12
- Node.js and npm
- Expo-compatible development environment or device

## Setup

Clone the repository:

```bash
git clone https://github.com/SudhanvaSM/Fair-App.git
cd Fair-App
```

### 1. Configure the backend

Create the backend environment file using `backend/.env-example` as a reference. Set the required values for the services you intend to use.

The backend configuration uses these variables:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by the backend client |
| `OCR_SERVICE_URL` | Remote OCR service endpoint |
| `HF_TOKEN` | Token used to access the configured remote OCR service, if required |
| `CORS_ORIGINS` | Optional comma-separated allowed origins |
| `ENV` | Environment mode used for API documentation visibility |

Install dependencies and start the API:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment, then run:

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The remote OCR flow requires valid service configuration. Keep server-side tokens such as `HF_TOKEN` private and out of source control.

### 2. Configure the frontend

Create the frontend environment file using `frontend/.env-example` as a reference. The example file documents these variables:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL for the mobile app |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key for client-side use |
| `EXPO_PUBLIC_API_URL` | Base URL of the receipt-processing API |

Install dependencies and start Expo:

```bash
cd frontend
npm install
npx expo start
```

For a physical device, set `EXPO_PUBLIC_API_URL` to a backend address the device can reach. `localhost` on a phone refers to the phone itself, not your development computer.

Only put client-safe values in `EXPO_PUBLIC_*` variables. Never place service-role keys, private API tokens, or other server-side secrets in the mobile app.

## API

### `POST /upload`

Uploads a receipt image for processing. The route requires a valid bearer token and accepts multipart form data.

Example for a locally running backend:

```bash
curl -X POST "http://127.0.0.1:8000/upload" \
  -H "Authorization: Bearer <access-token>" \
  -F "file=@receipt.jpg"
```

Supported image formats and upload limits are enforced by the backend. The upload route currently applies an 8 MB file-size limit, and additional request-size checks may reject larger requests.

### `GET /health`

Checks whether the API is responding:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## Data Handling and Privacy

- Core expense and group data is stored locally using SQLite in the mobile app.
- Receipt images are sent from the app to the FastAPI backend for processing.
- The backend temporarily writes receipt images before sending them to the configured remote OCR service.
- The backend uses Supabase-related configuration and validates bearer tokens for protected upload operations.
- The remote OCR provider's own processing and retention practices are governed by that provider and should be reviewed separately.

Local storage does not mean every feature works offline: receipt scanning requires connectivity to the backend and the OCR service. See the [Privacy Policy](https://fair-app.getfair.workers.dev/privacy/) and [Terms and Conditions](https://fair-app.getfair.workers.dev/terms/) for the app's complete data-handling disclosures.

## Security Notes

The repository implements several protections for receipt processing, including upload validation, request throttling, and bearer-token authentication. These measures do not by themselves establish that the application is free of vulnerabilities or has passed a formal security audit.

When deploying:

- Keep backend secrets in the hosting provider's environment configuration.
- Do not commit `.env` files or credentials.
- Configure the allowed CORS origins for the deployment.
- Review the OCR provider's data-handling terms before sending real receipts.
- Keep dependencies updated and test authentication, upload validation, and account and data deletion flows.

## Testing and Development

Backend tests are located under `backend/app/tests/`. From the `backend` directory, with the project's test dependencies installed, run:

```bash
pytest
```

If `frontend/package.json` defines a lint script, run it from the `frontend` directory:

```bash
npm run lint
```

## Contributing

Contributions and bug reports are welcome.

1. Fork the repository.
2. Create a branch for your change.
3. Keep changes focused and explain the reason for them.
4. Run relevant backend tests and frontend checks.
5. Open a pull request describing the change and any testing performed.

## License

Released under the **MIT** License. See [LICENSE](LICENSE).

---

FAIR combines local expense management with remote receipt processing to make group bill splitting easier. Contributions, bug reports, and feedback are welcome.
