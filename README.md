# Pharmacy Management System

A web-based pharmacy platform built with a Django REST Framework backend and a React 19 single-page frontend. Four role-isolated dashboards (Customer, Administrator, Store Manager, Doctor) cover the full pharmaceutical workflow: catalog and batch management, expiry-aware stock control, order processing, medical-history tracking with allergy warnings, doctor consultations, and an AI assistant for general medicine questions.

---

## Features

### Customer
- Browse, search (name / manufacturer / active ingredient), filter, and sort the product catalog.
- Quick-preview modal, persistent cart, namespaced per-user wishlist.
- Cart additions are checked against the user's recorded allergies; the system surfaces a warning when a product's active ingredient matches a known allergy.
- Order placement and tracking with status badges (Pending → Approved → Processing → Shipped → Delivered).
- Submit medical questions to registered doctors and read their answers.
- Maintain a medical history of allergies, chronic conditions, and current medications.
- Converse with an AI assistant (OpenRouter API with multi-model fallback) for general medicine guidance.
- Editable profile, dark mode with system-preference detection, global Ctrl+K command palette.

### Administrator
- Manage users, roles, categories, products, batches (with expiry tracking), and orders.
- Approve or reject pending orders and stock-replenishment requests submitted by managers.
- Pending counts surfaced as badges in the navbar for Orders and Requests.

### Store Manager
- Inventory dashboard with low-stock and expiry indicators.
- View per-product batch lists (quantity, expiry date, status).
- Submit stock-replenishment requests that the admin approves or rejects.

### Doctor
- Answer customer medical questions through a dedicated inbox.
- Review patient medical history (allergies, chronic conditions, medications) when responding.

### Cross-cutting
- Role-aware navigation and Ctrl+K palette — each role only sees the routes and data it has permission for.
- Stale-while-revalidate caching for products / categories / batches with idle pre-fetch on app boot.
- Dark mode persisted in `localStorage`, with system-preference fallback.
- Lightweight skeleton loaders to keep the UI responsive while caches warm.
- JWT authentication with automatic refresh on `401` responses.

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Django | 4.2.7 | Web framework |
| Django REST Framework | 3.14.0 | REST API layer |
| djangorestframework-simplejwt | 5.3.0 | JWT auth with refresh tokens |
| django-cors-headers | 4.3.0 | CORS for the dev React server |
| python-decouple | 3.8 | `.env` configuration |
| Pillow | ≥ 10.4 | Image handling for product uploads |
| requests | ≥ 2.31 | Used by the AI chatbot integration |
| SQLite (dev) / PostgreSQL (prod recommended) | — | Database |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2 | UI library |
| React Router DOM | 7.12 | Client-side routing |
| Axios | 1.13 | HTTP client (with JWT refresh interceptor) |
| Tailwind CSS | 3.3.5 | Styling (utility-first, `darkMode: 'class'`) |
| Framer Motion | 12 | Page and component animations |
| Headless UI | 2.2 | Accessible primitives (combobox, dialog, transition) |
| react-icons | 4.12 | Icon set |
| tesseract.js | 7.0 | Client-side OCR (where used) |

### Tooling
- **Backend tests:** Django's built-in test runner + DRF `APITestCase`/`APIClient`.
- **Frontend tests:** Jest + React Testing Library (`react-scripts test`).
- **Build:** `react-scripts build` for production bundle; `manage.py runserver` for the dev backend.

---

## Prerequisites

- Python 3.10+ (the project is verified against 3.11 and 3.13)
- Node.js 16+ with npm
- Git

---

## Installation

### Backend

```bash
cd backend/pharmacy_project
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r ../../requirements.txt
```

Create a `.env` file at `backend/pharmacy_project/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOW_ALL_ORIGINS=True

# Optional — AI chatbot
OPENROUTER_API_KEY=your-openrouter-key
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser    # optional
python manage.py runserver
```

API root: <http://localhost:8000/api/>

### Frontend

```bash
cd frontend
npm install
```

Optional `frontend/.env` to override the default API URL:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

Start the dev server:

```bash
npm start
```

Application: <http://localhost:3000>

---

## Project Structure

```
pharmacy-system/
├── backend/
│   └── pharmacy_project/
│       ├── pharmacy/                  # Domain app
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── tests/                 # test_models / test_serializers / test_api / test_views
│       ├── pharmacy_project/          # Project config
│       │   ├── settings.py
│       │   └── urls.py
│       └── manage.py
├── frontend/
│   └── src/
│       ├── components/                # Reusable UI + role-aware Navbar, Footer, skeletons
│       ├── pages/                     # Routed screens, one folder per role
│       ├── contexts/                  # AuthContext, WishlistContext, SearchContext,
│       │                              # ProductsCache / CategoriesCache / BatchesCache,
│       │                              # createResourceCache (SWR factory)
│       ├── context/                   # ThemeContext (dark mode)
│       ├── hooks/                     # useCartCount, usePendingCount, useFocusOnArrival,
│       │                              # useRoutePrefetch, useToast
│       ├── lib/                       # Pure helpers (search providers, etc.)
│       ├── services/                  # Axios client + per-resource API wrappers
│       ├── __tests__/                 # Jest + RTL test files
│       └── App.js
├── requirements.txt
└── README.md
```

---

## API Overview

All endpoints are prefixed with `/api/`. The frontend reaches them through Axios wrappers in `frontend/src/services/api.js`.

### Authentication
- `POST /api/users/login/` — issue access + refresh tokens.
- `POST /api/users/` — register (also exposes `register` action).
- `POST /api/users/change_password/` — change password.
- `GET / PATCH /api/users/me/` — own profile.
- `POST /api/token/refresh/` — rotate access token.

### Catalog
- `GET /api/categories/` and CRUD on `/api/categories/{id}/`.
- `GET /api/products/?paginate=false` — full catalog (used by the storefront cache).
- `GET /api/products/?page=N&category=X&q=Y` — paginated, filtered, searchable.
- `GET /api/products/{id}/`, `POST/PATCH/DELETE` for admins.
- `GET /api/products/low_stock/` — low-stock listing.

### Batches
- CRUD on `/api/product-batches/`.
- `GET /api/product-batches/expired/`.
- `GET /api/product-batches/expiring_soon/?days=30`.

### Cart & Orders
- CRUD on `/api/cart/`.
- `POST /api/orders/checkout/` — convert cart to order (FEFO over non-expired batches).
- `POST /api/orders/{id}/approve|reject|cancel/`.
- `POST /api/orders/{id}/add_item|remove_item/`, `PATCH /api/orders/{id}/update_item_quantity/`.

### Stock Requests (manager → admin)
- CRUD on `/api/stock-requests/`.
- `POST /api/stock-requests/{id}/approve|reject/`.

### Medical History
- `/api/medical-profiles/`, `/api/allergies/`, `/api/chronic-conditions/`, `/api/current-medications/`, `/api/medical-notes/`.
- `GET /api/allergies/check_drug/?drug=NAME` — allergy probe used during cart-add.

### Doctor Consultations
- CRUD on `/api/questions/` + `POST /api/questions/{id}/answer/`.
- CRUD on `/api/patient-records/`.

### Chatbot
- `POST /api/chat/` — single-turn message to the AI assistant.
- `GET /api/chat/history/` — conversation history for the current user.

A full endpoint reference with payload examples is included in the project graduation documentation.

---

## Testing

### Backend
```bash
cd backend/pharmacy_project
python manage.py test pharmacy
```

Test layout under `pharmacy/tests/`:
- `test_models.py` — model invariants (unit).
- `test_serializers.py` — JSON serialization (unit).
- `test_api.py` — request/response cycles for auth, catalog, cart, orders (integration).
- `test_views.py` — extended ViewSet coverage including the stock-request workflow (integration).

### Frontend
```bash
cd frontend
CI=true npm test
```

Tests live under `frontend/src/__tests__/` and `frontend/src/App.test.js`. They are component-isolation tests written with React Testing Library against mocked components and providers; the backend integration tests cover the real end-to-end API contract that the frontend consumes.

---

## Security

- JWT access + refresh tokens (`djangorestframework-simplejwt`).
- Passwords hashed with Django's PBKDF2-SHA256.
- Role-based permission classes enforced server-side on every protected endpoint.
- CORS controlled via `CORS_ALLOW_ALL_ORIGINS` / `CORS_ALLOWED_ORIGINS` environment variables.
- All sensitive configuration (`SECRET_KEY`, `OPENROUTER_API_KEY`, DB credentials) read from environment variables via `python-decouple`.
- The frontend `axios` response interceptor refreshes expired access tokens transparently; a failed refresh routes the user to the login screen.

---

## Production Deployment

1. Set `DEBUG=False` and a strong, unique `SECRET_KEY` in the backend `.env`.
2. Populate `ALLOWED_HOSTS` with your domain(s) and switch `CORS_ALLOW_ALL_ORIGINS=False`, listing trusted origins in `CORS_ALLOWED_ORIGINS`.
3. Switch the database from SQLite to PostgreSQL (or MySQL) in `settings.py`.
4. Run `python manage.py collectstatic` and serve `STATIC_ROOT` from a static-file server or CDN.
5. Run the backend behind a production WSGI server (e.g. Gunicorn) fronted by a reverse proxy (e.g. Nginx) terminating TLS.
6. Build the frontend with `npm run build` and serve the resulting `build/` directory from the same reverse proxy.

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Run the test suites (`python manage.py test pharmacy` and `CI=true npm test`) before submitting.
4. Open a pull request.

---

## License

MIT — see the project root for details.
