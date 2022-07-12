import { Module, OnModuleInit } from '@nestjs/common';
import { HooksBus } from './hooks.bus';
import { ExplorerService } from './services';

@Module({
  providers: [HooksBus, ExplorerService],
  exports: [HooksBus],
})
export class HooksModule implements OnModuleInit {
  constructor(
    private readonly hooksBus: HooksBus,
    private readonly explorerService: ExplorerService,
  ) {}

  async onModuleInit() {
    const { hookHandlers } = this.explorerService.exploreHandlers();

    this.hooksBus.register(hookHandlers);
  }
}
