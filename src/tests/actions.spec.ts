import { Test } from '@nestjs/testing';
import { ActionsModule } from '../actions.module';
import { Injectable, Module } from '@nestjs/common';
import { ActionsBus } from '../actions.bus';
import { ActionsHandler } from '../actions-handler.decorator';
import { ActionHandlerInterface } from '../interfaces/action-handler.interface';

jest.setTimeout(20000);

describe('actions', () => {
  it('should initialize without throwing', async () => {
    const module = await Test.createTestingModule({
      imports: [ActionsModule],
    }).compile();
    await module.init();
    expect(true).toBe(true);
  });

  it('should run action handlers', async () => {
    class Action {}

    @ActionsHandler(Action)
    class Handler implements ActionHandlerInterface {
      execute(action) {
        return 'works';
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly actionsService: ActionsBus) {}
      run() {
        return this.actionsService.execute<Action>(new Action());
      }
    }

    const module = await Test.createTestingModule({
      imports: [ActionsModule],
      providers: [Service, Handler],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result).toBe('works');
  });

  it('should run actions in order', async () => {
    class Action {
      value = 1;
    }

    @ActionsHandler(Action)
    class DoubleValueHandler implements ActionHandlerInterface<Action> {
      execute(action) {
        action.value = action.value * 2;
      }
    }

    @ActionsHandler(Action)
    class ToStringHandler implements ActionHandlerInterface<Action> {
      execute(action) {
        action.value = action.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly actionBus: ActionsBus) {}

      run() {
        return this.actionBus.execute(new Action());
      }
    }

    const module = await Test.createTestingModule({
      imports: [ActionsModule],
      providers: [Service, DoubleValueHandler, ToStringHandler],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result.value).toBe('2');
  });

  it('should run async actions', async () => {
    class Action {
      value = 1;
    }

    @ActionsHandler(Action)
    class DoubleValueHandler implements ActionHandlerInterface<Action> {
      async execute(action) {
        await new Promise((r) => setTimeout(r, 10));
        action.value = action.value * 2;
      }
    }

    @ActionsHandler(Action)
    class ToStringAction implements ActionHandlerInterface<Action> {
      async execute(action) {
        await new Promise((r) => setTimeout(r, 5));
        action.value = action.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly actionBus: ActionsBus) {}
      run() {
        return this.actionBus.execute(new Action());
      }
    }

    const module = await Test.createTestingModule({
      imports: [ActionsModule],
      providers: [Service, DoubleValueHandler, ToStringAction],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result.value).toBe('2');
  });

  it('should allow multiple actions for single handler', async () => {
    class Action {
      value = 1;
    }

    class SecondAction {
      value = 2;
    }

    @ActionsHandler(Action, SecondAction)
    class HandlerForTwoActions implements ActionHandlerInterface<Action> {
      async execute(action) {
        await new Promise((r) => setTimeout(r, 10));
        action.value = action.value * 2;
      }
    }

    @ActionsHandler(Action)
    class ToStringAction implements ActionHandlerInterface<Action> {
      async execute(action) {
        await new Promise((r) => setTimeout(r, 5));
        action.value = action.value.toString();
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly actionBus: ActionsBus) {}
      async run() {
        return [
          await this.actionBus.execute(new Action()),
          await this.actionBus.execute(new SecondAction()),
        ];
      }
    }

    const module = await Test.createTestingModule({
      imports: [ActionsModule],
      providers: [Service, HandlerForTwoActions, ToStringAction],
    }).compile();
    const app = await module.init();
    const service = app.get<Service>(Service);
    const result = await service.run();

    expect(result[0].value).toBe('2');
    expect(result[1].value).toBe(4);
  });

  it('should allow cross module actions', async () => {
    class Action {}

    @ActionsHandler(Action)
    class Handler implements ActionHandlerInterface {
      execute(action) {
        return 'works';
      }
    }

    @Injectable()
    class Service {
      constructor(private readonly actionBus: ActionsBus) {}
      run() {
        return this.actionBus.execute(new Action());
      }
    }

    @Module({
      imports: [ActionsModule],
      providers: [Service],
    })
    class ModuleOne {}

    @Module({
      imports: [ActionsModule, ModuleOne],
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
