const pug = require('pug')
const gaze = require('gaze')
const sass = require('sass')
const glob = require('glob').sync
const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const { uglify } = require('rollup-plugin-uglify')
const resolve = require('rollup-plugin-node-resolve')
const log = console.log;
const fePath = '../fe2';
const boards = require(`${fePath}/static/boards.json`);

const isProd = process.env.NODE_ENV === 'production';
const lynxPath = '../be/boot.js';

glob('html/**/*.pug').forEach(compileHtml)
gaze('html/**/*.pug', (e, watcher) => watcher.on('all', onChange(pugChange)));
glob('css/*.sass').forEach(compileCss)
gaze('css/**/*', (e, watcher) => watcher.on('all', () => {
  glob('css/*.sass').forEach(compileCss);
}));

const plugins = [ babel(), resolve() ];
if (isProd) plugins.push(uglify());

[
  'chan.js',
  'catalog.js'
].forEach(input => rollup.watch({
  input,
  output: {
    file: `${fePath}/static/` + input,
    format: 'iife'
  },
  plugins,
  watch: {
    clearScreen: false
  }
}).on('event', event => {
  switch(event.code) {
    case 'ERROR':
    case 'FATAL':
      console.log(event.error.frame || event.error)
      break;

    case 'BUNDLE_END':
      console.log(`generated ${input} in ` + event.duration + 'ms');
      break;
  }
}))

function onChange(cb) {
  return (event, filepath) => {
    log(chalk.gray(path.basename(filepath) + ' ' + event));
    if (event === 'added' || event === 'changed') {
      cb(filepath);
    }
  }
}

function pugChange(filepath) {
  compileHtml(filepath);
  const lynxReload = execSync(`${lynxPath} -nd -r -cc`);
  log(chalk.gray(String(lynxReload).trim()));
}

function compileHtml(filepath) {
  try {
    const pathObject = path.parse(filepath);
    const dir = pathObject.dir.match(/[^\/]+$/)[0];
    let dest = fePath;
    dest += dir === 'static' ? '/static' : `/templates/${dir}`;
    dest += `/${pathObject.name}.html`;
    console.log(dest)
    log(chalk.green('Compiling ' + path.relative('.', filepath)));
    const output = pug.renderFile(filepath, {
      basedir: '.',
      pretty: isProd ? false : '  ',
      boards
    })
    writeFileSync(dest, output);
  } catch(e) {
    log(chalk.red(e.msg));
  }
}

function compileCss(filepath) {
  try {
    const dest = `${fePath}/static/css/${path.basename(filepath, '.sass')}.css`;
    log(chalk.green('Compiling ' + path.relative('.', filepath)));

    const output = sass.renderSync({file: filepath, outputStyle: 'compressed'});
    writeFileSync(dest, output.css.toString());
  } catch(e) {
    log(chalk.red(e));
  }
}
