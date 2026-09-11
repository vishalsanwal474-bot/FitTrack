export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || 'Validation failed';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate value';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized';
  }

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong';
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
};

export const notFound = (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
};
