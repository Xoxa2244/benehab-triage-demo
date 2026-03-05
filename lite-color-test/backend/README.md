# Lite Color Test Backend

## Run

```bash
cd lite-color-test/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

API base: `http://localhost:8010/api`

Data persistence: `lite-color-test/backend/data/storage.json`

## Run Tests

```bash
cd lite-color-test/backend
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```
