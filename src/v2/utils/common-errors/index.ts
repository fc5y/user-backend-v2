import { SHOW_DEBUG } from '../common-config';

export const ERROR_CODE = {
  // User Backend v2: 500000..599999
  JSON_SCHEMA_VALIDATION_FAILED: 500120,
  DATABASE_GATEWAY_ERROR: 500125,
  ROLE_MUST_BE_ADMIN: 500256,
  ROUTE_NOT_FOUND: 500349,
  USER_NOT_FOUND: 500425,
  CONTEST_NOT_FOUND: 500555,
  CONTEST_CANNOT_ENTER: 500595,
  PARTICIPATION_NOT_FOUND: 500654,
  INVALID_PASSWORD: 500689,
  INVALID_EMAIL: 500736,
  UNAUTHORIZED: 501401,
  EMAIL_SERVICE_ERROR: 502500,
  CMS_MANAGER_ERROR: 503000,
  CMS_MANAGER_GENERATE_TOKEN_FAILED: 503019,
  CMS_MANAGER_CONTEST_NOT_FOUND: 503402,
  UNKNOWN_ERROR: 599999,
};

export const CMS_MANAGER_ERROR_CODE = {
  EXISTED: 10003,
};

export class GeneralError extends Error {
  error: number;
  error_msg: string;
  data: any;

  constructor({ error, error_msg, data }: { error: number; error_msg: string; data: any }) {
    if (SHOW_DEBUG == false) {
      error_msg = '';
      data = null;
    }
    super(JSON.stringify({ error, error_msg, data }));
    this.error = error;
    this.error_msg = error_msg;
    this.data = data;
    this.name = 'GeneralError';
  }
}
