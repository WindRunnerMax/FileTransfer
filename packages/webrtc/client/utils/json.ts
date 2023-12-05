import { decodeJSON as DecodeJSON, encodeJSON as EncodeJSON } from "laser-utils";
import { TextMessageType } from "../../types/client";

type EncodeJSONType = (value: TextMessageType) => string;
type DecodeJSONType = (value: string) => TextMessageType | null;

export const encodeJSON = EncodeJSON as EncodeJSONType;
export const decodeJSON: DecodeJSONType = DecodeJSON;
