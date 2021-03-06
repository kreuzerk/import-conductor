import fs from 'fs';
import pkgUp from 'pkg-up';

import { parseJsonFile } from '../helpers/parse-json-file';

export function getThirdParty(): Set<string> {
  const packagePath = pkgUp.sync();
  const lockPath = packagePath.replace('package.json', 'package-lock.json');
  let deps: string[];

  if (fs.existsSync(lockPath)) {
    deps = Object.keys(parseJsonFile(lockPath).dependencies);
  } else {
    const { dependencies, devDependencies } = parseJsonFile(packagePath);
    deps = Object.keys(devDependencies).concat(dependencies);
  }

  return new Set(deps);
}
