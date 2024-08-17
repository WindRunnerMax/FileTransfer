import { decodeJSON as DecodeJSON, encodeJSON as EncodeJSON } from "laser-utils";
import type { MessageType } from "../../types/client";

type EncodeJSONType = (value: MessageType) => string;
type DecodeJSONType = (value: string) => MessageType | null;

export const TSON = {
  /**
   * Object -> String
   */
  encode: EncodeJSON as EncodeJSONType,
  /**
   * String -> Object
   */
  decode: DecodeJSON as DecodeJSONType,
};
