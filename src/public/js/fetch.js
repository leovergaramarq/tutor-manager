export default async function (url, options) {
    let timeout, controller;

    if (options) {
        // body
        if (options.body) {
            if (options.method === 'GET') {
                delete options.body;
            } else {
                if (options.body instanceof Object) options.body = JSON.stringify(options.body);
                options.body = new TextEncoder().encode(options.body);
            }
        }

        // timeout
        if (options.timeout) {
            controller = new AbortController();
            timeout = setTimeout(() => controller.abort(), options.timeout);
            delete options.timeout;
        }
        
        try {
            const res = timeout ? await fetch(url, {
                ...options,
                signal: controller.signal
            }, controller.signal)
            : await fetch(url, options);

            return {
                status: res.status,
                data: await (res.headers.get('content-type').includes('application/json') ? res.json() : res.text())
            };
        } catch (err) {
            if (err instanceof DOMException) throw new Error('Request timed out');
            throw err;
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    } else {
        const res = await fetch(url);
        return {
            status: res.status,
            data: await (res.headers.get('content-type').includes('application/json') ? res.json() : res.text())
        };
    }
} 
