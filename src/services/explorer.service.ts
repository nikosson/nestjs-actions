import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { HookHandlerInterface } from '../interfaces';
import { HOOK_HANDLER_METADATA } from '../constants';

/**
 * This service will explore all hook handlers across all modules.
 */
@Injectable()
export class ExplorerService {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  /**
   * Retrieves hook handlers available to the module.
   */
  exploreHandlers() {
    const modules = [...this.modulesContainer.values()];

    const hookHandlers = this.flatMap<HookHandlerInterface>(
      modules,
      (instance) => this.filterProvider(instance, HOOK_HANDLER_METADATA),
    );

    return { hookHandlers };
  }

  private flatMap<T>(
    modules: Module[],
    callback: (instance: InstanceWrapper) => Type | undefined,
  ): Type<T>[] {
    const items = modules
      .map((module) => [...module.providers.values()].map(callback))
      .reduce((a, b) => a.concat(b), []);

    return items.filter((element) => !!element) as Type<T>[];
  }

  private filterProvider(
    wrapper: InstanceWrapper,
    metadataKey: string,
  ): Type | undefined {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    return this.extractMetadata(instance, metadataKey);
  }

  private extractMetadata(
    instance: Record<string, any>,
    metadataKey: string,
  ): Type | undefined {
    if (!instance.constructor) {
      return undefined;
    }
    const metadata = Reflect.getMetadata(metadataKey, instance.constructor);

    return metadata ? (instance.constructor as Type) : undefined;
  }
}
