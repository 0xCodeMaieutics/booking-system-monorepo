export type BookingErrorCode =
  | "NOT_FOUND"
  | "INVALID_PHONE"
  | "INVALID_EMAIL"
  | "SMS_UNAVAILABLE"
  | "SLOT_UNAVAILABLE"
  | "SLOT_TAKEN"
  | "INVALID_CODE"
  | "RATE_LIMITED"
  | "CUTOFF_PASSED"
  | "INVALID_STATE"
  | "CLINIC_CLOSED";

export class BookingError extends Error {
  constructor(
    readonly code: BookingErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "BookingError";
  }
}
