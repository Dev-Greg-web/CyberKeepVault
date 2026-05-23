# CyberKeep

CyberKeep is a single-admin password and prompt vault built as a Flask + React monolith.

## Development

Backend:

```powershell
cd D:\FullStackRoad\CyberKeep
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
.\.venv\Scripts\python -m backend.app
```

Frontend:

```powershell
cd D:\FullStackRoad\CyberKeep\frontend
npm install
npm run dev
```

Default local URLs:

- Flask API: `http://127.0.0.1:5000`
- Vite UI: `http://127.0.0.1:5173`

## Monolith Build

```powershell
cd D:\FullStackRoad\CyberKeep\frontend
npm run build
cd ..
.\.venv\Scripts\python -m backend.app
```

Then open `http://127.0.0.1:5000`.

