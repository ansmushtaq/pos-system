export const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'An unexpected error occurred' : err.message;
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: null,
  });
};
