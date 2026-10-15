import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid session. Please log in again.';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 2 MB' : err.message;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};
