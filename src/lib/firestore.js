import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const KEY='automedia_data_v1';
const event='automedia:data-changed';
const now=()=>new Date().toISOString();
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{"users":[]}');return {users:Array.isArray(x.users)?x.users:[]}}catch{return {users:[]}}}
function write(data){localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new Event(event));}
export async function getUsers(){return read().users}
export function watchUsers(callback){const emit=()=>callback(read().users,null);emit();window.addEventListener(event,emit);window.addEventListener('storage',emit);return()=>{window.removeEventListener(event,emit);window.removeEventListener('storage',emit)}}
export async function createUser({name,email}){const data=read(), normalized=email.trim().toLowerCase();const found=data.users.find(u=>u.email===normalized);if(found)return {...found,exists:true};const user={id:crypto.randomUUID(),name:name.trim(),email:normalized,createdAt:now(),sheet:{},sheetConnected:false,enabledPlatforms:[],connectors:{},connectorsCount:0,settings:{}};data.users.unshift(user);write(data);return user}
export async function updateUser(id,patch){const data=read();const i=data.users.findIndex(u=>u.id===id);if(i<0)throw new Error('User not found');data.users[i]={...data.users[i],...patch,updatedAt:now()};write(data);return data.users[i]}
export async function deleteUser(id){const data=read();data.users=data.users.filter(u=>u.id!==id);write(data)}
export async function setEnabledPlatforms(id,enabledPlatforms){return updateUser(id,{enabledPlatforms})}
export async function saveSheetConfig(id,sheet){return updateUser(id,{sheet,sheetConnected:!!sheet})}
export function watchSheetConfig(id,callback){return watchUsers(users=>callback(users.find(u=>u.id===id)?.sheet||null))}
export async function saveConnector(id,platform,fields){const u=(await getUsers()).find(x=>x.id===id);if(!u)throw new Error('User not found');const connectors={...(u.connectors||{}),[platform]:{platform,status:'connected',updatedAt:now(),...fields}};const enabledPlatforms=[...new Set([...(u.enabledPlatforms||[]),platform])];return updateUser(id,{connectors,enabledPlatforms,connectorsCount:Object.keys(connectors).length})}
export async function removeConnector(id,platform){const u=(await getUsers()).find(x=>x.id===id),connectors={...(u?.connectors||{})};delete connectors[platform];return updateUser(id,{connectors,enabledPlatforms:(u?.enabledPlatforms||[]).filter(x=>x!==platform),connectorsCount:Object.keys(connectors).length})}
export function watchConnectors(id,callback){return watchUsers(users=>{const u=users.find(x=>x.id===id);callback(Object.entries(u?.connectors||{}).map(([id,x])=>({id,...x})))})}
export async function syncUserToFirebase(user,uid){if(!db)throw new Error('Firebase is not configured.');await setDoc(doc(db,'cloudUsers',uid,'profiles',user.id),{...user,localUserId:user.id,syncedAt:now()},{merge:true})}
export async function syncFirebaseToLocal(uid){if(!db)throw new Error('Firebase is not configured.');const snap=await getDocs(collection(db,'cloudUsers',uid,'profiles'));const data=read();for(const d of snap.docs){const cloud=d.data();const i=data.users.findIndex(u=>u.email===cloud.email);if(i>=0)data.users[i]={...data.users[i],...cloud,id:data.users[i].id};else data.users.push({...cloud,id:cloud.localUserId||crypto.randomUUID()})}write(data);return data.users}
export async function saveQueue(id,queue){return updateUser(id,{contentQueue:queue})}
export async function addQueueItem(id,item){const u=(await getUsers()).find(x=>x.id===id);const queue=[...(u?.contentQueue||[]),{id:crypto.randomUUID(),status:'draft',createdAt:now(),platformStatus:{},...item}];return updateUser(id,{contentQueue:queue})}
export async function updateQueueItem(id,itemId,patch){const u=(await getUsers()).find(x=>x.id===id);return updateUser(id,{contentQueue:(u?.contentQueue||[]).map(x=>x.id===itemId?{...x,...patch,updatedAt:now()}:x)})}
