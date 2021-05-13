import { Request, Response, Router } from 'express';
import { getCurrentTimestamp } from './utils';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    error: 0,
    error_msg: '',
    // Format: https://docs.npmjs.com/cli/v7/configuring-npm/package-json
    data: {
      name: 'user-backend-v2',
      version: '2.0.0-test.1',
      description: 'User Backend v2',
      homepage: '',
      contributors: [
        {
          name: 'Kien Nguyen',
          email: 'kc97ble@gmail.com',
        },
      ],
    },
  });
});

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
