import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ACTION_HANDLER_METADATA } from './constants';
import { ActionHandlerInterface } from './interfaces/action-handler.interface';
import { ActionInterface } from './interfaces/action.interface';

type ActionHandler = Type<ActionHandlerInterface<ActionInterface>>;

@Injectable()
export class ActionsBus {
  private handlers: Map<string, ActionHandlerInterface[]> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  register(actionHandlers: ActionHandler[]) {
    actionHandlers.forEach((handler) => this.registerActionHandler(handler));
  }

  private registerActionHandler(actionActionClass: ActionHandler) {
    const actionActionInstance = this.moduleRef.get(actionActionClass, {
      strict: false,
    });

    if (!actionActionInstance) {
      return;
    }

    const actions = this.reflectActions(actionActionClass);

    actions.forEach((action) => {
      const existingHandlers = this.handlers.get(action.name) || [];
      this.handlers.set(action.name, [
        ...existingHandlers,
        actionActionInstance,
      ]);
    });
  }

  async execute<T extends ActionInterface>(action: T): Promise<T> {
    const actionName = this.getClassName(action);
    const actions = this.handlers.get(actionName) || [];

    let result: T = action;

    for (let action of actions) {
      const actionResult = await action.execute(result);
      if (typeof actionResult !== 'undefined') {
        result = actionResult;
      }
    }

    return result;
  }

  private getClassName(classRef: any): string {
    const { constructor } = Object.getPrototypeOf(classRef);

    return constructor.name;
  }

  private reflectActions(handler: ActionHandler): FunctionConstructor[] {
    return Reflect.getMetadata(ACTION_HANDLER_METADATA, handler);
  }
}
