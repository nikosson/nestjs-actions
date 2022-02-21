import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { ActionHandlerInterface } from '../interfaces/action-handler.interface';
import { ACTION_HANDLER_METADATA } from '../constants';

/**
 * This service will explore all action handlers across all modules.
 */
@Injectable()
export class ActionHandlersExplorerService {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  /**
   * Retrieves Action Handlers available to the module.
   */
  exploreHandlers() {
    const modules = [...this.modulesContainer.values()];

    const actionHandlers = this.flatMap<ActionHandlerInterface>(
      modules,
      (instance) => this.filterProvider(instance, ACTION_HANDLER_METADATA),
    );

    return { actionHandlers };
  }

  private flatMap<T>(
    modules: Module[],
    callback: (instance: InstanceWrapper) => Type<any> | undefined,
  ): Type<T>[] {
    const items = modules
      .map((module) => [...module.providers.values()].map(callback))
      .reduce((a, b) => a.concat(b), []);

    return items.filter((element) => !!element) as Type<T>[];
  }

  private filterProvider(
    wrapper: InstanceWrapper,
    metadataKey: string,
  ): Type<any> | undefined {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    return this.extractMetadata(instance, metadataKey);
  }

  private extractMetadata(
    instance: Record<string, any>,
    metadataKey: string,
  ): Type<any> | undefined {
    if (!instance.constructor) {
      return undefined;
    }
    const metadata = Reflect.getMetadata(metadataKey, instance.constructor);

    return metadata ? (instance.constructor as Type<any>) : undefined;
  }
}
