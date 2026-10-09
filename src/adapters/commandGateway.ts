import type { CommandAdapter, FrontendCommand } from './commandContracts'

let adapter: CommandAdapter | null = null
export interface CommandFailure { command: FrontendCommand; message: string }
const failureListeners = new Set<(failure: CommandFailure) => void>()

export function configureCommandAdapter(nextAdapter: CommandAdapter) {
  adapter = nextAdapter
}

export async function dispatchCommand(command: FrontendCommand) {
  try {
    if (!adapter) throw new Error('Command runtime is not configured')
    return await adapter.execute(command)
  } catch (error) {
    const failure = { command, message: error instanceof Error ? error.message : 'Command failed' }
    failureListeners.forEach((listener) => listener(failure))
    return null
  }
}

export function subscribeCommandFailures(listener: (failure: CommandFailure) => void) {
  failureListeners.add(listener)
  return () => { failureListeners.delete(listener) }
}
