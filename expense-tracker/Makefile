.PHONY: install dev stop db

install:
	python3 -m venv backend/venv
	backend/venv/bin/pip install -q -r backend/requirements.txt
	cd frontend && npm install

dev:
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	backend/venv/bin/uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 > /tmp/et-backend.log 2>&1 & echo $$! > /tmp/et-backend.pid
	cd frontend && npm run dev > /tmp/et-frontend.log 2>&1 & echo $$! > /tmp/et-frontend.pid
	@echo ""
	@echo "  Backend  →  http://localhost:8000"
	@echo "  Frontend →  http://localhost:5173"
	@echo "  API docs →  http://localhost:8000/docs"
	@echo ""
	@echo "  Run 'make stop' to shut down"

db:
	sqlite3 backend/expenses.db

stop:
	@[ -f /tmp/et-backend.pid ] && kill $$(cat /tmp/et-backend.pid) 2>/dev/null && rm /tmp/et-backend.pid && echo "Backend stopped" || echo "Backend not running"
	@[ -f /tmp/et-frontend.pid ] && kill $$(cat /tmp/et-frontend.pid) 2>/dev/null && rm /tmp/et-frontend.pid && echo "Frontend stopped" || echo "Frontend not running"
