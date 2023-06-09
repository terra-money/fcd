#!/usr/bin/env sh
# apidoc uses FCD_URI env var
npm run apidoc
exec npm run "$@"
