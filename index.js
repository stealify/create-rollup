#!/usr/bin/env node
const process = require('process');
const path = require('path');
const { basename, join } = require('path');
const Debug = require('debug');
const { 
  writeFileSync, 
  lstatSync,
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync
} = require('fs');

const { name } = JSON.parse(readFileSync('./package.json'));
const debug = Debug('FileTransfer::');

if (name === 'create-rollup' && process.cwd().indexOf('create-rollup') >-1 ) {
  debug('Detected myself',process.cwd());
  process.exit();
}
//if target is a directory a new file with the same name will be created
const normalizeTarget = (target, source) => (existsSync(target) && lstatSync(target).isDirectory()) 
  ? path.join(target, basename(source)) 
  : target;

const copyFileSync = (source, target) => 
 !existsSync(target) && writeFileSync(target, readFileSync(source));


function copyRecursiveSync( source, target ) {
  var files = [];

  //check if folder needs to be created or integrated
  let targetPath = (basename(source) === 'create-rollup') ? '' : basename(source);
  if (targetPath === '') {
    debug([basename( source )].join());  
  }
  var targetFolder = path.join( target, targetPath);
    
  if (basename( source ) === 'node_modules' || basename(source) === '.git') {
    debug('targetFolder =>',targetFolder,basename( target));
    debug('srcFolder =>',source,basename( target));
    return;
  }

  debug('targetFolder =>',targetFolder);
  if ( !existsSync( targetFolder ) ) {
    mkdirSync( targetFolder );
  }

  //copy
  if ( lstatSync(source).isDirectory() ) {
    
    readdirSync(source).forEach( ( file ) => {
      var curSource = path.join( source, file ); 
      if (basename(curSource) === '.git') {
        return;
      }

      if (basename(curSource) === 'node_modules') {
        return; 
      }

      debug('=>',curSource);
      if ( fs.lstatSync( curSource ).isDirectory() ) {
        copyRecursiveSync( curSource, targetFolder );
      } else {
        const normalizedTarget = normalizeTarget(targetFolder)
        if (!existsSync(normalizedTarget)) {
          copyFileSync( curSource, normalizedTarget );
        } else {
          console.warn(normalizedTarget, 'got created already please delete')
        }
      }
    });
  }
}

const src = __dirname;
const dest = process.cwd();
debug(`Copy: ${src} => ${dest}`);
copyRecursiveSync(src,dest);
//https://github.com/stealify/create-rollup