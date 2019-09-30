import { danger, warn, message } from 'danger';
import { includes } from 'lodash';
import * as fs from 'fs';

// No PR is too small to include a description of why you made a change
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

const filesOnly = (file) =>
  fs.existsSync(file) && fs.lstatSync(file).isFile();
const javascriptOnly = (file) => includes(file, '.js');
const modifiedMD = danger.git.modified_files.join('- ');
const modified = danger.git.modified_files;

// Custom subsets of known files
const modifiedAppFiles = modified
  .filter(p => includes(p, 'src') || includes(p, '__tests__'))
  .filter(p => filesOnly(p) && javascriptOnly(p));

const hasAppChanges = modifiedAppFiles.length > 0;

message('Changed Files in this PR: \n - ' + modifiedMD);

// Warn when there is a big PR
const bigPRThreshold = 500;

if (
  danger.github.pr.additions + danger.github.pr.deletions >
  bigPRThreshold
) {
  warn(':exclamation: Big PR');
}

const testChanges = modifiedAppFiles.filter(filepath =>
  filepath.includes('test'),
);
const hasTestChanges = testChanges.length > 0;

// Warn if there are library changes, but not tests
if (hasAppChanges && !hasTestChanges) {
  warn(
    "There are library changes, but not tests. That's OK as long as you're refactoring existing code",
  );
}

// Politely ask for their name in the authors file
message('Please add your name and email to the AUTHORS file (optional)');
message(
  `If this was a change that affects the external API,
  please update the docs and post a link to the PR in the discussion`,
);
