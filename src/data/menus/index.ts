import { ajmanMenu } from "./ajman";
import { intlMenu } from "./intl";
import { muweilahMenu } from "./muweilah";
import { riggaMenu } from "./rigga";
import { saharaMenu } from "./sahara";
import type { SeedMenu } from "../types";

export const menus: SeedMenu[] = [intlMenu, riggaMenu, muweilahMenu, saharaMenu, ajmanMenu];

export const menuPageCounts: Record<string, number> = {
  "menu-intl-2022-02": 12,
  "menu-rigga-2022-02": 1,
  "menu-muwailih-2022-02": 2,
  "menu-sahara-2022-01": 8,
  "menu-ajman-2021-08": 8,
};
