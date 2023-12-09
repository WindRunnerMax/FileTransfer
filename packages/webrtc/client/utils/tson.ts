import { decodeJSON as DecodeJSON, encodeJSON as EncodeJSON } from "laser-utils";
import { TextMessageType } from "../../types/client";

type EncodeJSONType = (value: TextMessageType) => string;
type DecodeJSONType = (value: string) => TextMessageType | null;

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
