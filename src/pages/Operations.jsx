import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { exportBackup, importBackup, syncProjectToFirebase, syncProjectFromFirebase } from "../lib/firestore";
import SchedulerPanel from "../components/SchedulerPanel";
import { getSchedulerStatus, configureScheduler } from "../lib/serverApi";
import { useToast } from "../context/ToastContext";

export default function Operations(){
 const {activeUser,authUser}=useApp(); const toast=useToast(); const input=useRef(null); const [busy,setBusy]=useState(false);
 async function backup(){
  try{const scheduler=await getSchedulerStatus().catch(()=>null);const payload=exportBackup({scheduler});const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=`auto-media-full-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(u);toast.success("Full backup exported, including connector configuration/secrets.");}catch(e){toast.error(e.message)}
 }
 async function restore(e){
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  try{const p=JSON.parse(await file.text());if(p.app!=="auto-media")throw new Error("Not an Auto-Media backup.");if(!window.confirm("This is a FULL backup. It contains connector secrets. Replace current local project data?"))return;const users=importBackup(p,{mode:"replace"});
      if(p.scheduler?.payload?.sheet && (p.scheduler.enabled || p.scheduler.payload)) {
        await configureScheduler({
          enabled:!!p.scheduler.enabled,
          intervalMinutes:p.scheduler.intervalMinutes||30,
          batchSize:p.scheduler.batchSize||"1",
          userId:p.scheduler.userId||users[0]?.id||null,
          payload:p.scheduler.payload
        });
      }
      toast.success(`Restored ${users.length} user(s), connectors, platform apps and scheduler state.`);}catch(err){toast.error(err.message)}
 }
 async function sync(){
  if(!authUser) return toast.error("Sign in with Google first.");
  if(!activeUser) return toast.error("Create/select a user first.");
  if(!window.confirm("Full Firebase Sync will upload users, connectors, credentials/secrets, queue, videos, results and settings. Continue?"))return;
  setBusy(true);try{const scheduler=await getSchedulerStatus().catch(()=>null);await syncProjectToFirebase(authUser.uid,{scheduler,reason:"manual-full-sync"});toast.success("Full project synced to Firebase.");}catch(e){toast.error(e.message)}finally{setBusy(false)}
 }
 async function restoreCloud(){
  if(!authUser)return toast.error("Sign in with Google first.");
  setBusy(true);try{const x=await syncProjectFromFirebase(authUser.uid);toast.success(`Restored ${x.users.length} user(s) from Firebase.`)}catch(e){toast.error(e.message)}finally{setBusy(false)}
 }
 return <div className="max-w-5xl"><header className="mb-6"><p className="label">OPERATIONS · PHASE 1</p><h1 className="font-display text-3xl font-semibold">Scheduler & full project storage</h1><p className="text-muted text-sm mt-2">One complete backup mode and one complete Firebase synchronization mode. No safe/partial mode.</p></header>
 <div className="grid md:grid-cols-2 gap-4">
  <section className="card p-5"><p className="label">FULL JSON BACKUP</p><h2 className="font-semibold mt-1">Everything in one file</h2><p className="text-muted text-xs mt-2">Users, connectors, credentials/secrets, Sheet configuration, video queue, platform results, settings, scheduler state and history.</p><div className="flex gap-2 mt-4"><button className="btn-primary text-xs" onClick={backup}>Export full JSON</button><button className="btn-ghost text-xs" onClick={()=>input.current?.click()}>Import full JSON</button><input ref={input} hidden type="file" accept=".json,application/json" onChange={restore}/></div></section>
  <section className="card p-5"><p className="label">FULL FIREBASE SYNC</p><h2 className="font-semibold mt-1">Complete project cloud state</h2><p className="text-muted text-xs mt-2">Syncs users, connectors and their configuration/secrets, videos, queue, platform results, settings and scheduler information.</p><div className="flex flex-wrap gap-2 mt-4"><button className="btn-primary text-xs" disabled={busy} onClick={sync}>{busy?"Syncing…":"Sync everything to Firebase"}</button><button className="btn-ghost text-xs" disabled={busy} onClick={restoreCloud}>Restore from Firebase</button></div></section>
 </div>
 <div className="mt-2 rounded-xl border border-rose/20 bg-rose/5 p-4 text-xs text-rose">Full mode intentionally includes secrets because this project requires complete export/synchronization. Treat JSON backups and Firebase data as sensitive.</div>
 <SchedulerPanel/>
 </div>
}
