import fs from 'fs'
import puppeteer from 'puppeteer';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getCupos(page, name, url) {
    console.log("PROCESSING ", name, url)
    // Navigate the page to a URL
    try {

        await page.goto(url);
        // await delay(1000)
        await page.reload()
    } catch (e) {
        console.log(e)
        console.log("TIMEOUT!:", name, url)
        return {}
    }

    const tableSeletor = '.contenidotabla'
    const rowSel = (n) => `td:nth-child(${n})`

    await page.waitForSelector(tableSeletor)
    const tables = await page.$$(tableSeletor)

    // console.log('res')
    let cuposMap = {}
    for (let table of tables) {
        const rows = await table.$$('tbody>tr')
        for (let rowIndex in rows) {
            const row = rows[rowIndex]
            if (rowIndex == 0) continue
            const grupoEl = await row.$(rowSel(1))
            const cupoEl = await row.$(rowSel(10))
            const cupo = await cupoEl?.evaluate(el => parseInt(el.textContent?.trim()))
            const grupo = await grupoEl?.evaluate(el => el.textContent?.trim())
            // console.log(grupo, cupo)
            cuposMap[grupo] = cupo
        }
    }
    console.log("END ", name, url)

    return cuposMap
}

async function notify2(name, grupo, cupos) {
    const token = "6359310569:AAEwZoI-j_vrDj4DvYa0Bou4rLzDVmK3pg0";
    const chat_id = -4145856704;
    const message = `hay ${cupos} cupo(s) en ${name}:${grupo}`
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${message}&parse_mode=html`;

    // const oReq = new XMLHttpRequest();
    await fetch(url)
    // oReq.open("GET", url, true);
    // oReq.send();
}

function notify(name, grupo, cupo) {
    console.log(name, grupo, cupo)
}

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: 'new',
        timeout: 300_000,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(300000)

    // Set screen size
    await page.setViewport({
        width: 1080,
        height: 1024
    });
    const args = process.argv;

    const contents = fs.readFileSync(args[2]).toString()
    const time = parseInt(args?.[3] ? args[3] : 60) * 1000
    console.log("time: ", time)


    const main = async () => {

        const rows = contents.split('\n')
        for (const row of rows) {
            const [name, grupos, url] = row.split(',')
            const cuposMap = await getCupos(page, name, url)
            const gruposXs = grupos.split('|')
            for (const grupo of gruposXs) {
                const cupo = cuposMap[grupo]
                if (cupo > 0)
                    await notify2(name, grupo, cupo)
            }
        }

    }

    while (true) {
        await main()
        await delay(time)
    }
    // setInterval(main, time)


    // Type into search box

    // await page.type('.search-box__input', 'automate beyond recorder');

    // // Wait and click on first result
    // const searchResultSelector = '.search-box__link';
    // await page.waitForSelector(searchResultSelector);
    // await page.click(searchResultSelector);

    // // Locate the full title with a unique string
    // const textSelector = await page.waitForSelector(
    //     'text/Customize and automate'
    // );
    // const fullTitle = await textSelector?.evaluate(el => el.textContent);

    // // Print the full title
    // console.log('The title of this blog post is "%s".', fullTitle);

    await browser.close();
})();