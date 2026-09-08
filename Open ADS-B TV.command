#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")"
if [ ! -d node_modules ] || [ ! -d apps/tvos/node_modules ]; then
  npm run setup || exit 1
fi
npm run preview:tv
