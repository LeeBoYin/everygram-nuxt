// Runs the emulators with the `demo-everygram` project, which can't reach any
// real Firebase resource. A throwaway service account is used for the functions,
// so no real key is needed (and a real one, if present, is never loaded).
//
//   node scripts/emulators.mjs             start and keep data between runs
//   node scripts/emulators.mjs "<command>" run a command against fresh emulators
import { spawn } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import {
    copyFileSync,
    existsSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'demo-everygram';
const KEY_FILE = 'everygram-firebase-adminsdk.json';
const DATA_DIR = '.emulator-data';

const root = fileURLToPath(new URL('../', import.meta.url));
const srcKey = `${root}functions/src/${KEY_FILE}`;
const libKey = `${root}functions/lib/${KEY_FILE}`;
const command = process.argv[2];

const createFakeKey = () =>
    JSON.stringify({
        type: 'service_account',
        project_id: PROJECT_ID,
        client_email: `test@${PROJECT_ID}.iam.gserviceaccount.com`,
        private_key: generateKeyPairSync('rsa', {
            modulusLength: 2048,
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' },
        }).privateKey,
    });

let child;
let isStopping = false;
// stay alive on signals so the cleanup below still runs
// (Ctrl-C already reaches the child, SIGTERM has to be forwarded)
process.on('SIGINT', () => {
    isStopping = true;
});
process.on('SIGTERM', () => {
    isStopping = true;
    child?.kill('SIGINT');
});

const run = (file, args) =>
    new Promise((resolve) => {
        child = spawn(file, args, { cwd: root, stdio: 'inherit' });
        child.on('error', (error) => {
            console.error(error);
            resolve(1);
        });
        child.on('exit', (code) => resolve(code ?? 1));
    });

// the build imports the key file, so it must exist
// a leftover throwaway key (the process was killed) counts as ours
const isOwnSrcKey =
    !existsSync(srcKey) ||
    JSON.parse(readFileSync(srcKey, 'utf8')).project_id === PROJECT_ID;

const emulatorArgs = command
    ? ['emulators:exec', '--only', 'auth,functions,firestore,storage']
    : [
          'emulators:start',
          '--only',
          'auth,functions,firestore,storage',
          `--export-on-exit=${DATA_DIR}`,
          ...(existsSync(`${root}${DATA_DIR}`) ? [`--import=${DATA_DIR}`] : []),
      ];

try {
    if (isOwnSrcKey) {
        writeFileSync(srcKey, createFakeKey());
    }
    process.exitCode = await run('npm', [
        '--prefix',
        'functions',
        'run',
        'build',
    ]);
    if (process.exitCode === 0 && !isStopping) {
        writeFileSync(libKey, createFakeKey());
        process.exitCode = await run('firebase', [
            ...emulatorArgs,
            '--project',
            PROJECT_ID,
            ...(command ? [command] : []),
        ]);
    }
} finally {
    // never leave the throwaway key behind
    rmSync(libKey, { force: true });
    if (isOwnSrcKey) {
        rmSync(srcKey, { force: true });
    } else if (existsSync(`${root}functions/lib`)) {
        copyFileSync(srcKey, libKey);
    }
}
