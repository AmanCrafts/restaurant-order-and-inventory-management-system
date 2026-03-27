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
        req.body = bodySchema.parse(req.body);
      }
      if (paramsSchema) {
        req.params = paramsSchema.parse(req.params);
      }
      if (querySchema) {
        req.query = querySchema.parse(req.query) as Request['query'];
      }
      next();
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        details:
          typeof error === 'object' && error && 'flatten' in error
            ? (error as { flatten(): unknown }).flatten()
            : error,
      });
    }
  };
}
