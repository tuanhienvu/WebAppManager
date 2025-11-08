const { createServer } = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> WebApp Manager ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start Next.js server:', err);
    process.exit(1);
  });

