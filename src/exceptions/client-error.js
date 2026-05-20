class ClientError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ClientError';
    this.statusCode = statusCode;
    this.status = false;
  }
}

export default ClientError;
