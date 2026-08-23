import { createHmac, randomBytes } from 'node:crypto';

// OAuth 1.0a per RFC 5849 / X's implementation. Every other platform in
// this app uses a Bearer token or a simple form POST — X's user-context
// API still requires signing each request with the consumer key/secret
// and the user's access token/secret.

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Builds the Authorization header for one request.
 * `params` should be the request's form-urlencoded / query parameters
 * ONLY — never a JSON body, and never a multipart file field (per OAuth
 * 1.0a, those aren't part of the signature base string).
 */
export function oauth1Header({ method, url, params = {}, consumerKey, consumerSecret, token, tokenSecret }) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const baseParamString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(String(allParams[k]))}`)
    .join('&');

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(baseParamString)].join('&');
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

  const headerParams = { ...oauthParams, oauth_signature: signature };
  const header =
    'OAuth ' +
    Object.keys(headerParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
      .join(', ');

  return header;
}
