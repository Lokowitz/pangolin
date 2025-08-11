import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod/v4";

extendZodWithOpenApi(z);

export default function extendZod() {}
