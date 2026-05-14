#!/usr/bin/env bash
set -euo pipefail

cd /home/shabi/projects/magicdong.top

MSG="${1:-Update site}"

echo "Building project..."
npm run build

echo "Cleaning build output from git working tree..."
git restore out 2>/dev/null || true
git clean -fd out 2>/dev/null || true
git restore .next 2>/dev/null || true
git clean -fd .next 2>/dev/null || true

echo "Current source changes:"
git status --short

echo "Adding source changes..."
git add -A

if ! git diff --cached --quiet; then
  echo "Committing changes..."
  git commit -m "$MSG"
else
  echo "No new source changes to commit."
fi

echo "Pulling latest changes from GitHub..."
git pull --rebase origin main

echo "Pushing to GitHub..."
git push origin main

echo "Done. Cloudflare Pages will deploy automatically."
