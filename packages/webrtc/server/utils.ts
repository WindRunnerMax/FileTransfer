import { Member } from "webrtc/types/server";

export const updateMember = <T extends keyof Member>(
  map: Map<string, Member>,
  id: string,
  key: T,
  value: Member[T]
) => {
  const instance = map.get(id);
  if (instance) {
    map.set(id, { ...instance, [key]: value });
  } else {
    console.warn(`UpdateMember: ${id} Not Found`);
  }
};
