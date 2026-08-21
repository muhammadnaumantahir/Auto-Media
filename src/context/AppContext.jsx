import { createContext,useContext,useEffect,useState } from 'react';
import { onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { watchUsers,syncUserToFirebase,syncFirebaseToLocal } from '../lib/firestore';
const AppContext=createContext(null);
export function AppProvider({children}){const [users,setUsers]=useState([]),[loadingUsers,setLoadingUsers]=useState(true),[watcherError,setWatcherError]=useState(null),[authUser,setAuthUser]=useState(null),[syncing,setSyncing]=useState(false);const [activeUserId,setActiveUserId]=useState(()=>localStorage.getItem('automedia:activeUserId')||null);
useEffect(()=>{const u=watchUsers((list,err)=>{if(err){setWatcherError(err);setLoadingUsers(false);return}setUsers(list||[]);setWatcherError(null);setLoadingUsers(false)});return u},[]);
useEffect(()=>onAuthStateChanged(auth,setAuthUser),[]);
useEffect(()=>{activeUserId?localStorage.setItem('automedia:activeUserId',activeUserId):localStorage.removeItem('automedia:activeUserId')},[activeUserId]);
useEffect(()=>{if(!loadingUsers&&users.length&&!users.some(u=>u.id===activeUserId))setActiveUserId(users[0].id);if(!loadingUsers&&!users.length)setActiveUserId(null)},[users,activeUserId,loadingUsers]);
const activeUser=users.find(u=>u.id===activeUserId)||null;
async function loginWithGoogle(){setWatcherError(null);try{const result=await signInWithPopup(auth,new GoogleAuthProvider());setAuthUser(result.user);setSyncing(true);try{await syncFirebaseToLocal(result.user.uid);const latest=await (await import('../lib/firestore')).getUsers();for(const u of latest)await syncUserToFirebase(u,result.user.uid)}finally{setSyncing(false)}}catch(err){setWatcherError(err);return null}}
async function syncNow(){if(!authUser){const err=new Error('Sign in with Google first.');setWatcherError(err);return null;}setSyncing(true);try{for(const u of users)await syncUserToFirebase(u,authUser.uid)}finally{setSyncing(false)}}
return <AppContext.Provider value={{users,loadingUsers,activeUserId,setActiveUserId,activeUser,watcherError,authUser,loginWithGoogle,logout:()=>signOut(auth),syncNow,syncing,clearWatcherError:()=>setWatcherError(null)}}>{children}</AppContext.Provider>}
export function useApp(){const c=useContext(AppContext);if(!c)throw new Error('useApp must be used within AppProvider');return c}
