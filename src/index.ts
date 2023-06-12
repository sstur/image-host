import './env';

import express from 'express';
import cors from 'cors';

import * as handlers from './handlers';

const PORT = Number(process.env.PORT || 3000);

const app = express();
app.disable('x-powered-by');
app.use(cors());

app.get('/', (request, response) => {
  response.status(404).json({ error: 'Not Found' });
});

for (const attachHandler of Object.values(handlers)) {
  attachHandler(app);
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://localhost:${PORT}`);
});
