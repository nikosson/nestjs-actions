import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HOOK_HANDLER_METADATA } from './constants';
import { HookHandlerInterface } from './interfaces/hook-handler.interface';
import { HookInterface } from './interfaces/hook.interface';

type HookHandler = Type<HookHandlerInterface<HookInterface>>;

@Injectable()
export class HooksBus {
  private handlers: Map<string, HookHandlerInterface[]> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  register(hooksHandlers: HookHandler[]) {
    hooksHandlers.forEach((handler) => this.registerHookHandler(handler));
  }

  private registerHookHandler(hookHandler: HookHandler) {
    const handlerInstance = this.moduleRef.get(hookHandler, {
      strict: false,
    });

    if (!handlerInstance) {
      return;
    }

    const hookHandlers = this.reflectActions(hookHandler);

    hookHandlers.forEach((action) => {
      const existingHandlers = this.handlers.get(action.name) || [];
      this.handlers.set(action.name, [...existingHandlers, handlerInstance]);
    });
  }

  async execute<T extends HookInterface>(hook: T): Promise<T> {
    const hookName = this.getClassName(hook);
    const handlers = this.handlers.get(hookName) || [];

    let result: T = hook;

    for (let handler of handlers) {
      const hookResult = await handler.execute(result);
      if (typeof hookResult !== 'undefined') {
        result = hookResult;
      }
    }

    return result;
  }

  private getClassName(classRef: any): string {
    const { constructor } = Object.getPrototypeOf(classRef);

    return constructor.name;
  }

  private reflectActions(handler: HookHandler): FunctionConstructor[] {
    return Reflect.getMetadata(HOOK_HANDLER_METADATA, handler);
  }
}
