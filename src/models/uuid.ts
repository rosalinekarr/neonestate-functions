export type UUID = string;

export function isUUID(x: any): x is UUID {
  return (
    typeof x === "string" &&
    !!x.match(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i)
  );
}

export function newUUID(): UUID {
  return crypto.randomUUID();
}
