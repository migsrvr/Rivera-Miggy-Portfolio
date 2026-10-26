export class AppError extends Error {
  constructor(statusCode,message,fields){super(message);this.statusCode=statusCode;this.fields=fields;}
}
