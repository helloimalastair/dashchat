import { generateID } from "utils";

interface UploadLinkResponse {
  result: {
    uid: string;
    uploadURL: string;
  };
};

export async function generateUploadLink(duration: number, env: Environment) {
  const uploadLink: UploadLinkResponse = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CFAccountId}/stream/direct_upload`, {
    headers: {
      authorization: env.CFAPIToken
    },
    body: JSON.stringify({
      maxDurationSeconds: duration,
      allowedOrigins: ["dashchat.app"],
      requireSignedURLs: true
    })
  })).json(),
    id = generateID(uploadLink.result.uid);
  await env.KV.put(`${env.KVPrefix}-ProcessingComplete-${id}`, "false");
  return {
    url: uploadLink.result.uploadURL,
    id
  };
}