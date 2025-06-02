import { resolve } from 'path';

import findUp from 'findup-sync';

export const findGitRootPath = () => {
  const path = findUp('.git');
  if (!path) {
    throw Error('git not found');
  }
  return resolve(path.replace('.git', ''));
};

export const findPackageRootPath = () => {
  const path = findUp('package.json');
  if (!path) {
    throw Error('package.json not found');
  }
  return resolve(path.replace('package.json', ''));
};
