#!/usr/bin/env node
/* global process */
const { name } = require('./package.json');

const fs = require('fs');
const path = require('path');
const Debug = require('debug');
const debug = Debug('FileTransfer::');
if (name === 'create-rollup' && process.cwd().indexOf('create-rollup') >-1 ) {
  debug('Detected myself',process.cwd());
  process.exit();
}

function copyFileSync( source, target ) {

  var targetFile = target;

  //if target is a directory a new file with the same name will be created
  if ( fs.existsSync( target ) ) {
    if ( fs.lstatSync( target ).isDirectory() ) {
      targetFile = path.join( target, path.basename( source ) );
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyRecursiveSync( source, target ) {
  var files = [];

  //check if folder needs to be created or integrated
  let targetPath = path.basename( source );
  if (targetPath === 'create-rollup') {
    targetPath = '';
    debug([path.basename( source )].join());  
  }
  var targetFolder = path.join( target, targetPath); // 
  
  
  if (path.basename( source ) === 'node_modules' || path.basename( source ) === '.git') {
    debug('targetFolder =>',targetFolder,path.basename( target));
    debug('srcFolder =>',source,path.basename( target));
    return;
  }
  debug('targetFolder =>',targetFolder);
  if ( !fs.existsSync( targetFolder ) ) {
    fs.mkdirSync( targetFolder );
  }

  //copy
  if ( fs.lstatSync( source ).isDirectory() ) {
    files = fs.readdirSync( source );


    files.forEach( function ( file ) {
      var curSource = path.join( source, file );
      
      if (path.basename(curSource) === '.git') {
        return;
      }

      if (path.basename(curSource) === 'node_modules') {
        return; 
      }

      debug('=>',curSource);
      if ( fs.lstatSync( curSource ).isDirectory() ) {
        copyRecursiveSync( curSource, targetFolder );
      } else {
        copyFileSync( curSource, targetFolder );
      }
    } );
  }
}

const src = __dirname;
const dest = process.cwd();
debug(`Copy: ${src} => ${dest}`);
copyRecursiveSync(src,dest);
//https://github.com/stealify/create-rollup