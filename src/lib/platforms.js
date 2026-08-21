const creds = [
  { key: 'clientId', label: 'Client ID / App ID', placeholder: 'Enter your app client ID' },
  { key: 'accessToken', label: 'Access token', placeholder: 'OAuth access token', secret: true },
];

// YouTube needs a refresh token (not a short-lived access token) so posting
// keeps working unattended, plus the channel ID to know which channel to
// upload to. This must match what the YouTube setup guide tells people to
// paste in (src/lib/guides.js).
const youtubeCreds = [
  { key: 'clientId', label: 'Client ID', placeholder: 'From Google Cloud → Credentials' },
  { key: 'clientSecret', label: 'Client secret', placeholder: 'From Google Cloud → Credentials', secret: true },
  { key: 'refreshToken', label: 'Refresh token', placeholder: 'From OAuth Playground, step 2', secret: true },
  { key: 'channelId', label: 'Channel ID', placeholder: 'From YouTube Studio → Settings → Channel' },
];

const fieldsFor = (id) => (id === 'youtube' ? youtubeCreds : creds);

export const PLATFORMS=[
['youtube','YouTube','YT','Video & Short Form','Videos and Shorts'],['tiktok','TikTok','TT','Video & Short Form','Videos and short clips'],['instagram','Instagram','IG','Video & Short Form','Reels and video'],['facebook','Facebook','FB','Video & Short Form','Page videos and Reels'],['snapchat','Snapchat','SC','Video & Short Form','Short video distribution'],['pinterest','Pinterest','PI','Video & Short Form','Video Pins'],['threads','Threads','TH','Social & Professional','Video and text posts'],['linkedin','LinkedIn','IN','Social & Professional','Professional video posts'],['x','X','X','Social & Professional','Video posts'],['bluesky','Bluesky','BS','Social & Professional','Social distribution'],['reddit','Reddit','RD','Community & Distribution','Community video posts'],['telegram','Telegram','TG','Community & Distribution','Channel distribution'],['discord','Discord','DC','Community & Distribution','Community distribution'],['google-business','Google Business','GB','Community & Distribution','Business content'],['mastodon','Mastodon','MA','Community & Distribution','Federated publishing']
].map(([id,name,short,category,description])=>({id,name,short,category,description,fields:fieldsFor(id),requirements:id==='youtube'?['OAuth consent screen','YouTube Data API','videos.insert permission']:id==='tiktok'?['Registered developer app','Content Posting API','video.publish authorization']:['Developer app or authorized account','OAuth/API permission','Valid publishing access']}));
export const PLATFORM_FIELDS={youtube:['title','description','tags','video','thumbnail','schedule'],tiktok:['caption','tags','video','schedule'],pinterest:['title','description','video','thumbnail','destinationUrl','schedule'],default:['title','description','tags','video','thumbnail','schedule']};
