import { Test } from '@nestjs/testing';
import { HooksModule } from '../hooks.module';
import { Injectable, Module } from '@nestjs/common';
import { HooksBus } from '../hooks.bus';
import { HooksHandler } from '../hooks-handler.decorator';
import { HookHandlerInterface } from '../interfaces/hook-handler.interface';

jest.setTimeout(20000);

describe('hooks', () => {
  it('should initialize without throwing', async () => {
    const module = await Test.createTestingModule({
      imports: [HooksModule],
    }).compile();
    await module.init();
    expect(true).toBe(true);
  });

  it('should run hook handlers', async () => {
    class Hook {}

    @HooksHandler(Hook)
    class Handler implements HookHandlerInterface {
      execute(hook) {
        return 'works';
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksBus: HooksBus) {}
      run() {
        return this.hooksBus.execute<Hook>(new Hook());
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, Handler],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result).toBe('works');
  });

  it('should run hook handlers in order', async () => {
    class Hook {
      value = 1;
    }

    @HooksHandler(Hook)
    class DoubleValueHandler implements HookHandlerInterface<Hook> {
      execute(hook) {
        hook.value = hook.value * 2;
      }
    }

    @HooksHandler(Hook)
    class ToStringHandler implements HookHandlerInterface<Hook> {
      execute(hook) {
        hook.value = hook.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksBus: HooksBus) {}

      run() {
        return this.hooksBus.execute(new Hook());
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, DoubleValueHandler, ToStringHandler],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result.value).toBe('2');
  });

  it('should run async hooks', async () => {
    class Hook {
      value = 1;
    }

    @HooksHandler(Hook)
    class DoubleValueHandler implements HookHandlerInterface<Hook> {
      async execute(hook) {
        await new Promise((r) => setTimeout(r, 10));
        hook.value = hook.value * 2;
      }
    }

    @HooksHandler(Hook)
    class ToStringHook implements HookHandlerInterface<Hook> {
      async execute(hook) {
        await new Promise((r) => setTimeout(r, 5));
        hook.value = hook.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksBus: HooksBus) {}
      run() {
        return this.hooksBus.execute(new Hook());
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, DoubleValueHandler, ToStringHook],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result.value).toBe('2');
  });

  it('should allow multiple hooks for single handler', async () => {
    class Hook {
      value = 1;
    }

    class SecondHook {
      value = 2;
    }

    @HooksHandler(Hook, SecondHook)
    class HandlerForTwoHooks implements HookHandlerInterface<Hook> {
      async execute(hook) {
        await new Promise((r) => setTimeout(r, 10));
        hook.value = hook.value * 2;
      }
    }

    @HooksHandler(Hook)
    class ToStringHook implements HookHandlerInterface<Hook> {
      async execute(hook) {
        await new Promise((r) => setTimeout(r, 5));
        hook.value = hook.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksBus: HooksBus) {}
      async run() {
        return [
          await this.hooksBus.execute(new Hook()),
          await this.hooksBus.execute(new SecondHook()),
        ];
      }
    }

    const module = await Test.createTestingModule({
      imports: [HooksModule],
      providers: [Service, HandlerForTwoHooks, ToStringHook],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result[0].value).toBe('2');
    expect(result[1].value).toBe(4);
  });

  it('should allow cross module hooks', async () => {
    class Hook {}

    @HooksHandler(Hook)
    class Handler implements HookHandlerInterface {
      execute(hook) {
        return 'works';
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly hooksBus: HooksBus) {}
      run() {
        return this.hooksBus.execute(new Hook());
      }
    }

    @Module({
      imports: [HooksModule],
      providers: [Service],
    })
    class ModuleOne {}

    @Module({
      imports: [HooksModule, ModuleOne],
      providers: [Handler],
    })
    class ModuleTwo {}

    const module = await Test.createTestingModule({
      imports: [ModuleOne, ModuleTwo],
      providers: [],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result).toBe('works');
  });
});
