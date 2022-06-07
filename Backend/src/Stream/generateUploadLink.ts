import { generateID } from "utils";

export async function generateUploadLink(userID: string, env: Environment) {
  const uploadLink = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CFAccountID}/stream?direct_user=true`,
    {
      method: "POST",
      headers: {
        authorization: env.CFAPIToken,
        "upload-length": "21600",
        "tus-resumable": "1.0.0",
        "upload-metadata": `allowedOrigins WyJkYXNoY2hhdC5hcHAiXQ==,creator ${btoa(
          userID
        )},requireSignedUrls`,
        "Content-Type": "application/json",
      },
    }
  );

  if (uploadLink.status != 201)
    throw new Error("Cloudflare API returned an invalid response");

  const streamMediaID = uploadLink.headers.get("Stream-Media-Id") as string;
  const uploadLinkURL = uploadLink.headers.get("Location") as string;

  const id = generateID(streamMediaID);
  await env.KV.put(`${env.KVPrefix}-ProcessingComplete-${id}`, "false");
  return {
    url: uploadLinkURL,
    id,
  };
}
