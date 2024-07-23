export class UnauthorizedError extends Error {
  code: number = 401;

  constructor() {
    super("Unauthorized");
  }
}

export class PermissionDeniedError extends Error {
  code: number = 403;

  constructor() {
    super("Permission denied");
  }
}

export class NotFoundError extends Error {
  code: number = 404;

  constructor() {
    super("Page not found");
  }
}

export class AlreadyExistsError extends Error {
  code: number = 409;

  constructor() {
    super("Record already exists");
  }
}

export class InvalidArgumentError extends Error {
  code: number = 422;

  constructor() {
    super("Invalid argument");
  }
}

export class ServerError extends Error {
  code: number = 500;

  constructor() {
    super("Server-side error");
  }
}
