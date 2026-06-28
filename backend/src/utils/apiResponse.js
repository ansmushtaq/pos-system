export const success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data, errors: null });

export const paginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({
    success: true, message, data, errors: null,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });

export const error = (res, message = 'An error occurred', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, data: null, errors });
