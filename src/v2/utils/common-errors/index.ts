import { ErrorObject } from 'ajv';

export const ERROR_CODE = {
  // User Backend v2: 500000..599999
  JSON_SCHEMA_VALIDATION_FAILED: 500120,
  DATABASE_GATEWAY_ERROR: 500125,
  UNKNOWN_ERROR: 509999,
};

/**
 * @deprecated Use GeneralError instead
 * TODO: remove this
 */
export class JsonSchemaValidationError extends Error {
  errors: ErrorObject[] | null | undefined;

  constructor(message: string, errors: ErrorObject[] | null | undefined) {
    super(message);
    this.errors = errors;
    this.name = 'JsonSchemaValidationError';
  }
}

export class GeneralError extends Error {
  error: number;
  error_msg: string;
  data: any;

  constructor({ error, error_msg, data }: { error: number; error_msg: string; data: any }) {
    super(JSON.stringify({ error, error_msg, data }));
    this.error = error;
    this.error_msg = error_msg;
    this.data = data;
    this.name = 'GeneralError';
  }
}
