import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import { JsonSchemaValidationError } from '../common-errors';

const ajv = new Ajv({ coerceTypes: true, allowUnionTypes: true });

const validators = new WeakMap<Object, ValidateFunction>();

export function assertWithSchema<T>(
  value: unknown,
  schema: JSONSchemaType<T>,
  { allowsMutation = false }: { allowsMutation?: boolean } = {},
): T {
  // ajv with { coerceTypes: true } will mutate the input value
  // https://github.com/ajv-validator/ajv/issues/549
  const result: unknown = allowsMutation ? value : JSON.parse(JSON.stringify(value));

  if (!validators.has(schema)) {
    validators.set(schema, ajv.compile(schema));
  }
  const validate = validators.get(schema) as ValidateFunction<T>;

  if (validate(result)) {
    return result;
  } else {
    throw new JsonSchemaValidationError(ajv.errorsText(validate.errors), validate.errors);
  }
}

export { JSONSchemaType };
