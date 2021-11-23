const axios = require('axios');
const cheerio = require('cheerio');
const delay = require('delay');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function writeCsv({ path, header }, data) {
  const csvWriter = createCsvWriter({
    path,
    header,
  });

  return csvWriter.writeRecords(data);
}

const url = 'https://etks.info/etks';
axios
  .get(url)
  .then(scrape)
  .then((data) => {
    return writeCsv(
      {
        path: './output.csv',
        header: [
          { id: 'title', title: 'Issue' },
          { id: 'profession', title: 'Profession' },
          { id: 'desc', title: 'Description' },
          { id: 'url', title: 'Link' },
        ],
      },
      data
    );
  });

function scrapeMainPage({ data }) {
  const $ = cheerio.load(data);
  const issues = $("dt a[href *= 'etk']");
  return issues.slice(0, 5).map((_, v) => {
    return {
      url: v.attribs['href'],
      title: v.children[0].data,
      desc: v.parentNode.parentNode.children[3].children[0].data,
    };
  });
}

async function scrapeProfessions(issues) {
  let res = [];
  for await (const issue of issues) {
    await delay(1000);

    const url = `https://etks.info${issue.url}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const links = $("ul a[href *= 'etk']");
    const professions = links.map((_, link) => link.children[0].data);
    res = res.concat(
      [...professions].map((p) => {
        return {
          profession: p,
          ...issue,
        };
      })
    );
  }

  return res.slice(0, 5);
}

function scrape(page) {
  const issues = scrapeMainPage(page);
  return scrapeProfessions(issues);
}
