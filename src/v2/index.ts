import { Request, Response, Router } from 'express';
import { getCurrentTimestamp } from './utils';

const router = Router();

router.get('/timestamp', (req: Request, res: Response) => {
  res.json({
    data: {
      timestamp: getCurrentTimestamp(),
    },
    error: 0,
    error_msg: '',
  });
});

export default router;
