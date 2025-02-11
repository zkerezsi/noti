#!/bin/sh

sed -n '/gql`/,/`/p' ../src/typeDefs.ts | sed '1d; $d' | sed 's/^  //' > ../schema.gql
