import { NextFunction, Request, Response, Router } from 'express';
import { getCurrentTimestamp } from './utils/common-utils';
import routeContest from './routes/contests';
import { ERROR_CODE, GeneralError, JsonSchemaValidationError } from './utils/common-errors';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
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

router.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err); // TODO: use a proper logger
  if (err instanceof GeneralError) {
    res.status(400).json({
      error: err.error,
      error_msg: err.error_msg,
      data: err.data,
    });
  } else if (err instanceof JsonSchemaValidationError) {
    res.status(400).json({
      error: ERROR_CODE.JSON_SCHEMA_VALIDATION_FAILED,
      error_msg: err.name,
      data: {
        message: err.message,
        errors: err.errors,
      },
    });
  } else {
    res.status(500).json({
      error: ERROR_CODE.UNKNOWN_ERROR, // TODO: use a correct error code
      error_msg: 'Unknown error',
      data: err.toString(),
    });
  }
});

export default router;
