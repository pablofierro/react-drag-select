#!/bin/bash

set -e
echo $(git rev-parse --show-toplevel) # to fail if we are in wrong place
cd "$(git rev-parse --show-toplevel)"
npm run build-demo
cd sample/
git init .
git add .
git commit -m "Update pages"
git push git@github.com:pablofierro/react-drag-select.git master:gh-pages --force
rm -rf .git
