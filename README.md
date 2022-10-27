# gak-ngotak
Discord Random Auto Chat with Puppeteer

I remake [selenium automation](https://github.com/FarizInk/discord-random-auto-chat) with puppeteer, with improvement:
- Support Docker
- More Simple than selenium version
- Can run in background

### Note
Docker tested on mac M1 not work ❌, but on Ubuntu 22.04 work correctly ✅. I'm having trouble running the docker version on M1 because it's using ARM. If email and password empty, you can scan barcode appear in console for Discord authorization 🥳.


### Run on Node JS
```bash
# clone this repository
cp env.example .env
nano .env
npm install
npm run start
```

### Run on Docker
```bash
# clone this repository
cp env.example .env
nano .env
./build.sh
./run.sh
```