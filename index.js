#!/usr/bin/env node
require('node:child_process').exec('npm i -D rollup @rollup/plugin-commonjs git+https://github.com/wessberg/rollup-plugin-ts', { stdio: "inhire"},
(error, _stdout, _stderr) => (error) && console.error(`exec error: ${error}`))

// Sorry for the old behavior and code i guess this is much better it adds rollup to the dependencies.
// npx create-rollup 
// npm init rollup
//https://github.com/stealify/create-rollup
