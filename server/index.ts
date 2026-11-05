import { createApp } from './app.js';
import { config } from './config.js';

const { app, db } = createApp();

const server = app.listen(config.port, () => {
  console.log(`Pantry is running at http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
