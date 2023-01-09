import fetch from './fetch.js';

document.querySelector('#login').addEventListener('click', async function(e) {
    e.preventDefault();
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    try {
        const { status } = await fetch('/api/login', {
            method: 'POST',
            body: { username, password },
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        if(status !== 201) throw new Error('Server error' + status);
        window.location.href = '/';
    } catch (err) {
        console.error(err);
    }
});
