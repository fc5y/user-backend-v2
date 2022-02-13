import { Router, Request, Response, NextFunction } from 'express';
import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { mustBeAdmin } from '../../utils/role-verification';
import { getTotalAnnouncements } from './utils';
import dbw from '../../utils/database-gateway-wrapper';

// #region GET /api/v2/announcements

type GetAllAnnouncementsParams = {
  offset: number;
  limit: number;
};

const getAllAnnouncementsParamsSchema: JSONSchemaType<GetAllAnnouncementsParams> = {
  type: 'object',
  required: ['offset', 'limit'],
  properties: {
    offset: { type: 'integer' },
    limit: { type: 'integer' },
  },
};

async function getAllAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const { offset, limit } = assertWithSchema(req.query, getAllAnnouncementsParamsSchema);
    const { error, error_msg, data } = await db.announcements.getAnnouncements({ offset, limit });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting announcements',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'Announcements',
      data: {
        total: await getTotalAnnouncements(),
        announcements: await Promise.all(
          data.items.map(async (announcement) => ({
            name: announcement.announcement_name,
            title: announcement.announcement_title,
            description: announcement.announcement_description,
          })),
        ),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region POST /api/v2/announcements/create

type CreateAnnouncementParams = {
  name: string;
  title: string;
  description: string;
};

const createAnnouncementParamsSchema: JSONSchemaType<CreateAnnouncementParams> = {
  type: 'object',
  required: ['name', 'title', 'description'],
  properties: {
    name: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
  },
};

async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, title, description } = assertWithSchema(req.body, createAnnouncementParamsSchema);
    if ((await dbw.announcements.getAnnouncementOrUndefined(name)) !== undefined) {
      throw new GeneralError({
        error: ERROR_CODE.ANNOUNCEMENT_EXISTED,
        error_msg: 'Announcement name already existed',
        data: { name },
      });
    }
    const { error, error_msg, data } = await db.announcements.createAnnouncements({
      name: name,
      title: title,
      description: description,
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Receive non-zero code from Database Gateway when creating Announcement',
        data: { response: { error, error_msg, data } },
      });
    }
    res.json({
      error: 0,
      error_msg: 'Announcement created',
      data: {
        announcement: {
          name: name,
          title: title,
          description: description,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region GET /api/v2/announcements/:announcement_name

type GetAnnouncementByNameParams = {
  announcement_name: string;
};

const getAnnouncementByNameParamsSchema: JSONSchemaType<GetAnnouncementByNameParams> = {
  type: 'object',
  required: ['announcement_name'],
  properties: {
    announcement_name: { type: 'string' },
  },
};

async function getAnnouncementByName(req: Request, res: Response, next: NextFunction) {
  try {
    const { announcement_name } = assertWithSchema(req.params, getAnnouncementByNameParamsSchema);
    const { error, error_msg, data } = await db.announcements.getAnnouncements({
      offset: 0,
      limit: 1,
      announcement_name: announcement_name,
    });
    if (error || !data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when getting announcements',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'Announcement',
      data: {
        announcements: await Promise.all(
          data.items.map(async (announcement) => ({
            name: announcement.announcement_name,
            title: announcement.announcement_title,
            description: announcement.announcement_description,
          })),
        ),
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region POST /api/v2/announcements/:announcement_name/delete

type DeleteAnnouncementParams = {
  announcement_name: string;
};

const deleteAnnouncementParamsSchema: JSONSchemaType<DeleteAnnouncementParams> = {
  type: 'object',
  required: ['announcement_name'],
  properties: {
    announcement_name: { type: 'string' },
  },
};

async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { announcement_name } = assertWithSchema(req.params, deleteAnnouncementParamsSchema);
    const { error, error_msg, data } = await db.announcements.deleteAnnouncements({
      announcement_name: announcement_name,
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero code from Database Gateway when deleting announcements',
        data: { response: { error, error_msg, data } },
      });
    }
    res.json({
      error: 0,
      error_msg: 'Announcement deleted',
      data: {
        name: announcement_name,
      },
    });
  } catch (error) {
    next(error);
  }
}

// #endregion

// #region POST /api/v2/announcements/:announcement_name/update

type UpdateAnnouncementParams = {
  announcement_name: string;
};

type UpdateAnnouncementBody = {
  name: string;
  title: string;
  description: string;
};

const updateAnnouncementParamsSchema: JSONSchemaType<UpdateAnnouncementParams> = {
  type: 'object',
  required: ['announcement_name'],
  properties: {
    announcement_name: { type: 'string' },
  },
};

const updateAnnouncementBodySchema: JSONSchemaType<UpdateAnnouncementBody> = {
  type: 'object',
  required: [],
  properties: {
    name: { type: 'string', nullable: true },
    title: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
  },
};

async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    // POST Update request
    const { announcement_name } = assertWithSchema(req.params, updateAnnouncementParamsSchema);
    const { name, title, description } = assertWithSchema(req.body, updateAnnouncementBodySchema);
    const { error, error_msg, data } = await db.announcements.updateAnnouncements({
      announcement_name: announcement_name,
      update_name: name,
      update_title: title,
      update_description: description,
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Receive non-zero code from Database Gateway when updating announcement',
        data: { response: { error, error_msg, data } },
      });
    }

    // GET Update response
    const newAnnouncementName = name || announcement_name;
    const getResponse = await db.announcements.getAnnouncements({
      offset: 0,
      limit: 1,
      has_total: false,
      announcement_name: newAnnouncementName,
    });
    if (getResponse.error || !getResponse.data) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Received non-zero error from Database Gateway when updating announcement',
        data: { response: getResponse },
      });
    }
    // Return Final result
    const announcementResult = getResponse.data.items[0];
    const responseResult = {
      name: announcementResult.announcement_name,
      title: announcementResult.announcement_title,
      description: announcementResult.announcement_description,
    };
    res.json({
      error: 0,
      error_msg: 'Announcement updated',
      data: responseResult,
    });
  } catch (error) {
    next(error);
  }
}

// #endregion

const router = Router();
router.get('/', getAllAnnouncements);
router.post('/create', mustBeAdmin, createAnnouncement);
router.get('/:announcement_name', getAnnouncementByName);
router.post('/:announcement_name/delete', mustBeAdmin, deleteAnnouncement);
router.post('/:announcement_name/update', mustBeAdmin, updateAnnouncement);

export default router;
