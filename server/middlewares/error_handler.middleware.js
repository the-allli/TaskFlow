const errorHandlerMiddleware = (logger) => (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    logger.error(`${status} - ${message}`, { stack: err.stack });
  }

  res.status(status).json({ message });
};

export default errorHandlerMiddleware;
