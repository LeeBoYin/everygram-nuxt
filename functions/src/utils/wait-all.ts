// Like Promise.all, but waits for every task before throwing the first error:
// a function that fails early may be frozen while other tasks are still running.
export const waitAll = async (tasks: Promise<unknown>[]) => {
    const results = await Promise.allSettled(tasks);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) {
        throw failed.reason;
    }
};
