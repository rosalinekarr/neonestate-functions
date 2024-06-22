import { Timestamp } from "firebase-admin/firestore";
import { UUID, newUUID } from "./uuid";
import { User } from "./user";

export type Record = {
  id: UUID;
  createdAt: Timestamp;
  createdBy: UUID;
  deletedAt?: Timestamp;
  deletedBy?: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
};

export function newRecord({ id }: User): Record {
  const now = Timestamp.now();
  return {
    id: newUUID(),
    createdAt: now,
    createdBy: id,
    updatedAt: now,
    updatedBy: id,
  };
}

export function serializeRecord(record: Record) {
  const { deletedAt, deletedBy, id } = record;
  if (deletedAt)
    return {
      id,
      deletedAt,
      deletedBy,
    };
  return {
    ...record,
    createdAt: record.createdAt.seconds,
    updatedAt: record.updatedAt.seconds,
  };
}
