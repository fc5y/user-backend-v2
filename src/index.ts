import express from 'express';
import cors from 'cors';
import v2 from './v2';

const app = express();
const port = process.env.PORT || 8013;

app.set('json spaces', 2);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    name: 'user-backend-v2',
  });
});

app.use('/api/v2', v2);

// TODO: handle error 404

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
