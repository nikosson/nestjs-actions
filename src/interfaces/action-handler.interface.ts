import { ActionInterface } from './action.interface';

export interface ActionHandlerInterface<T extends ActionInterface = any> {
  execute(hook: T);
}
