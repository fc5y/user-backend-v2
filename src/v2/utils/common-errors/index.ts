import { ErrorObject } from 'ajv';

export class JsonSchemaValidationError extends Error {
  errors: ErrorObject[] | null | undefined;

  constructor(message: string, errors: ErrorObject[] | null | undefined) {
    super(message);
    this.errors = errors;
    this.name = 'JsonSchemaValidationError';
  }
}
