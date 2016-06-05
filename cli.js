#!/usr/bin/env node
'use strict';
const axios = require('axios');
const cheerio = require('cheerio');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { resolve } = require('url');
const { spawn } = require('child_process');


let errorHandler = err => console.log(`Error ${err.status || ''}. ${err.statusText || ''}`);


let crawl_links = (url, dir) =>
  axios
    .get(url)
    .then(function(res) {
      let $ = cheerio.load(res.data);
      let links = [];
      $('a').each(function() {
        let link = $(this).attr('href');
        if (link) {
          let lin = resolve(url, link);
          if (/\.\w{2,4}$/.test(lin)) {
            links.push(lin);
          }
        }
      });
      if (links.length > 0) {
        download_url(links, dir);
      }
    })
    .catch(errorHandler)
;


let output_link = function(link, folder) {
  let b_link = link.split('/');
  let fname = b_link[b_link.length-1];
  if (/&/.test(fname)) {
    fname = fname.split('=').slice(-1)[0];
  }
  let file_name = path.join(path.resolve(folder), decodeURI(fname));
  return file_name;
};


var download_url = function(urls, dir) {
  inquirer
    .prompt([
      {
        name: 'bin',
        message: 'Downloader (use full path if possible)',
        type: 'input',
        default: 'curl'
      },
      {
        name: 'args',
        message: 'CLI argument flags (other than output, - to skip)',
        type: 'input',
        default: '-L'
      },
      {
        name: 'out',
        message: 'CLI output flags (comes right before output)',
        type: 'input',
        default: '-o'
      }
    ])
    .then((res) => {
      let arg = [];
      if (res.args !== '-')
        arg = res.args.split(' ');
      urls.forEach(function(url) {
        let file_name = output_link(url, dir);
        spawn(res.bin, arg.concat(url, res.out, file_name));
        console.log('Downloading', url, 'as', file_name);
      });
    });
};


let ask_link = function() {
  let link = process.argv[2];
  let questions = [];
  questions.push;

  if (!link) {
    questions.push({
      name: 'link',
      message: 'Give link to the page you wanna download from.',
      type: 'input'
    });
  }

  questions.push({
    name: 'dir',
    message: 'Output directory',
    type: 'input',
    default: path.resolve('.')
  });

  inquirer
    .prompt(questions)
    .then(ans =>
      fs.stat(ans.dir, function(err, stat) {
        if (!stat) {
          fs.mkdirSync(ans.dir);
        }
        return crawl_links(link || ans.link, ans.dir);
      })
    );
};


if (require.main === module) {
  ask_link();
}
