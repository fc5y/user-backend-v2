import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import v2 from './v2';
import logger from './v2/utils/logger';

const app = express();
const port = process.env.PORT || 8013;

app.set('json spaces', 2);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    name: 'user-backend-v2',
  });
});

app.use('/api/v2', v2);

app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: 404,
    error_msg: 'Route not found',
    data: null,
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({
    error: 500,
    error_msg: 'Server error',
    data: err,
  });
});

app.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
