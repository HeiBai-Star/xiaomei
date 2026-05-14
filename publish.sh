#!/usr/bin/env bash
set -e

cd /home/shabi/projects/magicdong.top

echo "Checking changes..."
git status

echo "Building project..."
npm run build

echo "Restoring build output changes..."
git restore out 2>/dev/null || true

echo "Adding source changes..."
git add .

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

echo "Committing changes..."
git commit -m "Update site"

echo "Pulling latest changes..."
git pull --rebase origin main

echo "Pushing to GitHub..."
git push origin main

echo "Done. Cloudflare Pages will deploy automatically."
