import { ApiResponse, fetchApi } from '../fetch-utils';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { assertWithSchema, JSONSchemaType } from '../validation';
import { getUrl } from '../get-url';

// #region GET /db/v2/announcements

export type GetAnnouncementsParams = {
  offset: number;
  limit: number;
  announcement_name?: string;
};

export type GetAnnouncementsData = {
  total?: number;
  items: Array<{
    id: number;
    announcement_name: string;
    announcement_title: string;
    announcement_description: string;
    created_at: number;
    updated_at: number;
  }>;
};

const getAnnouncementsDataSchema: JSONSchemaType<GetAnnouncementsData> = {
  type: 'object',
  required: ['items'],
  properties: {
    total: { type: 'number', nullable: true },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'announcement_name',
          'announcement_title',
          'announcement_description',
          'created_at',
          'updated_at',
        ],
        properties: {
          id: { type: 'number' },
          announcement_name: { type: 'string' },
          announcement_title: { type: 'string' },
          announcement_description: { type: 'string' },
          created_at: { type: 'number' },
          updated_at: { type: 'number' },
        },
      },
    },
  },
};

export async function getAnnouncements({ offset, limit, announcement_name }: GetAnnouncementsParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/announcements/read',
  });
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    body: {
      offset,
      limit,
      where: {
        announcement_name: announcement_name,
      },
    },
  });
  const validateData = !error && data != null ? assertWithSchema(data, getAnnouncementsDataSchema) : undefined;
  return { error, error_msg, data: validateData };
}

// #endregion

// #region POST /api/v2/announcements

export type createAnnouncementsParams = {
  name: string;
  title: string;
  description: string;
};

type createAnnouncementsData = undefined;

export async function createAnnouncements(
  params: createAnnouncementsParams,
): Promise<ApiResponse<createAnnouncementsParams>> {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/announcements/create',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      values: {
        announcement_name: params.name,
        announcement_title: params.title,
        announcement_description: params.description,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion

// #region POST /api/v2/:announcement_name/delete

export type deleteAnnouncementsParams = {
  announcement_name: string;
};

export async function deleteAnnouncements({ announcement_name }: deleteAnnouncementsParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/announcements/delete',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      where: {
        announcement_name: announcement_name,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion

// #region POST /api/v2/:announcement_name/update

export type updateAnnouncementParams = {
  announcement_name: string;
  name: string;
  title: string;
  description: string;
};

type updateAnnouncementData = undefined;

export async function updateAnnouncements(
  params: updateAnnouncementParams,
): Promise<ApiResponse<updateAnnouncementData>> {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/announcements/update',
  });
  const { error, error_msg, data } = await fetchApi({
    url,
    method: 'POST',
    body: {
      where: {
        announcement_name: params.announcement_name,
      },
      values: {
        announcement_name: params.name,
        announcement_title: params.title,
        announcement_description: params.description,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion
