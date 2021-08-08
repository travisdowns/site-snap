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
console.log('exclude dir: ', excludes);
console.log('host:port  : ', hostPort);

if (!fs.existsSync(sitePath))
    throw new Error('_site dir does not exist: ' + sitePath);

allFiles = glob.sync('**/*.html', { cwd: sitePath });
console.log('Found ' + allFiles.length + " HTML files")

for (const f of allFiles) {
    // debuglog('Found: ' + f);
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
            
            await page.goto(url);
            await page.screenshot({ path: out, fullPage: true });
            const size = fs.statSync(out).size;
            console.log('(' + (size / 1000000).toFixed(2) + ' MB) Captured ' + url + ' to ' + out);
        }
    } finally {
        await browser.close();
    }
})()
.then(() => {
    console.log('Success');
})
.catch(e => {
    console.error(e);
    process.exitCode = 1;
})
;


