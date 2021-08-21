import path from 'path';
import { Router } from 'express';

const router = Router();

router.get('/', (req, res, next) => {
  res.send(`
    <html>
      <head>
        <style>
          label, input, textarea {
            display: block;
            width: 100%;
          }
          pre {
            margin-left: 2rem;
            white-space: pre-line;
          }
          article {
            display: flex;
          }
          main {
            flex: 1 0 400px;
          }
          aside {
            flex: 1 0 auto;
          }
        </style>
      </head>
      <body>
        <h1>Postman</h1>
        <article>
        <main>
          <fieldset>
            <label>method</label>
            <input id="method" type="text" value="GET"/>
            <label>href</label>
            <input id="href" type="text" value="/api/v2/timestamp"/>
            <label>body</label>
            <textarea id="body" rows=10></textarea>
            <br/>
            <button onClick="submit()">Send</button>
          </fieldset>
          <fieldset>
            <label>response</label>
            <textarea id="response" readonly rows=10></textarea>
            <br/>
            <label>error</label>
            <textarea id="error" readonly></textarea>
          </fieldset>
        </main>
        <aside>
          <pre>
            GET
            POST
          </pre>
          <pre>
            /api/v2/announcements?offset=0&limit=10
            /api/v2/announcements/create
            /api/v2/announcements/announcement-1
            /api/v2/announcements/announcement-1/delete
            /api/v2/announcements/announcement-1/update
            /api/v2/users/xuanquang1999
            /api/v2/users/xuanquang1999/participations
            /api/v2/me
            /api/v2/me/update
            /api/v2/me/participations/create
            /api/v2/me/change-password
            /api/v2/me/participations
            /api/v2/auth/signup
            /api/v2/auth/login
            /api/v2/auth/send-otp
            /api/v2/auth/login-status
            /api/v2/auth/logout
            /api/v2/contests?offset=0&limit=10
            /api/v2/contests/create
            /api/v2/contests/free-contest-121
            /api/v2/contests/free-contest-121/update
            /api/v2/contests/free-contest-121/delete
            /api/v2/contests/free-contest-121/get-credentials
            /api/v2/contests/free-contest-121/participations
            /api/v2/timestamp
          </pre>
        </aside>
        </article>
        <script>
          async function run(method, href, body) {
            const response = await fetch(href, {
              method,
              body: method === 'POST' ? body : undefined,
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            return data;
          }
          function submit() {
            const elMethod = document.getElementById("method");
            const elHref = document.getElementById("href");
            const elBody = document.getElementById("body");
            const elResponse = document.getElementById("response");
            const elError = document.getElementById("error");
            run(elMethod.value, elHref.value, elBody.value)
              .then((data) => {
                elResponse.value = JSON.stringify(data, null, 2);
                elError.value = "";
              })
              .catch((error) => {
                console.log(error);
                console.log(error.toString());
                elResponse.value = "";
                elError.value = error.toString();
              });
          }
        </script>
      </body>
    </html>
  `);
});

export default router;
