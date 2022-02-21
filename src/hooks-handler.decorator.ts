import { HookInterface } from './interfaces/hook.interface';
import { HOOK_HANDLER_METADATA } from './constants';

export const HooksHandler = (...events: HookInterface[]): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(HOOK_HANDLER_METADATA, events, target);
  };
};
