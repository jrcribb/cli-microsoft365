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
import command from './field-get.js';

describe(commands.FIELD_GET, () => {
  let log: string[];
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
    assert.strictEqual(command.name, commands.FIELD_GET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the specified site URL is not a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'site.com', id: '03e45e84-1992-4d42-9116-26f756012634' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the field ID is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com/sites/sales', id: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the list ID is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com/sites/sales', id: '03e45e84-1992-4d42-9116-26f756012634', listId: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when all required parameters are valid', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com/sites/sales', id: '03e45e84-1992-4d42-9116-26f756012634' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('gets information about a site column', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/fields/getbyid('5ee2dd25-d941-455a-9bdb-7f2c54aed11b')`) {
        return {
          "AutoIndexed": false,
          "CanBeDeleted": true,
          "ClientSideComponentId": "00000000-0000-0000-0000-000000000000",
          "ClientSideComponentProperties": null,
          "CustomFormatter": null,
          "DefaultFormula": null,
          "DefaultValue": "[today]",
          "Description": "",
          "Direction": "none",
          "EnforceUniqueValues": false,
          "EntityPropertyName": "PnPAlertStartDateTime",
          "Filterable": true,
          "FromBaseType": false,
          "Group": "PnP Columns",
          "Hidden": false,
          "Id": "5ee2dd25-d941-455a-9bdb-7f2c54aed11b",
          "Indexed": false,
          "InternalName": "PnPAlertStartDateTime",
          "JSLink": "clienttemplates.js",
          "PinnedToFiltersPane": false,
          "ReadOnlyField": false,
          "Required": false,
          "SchemaXml": "<Field Type=\"DateTime\" DisplayName=\"Start date-time\" Required=\"FALSE\" EnforceUniqueValues=\"FALSE\" Indexed=\"FALSE\" Format=\"DateTime\" Group=\"PnP Columns\" FriendlyDisplayFormat=\"Disabled\" ID=\"{5ee2dd25-d941-455a-9bdb-7f2c54aed11b}\" SourceID=\"{4f118c69-66e0-497c-96ff-d7855ce0713d}\" StaticName=\"PnPAlertStartDateTime\" Name=\"PnPAlertStartDateTime\" Version=\"1\"><Default>[today]</Default></Field>",
          "Scope": "/sites/portal",
          "Sealed": false,
          "ShowInFiltersPane": 0,
          "Sortable": true,
          "StaticName": "PnPAlertStartDateTime",
          "Title": "Start date-time",
          "FieldTypeKind": 4,
          "TypeAsString": "DateTime",
          "TypeDisplayName": "Date and Time",
          "TypeShortDescription": "Date and Time",
          "ValidationFormula": null,
          "ValidationMessage": null,
          "DateTimeCalendarType": 0,
          "DisplayFormat": 1,
          "FriendlyDisplayFormat": 1
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/portal', id: '5ee2dd25-d941-455a-9bdb-7f2c54aed11b' } });
    assert(loggerLogSpy.calledWith({
      "AutoIndexed": false,
      "CanBeDeleted": true,
      "ClientSideComponentId": "00000000-0000-0000-0000-000000000000",
      "ClientSideComponentProperties": null,
      "CustomFormatter": null,
      "DefaultFormula": null,
      "DefaultValue": "[today]",
      "Description": "",
      "Direction": "none",
      "EnforceUniqueValues": false,
      "EntityPropertyName": "PnPAlertStartDateTime",
      "Filterable": true,
      "FromBaseType": false,
      "Group": "PnP Columns",
      "Hidden": false,
      "Id": "5ee2dd25-d941-455a-9bdb-7f2c54aed11b",
      "Indexed": false,
      "InternalName": "PnPAlertStartDateTime",
      "JSLink": "clienttemplates.js",
      "PinnedToFiltersPane": false,
      "ReadOnlyField": false,
      "Required": false,
      "SchemaXml": "<Field Type=\"DateTime\" DisplayName=\"Start date-time\" Required=\"FALSE\" EnforceUniqueValues=\"FALSE\" Indexed=\"FALSE\" Format=\"DateTime\" Group=\"PnP Columns\" FriendlyDisplayFormat=\"Disabled\" ID=\"{5ee2dd25-d941-455a-9bdb-7f2c54aed11b}\" SourceID=\"{4f118c69-66e0-497c-96ff-d7855ce0713d}\" StaticName=\"PnPAlertStartDateTime\" Name=\"PnPAlertStartDateTime\" Version=\"1\"><Default>[today]</Default></Field>",
      "Scope": "/sites/portal",
      "Sealed": false,
      "ShowInFiltersPane": 0,
      "Sortable": true,
      "StaticName": "PnPAlertStartDateTime",
      "Title": "Start date-time",
      "FieldTypeKind": 4,
      "TypeAsString": "DateTime",
      "TypeDisplayName": "Date and Time",
      "TypeShortDescription": "Date and Time",
      "ValidationFormula": null,
      "ValidationMessage": null,
      "DateTimeCalendarType": 0,
      "DisplayFormat": 1,
      "FriendlyDisplayFormat": 1
    }));
  });

  it('gets information about a list column', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle('Documents')/fields/getbyid('03e45e84-1992-4d42-9116-26f756012634')`) {
        return {
          "AutoIndexed": false,
          "CanBeDeleted": false,
          "ClientSideComponentId": "00000000-0000-0000-0000-000000000000",
          "ClientSideComponentProperties": null,
          "CustomFormatter": null,
          "DefaultFormula": null,
          "DefaultValue": null,
          "Description": "",
          "Direction": "none",
          "EnforceUniqueValues": false,
          "EntityPropertyName": "ContentTypeId",
          "Filterable": true,
          "FromBaseType": true,
          "Group": "Custom Columns",
          "Hidden": true,
          "Id": "03e45e84-1992-4d42-9116-26f756012634",
          "Indexed": false,
          "InternalName": "ContentTypeId",
          "JSLink": null,
          "PinnedToFiltersPane": false,
          "ReadOnlyField": true,
          "Required": false,
          "SchemaXml": "<Field ID=\"{03e45e84-1992-4d42-9116-26f756012634}\" RowOrdinal=\"0\" Type=\"ContentTypeId\" Sealed=\"TRUE\" ReadOnly=\"TRUE\" Hidden=\"TRUE\" DisplayName=\"Content Type ID\" Name=\"ContentTypeId\" DisplaceOnUpgrade=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"ContentTypeId\" ColName=\"tp_ContentTypeId\" FromBaseType=\"TRUE\" />",
          "Scope": "/sites/portal/Shared Documents",
          "Sealed": true,
          "ShowInFiltersPane": 0,
          "Sortable": true,
          "StaticName": "ContentTypeId",
          "Title": "Content Type ID",
          "FieldTypeKind": 25,
          "TypeAsString": "ContentTypeId",
          "TypeDisplayName": "Content Type Id",
          "TypeShortDescription": "Content Type Id",
          "ValidationFormula": null,
          "ValidationMessage": null
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', id: '03e45e84-1992-4d42-9116-26f756012634', listTitle: 'Documents' } });
    assert(loggerLogSpy.calledWith({
      "AutoIndexed": false,
      "CanBeDeleted": false,
      "ClientSideComponentId": "00000000-0000-0000-0000-000000000000",
      "ClientSideComponentProperties": null,
      "CustomFormatter": null,
      "DefaultFormula": null,
      "DefaultValue": null,
      "Description": "",
      "Direction": "none",
      "EnforceUniqueValues": false,
      "EntityPropertyName": "ContentTypeId",
      "Filterable": true,
      "FromBaseType": true,
      "Group": "Custom Columns",
      "Hidden": true,
      "Id": "03e45e84-1992-4d42-9116-26f756012634",
      "Indexed": false,
      "InternalName": "ContentTypeId",
      "JSLink": null,
      "PinnedToFiltersPane": false,
      "ReadOnlyField": true,
      "Required": false,
      "SchemaXml": "<Field ID=\"{03e45e84-1992-4d42-9116-26f756012634}\" RowOrdinal=\"0\" Type=\"ContentTypeId\" Sealed=\"TRUE\" ReadOnly=\"TRUE\" Hidden=\"TRUE\" DisplayName=\"Content Type ID\" Name=\"ContentTypeId\" DisplaceOnUpgrade=\"TRUE\" SourceID=\"http://schemas.microsoft.com/sharepoint/v3\" StaticName=\"ContentTypeId\" ColName=\"tp_ContentTypeId\" FromBaseType=\"TRUE\" />",
      "Scope": "/sites/portal/Shared Documents",
      "Sealed": true,
      "ShowInFiltersPane": 0,
      "Sortable": true,
      "StaticName": "ContentTypeId",
      "Title": "Content Type ID",
      "FieldTypeKind": 25,
      "TypeAsString": "ContentTypeId",
      "TypeDisplayName": "Content Type Id",
      "TypeShortDescription": "Content Type Id",
      "ValidationFormula": null,
      "ValidationMessage": null
    }));
  });

  it('should call the correct GET url when id and list url specified', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/GetList('%2Fsites%2Fportal%2FLists%2FEvents')/fields/getbyid('03e45e84-1992-4d42-9116-26f756012634')`) {
        return {
          "Id": "03e45e84-1992-4d42-9116-26f756012634"
        };
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, verbose: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', id: '03e45e84-1992-4d42-9116-26f756012634', listUrl: 'Lists/Events' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/GetList(\'%2Fsites%2Fportal%2FLists%2FEvents\')/fields/getbyid(\'03e45e84-1992-4d42-9116-26f756012634\')');
  });

  it('should call the correct GET url when field title and list title specified (verbose)', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle('Documents')/fields/getbyinternalnameortitle('Title')`) {
        return {
          "Id": "03e45e84-1992-4d42-9116-26f756012634"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, verbose: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', title: 'Title', listTitle: 'Documents' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle(\'Documents\')/fields/getbyinternalnameortitle(\'Title\')');
  });

  it('should call the correct GET url when field title and list title specified', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle('Documents')/fields/getbyinternalnameortitle('Title')`) {
        return {
          "Id": "03e45e84-1992-4d42-9116-26f756012634"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/portal', title: 'Title', listTitle: 'Documents' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle(\'Documents\')/fields/getbyinternalnameortitle(\'Title\')');
  });

  it('should call the correct GET url when field title and list url specified', async () => {
    const webUrl = 'https://contoso.sharepoint.com/sites/portal';
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `${webUrl}/_api/web/lists(guid'03e45e84-1992-4d42-9116-26f756012634')/fields/getbyinternalnameortitle('Title')`) {
        return {
          "Id": "03e45e84-1992-4d42-9116-26f756012634"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', title: 'Title', listId: '03e45e84-1992-4d42-9116-26f756012634' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/lists(guid\'03e45e84-1992-4d42-9116-26f756012634\')/fields/getbyinternalnameortitle(\'Title\')');
  });

  it('should call the correct GET url when field internalName and list title specified (verbose)', async () => {
    const webUrl = 'https://contoso.sharepoint.com/sites/portal';
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `${webUrl}/_api/web/lists/getByTitle('Documents')/fields/getbyinternalnameortitle('Title')`) {
        return {
          "Id": "03e45e84-1992-4d42-9116-26f756012634"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, verbose: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', internalName: 'Title', listTitle: 'Documents' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle(\'Documents\')/fields/getbyinternalnameortitle(\'Title\')');
  });

  it('should call the correct GET url when field internalName and list title specified', async () => {
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle('Documents')/fields/getbyinternalnameortitle('Title')`) {
        return {
          "Id": "03e45e84-1992-4d42-9116-26f756012634"
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: 'https://contoso.sharepoint.com/sites/portal', internalName: 'Title', listTitle: 'Documents' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle(\'Documents\')/fields/getbyinternalnameortitle(\'Title\')');
  });

  it('should call the correct GET url when field internalName and list url specified', async () => {
    const webUrl = 'https://contoso.sharepoint.com/sites/portal';
    const getStub = sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `${webUrl}/_api/web/lists(guid'03e45e84-1992-4d42-9116-26f756012634')/fields/getbyinternalnameortitle('Title')`) {
        return {
          'Id': '03e45e84-1992-4d42-9116-26f756012634'
        };
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', internalName: 'Title', listId: '03e45e84-1992-4d42-9116-26f756012634' } });
    assert.strictEqual(getStub.lastCall.args[0].url, 'https://contoso.sharepoint.com/sites/portal/_api/web/lists(guid\'03e45e84-1992-4d42-9116-26f756012634\')/fields/getbyinternalnameortitle(\'Title\')');
  });

  it('correctly handles site column not found', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/fields/getbyid('03e45e84-1992-4d42-9116-26f756012634')`) {
        throw {
          error: {
            "odata.error": {
              "code": "-2147024809, System.ArgumentException",
              "message": {
                "lang": "en-US",
                "value": "Invalid field name. {03e45e84-1992-4d42-9116-26f756012634} https://contoso.sharepoint.com/sites/portal "
              }
            }
          }
        };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', id: '03e45e84-1992-4d42-9116-26f756012634' } } as any),
      new CommandError('Invalid field name. {03e45e84-1992-4d42-9116-26f756012634} https://contoso.sharepoint.com/sites/portal '));
  });

  it('correctly handles list column not found', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle('Documents')/fields/getbyid('03e45e84-1992-4d42-9116-26f756012634')`) {
        throw {
          error: {
            "odata.error": {
              "code": "-2147024809, System.ArgumentException",
              "message": {
                "lang": "en-US",
                "value": "Invalid field name. {03e45e84-1992-4d42-9116-26f756012634}  /sites/portal/Shared Documents"
              }
            }
          }
        };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', id: '03e45e84-1992-4d42-9116-26f756012634', listTitle: 'Documents' } } as any),
      new CommandError('Invalid field name. {03e45e84-1992-4d42-9116-26f756012634}  /sites/portal/Shared Documents'));
  });

  it('correctly handles list not found', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://contoso.sharepoint.com/sites/portal/_api/web/lists/getByTitle('Documents')/fields/getbyid('03e45e84-1992-4d42-9116-26f756012634')`) {
        throw {
          error: {
            "odata.error": {
              "code": "-1, System.ArgumentException",
              "message": {
                "lang": "en-US",
                "value": "List 'Documents' does not exist at site with URL 'https://contoso.sharepoint.com/sites/portal'."
              }
            }
          }
        };
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, webUrl: 'https://contoso.sharepoint.com/sites/portal', id: '03e45e84-1992-4d42-9116-26f756012634', listTitle: 'Documents' } } as any),
      new CommandError("List 'Documents' does not exist at site with URL 'https://contoso.sharepoint.com/sites/portal'."));
  });
});
