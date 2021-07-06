import { ApiResponse, fetchApi } from '../fetch-utils';
import { DATABASE_GATEWAY_ORIGIN } from '../common-config';
import { assertWithSchema, JSONSchemaType } from '../validation';
import { getUrl } from '../get-url';

// #region GET /db/v2/announcements

export type GetAnnouncementsParams = {
  offset: number;
  limit: number;
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

export async function getAnnouncements({ offset, limit }: GetAnnouncementsParams) {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/announcements/read',
  });
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url,
    body: { offset, limit },
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

export async function createAnnouncements(params: createAnnouncementsParams): Promise<ApiResponse<createAnnouncementsData>> {
  const url = getUrl({
    origin: DATABASE_GATEWAY_ORIGIN,
    pathname: '/db/v2/annnouncements/create',
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
