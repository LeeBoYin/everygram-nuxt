// Cloud Functions tests against the emulators. Usage: npm run test:functions
// A throwaway service account is used, so no real key is needed (and a real one,
// if present, is never loaded by the emulator).
import { spawnSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { copyFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'demo-everygram';
const KEY_FILE = 'everygram-firebase-adminsdk.json';

const root = fileURLToPath(new URL('../../', import.meta.url));
const srcKey = `${root}functions/src/${KEY_FILE}`;
const libKey = `${root}functions/lib/${KEY_FILE}`;

const fakeKey = JSON.stringify({
    type: 'service_account',
    project_id: PROJECT_ID,
    client_email: `test@${PROJECT_ID}.iam.gserviceaccount.com`,
    private_key: generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
    }).privateKey,
});

const run = (command, args) =>
    spawnSync(command, args, { cwd: root, stdio: 'inherit' }).status ?? 1;

// stay alive on Ctrl-C so the cleanup below still runs
process.on('SIGINT', () => {});

// the build imports the key file, so it must exist
const createdSrcKey = !existsSync(srcKey);
if (createdSrcKey) {
    writeFileSync(srcKey, fakeKey);
}

try {
    process.exitCode = run('npm', ['--prefix', 'functions', 'run', 'build']);
    if (process.exitCode === 0) {
        writeFileSync(libKey, fakeKey);
        process.exitCode = run('firebase', [
            'emulators:exec',
            '--only',
            'functions,firestore,storage',
            '--project',
            PROJECT_ID,
            'node --test tests/functions/on-gear-deleted.mjs',
        ]);
    }
} finally {
    // never leave the throwaway key behind
    rmSync(libKey, { force: true });
    if (createdSrcKey) {
        rmSync(srcKey);
    } else if (existsSync(`${root}functions/lib`)) {
        copyFileSync(srcKey, libKey);
    }
}
