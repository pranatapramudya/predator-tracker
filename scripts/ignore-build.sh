#!/usr/bin/env bash

# Vercel Ignored Build Step Script
# Documentation: https://vercel.com/docs/concepts/projects/overview#ignored-build-step
# Exit code 0: Skip build (batalkan deployment, hemat storage & bandwidth)
# Exit code 1: Lanjutkan build (deploy ke Vercel)

echo "🔍 [Predator Tracker] Mengecek apakah build Vercel perlu dijalankan..."

# 1. Skip jika pesan commit mengandung [skip ci] atau [skip vercel]
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
if echo "$COMMIT_MSG" | grep -qiE '\[skip ci\]|\[skip vercel\]'; then
  echo "🛑 [Build Skipped] Commit mengandung [skip ci] atau [skip vercel]."
  exit 0
fi

# 2. Skip jika commit dilakukan oleh github-actions[bot]
AUTHOR_NAME=$(git log -1 --pretty=%an 2>/dev/null || echo "")
if echo "$AUTHOR_NAME" | grep -qi "github-actions"; then
  echo "🛑 [Build Skipped] Commit dibuat oleh github-actions[bot]."
  exit 0
fi

# 3. Cek file apa saja yang diubah dalam commit ini
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && [ -n "$VERCEL_GIT_COMMIT_SHA" ]; then
  DIFF_FILES=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" 2>/dev/null)
else
  DIFF_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "ALL")
fi

# 4. Jika hanya data/, config/, docs/, atau markdown yang berubah -> SKIP!
if echo "$DIFF_FILES" | grep -qE '^(src/|public/|prisma/|package\.json|package-lock\.json|next\.config|tsconfig|tailwind)'; then
  echo "✅ [Build Proceeding] Kode aplikasi diubah. Melanjutkan deployment ke Vercel..."
  exit 1
else
  echo "🛑 [Build Skipped] Hanya data/docs/state yang berubah. Deployment di-skip untuk menghemat Functions Storage."
  exit 0
fi

