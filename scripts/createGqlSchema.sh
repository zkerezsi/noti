#!/bin/sh

sed -n '/gql`/,/`/p' src/graphql/types.ts | sed '1d; $d' | sed 's/^  //' > schema.gql
