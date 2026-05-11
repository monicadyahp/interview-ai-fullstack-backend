const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const env = require('./config/env');
const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

connectDB().catch((err) => console.error('[boot] DB connect failed:', err.message));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
});

app.use(errorHandler);

if (env.NODE_ENV !== 'production') {
  app.listen(env.PORT, () => {
    console.log(`[server] running at http://${env.HOST}:${env.PORT}`);
    console.log(`[server] api root: http://${env.HOST}:${env.PORT}/api`);
  });
}

module.exports = app;
