/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { z } from "zod";
import { _idValidator } from "./schemaComponents";

export const shortListSchema = z.object({
    shortListedId: _idValidator
});   