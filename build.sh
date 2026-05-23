#!/usr/bin/env bash
# Zatrzymuje skrypt w przypadku błędu
set -o errexit

echo "Budowanie Frontendu..."
cd frontend
npm install
npm run build
cd ..

echo "Instalowanie zależności Backendu..."
cd backend
pip install -r requirements.txt
cd ..

echo "Build zakończony sukcesem!"
