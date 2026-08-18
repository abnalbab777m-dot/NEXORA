import { Router } from 'express';
export const testRouter = Router();
testRouter.get('/test-headers', (req, res) => {
  res.json({
    proto: req.headers['x-forwarded-proto'],
    secure: req.secure,
    headers: req.headers
  });
});
