export default async function (url, options) {
    // timeout
    const timeout = options.timeout;
    delete options.timeout;

    const controller = new AbortController();
    let id;
    if (timeout) id = setTimeout(() => controller.abort(), timeout);

    // body
    if (options.body) {
        if (options.body instanceof Object) options.body = JSON.stringify(options.body);
        options.body = new TextEncoder().encode(options.body);
    }

    try {
        if (options.method === 'GET' && options.body) delete options.body;
        const res = await fetch(url, {
            ...options,
            signal: controller.signal
        }, controller.signal);
        return {
            status: res.status,
            data: await (res.headers.get('content-type').includes('application/json') ? res.json() : res.text())
        };
    } catch (err) {
        if (err instanceof AbortError) throw new Error('Timeout');
        throw err;
    } finally {
        if (id) clearTimeout(id);
    }
} 
