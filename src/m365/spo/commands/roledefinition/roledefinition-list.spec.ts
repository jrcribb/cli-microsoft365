import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './roledefinition-list.js';

describe(commands.ROLEDEFINITION_LIST, () => {
  let log: any[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

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
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.ROLEDEFINITION_LIST);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('defines correct properties for the default output', () => {
    assert.deepStrictEqual(command.defaultProperties(), ['Id', 'Name']);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('list role definitions handles reject request correctly', async () => {
    const err = 'request rejected';
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_api/web/roledefinitions') {
        throw err;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        webUrl: 'https://contoso.sharepoint.com'
      }
    }), new CommandError(err));
  });

  it('lists all role definitions from web', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/sites/cli/_api/web/roledefinitions') {
        return ({
          value:
            [
              {
                "BasePermissions": {
                  "High": "2147483647",
                  "Low": "4294967295"
                },
                "Description": "Has full control.",
                "Hidden": false,
                "Id": 1073741829,
                "Name": "Full Control",
                "Order": 1,
                "RoleTypeKind": 5
              },
              {
                "BasePermissions": {
                  "High": "432",
                  "Low": "1012866047"
                },
                "Description": "Can view, add, update, delete, approve, and customize.",
                "Hidden": false,
                "Id": 1073741828,
                "Name": "Design",
                "Order": 32,
                "RoleTypeKind": 4
              }
            ]
        });
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        debug: true,
        webUrl: 'https://contoso.sharepoint.com/sites/cli'
      }
    });
    assert(loggerLogSpy.calledWith(
      [
        {
          "BasePermissions": {
            "High": "2147483647",
            "Low": "4294967295"
          },
          "Description": "Has full control.",
          "Hidden": false,
          "Id": 1073741829,
          "Name": "Full Control",
          "Order": 1,
          "RoleTypeKind": 5,
          "BasePermissionsValue": [
            "ViewListItems",
            "AddListItems",
            "EditListItems",
            "DeleteListItems",
            "ApproveItems",
            "OpenItems",
            "ViewVersions",
            "DeleteVersions",
            "CancelCheckout",
            "ManagePersonalViews",
            "ManageLists",
            "ViewFormPages",
            "AnonymousSearchAccessList",
            "Open",
            "ViewPages",
            "AddAndCustomizePages",
            "ApplyThemeAndBorder",
            "ApplyStyleSheets",
            "ViewUsageData",
            "CreateSSCSite",
            "ManageSubwebs",
            "CreateGroups",
            "ManagePermissions",
            "BrowseDirectories",
            "BrowseUserInfo",
            "AddDelPrivateWebParts",
            "UpdatePersonalWebParts",
            "ManageWeb",
            "AnonymousSearchAccessWebLists",
            "UseClientIntegration",
            "UseRemoteAPIs",
            "ManageAlerts",
            "CreateAlerts",
            "EditMyUserInfo",
            "EnumeratePermissions"
          ],
          "RoleTypeKindValue": "Administrator"
        },
        {
          "BasePermissions": {
            "High": "432",
            "Low": "1012866047"
          },
          "Description": "Can view, add, update, delete, approve, and customize.",
          "Hidden": false,
          "Id": 1073741828,
          "Name": "Design",
          "Order": 32,
          "RoleTypeKind": 4,
          "BasePermissionsValue": [
            "ViewListItems",
            "AddListItems",
            "EditListItems",
            "DeleteListItems",
            "ApproveItems",
            "OpenItems",
            "ViewVersions",
            "DeleteVersions",
            "CancelCheckout",
            "ManagePersonalViews",
            "ManageLists",
            "ViewFormPages",
            "Open",
            "ViewPages",
            "AddAndCustomizePages",
            "ApplyThemeAndBorder",
            "ApplyStyleSheets",
            "CreateSSCSite",
            "BrowseDirectories",
            "BrowseUserInfo",
            "AddDelPrivateWebParts",
            "UpdatePersonalWebParts",
            "UseClientIntegration",
            "UseRemoteAPIs",
            "CreateAlerts",
            "EditMyUserInfo"
          ],
          "RoleTypeKindValue": "WebDesigner"
        }
      ]
    ));
  });

  it('should return an empty array for BasePermissionValue & not return RoleTypeKindValue with unmappable data', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === 'https://contoso.sharepoint.com/_api/web/roledefinitions') {
        return ({
          value:
            [
              {
                "BasePermissions": {
                  "High": "0",
                  "Low": "0"
                },
                "Description": "Has no permissions.",
                "Hidden": false,
                "Id": 1073741822,
                "Name": "No Permissions",
                "Order": 1,
                "RoleTypeKind": 9
              }
            ]
        });
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        output: 'json',
        debug: true,
        webUrl: 'https://contoso.sharepoint.com'
      }
    });
    assert(loggerLogSpy.calledWith(
      [
        {
          "BasePermissions": {
            "High": "0",
            "Low": "0"
          },
          "Description": "Has no permissions.",
          "Hidden": false,
          "Id": 1073741822,
          "Name": "No Permissions",
          "Order": 1,
          "RoleTypeKind": 9,
          "BasePermissionsValue": [],
          "RoleTypeKindValue": undefined
        }
      ]
    ));
  });
});
