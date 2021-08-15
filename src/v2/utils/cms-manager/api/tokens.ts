import { assertWithSchema, JSONSchemaType } from '../../validation';
import { CMS_MANAGER_ORIGIN, CMS_MANAGER_SIGNATURE } from '../../common-config';
import { fetchApi } from '../../fetch-utils';
import { getUrl } from '../../get-url';

type GenerateTokenData = {
  token: string;
  createdAt?: number;
  expireAt?: number;
};

const generateTokenDataSchema: JSONSchemaType<GenerateTokenData> = {
  type: 'object',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
    },
    createdAt: {
      type: 'number',
      nullable: true,
    },
    expireAt: {
      type: 'number',
      nullable: true,
    },
  },
};

export async function generateToken() {
  const { error, error_msg, data } = await fetchApi({
    method: 'POST',
    url: getUrl({
      origin: CMS_MANAGER_ORIGIN,
      pathname: '/api/token/generate',
    }),
    body: {
      signature: CMS_MANAGER_SIGNATURE,
    },
  });
  const validatedData = !error && data != null ? assertWithSchema(data, generateTokenDataSchema) : undefined;
  return { error, error_msg, data: validatedData };
}
