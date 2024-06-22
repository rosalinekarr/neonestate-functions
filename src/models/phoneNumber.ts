export type PhoneNumber = string;

export function isPhoneNumber(x: unknown): x is PhoneNumber {
  return typeof x === "string" && !!x.match(/\d+/);
}
