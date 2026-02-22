import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(
  bodySchema?: ZodSchema,
  paramsSchema?: ZodSchema,
  querySchema?: ZodSchema,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (bodySchema) {
        bodySchema.parse(req.body);
      }
      if (paramsSchema) {
        paramsSchema.parse(req.params);
      }
      if (querySchema) {
        querySchema.parse(req.query);
      }
      next();
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error,
      });
    }
  };
}
