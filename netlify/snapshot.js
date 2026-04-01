const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "rayanamirouche-glitch/dshbrd";
const FILE_PATH = "snapshots.json";
const BRANCH = "main";

async function getFile() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (res.status === 404) return { content: null, sha: null };
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
  return { content, sha: data.sha };
}

async function saveFile(content, sha) {
  const body = {
    message: `snapshot ${new Date().toISOString().split("T")[0]}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // GET — lire les snapshots
  if (event.httpMethod === "GET") {
    try {
      const { content } = await getFile();
      return { statusCode: 200, headers, body: JSON.stringify(content || {}) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // POST — sauvegarder un snapshot
  if (event.httpMethod === "POST") {
    try {
      const incoming = JSON.parse(event.body);
      const today = new Date().toISOString().split("T")[0];
      const { content, sha } = await getFile();
      const snapshots = content || {};

      // Ne sauvegarde qu'une fois par jour
      if (snapshots[today]) {
        return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, date: today }) };
      }

      snapshots[today] = incoming;
      await saveFile(snapshots, sha);
      return { statusCode: 200, headers, body: JSON.stringify({ saved: true, date: today }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: "Method not allowed" };
};
