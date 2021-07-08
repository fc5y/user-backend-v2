import { Router, Request, Response, NextFunction } from 'express';
import db from '../../utils/database-gateway';
import { assertWithSchema, JSONSchemaType } from '../../utils/validation';
import { ERROR_CODE, GeneralError } from '../../utils/common-errors';
import { mustBeAdmin } from '../../utils/role-verification';
import { getTotalAnnouncements } from './utils';

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
        error_msg: 'Received non-zero code from Database Gateway when fetching announcements',
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

// #region POST /api/v2/anouncements

type createAnnouncementParams = {
  name: string;
  title: string;
  description: string;
};

const createAnnouncementParamsSchema: JSONSchemaType<createAnnouncementParams> = {
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

// #region GET /api/v2/:announcement_name

type getAnnouncementByNameParams = {
  announcement_name: string;
};

const getAnnouncementByNameParamsSchema: JSONSchemaType<getAnnouncementByNameParams> = {
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
        error_msg: 'Received non-zero code from Database Gateway when fetching AnnouncementByName',
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

// #region POST /api/v2/:announcement_name/delete

type deleteAnnouncementParams = {
  announcement_name: string;
};

const deleteAnnouncementParamsSchema: JSONSchemaType<deleteAnnouncementParams> = {
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
        error_msg: 'Received non-zero code from Database Gateway when deleting Announcement',
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

// #region POST /api/v2/:announcement_name/update

type updateAnnouncementParams = {
  announcement_name: string;
};

type updateAnnouncementBody = {
  name: string;
  title: string;
  description: string;
};

const updateAnnouncementParamsSchema: JSONSchemaType<updateAnnouncementParams> = {
  type: 'object',
  required: ['announcement_name'],
  properties: {
    announcement_name: { type: 'string' },
  },
};

const updateAnnouncementBodySchema: JSONSchemaType<updateAnnouncementBody> = {
  type: 'object',
  required: ['name', 'title', 'description'],
  properties: {
    name: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
  },
};

async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { announcement_name } = assertWithSchema(req.params, updateAnnouncementParamsSchema);
    const { name, title, description } = assertWithSchema(req.body, updateAnnouncementBodySchema);
    const { error, error_msg, data } = await db.announcements.updateAnnouncements({
      announcement_name: announcement_name,
      name: name,
      title: title,
      description: description,
    });
    if (error) {
      throw new GeneralError({
        error: ERROR_CODE.DATABASE_GATEWAY_ERROR,
        error_msg: 'Receive non-zero code from Database Gateway when updating announcement',
        data: { response: { error, error_msg, data } },
      });
    }
    const result = {
      error: 0,
      error_msg: 'Announcement updated',
      data: {
        announcement: {
          name: name,
          title: title,
          description: description,
        },
      },
    };
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// #endregion

const router = Router();
router.get('/', getAllAnnouncements);
router.post('/create', mustBeAdmin, createAnnouncement);
router.get('/:announcement_name', getAnnouncementByName);
router.post('/:announcement_name/delete', deleteAnnouncement);
router.post('/:announcement_name/update', updateAnnouncement);

export default router;
