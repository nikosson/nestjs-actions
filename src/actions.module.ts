import { Module, OnModuleInit } from '@nestjs/common';
import { ActionsBus } from './actions.bus';
import { ActionHandlersExplorerService } from './services/action-handlers-explorer.service';

@Module({
  providers: [ActionsBus, ActionHandlersExplorerService],
  exports: [ActionsBus],
})
export class ActionsModule implements OnModuleInit {
  constructor(
    private readonly actionBus: ActionsBus,
    private readonly explorerService: ActionHandlersExplorerService,
  ) {}

  async onModuleInit() {
    const { actionHandlers } = this.explorerService.exploreHandlers();

    this.actionBus.register(actionHandlers);
  }
}
