/* global process */ 
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import string from 'rollup-plugin-string';
import lessModules from 'rollup-plugin-less-modules';
import eslint from 'rollup-plugin-eslint-bundle';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import Debug from 'debug';
const debug = Debug('rollup.config.mjs');

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = (!process.env.ROLLUP_WATCH);

const plugins = [ commonjs(), globals(), builtins(),
  resolve({
    browser: false, 
  }),
  sizeSnapshot(),
  // optional exclude: ['**/index.html']
  lessModules(),
  eslint({
    fix: true,
  }),
  string({ include: '**/*.html'	}),
  string({ include: '**/*.stache'	}),
  string({ include: '**/*.css'	}),
  !production && function(){
    return { // CanJS Related Stuff
      name: '',
      transform(code, id) {
        const isCan=(code)=>{
          if (code.indexOf('Component.extend({') > -1) {
            Debug('rollup.config.mjs')('');
            // eslint-disable-next-line no-console
            console.log(id,'=>','CanJS Component');
            return true;
          }
          return false;
        };    
        if (isCan(code)) {
          return {
            code,
            map: { mappings: null } //'' for no map
          };
        }
      }
    };
  }(),
];

async function rreaddir(dir, allFiles = []) {
  const { join } = await import('path');
  const { readdir, stat } = await import('fs');
  const { promisify } = await import('util');
  const files = (await promisify(readdir)(dir)).map(f => join(dir, f));
  allFiles.push(...files);
  await Promise.all(files.map(async f => (await promisify(stat)(f)).isDirectory() && rreaddir(f, allFiles)));
  return allFiles;
}

const isJs = x=> (x.indexOf('.js') > -1);
const isESM = x=> (x.indexOf('.mjs') > -1);
const isTest = x=> (x.indexOf('test') > -1);
const fileIsScript = x=>(isJs(x) || isESM(x));

// 'path/file.ext' => input={ 'path/fileWithoutExt'-dir: 'dir/path/file.ext'}
const mapFiles = (x,input,dir='src/') =>{
  input[`components/${x.split(dir)[1].split('.js')[0].split('.mjs')[0]}`] = x;
};    

async function getInputFilesFromDir(dir) {
  const input = {
    'index': 'src/index.js'
  };
  
  const Files = await rreaddir(dir);
  Files.filter(x=>(fileIsScript(x) && !isTest(x))).map(x=>mapFiles(x,input));
  debug(input);
  return input;
}

/** 
  * uglify-es is no longer maintained and uglify-js does not support ES6+.
  * terser is a fork of uglify-es that retains API and CLI compatibility with uglify-es and uglify-js@3
  * will later get replaced by babel/minify as soon as we have hardned the apis
*/
async function minify(){
  const { terser } = await import('rollup-plugin-terser');
  return terser({
    output: {
      //comments: "all",
      comments: function(node, comment) {
        var text = comment.value;
        var type = comment.type;
        if (type == 'comment2') {
          // multiline comment
          return /@preserve|@license|@cc_on/i.test(text);
        }
      },
    }
  });
}

async function configPromise() {

  const input = await getInputFilesFromDir('src/components/');

  const inputMin = {};
  Object.keys(input).map(key=>{
    let val = input[key];
    inputMin[key+'.min'] = val;
  });

  const options = {
    //experimentalPreserveModules: true,
    experimentalCodeSplitting: true,
    input,
    plugins,
  };

  const use = x=>Object.assign(options,x);
  return [use({
    output: { // SystemJS version, for older browsers minifyed
      dir: 'dist/system',
      format: 'system',
      exports: 'named',
      sourcemap: true
    },
    plugins: plugins.concat([await minify()]),
  }),use({ 
    output: { // ESModule version, for modern browsers
      dir: 'dist/module',
      format: 'esm',
      //exports: 'named',
      //sourcemap: true
    },
  }),use({
    input: inputMin,
    output: { // ESModule version, for modern browsers minifyed
      dir: 'dist/module',
      format: 'esm',
      //exports: 'named',
      //sourcemap: true
    },
    plugins: plugins.concat([await minify()]),  
  })];
}

export default configPromise;