#!/usr/bin/env node
// import-conductor-skip
import './pollyfils';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

import { packageVersion } from './version';
import chalk from 'chalk';

import { organizeImports } from './conductor/organize-imports';
import { optionDefinitions, sections } from './cliOptions';
import { conduct } from './conductor/conduct';

export { conduct, organizeImports };

const cliConfig = commandLineArgs(optionDefinitions, {
  camelCase: true,
  stopAtFirstUnknown: true,
});
const { help, version } = cliConfig;

if (version) {
  console.log(packageVersion);
  process.exit();
}

if (help) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit();
}

conduct(cliConfig).then((summary) => {
  if (summary.length) {
    const message = `${chalk.underline('🏁 Summary:')}\n${summary.join('\n')}\n`;
    console.log(message);
  }
});
