const response = (res, statusCode, message, data) => {
  let status;
  if (statusCode < 400) status = 'success';
  else if (statusCode < 500) status = 'fail';
  else status = 'error';

  const body = { status, message };
  if (data !== undefined && data !== null) body.data = data;

  return res.status(statusCode).json(body);
};

export default response;
