import logger from './utils/logger';
import routeAnnouncement from './routes/announcements';
import routeAuth from './routes/auth';
import routeContest from './routes/contests';
import routeMe from './routes/me';
import routeUser from './routes/users';
import routePostman from './routes/postman';
import { ERROR_CODE, GeneralError } from './utils/common-errors';
import { getCurrentTimestamp } from './utils/common-utils';
import { NextFunction, Request, Response, Router } from 'express';
import { sessionMiddleware } from './utils/session-utils';

const router = Router();

router.use(sessionMiddleware());

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
    error_msg: 'Current timestamp',
  });
});

router.use('/contests', routeContest);
router.use('/announcements', routeAnnouncement);
router.use('/users', routeUser);
router.use('/me', routeMe);
router.use('/auth', routeAuth);
router.use('/postman', routePostman);

router.use((req: Request, res: Response, next: NextFunction) => {
  next(
    new GeneralError({
      error: ERROR_CODE.ROUTE_NOT_FOUND,
      error_msg: 'You are sending a request to an undefined route.',
      data: { method: req.method, url: req.url },
    }),
  );
});

router.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  if (err instanceof GeneralError) {
    res.status(400).json({
      error: err.error,
      error_msg: err.error_msg,
      data: err.data,
    });
  } else {
    res.status(500).json({
      error: ERROR_CODE.UNKNOWN_ERROR,
      error_msg: 'Unknown error',
      data: err.toString(),
    });
  }
});

export default router;
