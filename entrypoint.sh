#!/bin/sh
set -e

node dist/migrations.mjs
exec node --enable-source-maps dist/server.mjs
