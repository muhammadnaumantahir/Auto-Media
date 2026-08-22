// LinkedIn's video flow is register → upload → publish. The access token
// needs the w_member_social scope; the person posting needs to already
// hold a token with that scope (from LinkedIn's own OAuth flow or a tool
// like Postman's OAuth helper) - this file doesn't do the OAuth dance
// itself, same as Facebook's pasted long-lived token.

async function registerUpload({ accessToken, authorUrn }) {
  const res = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
        owner: authorUrn,
        serviceRelationships: [
          { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
        ],
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'LinkedIn rejected the upload registration.');
  }
  const uploadUrl =
    data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
      .uploadUrl;
  return { uploadUrl, asset: data.value.asset };
}

async function uploadBytes({ uploadUrl, accessToken, buffer }) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error('LinkedIn rejected the video upload.');
  }
}

async function createPost({ accessToken, authorUrn, asset, title, description }) {
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: description || title || '' },
          shareMediaCategory: 'VIDEO',
          media: [
            {
              status: 'READY',
              description: { text: description || '' },
              media: asset,
              title: { text: (title || 'Video').slice(0, 200) },
            },
          ],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'LinkedIn rejected the post.');
  }
  const postId = res.headers.get('x-restli-id') || data.id;
  return postId;
}

export async function postVideoToLinkedIn({ accessToken, authorUrn, buffer, title, description }) {
  if (!accessToken || !authorUrn) {
    throw new Error('LinkedIn needs an access token and an author URN (urn:li:person:...).');
  }

  const { uploadUrl, asset } = await registerUpload({ accessToken, authorUrn });
  await uploadBytes({ uploadUrl, accessToken, buffer });
  const postId = await createPost({ accessToken, authorUrn, asset, title, description });

  return {
    url: postId ? `https://www.linkedin.com/feed/update/${postId}` : null,
    postId,
  };
}
