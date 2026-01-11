import type { ContentfulStatusCode } from "hono/utils/http-status";

export type Failure = {
  path?: PropertyKey[];
  message: string;
  code?: string;
};

export default class ErrorFactory {
  private readonly _errors: readonly Failure[];
  private readonly _status: ContentfulStatusCode;

  // Set a default status (400) so the constructor is always satisfied
  private constructor(errors: Failure[], status: ContentfulStatusCode = 400) {
    this._errors = Object.freeze(errors);
    this._status = status;
  }

  /** Static helper to initialize from an array */
  static from(
    errors: Failure[],
    status: ContentfulStatusCode = 400
  ): ErrorFactory {
    return new ErrorFactory(errors, status);
  }

  /** Helper to create a factory from a single error */
  static single(
    message: string,
    path?: PropertyKey[],
    code?: string,
    status: ContentfulStatusCode = 400 // Added status here
  ): ErrorFactory {
    return new ErrorFactory([{ message, path, code }], status);
  }

  get status(): ContentfulStatusCode {
    return this._status;
  }

  get errors(): readonly Failure[] {
    return this._errors;
  }

  toJSON() {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errors: this._errors.map((err) => ({
        ...err,
        path: err.path,
        // Helper for frontend developers to avoid parsing arrays
        pathString: err.path?.join("."),
      })),
    };
  }
}
