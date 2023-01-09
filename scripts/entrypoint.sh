#!/usr/bin/env sh
# apidoc uses INDEXER_FCD_URI env var
npm run apidoc
exec npm run "$@"
