import type { File } from '@google-cloud/storage';
import { getDownloadURL } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';

/**
 * Uploads a local file with a Firebase download token and returns its download URL.
 * The URL does not expire. Unlike getSignedUrl, it needs no private key: a URL
 * signed through IAM signBlob stops working when Google rotates the key.
 */
export const uploadWithDownloadUrl = async ({
    localPath,
    file,
    contentType,
}: {
    localPath: string;
    file: File;
    contentType: string;
}): Promise<string> => {
    await file.bucket.upload(localPath, {
        destination: file,
        metadata: {
            contentType,
            metadata: { firebaseStorageDownloadTokens: randomUUID() },
        },
    });
    return getDownloadURL(file);
};
