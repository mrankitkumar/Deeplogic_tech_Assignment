const http = require('http');
const https = require('https');

const PORT = 3000;
const url_api = 'https://time.com';

function fetchHtml(url, callback) {
    https.get(url, (response) => {
        let htmlData = '';
        response.on('data', (chunk) => {
            htmlData += chunk;
        });
        response.on('end', () => {
            callback(null, htmlData);
        });
    }).on('error', (err) => {
        callback(err);
    });
}


function getStories(html) {
    const stories = [];
    const start_content = '<div class="partial latest-stories"';
    const end_content = "</ul>"; 

    const start_ind = html.indexOf(start_content);
    const end_ind = html.indexOf(end_content, start_ind);
    console.log(start_ind,end_ind);
    if (start_ind !== -1 && end_ind !== -1) {
        const latest_stories = html.substring(start_ind, end_ind);
        const title =/<h3 class="latest-stories__item-headline">([^<]+)<\/h3>/g;
        const link = /<a href="([^"]+)">/g;


        let title_Match;
        let link_Match;
        const links = []; 
        while ((link_Match = link.exec(latest_stories)) !== null) {
            links.push(link_Match[1]);
        }

        while ((title_Match = title.exec(latest_stories)) !== null) {
            const title = title_Match[1].trim();
            const link = links.shift(); 
            if (link) {
                stories.push({ title, link: `${url_api}${link}` });
                if (stories.length >= 6) {
                    break;
                }
            }
        }
    }

    return stories;
}


const server = http.createServer((req, res) => {
    if (req.url === '/getTimeStories' && req.method === 'GET') {
        fetchHtml(url_api, (error, html) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error retrieving data from Time.com' }));
                return;
            }

            const lateststories = getStories(html);
            console.log(lateststories);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(lateststories));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Endpoint not found');
    }
});


server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});
