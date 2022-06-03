import { encoder } from "Utils/Coder";

const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
  objectToBase64url = (payload: any): string =>  arrayBufferToBase64Url(encoder.encode(JSON.stringify(payload)));

export async function generateSignedToken(env: Environment, videoID: string, viewableCountry: string): Promise<string> {
  const headers = {
      "alg": "RS256",
      "kid": env.StreamSignatureID
    },
    data = {
      "sub": videoID,
      "kid": env.StreamSignatureID,
      "exp": Math.floor(Date.now() / 1000) + 3600,
      "accessRules": [
        {
          "type": "ip.geoip.country",
          "action": "allow",
          "country": [viewableCountry]
        },
        { "type": "any", "action": "block" }
      ]
    },
    token = `${objectToBase64url(headers)}.${objectToBase64url(data)}`,
    signature = await crypto.subtle.sign(
      {
        name: "RSASSA-PKCS1-v1_5"
      },
      await crypto.subtle.importKey(
        "jwk", JSON.parse(env.StreamSignatureJWK),
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        false, [ "sign" ]
      ),
      encoder.encode(token)
    );
  return `${token}.${arrayBufferToBase64Url(signature)}`;
}