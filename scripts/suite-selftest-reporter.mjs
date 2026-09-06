import { JsonReporter } from 'vitest/node';

const serializeError = (error) => {
  const value = error && typeof error === 'object' ? error : {};
  return {
    message: typeof value.message === 'string' ? value.message : String(error),
    name: typeof value.name === 'string' ? value.name : 'Error',
    stack: typeof value.stack === 'string' ? value.stack : '',
  };
};

/**
 * Vitest's built-in JSON reporter omits its `unhandledErrors` argument. The mutation harness
 * expects test failures, so exit code 1 alone cannot distinguish an intentional red from a runner
 * failure. Preserve the public JSON shape and add the missing structured error channel.
 */
export default class SuiteSelftestReporter extends JsonReporter {
  unhandledErrors = [];

  async onTestRunEnd(testModules, unhandledErrors) {
    this.unhandledErrors = [...(unhandledErrors ?? [])].map(serializeError);
    await super.onTestRunEnd(testModules);
  }

  async writeReport(report) {
    const result = JSON.parse(report);
    result.unhandledErrors = this.unhandledErrors;
    await super.writeReport(JSON.stringify(result));
  }
}
