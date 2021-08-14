#!/usr/bin/env node

const debuglog = require('util').debuglog('snapshot');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const puppeteer = require('puppeteer');
const yargs = require('yargs/yargs');

const args = yargs(process.argv.slice(process.argv))
    .demandOption(['site', 'out'])
    .argv;

const sitePath = args.site;
const outPath = args.out;
const hostPort = args.host || 'localhost:8080';
const excludes = (args.excludes || "").split(',').filter(e => e);

console.log('_site  dir : ', sitePath);
console.log('output  dir: ', outPath);
console.log('excludes   : ', excludes);
console.log('host:port  : ', hostPort);

if (!fs.existsSync(sitePath))
    throw new Error('_site dir does not exist: ' + sitePath);

allFiles = glob.sync('**/*.html', { cwd: sitePath });
console.log('Found ' + allFiles.length + " HTML files")

for (const f of allFiles) {
    debuglog('Found: ' + f);
}


(async () => {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });


        for (const suffix of allFiles) {
            if (excludes.includes(suffix)) {
                console.log('Skipping excluded page: ' + suffix);
                continue;
            }
            const url = 'http://' + hostPort + '/' + suffix;
            const out = outPath + '/' + suffix + '.png'
            const dir = path.dirname(out);

            // fully mkdir the output directories in case any 
            // don't exist
            fs.mkdirSync(dir, { recursive: true })

            let ts = process.hrtime();
            await page.goto(url);
            height = await page.evaluate(_ => { return document.body.clientHeight });
            let gotots = process.hrtime(ts);
            ts = process.hrtime();
            await page.screenshot({ path: out, fullPage: true });
            screeshotts = process.hrtime(ts);
            const size = fs.statSync(out).size;

            function tsformat(ts) {
                let seconds = ts[0] + ts[1] / 1000000000;
                return seconds.toFixed(2);
            }

            console.log('(' + height + ' px, ' + (size / 1000000).toFixed(2) + ' MB, goto: '
                + tsformat(gotots) + ', ss: ' + tsformat(screeshotts) + ') Captured ' + url + ' to ' + out);
        }
    } finally {
        await browser.close();
    }
    console.log('Snapshot captured successfully');
})()
    .catch(e => {
        console.error(e);
        process.exitCode = 1;
    });


