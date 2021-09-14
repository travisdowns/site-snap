#!/usr/bin/env node

const debuglog = require('util').debuglog('snap-site');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const puppeteer = require('puppeteer');
const yargs = require('yargs/yargs');

const args = yargs(process.argv.slice(process.argv))
    .strict()
    .option('site-dir',
        {
            describe: 'The root directory containing the static site files',
            type: 'string',
            demandOption: true
        })
    .option('out-dir',
        {
            describe: 'The path where the screenshots should be saved',
            type: 'string',
            demandOption: true
        })
    .option('out-dir',
        {
            describe: 'The path where the screenshots should be saved',
            type: 'string',
            demandOption: true
        })
    .option('host-port',
        {
            describe: 'The host and port where the static site is being served, like localhost:8080',
            type: 'string',
            demandOption: true
        })
    .option('protocol',
        {
            describe: 'The protocol used to access the webserver',
            choices: ['http', 'https'],
            type: 'string',
            default: 'http'
        })
    .option('include',
        {
            describe: 'A node-glob pattern of files to include',
            type: 'string',
            default: '**/*.html'
        })
    .option('exclude',
        {
            describe: 'A comma separated list of node-glob patterns to exclude',
            type: 'string',
            default: ''
        })
    .option('height',
        {
            describe: 'The height of the viewport and the screenshot if the page does not scroll vertically',
            type: 'int',
            default: 600
        })
    .option('width',
        {
            describe: 'The width of the viewport and the resulting screenshot',
            type: 'int',
            default: 1200
        })
    .option('dark',
        {
            describe: 'Set prefers-color-scheme to dark',
            boolean: true,
            default: false
        })
    .argv;

const sitePath = args['site-dir'];
const outPath = args['out-dir'];
const hostPort = args['host-port'];
const include = args.include;
const excludes = args.exclude.split(',').filter(e => e);
const viewHeight = args.height;
const viewWidth = args.width;

console.log('_site  dir : ', sitePath);
console.log('output  dir: ', outPath);
console.log('include    : ', include);
console.log('excludes   : ', excludes.toString());
console.log('host:port  : ', hostPort);
console.log('view height: ', viewHeight);
console.log('view width : ', viewWidth);
console.log('dark mode  : ', args.dark);

if (!fs.existsSync(sitePath))
    throw new Error('_site dir does not exist: ' + sitePath);

allFiles = glob.sync(include, { cwd: sitePath, ignore: excludes });
console.log('Found ' + allFiles.length + " HTML files")

for (const f of allFiles) {
    debuglog('Found: ' + f);
}

(async () => {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: viewWidth, height: viewHeight });

        if (args.dark) {
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
        }

        if (allFiles.length) {
            console.log("  Height  Goto Time  Shot Time       Size    Suffix")
        }
        for (const suffix of allFiles) {
            if (excludes.includes(suffix)) {
                console.log('Skipping excluded page: ' + suffix);
                continue;
            }
            const url = args.protocol + '://' + hostPort + '/' + suffix;
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

            function pad(val, size = 6) {
                const str = val + '';
                return ' '.repeat(Math.max(0, size - str.length)) + str;
            }

            function tsformat(ts) {
                let seconds = ts[0] + ts[1] / 1000000000;
                return pad(seconds.toFixed(2));
            }

            console.log(`${pad(height)}px    ${tsformat(gotots)}s    ${tsformat(screeshotts)}s` +
                `  ${pad((size / 1000000).toFixed(2))} MB    ${suffix}`);
        }
    } finally {
        await browser.close();
    }
    console.log('Snapshot captured successfully');
})()
    .catch(e => {
        console.error(e.stack);
        process.exitCode = 1;
    });


