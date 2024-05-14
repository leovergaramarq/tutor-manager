import prompts from "prompts";
import { config, PORT } from "./config.js";
import net from "net";

const PORT_KEY = "port";

run();

function run(errPort) {
    getPort(errPort)
        .then((port) => initApp(port))
        .then((app) => startServer(app))
        .catch(console.error);
}

function startServer(app) {
    if (!app) return;
    app.listen(app.get(PORT_KEY), onListening);
    app.on("error", onError);

    function onListening() {
        console.log(`Server listening on port ${app.get(PORT_KEY)}`);
    }

    function onError(err) {
        console.error(err);
    }
}

async function initApp(port) {
    const module = await import("./app.js");
    const app = module.default;
    if (port) app.set(PORT_KEY, port);
    return app;
}

async function getPort(errPrev) {
    let port;
    let newPort = false;

    while (true) {
        if (errPrev || PORT === undefined) {
            const result = await prompts({
                type: "number",
                name: "port",
                message: "Enter port number (e.g. 5000)"
                // initial: 5000
            });
            port = result.port;
            if (!newPort) newPort = true;
        } else {
            port = PORT;
        }

        try {
            await new Promise((res, rej) => {
                const serverTest = net.createServer();

                serverTest.once("error", (err) => {
                    if (["EACCES", "EADDRINUSE"].includes(err.code)) {
                        serverTest.close();
                        rej(err);
                    } else {
                        res();
                    }
                });

                serverTest.once("listening", () => {
                    serverTest.close();
                    res();
                });

                serverTest.listen(port);
            });

            break;
        } catch (err) {
            console.error(`Port ${port} is already in use`);
            errPrev = err;
        }
    }

    if (newPort) config({ newPort: port });

    return port;
}
