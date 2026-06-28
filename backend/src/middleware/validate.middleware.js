import { validationResult } from 'express-validator';
import { error } from '../utils/apiResponse.js';

export const validate = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    await validation.run(req);
  }
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return error(res, 'Validation failed', 422, result.array().map(e => ({
    field: e.path,
    message: e.msg,
  })));
};
