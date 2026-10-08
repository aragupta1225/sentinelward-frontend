import type { CommandAdapter, CommandReceipt, FrontendCommand } from './commandContracts'

export class MockCommandAdapter implements CommandAdapter {
  readonly commands: FrontendCommand[] = []
  private sequence = 0

  async execute(command: FrontendCommand): Promise<CommandReceipt> {
    this.commands.push(structuredClone(command))
    this.sequence += 1
    return { commandId: `mock-command-${this.sequence}`, acceptedAt: Date.now(), status: 'accepted' }
  }
}
