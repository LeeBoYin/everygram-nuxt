/**
 * Fetches a text response, giving up when it takes too long or grows too large.
 * The timeout covers reading the body too.
 */
export const fetchTextWithLimit = async (
    url: string,
    { timeoutMs, maxBytes }: { timeoutMs: number; maxBytes: number },
): Promise<string> => {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    if (!response.body) {
        return '';
    }
    // count the bytes as they arrive, content-length can be missing or wrong
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
            await reader.cancel();
            throw new Error(`Response too large: ${url}`);
        }
        chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
};
