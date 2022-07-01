import { actions, organizeImports, organizeImportsForFile } from '@ic/conductor/organize-imports';
import * as config from '@ic/config';
import fs from 'fs';
import { Config } from '@ic/types';
import {
  readmeExample,
  comments,
  TestCase,
  codeBetweenImports,
  emptyNewLineSeparator,
  noImportStatement,
  importsOnDifferentGroupOrder,
  importsWithGroupOrderIncorrect,
} from './optimize-imports-mocks';
import { defaultConfig } from '@ic/defaultConfig';
import { getGroupOrder } from '@ic/conductor/get-group-order';

jest.mock('fs');
jest.mock('simple-git');

describe('optimizeImports', () => {
  const basicConfig: Config = {
    ...defaultConfig,
    source: ['test.ts'],
    userLibPrefixes: ['@myorg'],
    thirdPartyDependencies: new Set<string>(['@angular/core', 'rxjs']),
  };

  let spy: jasmine.Spy;
  beforeEach(() => {
    spy = spyOn(config, 'getConfig');
    spy.and.returnValue(basicConfig);
    (fs.existsSync as any).mockReturnValue(true);
    (fs.writeFileSync as any).mockClear();
  });

  async function assertConductor({ expected, input, noOfRuns }: TestCase) {
    (fs.readFileSync as any).mockReturnValue(Buffer.from(input));
    let noOfRun = noOfRuns ?? 1;
    const file = 'test.ts';
    let result: string;
    do {
      result = await organizeImportsForFile(file);
    } while (--noOfRun > 0);

    expect(fs.writeFileSync).toHaveBeenCalledWith(file, expected);

    return result;
  }

  it('should work with a basic example', async () => {
    await assertConductor(readmeExample);
  });

  it('should work with comments', async () => {
    await assertConductor(comments);
  });

  it('should work with non import node between the import blocks', async () => {
    await assertConductor(codeBetweenImports);
  });

  it('should give you an error if you import something that is not installed', async () => {
    spy.and.returnValue({ ...basicConfig, separator: '' });
    await assertConductor(emptyNewLineSeparator);
  });

  it('should not change conducted file', async () => {
    (fs.readFileSync as any).mockReturnValue(Buffer.from(readmeExample.expected));
    const file = 'test.ts';
    await organizeImports(file);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should skip the file when skip comment exists', async () => {
    const testCases = ['//import-conductor-skip', '// import-conductor-skip', '/* import-conductor-skip*/', '/*import-conductor-skip */'];
    for (const testCase of testCases) {
      (fs.readFileSync as any).mockReturnValue(Buffer.from(testCase));
      const file = 'test.ts';
      const result = await organizeImportsForFile(file);
      expect(result).toBe(actions.skipped);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    }
  });

  it('should do nothing if the file has no import', async () => {
    (fs.readFileSync as any).mockReturnValue(Buffer.from(noImportStatement.input));
    const file = 'test.ts';
    const result = await organizeImportsForFile(file);
    expect(result).toBe(actions.none);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should change group order', async () => {
    spy.and.returnValue({ ...basicConfig, groupOrder: importsOnDifferentGroupOrder.groupOrder, separator: '' });
    await assertConductor(importsOnDifferentGroupOrder);
  });

  it('should use default order because incorrect group order input', async () => {
    spy.and.returnValue({ ...basicConfig, groupOrder: getGroupOrder({ groupOrder: importsWithGroupOrderIncorrect.groupOrder }) });
    await assertConductor(importsWithGroupOrderIncorrect);
  });
});
