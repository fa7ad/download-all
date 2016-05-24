#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const inquirer = require('inquirer');
const spawn = require('child_process').spawn;
const resolve = require('url').resolve;


function errorHandler(err) {
    console.dir(err);
}


function crawl_links(url) {
    const crawler = axios.create({url: url});
    crawler
        .get(url)
        .then(function(res) {
            let $ = cheerio.load(res.data);
            $('a').each(function() {
                let link = $(this).attr('href');
                if (link){
                    let lin = resolve(url, link);
                    if(/\.(zip|rar|iso|dat|exe|msi|7z)$/.test(lin))
                        download_url(lin);
                }
            });
        })
        .catch(errorHandler);
}


function download_url(url) {
    let b_link = url.split('/');
    let fname = b_link[b_link.length-1];
    if (/&/.test(fname))
        fname = decodeURI(fname.split('=').slice(-1)[0]);
    try {
        spawn('wget', [url, '-O', fname]);
        console.log('Downloading', url, 'as', fname);
    } catch (e) {
        console.log('Please install "wget"');
    } finally {
        spawn('curl', ['-sL', url, '-o', fname]);
        console.log('Downloading', url, 'as', fname);
    }
}


function ask_link() {
    let question = {
        name: 'link',
        message: 'Give link to the page you wanna download from.',
        type: 'input'
    };

    inquirer
        .prompt([question])
        .then(ans => {
            crawl_links(ans.link);
        });
}


if (require.main === module)
    ask_link();