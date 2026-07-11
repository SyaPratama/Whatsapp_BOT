import { handleSystemCommand } from './system.mjs';
import { handleGroupCommand } from './group.mjs';
import { handleLwCommand } from './lw.mjs';
import { handleMiscCommand } from './misc.mjs';
import { handleToolsCommand } from './tools.mjs';
import { handleSewaCommand } from './sewa.mjs';
import { handleMaintenanceCommand } from './maintenance.mjs';
import { handleGeseranCommand } from './geseran.mjs';

export async function dispatchCommand(ctx) {
  if (await handleSystemCommand(ctx)) return true;
  if (await handleGroupCommand(ctx)) return true;
  if (await handleLwCommand(ctx)) return true;
  if (await handleMiscCommand(ctx)) return true;
  if (await handleToolsCommand(ctx)) return true;
  if (await handleSewaCommand(ctx)) return true;
  if (await handleMaintenanceCommand(ctx)) return true;
  if (await handleGeseranCommand(ctx)) return true;
  return false;
}