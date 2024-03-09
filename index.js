import puppeteer from 'puppeteer'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { Telegraf } from 'telegraf'

dotenv.config()

const isEmpty = (something) => something === "" || something === null || something === undefined;
const getText = async () => {
  let text, value;
  if (isEmpty(process.env.RANDOM_SENTENCES)) {
    try {
      await axios.get('https://quotable.io/random')
        .then(function (response) {
          const data = response.data;
          value = `"*${data.content}*" - ***${data.author}***`
          text = `"${data.content}" - ${data.author}`
        })
        .catch((err) => {
          const errorMsg = "Error Status: " + err?.response?.status + ", " + err?.response?.statusText;
          console.log(errorMsg);
          console.log("-------------------------------");
          text = errorMsg
          value = errorMsg
        });
    } catch (error) {
      const msg = "Something wrong!";
      console.log(error.message);
      text = msg;
      value = msg;
    }
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

const parsingQrCode = async (page) => {
  console.log('Pasing QR Code')
  await page.setViewport({ width: 1440, height: 1080 });
  await page.screenshot({ path: 'screenshot.png' });
  const app = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  await app.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, { source: './screenshot.png' })
  await page.waitForTimeout(60000);
}

const authEmail = async (page) => {
  console.log('auth email...')
  await page.type('input[name=email]', process.env.EMAIL);
  await page.type('input[name=password]', process.env.PASSWORD);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
}

const doTask = async (page) => {
  await page.waitForSelector('div[role=textbox]');
  let count = 0;
  while (true) {
    count++;
    // if (count % (43200/process.env.INTERVAL) === 0) {
      if (count % 2 === 0) {
      await page.type('div[role=textbox]', 't!profile');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await page.type('div[role=textbox]', 't!fishy inventory');
      await page.keyboard.press('Enter');
      await page.setViewport({ width: 1440, height: 1080 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshot.png' });
      await app.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, { source: './screenshot.png' })
      console.log('ss sended, check your file!')
    } else {
      const data = await getText();
      await page.type('div[role=textbox]', data.value);
      await page.keyboard.press('Enter');
      if (process.env.DEBUG_OUTPUT === 'true') {
        console.log("Count: " + count);
        if (isEmpty(process.env.RANDOM_SENTENCES)) {
          console.log("✉️ Sending Quote:");
          console.log(data.text);
        } else {
          console.log("✉️ Sending Text: " + data.value);
        }
        console.log("-------------------------------");
      }
    }
    await page.waitForTimeout(process.env.INTERVAL * 1000);
  }
}

const puppet = async () => {
  console.log('Initial browser 🌐');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      // '--window-size=1920,1080'
    ],
    // defaultViewport: {
    //   width: 1920,
    //   height: 1080
    // }
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36')
    page.setDefaultNavigationTimeout(60 * 1000);
    let pages = await browser.pages();
    await pages[0].close();

    while (true) {
      console.log("🚀 Go to channel: " + process.env.CHANNEL_URL);
      await page.goto(process.env.CHANNEL_URL, { waitUntil: ['load', 'networkidle0'] })

      await page.waitForTimeout(4000);
      if (await page.$('div[class^=qrCode_]') !== null) {
        // await parsingQrCode(page)
        await authEmail(page)
      } else if (await page.$('div[role=textbox]') !== null) {
        console.log('Do Task')
        await doTask(page)
      }
      console.log('restarting...')
    }

  } finally {
    await browser.close();
  }
}


console.log("Starting...");
(async () => {
  await puppet()
})().catch(async (e) => {
  console.log(e);
  process.exitCode = 1;

  await puppet()
});