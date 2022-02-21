import { ActionInterface } from './interfaces/action.interface';
import { ACTION_HANDLER_METADATA } from './constants';

export const ActionsHandler = (
  ...events: ActionInterface[]
): ClassDecorator => {
  return (target: object) => {
    Reflect.defineMetadata(ACTION_HANDLER_METADATA, events, target);
  };
};
