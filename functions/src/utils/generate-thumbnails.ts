import { getStorage } from 'firebase-admin/storage';

import type {
    ThumbnailSize,
    ThumbnailOption,
    StorageFile,
} from '../../types/types';
import _ from 'lodash';
import path from 'path';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';

export const GEAR_THUMBNAIL_SIZES: ThumbnailOption[] = [
    { width: 128, height: 128, name: 'xs' },
    { width: 360, height: 360, name: 'sm' },
    { width: 720, height: 720, name: 'md' },
];

export const TRIP_THUMBNAIL_SIZES: ThumbnailOption[] = [
    { width: 320, height: 180, name: 'xs' },
    { width: 640, height: 360, name: 'sm' },
    { width: 1280, height: 720, name: 'md' },
];

export const generateThumbnails = async ({
    imagePath,
    targetPath,
    sizes,
}: {
    imagePath: string;
    targetPath: string;
    sizes: ThumbnailOption[];
}): Promise<Partial<Record<ThumbnailSize, StorageFile>> | undefined> => {
    const bucket = getStorage().bucket();
    const fileName = path.basename(imagePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);

    // Download image
    await bucket.file(imagePath).download({ destination: tempFilePath });

    const generatedThumbnails: Partial<Record<ThumbnailSize, StorageFile>> = {};

    await Promise.all(
        sizes.map(async (size) => {
            const thumbFileName = size.name;
            const thumbFilePath = path.join(os.tmpdir(), thumbFileName);

            // Generate thumbnail
            await sharp(tempFilePath)
                .resize(size.width, size.height, {
                    fit: 'cover',
                })
                .toFile(thumbFilePath);

            const thumbFile = bucket.file(path.join(targetPath, thumbFileName));
            await bucket.upload(thumbFilePath, {
                destination: thumbFile,
                metadata: { contentType: 'image/jpeg' },
            });

            // get download url of thumbFile
            const [thumbFileUrl] = await thumbFile.getSignedUrl({
                action: 'read',
                expires: '01-01-2500',
            });

            generatedThumbnails[thumbFileName] = {
                fileName: thumbFileName,
                url: thumbFileUrl,
            };

            // Clean up temp files
            fs.unlinkSync(thumbFilePath);
        }),
    );

    fs.unlinkSync(tempFilePath);

    return generatedThumbnails;
};
