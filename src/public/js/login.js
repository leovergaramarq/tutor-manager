import fetch from "./fetch.js";
import { hideLoading, showLoading } from "./utils.js";

window.addEventListener("DOMContentLoaded", async function () {
    $username = document.querySelector("#username");
    $password = document.querySelector("#password");
    $validateCredentials = document.querySelector("#validate-credentials");

    document
        .querySelector("#login")
        .addEventListener("click", async function (e) {
            e.preventDefault();

            const username = $username.value.trim();
            const password = $password.value;

            if (!areCredentialsValid(username, password))
                return alert(
                    "Username and password must be at least 4 characters long"
                );

            try {
                const { status, data } = await fetch("/api/login", {
                    method: "POST",
                    body: { username, password },
                    headers: { "Content-Type": "application/json" },
                    timeout: 5000
                });
                if (status !== 201) throw new Error(data.message);
                window.location.href = "/";
            } catch (err) {
                console.error(err);
                alert("Error logging in\n\n" + err.message);
            }
        });

    document.querySelector("form").addEventListener("keyup", function () {
        const username = $username.value.trim();
        const password = $password.value;

        const valid = areCredentialsValid(username, password);

        if (valid && $validateCredentials.classList.contains("hidden")) {
            $validateCredentials.classList.remove("hidden");
        } else if (
            !valid &&
            !$validateCredentials.classList.contains("hidden")
        ) {
            $validateCredentials.classList.add("hidden");
        }
    });

    $validateCredentials.addEventListener("click", async function () {
        showLoading();

        const username = $username.value.trim();
        const password = $password.value;

        try {
            const { status, data } = await fetch("/api/validate-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: { username, password },
                timeout: 30000
            });

            if (status === 200) {
                const { valid } = data;
                if (valid) {
                    alert("Credentials are valid");
                } else {
                    alert("Credentials are invalid");
                }
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error validating credentials\n\n" + err.message);
        }

        hideLoading();
    });
});

function areCredentialsValid(username, password) {
    return username?.length >= 4 && password?.length >= 4;
}

let $username;
let $password;
let $validateCredentials;
