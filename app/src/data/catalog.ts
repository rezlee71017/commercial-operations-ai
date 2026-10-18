// Static copy of the demo data. The app reads from the database; this file is the
// seed source and the fixture used by unit tests.
import { defaultRules, seedProducts } from "./seed-data";

export const catalog = seedProducts;
export const rules = defaultRules;
