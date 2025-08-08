import express, { Request, Response } from 'express';
import logger from './config/logger';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  logger.info('Hello from the root!');
  res.send('Hello, World!');
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
