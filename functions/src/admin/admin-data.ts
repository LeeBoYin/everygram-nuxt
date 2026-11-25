import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Asia/Taipei is UTC+8 all year round (no daylight saving time)
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

// 'YYYY-MM' of the date in Asia/Taipei
export const toMonthKey = (date: Date): string =>
    new Date(date.getTime() + TAIPEI_OFFSET_MS).toISOString().slice(0, 7);

export const toPreviousMonthKey = (date: Date): string => {
    const [year, month] = toMonthKey(date).split('-').map(Number);
    // `month` is 1-based, so `month - 2` is the previous month for Date.UTC
    return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
};

// accepts Firestore timestamps and Auth date strings, old data may have neither
export const toDate = (value: unknown): Date | null => {
    if (typeof value === 'string') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    const timestamp = value as Partial<Timestamp> | null | undefined;
    return typeof timestamp?.toDate === 'function' ? timestamp.toDate() : null;
};

export const listAllUsers = async (): Promise<UserRecord[]> => {
    const users: UserRecord[] = [];
    let pageToken: string | undefined;
    do {
        const result = await getAuth().listUsers(1000, pageToken);
        users.push(...result.users);
        pageToken = result.pageToken;
    } while (pageToken);
    return users;
};

// documents of a whole collection, limited to the given fields to save memory
export const readCollection = async <T>(
    name: string,
    fields: string[],
): Promise<{ id: string; data: Partial<T> }[]> => {
    const snapshot = await getFirestore()
        .collection(name)
        .select(...fields)
        .get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as Partial<T>,
    }));
};
