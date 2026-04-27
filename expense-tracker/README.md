# Expense Tracker

A full-stack personal finance application for tracking daily expenses, visualizing spending patterns, and exporting data — built with FastAPI and React.

![Dashboard preview](https://placehold.co/900x450?text=Add+a+screenshot+here)

## Features

- **Authentication** — register, login, JWT-based session management
- **Expense management** — create, edit, and delete expenses with category, date, and description
- **Filtering** — filter expenses by month, year, or category
- **Analytics dashboard** — pie chart of spending by category + bar chart of monthly trends
- **CSV export** — download all expenses as a spreadsheet
- **Responsive UI** — clean, mobile-friendly layout

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Python REST API framework
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM with SQLite
- [Pydantic](https://docs.pydantic.dev/) — data validation and schemas
- [python-jose](https://github.com/mpdavis/python-jose) — JWT authentication
- [passlib](https://passlib.readthedocs.io/) — password hashing (bcrypt)

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/) — client-side routing
- [Recharts](https://recharts.org/) — chart components
- [Axios](https://axios-http.com/) — HTTP client

## Project Structure

```
expense-tracker/
├── backend/
│   ├── main.py             # FastAPI app, CORS, router registration
│   ├── database.py         # SQLAlchemy engine and session
│   ├── models.py           # User and Expense ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── auth.py             # JWT creation and validation
│   ├── routers/
│   │   ├── auth.py         # /auth/register, /auth/login
│   │   └── expenses.py     # CRUD, summary, trend, CSV export
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js           # Axios instance with auth interceptor
    │   ├── context/AuthContext.jsx # Global auth state
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ExpenseForm.jsx     # Add / edit modal
    │   │   └── PrivateRoute.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Dashboard.jsx       # Charts and summary cards
    │       └── Expenses.jsx        # Table with filters and actions
    ├── index.html
    └── vite.config.js
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`.  
Interactive docs are available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/expenses/` | List expenses (supports `month`, `year`, `category` filters) |
| POST | `/expenses/` | Create a new expense |
| PUT | `/expenses/{id}` | Update an expense |
| DELETE | `/expenses/{id}` | Delete an expense |
| GET | `/expenses/summary` | Total spending grouped by category |
| GET | `/expenses/monthly-trend` | Monthly spending totals |
| GET | `/expenses/export` | Download expenses as CSV |

## Roadmap

- [ ] Monthly budget limits per category with overspend alerts
- [ ] Recurring expenses
- [ ] Multi-currency support
- [ ] Deploy to Railway (backend) + Vercel (frontend)

## License

MIT
