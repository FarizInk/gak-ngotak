const puppeteer = require('puppeteer');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

require('dotenv').config()

const isEmpty = (something) => something === "" || something === null || something === undefined;
const getText = async () => {
    let text, value;
    if (isEmpty(process.env.RANDOM_SENTENCES)) {
        await axios.get('https://quotable.io/random')
            .then(function (response) {
                const data = response.data;
                value = `"*${data.content}*" - ***${data.author}***`
                text = `"${data.content}" - ${data.author}`
            });
    } else {
        const randomSentences = process.env.RANDOM_SENTENCES.split('|');
        text = randomSentences[Math.floor(Math.random() * randomSentences.length)];
        value = text;
    }

    return {
        text: text,
        value: value
    };
}


console.log("Starting...");
(async () => {
    console.log('Initial browser 🌐');
    const browser = await puppeteer.launch({
        // headless: false,
        args: ['--no-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36')
        page.setDefaultNavigationTimeout(60 * 1000);
        console.log("🚀 Opening Login page Discord");
        await page.goto(`https://discord.com/login`, { waitUntil: ['load', 'networkidle0'] });
        if (isEmpty(process.env.EMAIL) || isEmpty(process.env.PASSWORD)) {
            await page.waitForSelector('div[class^=qrCode-]');
            await page.waitForTimeout(5000);
            const qrcodeUrl = await page.evaluate(async () => { 
                return await new Promise(resolve => { // <-- return the data to node.js from browser
                    resolve(document.querySelector("div[class^=qrCode-]").getAttribute("title"))
                })
            })
            if (qrcodeUrl === null) throw "Something Wrong 😕"; 
            console.log("You don't have credential, scan this barcode:");
            qrcode.generate(qrcodeUrl);
            console.log("You have 10 seconds to scan barcode 🙂");
            await page.waitForTimeout(10000);
        } else {
            console.log("Login with credential: " + process.env.EMAIL);
            await page.waitForSelector('input[name=email], input[name=password]');
            await page.type('input[name=email]', process.env.EMAIL);
            await page.type('input[name=password]', process.env.PASSWORD);
            await page.click('button[type=submit]')
            await page.waitForTimeout(4000);
        }

        console.log("🚀 Go to channel: " + process.env.CHANNEL_URL);
        await page.goto(process.env.CHANNEL_URL)
        await page.waitForSelector('div[role=textbox]');
        await page.waitForTimeout(4000);

        let count = 0;
        while (true) {
            count++;
            const data = await getText();
            await page.type('div[role=textbox]', data.value);
            await page.keyboard.press('Enter');
            console.log("Count: " + count);
            if (isEmpty(process.env.RANDOM_SENTENCES)) {
                console.log("✉️ Sending Quote:");
                console.log(data.text);
            } else {
                console.log("✉️ Sending Text: " + data.value);
            }
            console.log("-------------------------------");
            await page.waitForTimeout(process.env.INTERVAL * 1000);
        }

    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.log(e);
    process.exitCode = 1;
});
