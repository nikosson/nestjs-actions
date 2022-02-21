import { HookInterface } from './hook.interface';

export interface HookHandlerInterface<T extends HookInterface = any> {
  execute(hook: T);
}
