import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../Auth.js';
import { CommandError } from '../../../Command.js';
import { cli } from '../../../cli/cli.js';
import { CommandInfo } from '../../../cli/CommandInfo.js';
import { Logger } from '../../../cli/Logger.js';
import request from '../../../request.js';
import { telemetry } from '../../../telemetry.js';
import { pid } from '../../../utils/pid.js';
import { session } from '../../../utils/session.js';
import { sinonUtil } from '../../../utils/sinonUtil.js';
import commands from '../commands.js';
import command from './flow-remove.js';

describe(commands.REMOVE, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let loggerLogToStderrSpy: sinon.SinonSpy;
  let promptIssued: boolean = false;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });

    promptIssued = false;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.delete,
      cli.promptForConfirmation
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the name is not valid GUID', async () => {
    const actual = await command.validate({
      options: {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: 'invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when the name and environment specified', async () => {
    const actual = await command.validate({
      options: {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('prompts before removing the specified Microsoft Flow owned by the currently signed-in user when force option not passed', async () => {
    await command.action(logger, {
      options: {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72'
      }
    });

    assert(promptIssued);
  });

  it('aborts removing the specified Microsoft Flow owned by the currently signed-in user when force option not passed and prompt not confirmed', async () => {
    const postSpy = sinon.spy(request, 'delete');
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72'
      }
    });
    assert(postSpy.notCalled);
  });

  it('removes the specified Microsoft Flow owned by the currently signed-in user when prompt confirmed', async () => {
    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if (opts.url === `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c/flows/0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72?api-version=2016-11-01`) {
        return { statusCode: 200 };
      }

      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        debug: true,
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72'
      }
    });
    assert(loggerLogToStderrSpy.called);
  });

  it('prompts before removing the specified Microsoft Flow owned by another user when force option not passed', async () => {
    await command.action(logger, {
      options: {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        asAdmin: true
      }
    });

    assert(promptIssued);
  });

  it('aborts removing the specified Microsoft Flow owned by another user when force option not passed and prompt not confirmed', async () => {
    const postSpy = sinon.spy(request, 'delete');
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        asAdmin: true
      }
    });
    assert(postSpy.notCalled);
  });

  it('removes the specified Microsoft Flow owned by another user when prompt confirmed (debug)', async () => {
    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if (opts.url === `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/scopes/admin/environments/Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c/flows/0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72?api-version=2016-11-01`) {
        return { statusCode: 200 };
      }

      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        debug: true,
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        asAdmin: true
      }
    });
    assert(loggerLogToStderrSpy.called);
  });

  it('removes the specified Microsoft Flow without prompting when confirm specified (debug)', async () => {
    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if (opts.url === `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c/flows/0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72?api-version=2016-11-01`) {
        return { statusCode: 200 };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        force: true
      }
    });
    assert(loggerLogToStderrSpy.called);
  });

  it('removes the specified Microsoft Flow as Admin without prompting when confirm specified (debug)', async () => {
    sinon.stub(request, 'delete').callsFake(async (opts) => {
      if (opts.url === `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/scopes/admin/environments/Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c/flows/0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72?api-version=2016-11-01`) {
        return { statusCode: 200 };
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        force: true,
        asAdmin: true
      }
    });
    assert(loggerLogToStderrSpy.called);
  });

  it('correctly handles no environment found without prompting when confirm specified', async () => {
    sinon.stub(request, 'delete').rejects({
      "error": {
        "code": "EnvironmentAccessDenied",
        "message": "Access to the environment 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c' is denied."
      }
    });

    await assert.rejects(command.action(logger, {
      options:
      {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        force: true
      }
    } as any), new CommandError(`Access to the environment 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c' is denied.`));
  });

  it('correctly handles no environment found when prompt confirmed', async () => {
    sinon.stub(request, 'delete').rejects({
      "error": {
        "code": "EnvironmentAccessDenied",
        "message": "Access to the environment 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c' is denied."
      }
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await assert.rejects(command.action(logger, {
      options:
      {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72'
      }
    } as any), new CommandError(`Access to the environment 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c' is denied.`));
  });

  it('correctly handles no Microsoft Flow found when prompt confirmed', async () => {
    sinon.stub(request, 'delete').resolves({ statusCode: 204 });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await assert.rejects(command.action(logger, {
      options:
      {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72'
      }
    } as any), new CommandError(`Error: Resource '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72' does not exist in environment 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c'`));
  });

  it('correctly handles no Microsoft Flow found when confirm specified', async () => {
    sinon.stub(request, 'delete').resolves({ statusCode: 204 });

    await assert.rejects(command.action(logger, {
      options:
      {
        environmentName: 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c',
        name: '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72',
        force: true
      }
    } as any), new CommandError(`Error: Resource '0f64d9dd-01bb-4c1b-95b3-cb4a1a08ac72' does not exist in environment 'Default-eff8592e-e14a-4ae8-8771-d96d5c549e1c'`));
  });
});
