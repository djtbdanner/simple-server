const http = require('http');
const fs = require('fs');
const path = require('path');

const content = "/public";
let contentFiles = getContentFiles(content);

const port = 3000;

app = http.createServer(async function (req, res) {
  try {
    let url = req.url;

    url = allowContextLocally(url);
    if (!contentFiles.includes(url)) {
      console.log(`${url} NOT listed as content, allowed url/files: ${contentFiles}`);
      res.writeHead(404);
      res.end(JSON.stringify({ notfound: url }));
      return;
    }

    // if from another origin, the browser will request access and this will give it.
    // this is something for local testing, should not be deployed most likely
    setAllowCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      console.log(`-- return 204 for cors query --\n`);
      return;
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await getRequestBody(req);
      console.log(`Request body: ${body}`);
      // if process requires body here it is  
    }

    if (url === "/" || url === "") {
      url = "/index.html"
    }

    fs.readFile(__dirname + content + url, function (err, data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      const contentType = getContentTypeString(url);
      res.setHeader("Content-Type", contentType);
      res.writeHead(200);
      res.end(data);
    });
  } catch (error) {
    sendResponse(res, 404, `Programe error ${JSON.stringify(err)}`);
    res.writeHead(404);
    res.end(`Programe error ${JSON.stringify(err)}`);
    return;
  }
});


app.listen(port, () => {
  console.log(`Server started listening on port ${port}\nhttp://localhost:${port}/`)
});


function getContentTypeString(fileName) {
  if (!fileName || fileName.split(`.`).length < 1) {
    console.log(`No content file name returning default ...`)
    return `text/html`;
  }
  const ext = fileName.split(`.`).slice(-1)[0];
  /// if any missing - https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
  let type;
  switch (ext) {
    case `bmp`:
      type = `image/bmp`;
      break;
    case `css`:
      type = `text/css`;
      break;
    case `csv`:
      type = `text/csv`;
      break;
    case `doc`:
      type = `application/msword`;
      break;
    case `docx`:
      type = `application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
      break;
    case `eot`:
      type = `application/vnd.ms-fontobject`;
      break;
    case `gz`:
      type = `application/gzip`;
      break;
    case `gif`:
      type = `image/gif`;
      break;
    case `ico`:
      type = `image/vnd.microsoft.icon`;
      break;
    case `jpg`:
      type = `image/jpeg`;
      break;
    case `jpeg`:
      type = `image/jpeg`;
      break;
    case `js`:
      type = `text/javascript`;
      break;
    case `json`:
      type = `application/json`;
      break;
    case `mp3`:
      type = `audio/mpeg`;
      break;
    case `mp4`:
      type = `video/mp4`;
      break;
    case `mpeg`:
      type = `video/mpeg`;
      break;
    case `png`:
      type = `image/png`;
      break;
    case `svg`:
      type = `image/svg+xml`;
      break;
    case `ttf`:
      type = `font/ttf`;
      break;
    case `txt`:
      type = `text/plain`;
      break;
    case `wav`:
      type = `audio/wav`;
      break;
    case `woff`:
      type = `font/woff`;
      break;
    case `woff2`:
      type = `font/woff2`;
      break;
    case `xml`:
      type = `application/xml`;
      break;
    case `zip`:
      type = `application/zip`;
      break;
    case `7z`:
      type = `application/x-7z-compressed`;
      break;
    default:
      type = `text/html`;
  }
  console.log(`Retrieving "${fileName}", as a "${ext}" file, ContentType = ${type}`)
  return type;
}

function setAllowCorsHeaders(res) {
  res.setHeader(`Access-Control-Allow-Origin`, `*`);
  res.setHeader(`Access-Control-Allow-Credentials`, `true`);
  res.setHeader(`Access-Control-Allow-Methods`, `*`);
  res.setHeader(`Access-Control-Allow-Headers`, `*`);

}


/**
 * fbclid is added when called from facebook
 */
function allowContextLocally(url) {
  if (url.includes(`?fbclid`)) {
    let idontwantfacebook = url.indexOf(`?fbclid`);
    console.log(`linked in from facebook: ${url}`);
    url = url.substring(0, idontwantfacebook);
  }
  return url;
}

/**
* Create an array of all the files in public for basic security, only serve files in the public directory
* @param contentFolder
* @returns {string[]}
*/
function getContentFiles(contentFolder) {
  let contentFiles = [];

  function buildContentFileList(contentFolder) {
    fs.readdirSync(__dirname + contentFolder).forEach(File => {
      const Absolute = path.join(contentFolder, File);
      if (fs.statSync(__dirname + Absolute).isDirectory()) return buildContentFileList(Absolute);
      else return contentFiles.push(Absolute);
    });
  }

  buildContentFileList(content);
  contentFiles = contentFiles.map(fileName => fileName.split(`\\`).join(`/`).replace(content, ``));
  contentFiles.push(`/`);
  // console.log(`Allowed content files \n ${contentFiles}`);
  return contentFiles;
}

async function getRequestBody(req) {
  let data = ``;
  req.on(`data`, (chunk) => {
    data += chunk;
  });

  return new Promise((resolve) => {
    req.on(`end`, () => {
      resolve(data);
    });
  });
}