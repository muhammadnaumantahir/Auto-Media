import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { watchSheetConfig, watchConnectors } from "../lib/firestore";
import { getPlatformApp } from "../lib/platformApps";
import { configureScheduler, getSchedulerStatus, runSchedulerNow, clearSchedulerHistory } from "../lib/serverApi";
import { useToast } from "../context/ToastContext";

const batches = [["1","1 video"],["5","5 videos"],["10","10 videos"],["all","All ready"]];

export default function SchedulerPanel() {
  const { activeUser } = useApp();
  const toast = useToast();
  const [sheet,setSheet]=useState(null),[connectors,setConnectors]=useState([]);
  const [status,setStatus]=useState(null),[enabled,setEnabled]=useState(false);
  const [intervalMinutes,setIntervalMinutes]=useState(30),[batchSize,setBatchSize]=useState("1");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if(!activeUser) return;
    const a=watchSheetConfig(activeUser.id,setSheet), b=watchConnectors(activeUser.id,setConnectors);
    getSchedulerStatus().then(x=>{
      setStatus(x); if(x.userId===activeUser.id){setEnabled(!!x.enabled);setIntervalMinutes(x.intervalMinutes||30);setBatchSize(x.batchSize||"1")}
    }).catch(()=>{});
    const t=setInterval(()=>getSchedulerStatus().then(setStatus).catch(()=>{}),5000);
    return ()=>{a();b();clearInterval(t)};
  },[activeUser]);

  const payload=useMemo(()=>({
    sheet, connectors,
    app:{youtube:getPlatformApp("youtube")},
    batchSize
  }),[sheet,connectors,batchSize]);

  async function save(nextEnabled=enabled){
    if(nextEnabled && (!sheet?.sheetUrl||!sheet?.tabName)) { toast.error("Connect a Google Sheet first."); return; }
    setBusy(true);
    try {
      const x=await configureScheduler({enabled:nextEnabled,intervalMinutes,batchSize,userId:activeUser.id,payload});
      setStatus(x);setEnabled(nextEnabled);
      toast.success(nextEnabled?"Automatic scheduler enabled.":"Scheduler disabled.");
    } catch(e){toast.error(e.message)} finally{setBusy(false)}
  }

  async function runNow(){
    if(!sheet?.sheetUrl) return toast.error("Connect a Google Sheet first.");
    setBusy(true);
    try {
      const x=await runSchedulerNow({payload,batchSize});
      setStatus(x.scheduler||x);
      toast.success(`Run finished: ${x.processed||0} video(s) processed.`);
    } catch(e){toast.error(e.message)} finally{setBusy(false)}
  }

  async function clearHistory(){
    if(!window.confirm("Clear scheduler history?")) return;
    try{setStatus(await clearSchedulerHistory());toast.success("Scheduler history cleared.")}catch(e){toast.error(e.message)}
  }

  if(!activeUser) return null;
  return <section className="card p-6 mt-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="label">PHASE 1 · SCHEDULER</p>
        <h2 className="font-display text-xl font-semibold">Automatic publishing</h2>
        <p className="text-muted text-xs mt-1">The local Node server owns the timer. The browser does not need to stay open, but your PC and Auto-Media server must be running.</p>
      </div>
      <span className={`badge ${enabled?"text-teal border-teal/40":"text-muted"}`}>{enabled?"● ON":"○ OFF"}</span>
    </div>

    <div className="grid sm:grid-cols-3 gap-4 mt-6">
      <div><span className="label">Run every</span><input className="input" type="number" min="1" value={intervalMinutes} onChange={e=>setIntervalMinutes(e.target.value)}/><p className="text-[11px] text-muted mt-1">minutes</p></div>
      <div><span className="label">Batch size</span><div className="flex flex-wrap gap-1.5 mt-1">{batches.map(([v,l])=><button key={v} className={batchSize===v?"btn-primary text-xs":"btn-ghost text-xs"} onClick={()=>setBatchSize(v)}>{l}</button>)}</div></div>
      <div><span className="label">Actions</span><div className="flex flex-wrap gap-2 mt-1"><button className="btn-primary text-xs" disabled={busy} onClick={runNow}>{busy?"Working…":"Run now"}</button><button className="btn-ghost text-xs" disabled={busy} onClick={()=>save(!enabled)}>{enabled?"Disable":"Enable"}</button></div></div>
    </div>

    <div className="grid sm:grid-cols-4 gap-3 mt-6">
      <div className="rounded-xl border border-border p-3"><p className="label">Last run</p><p className="text-xs font-mono mt-1">{status?.lastRunAt?new Date(status.lastRunAt).toLocaleString():"—"}</p></div>
      <div className="rounded-xl border border-border p-3"><p className="label">Next run</p><p className="text-xs font-mono mt-1">{status?.nextRunAt?new Date(status.nextRunAt).toLocaleString():"—"}</p></div>
      <div className="rounded-xl border border-border p-3"><p className="label">Successful</p><p className="text-lg text-teal mt-1">{status?.successCount||0}</p></div>
      <div className="rounded-xl border border-border p-3"><p className="label">Failed</p><p className="text-lg text-rose mt-1">{status?.failureCount||0}</p></div>
    </div>

    <div className="mt-6 flex items-center justify-between gap-3"><p className="label">Run history</p><button className="btn-ghost text-xs" onClick={clearHistory}>Clear history</button></div>
    <div className="grid gap-2 mt-2 max-h-72 overflow-y-auto">
      {(status?.history||[]).slice().reverse().map(h=><div key={h.id} className="rounded-xl border border-border p-3 text-xs flex justify-between gap-4"><span><b>{h.processed||0}</b> video(s) · <span className="text-teal">{h.successful||0} success</span> · <span className="text-rose">{h.failed||0} failed</span></span><span className="text-muted font-mono">{h.finishedAt?new Date(h.finishedAt).toLocaleString():"—"}</span></div>)}
      {!status?.history?.length&&<p className="text-xs text-muted">No scheduler runs yet.</p>}
    </div>

    <div className="mt-5 rounded-xl border border-amber/20 bg-amber/5 p-3 text-[11px] text-amber">
      Scheduler uses the configured connector data, including credentials, to publish locally. The scheduler state is stored in <code>.automedia/scheduler.json</code>. Keep this local file private.
    </div>
  </section>
}
