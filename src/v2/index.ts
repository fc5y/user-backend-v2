import { NextFunction, Request, Response, Router } from 'express';
import { getCurrentTimestamp } from './utils';
import routeContest from './routes/contest';
import { JsonSchemaValidationError } from './utils/common-errors';

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

router.use('/contests', routeContest);

router.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(error); // TODO: use a proper logger
  if (error instanceof JsonSchemaValidationError) {
    res.status(400).json({
      error: -1, // TODO: use a correct error code,
      error_msg: error.name,
      data: {
        message: error.message,
        errors: error.errors,
      },
    });
  } else {
    res.status(500).json({
      error: -1, // TODO: use a correct error code
      error_msg: 'Server error',
      data: error.toString(),
    });
  }
});

export default router;
