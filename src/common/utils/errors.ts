import { HTTPException } from "hono/http-exception";
import { STATUS_CODE } from "lib/status-code";

export class INTERNAL_SERVER_ERROR extends HTTPException {
  constructor() {
    super(STATUS_CODE.INTERNAL_SERVER_ERROR, {
      message: "Internal Server Error",
    });
  }
}

export class NOT_FOUND extends HTTPException {
  constructor() {
    super(STATUS_CODE.NOT_FOUND, {
      message: "not found",
    });
  }
}

export class UNAUTHORIZED extends HTTPException {
  constructor(msg?: string) {
    super(STATUS_CODE.UNAUTHORIZED, {
      message: msg ?? "unauthorized",
    });
  }
}

export class FORBIDDEN extends HTTPException {
  constructor() {
    super(STATUS_CODE.FORBIDDEN, {
      message: "forbidden",
    });
  }
}
