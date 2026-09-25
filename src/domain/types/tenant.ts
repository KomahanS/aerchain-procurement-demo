import type { Id, ISODateString } from "./common";

export interface Tenant {
  id: Id;
  name: string;
  createdAt: ISODateString;
}
