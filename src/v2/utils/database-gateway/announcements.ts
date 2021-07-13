import { ApiResponse, fetchApi } from '../fetch-utils';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { assertWithSchema, JSONSchemaType } from '../validation';
import { getUrl } from '../get-url';

// #region GET /db/v2/announcements

export type GetAnnouncementsParams = {
  offset: number;
  limit: number;
  announcement_name?: string;
  has_total?: boolean;
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

export async function getAnnouncements({ offset, limit, announcement_name, has_total }: GetAnnouncementsParams) {
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
      has_total,
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

export type CreateAnnouncementsParams = {
  name: string;
  title: string;
  description: string;
};

type CreateAnnouncementsData = undefined;

export async function createAnnouncements(
  params: CreateAnnouncementsParams,
): Promise<ApiResponse<CreateAnnouncementsData>> {
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

export type DeleteAnnouncementsParams = {
  announcement_name: string;
};

export async function deleteAnnouncements({ announcement_name }: DeleteAnnouncementsParams) {
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

export type UpdateAnnouncementParams = {
  announcement_name: string;
  update_name: string;
  update_title?: string;
  update_description?: string;
};

type UpdateAnnouncementData = undefined;

export async function updateAnnouncements(
  params: UpdateAnnouncementParams,
): Promise<ApiResponse<UpdateAnnouncementData>> {
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
        announcement_name: params.update_name,
        announcement_title: params.update_title,
        announcement_description: params.update_description,
      },
    },
  });
  return { error, error_msg, data };
}

// #endregion
