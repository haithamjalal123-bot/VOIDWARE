/* VOIDWARE V19.1 • PEAQ 8GB FPS OPTIMIZER • STUDIO UI • 15 NEW TOOLS • 200 NEW POWERS • PRESERVES V13.1 PARADOX AND +15 ABILITIES + ADVANCED WEAPON FUSION + ALL LEGACY FEATURES - 100 new powers across 10 labs, plus Rocket Recoil, Omega and legacy features | Clutcher.io LOCAL BOT LAB | 2026-10-17
   Paste this entire file once into DevTools Console while in a bot match.
   U = menu, V14 tabs in top navigation, P = Rage tab, Q = Mega Rage, I = bot wipe, V = wallbang, End = emergency off.
   All feature/action hotkeys can be reassigned in the HOTKEYS tab.
   Client-side local bot lab only. No remote downloads or eval. V8.3 adds customizable local kill sounds and third-person model presets; keeps previous features.
   Run deathWon.remove() to restore modifications.
*/
(() => {
  'use strict';
  const g = window.game;
  if (!g?.player || !g?.botMgr?.bots || !g?.weapons || !g?.fireBullet || !g?.killEntity || !g?.hud?.addKill) {
    console.warn('[VOIDWARE] Enter a running Clutcher bot match, then paste again.');
    return;
  }
  for (const cleanup of [() => window.deathWon?.remove?.(), () => window.clutcherMenu?.destroy?.(),
    () => window.clutcherRage?.remove?.(), () => window.clWallbang?.remove?.()]) {
    try { cleanup(); } catch(e) { console.warn('[VOIDWARE] Older add-on cleanup:', e); }
  }
  if (window.botKillHotkey) {
    window.removeEventListener('keydown', window.botKillHotkey);
    delete window.botKillHotkey;
  }
  // V18.9 | LOCAL client-side game clock control. Installed only on first enable.
  // RAF timestamps + performance.now() share one continuously rebased virtual timeline.
  // Never patch Date.now(), audio clocks or networking; those stay native.
  const nativeGameRAF=window.requestAnimationFrame.bind(window);
  const nativeGamePerfNow=performance.now.bind(performance);
  const originalRAF=window.requestAnimationFrame;
  const ownPerfNowDescriptor=Object.getOwnPropertyDescriptor(performance,'now');
  const gameClockKey='voidwareV18_9_timeControl';
  const gameClockState={installed:false,perfHook:false,rafHook:false,rafCallbacks:0,perfReads:0,lastCallbackReal:null,lastCallbackVirtual:null,errors:[],requestedRate:1};
  let gameClockRate=1,gameClockRealAnchor=nativeGamePerfNow(),gameClockVirtualAnchor=gameClockRealAnchor;
  try{
    const saved=JSON.parse(localStorage.getItem(gameClockKey)||'{}');
    if(Number.isFinite(+saved.rate))gameClockRate=Math.min(1000,Math.max(.0001,+saved.rate));
  }catch{}
  const gameClockSave=()=>{try{localStorage.setItem(gameClockKey,JSON.stringify({rate:gameClockRate}))}catch{}};
  function gameClockNow(){
    gameClockState.perfReads++;
    return gameClockVirtualAnchor+(nativeGamePerfNow()-gameClockRealAnchor)*gameClockState.requestedRate;
  }
  function gameClockSetRate(rate){
    const real=nativeGamePerfNow();
    const next=Math.min(1000,Math.max(.0001,Number(rate)||1));
    // A frame waiting during 1000× should not produce an enormous final
    // fast-time step after switching to 1×. Apply the new rate to the
    // unfinished frame interval; preserve the timestamp of the last frame.
    if(gameClockState.lastCallbackReal!==null){
      gameClockVirtualAnchor=gameClockState.lastCallbackVirtual+
        Math.max(0,real-gameClockState.lastCallbackReal)*next;
    }else{
      gameClockVirtualAnchor+=(real-gameClockRealAnchor)*next;
    }
    gameClockRealAnchor=real;
    gameClockState.requestedRate=next;
  }
  function gameClockInstall(){
    if(gameClockState.installed)return true;
    gameClockRealAnchor=nativeGamePerfNow();gameClockVirtualAnchor=gameClockRealAnchor;
    try{
      Object.defineProperty(performance,'now',{configurable:true,writable:true,value:gameClockNow});
      gameClockState.perfHook=performance.now===gameClockNow;
    }catch(e){gameClockState.errors.push('performance.now: '+e.message)}
    try{
      window.requestAnimationFrame=function voidwareTimeRaf(callback){
        if(typeof callback!=='function')return nativeGameRAF(callback);
        return nativeGameRAF(function(){gameClockState.rafCallbacks++;const real=nativeGamePerfNow(),virtual=gameClockNow();gameClockState.lastCallbackReal=real;gameClockState.lastCallbackVirtual=virtual;callback(virtual)});
      };
      gameClockState.rafHook=true;
    }catch(e){gameClockState.errors.push('requestAnimationFrame: '+e.message)}
    gameClockState.installed=gameClockState.perfHook||gameClockState.rafHook;
    if(!gameClockState.installed){
      try{if(ownPerfNowDescriptor)Object.defineProperty(performance,'now',ownPerfNowDescriptor);else delete performance.now}catch{}
      window.requestAnimationFrame=originalRAF;
    }
    return gameClockState.installed;
  }
  function gameClockSet(value,enable=true){
    const n=Number(value);
    if(!Number.isFinite(n))return false;
    gameClockRate=Math.min(1000,Math.max(.0001,n));gameClockSave();
    if(enable){if(!gameClockInstall())return false;flags.gameSpeedHack=true;}
    gameClockSetRate(flags.gameSpeedHack?gameClockRate:1);
    return true;
  }
  function gameClockReset(){flags.gameSpeedHack=false;gameClockSetRate(1);}
  function gameClockRestore(){
    gameClockReset();
    // Native timer restoration can cause a one-frame jump after heavy slowdown.
    // A browser refresh fully reinitializes the original game clock.
    if(gameClockState.rafHook&&window.requestAnimationFrame!==originalRAF)window.requestAnimationFrame=originalRAF;
    if(gameClockState.perfHook){
      try{if(ownPerfNowDescriptor)Object.defineProperty(performance,'now',ownPerfNowDescriptor);else delete performance.now}catch(e){console.warn('[VOIDWARE] Restore clock:',e)}
    }
    gameClockState.installed=false;gameClockState.perfHook=false;gameClockState.rafHook=false;
  }
  function gameClockFormat(rate){return Number(Number(rate).toPrecision(5)).toString()+'×';}
  function gameClockRenderControls(){
    section('⏱ GAME SPEED · WORLD CLOCK','GD-style local game-time scale. Below 1× is slow motion, above 1× fast-forward. Extreme rates can break physics or be capped by the game.');
    const row=grid();tile(row,'⏱ World Speed Hack','Scale the browser game clock; separate from player Movement Speed.',null,'gameSpeedHack');
    const box=document.createElement('div');box.className='dw-range';
    const title=document.createElement('div');title.className='dw-name';title.textContent='Game speed (logarithmic)';
    const display=document.createElement('b');display.style.cssText='float:right;color:#bd91ff';display.textContent=gameClockFormat(gameClockRate);title.append(display);
    const range=document.createElement('input');range.type='range';range.min='-4';range.max='3';range.step='.01';range.value=Math.log10(gameClockRate);
    range.setAttribute('aria-label','Game speed logarithmic slider');
    const numeric=document.createElement('input');numeric.type='number';numeric.min='.0001';numeric.max='1000';numeric.step='any';numeric.value=String(gameClockRate);
    numeric.style.cssText='width:100%;margin-top:8px';numeric.setAttribute('aria-label','Exact game speed');
    const set=v=>{if(gameClockSet(v)){range.value=String(Math.log10(gameClockRate));numeric.value=String(gameClockRate);display.textContent=gameClockFormat(gameClockRate);}else{numeric.value=String(gameClockRate);notice('Game clock hook unavailable');}};
    range.addEventListener('input',()=>set(Math.pow(10,Number(range.value))));
    numeric.addEventListener('change',()=>set(numeric.value));
    numeric.addEventListener('keydown',e=>{if(e.key==='Enter'){set(numeric.value);numeric.blur();}});
    box.append(title,range,numeric);content.append(box);
    const presets=grid();
    for(const [label,value] of [['0.0001×',.0001],['0.01×',.01],['0.1×',.1],['0.5×',.5],['1× NORMAL',1],['2×',2],['10×',10],['100×',100],['1000×',1000]]){
      tile(presets,label,'Set local game clock to '+label,()=>{if(value===1){gameClockReset();gameClockRate=1;gameClockSave();renderTab()}else{set(value);renderTab()}});
    }
    const reset=grid();tile(reset,'↺ Restore Normal Time','Reset to 1× instantly. Removes the speed modifier without jumping the clock.',()=>{gameClockReset();gameClockRate=1;gameClockSave();renderTab()});
    const hint=document.createElement('p');hint.className='dw-desc';
    hint.textContent='Local match only: engine time, physics and timers when they use RAF/performance.now. Browser tabs, server time, audio and CSS animations are not guaranteed to scale. 1000× may destabilize the game. Refresh if the game freezes.';
    content.append(hint);
  }
  const flags = { wallbang: false, wallIcon: true, silent: false, autoShoot: false, triggerbot: false, legitAim: false, fastFire: false, fly: false, chams: false, glow: false, spin: false, third: false,
    noRecoil: false, noSpread: false, infinity: false, god: false, autoBhop: false, autoStrafe: false,
    gameSpeedHack:false, fpsBooster:false, freeze: false, esp: false, espTracers: true, espHealth: true, espSkeleton: false, showCrosshair: false, flyNoclip: false, speedHud: true,
    // V6 additions — all exposed in the hotkeys tab
    megaRage:false, rage360:false, rageSticky:false, rageLead:false, rageHead:false,
    autoReload:false, autoScope:false, legitSticky:false, legitVisible:true, legitDeadzone:true,
    aimFovRing:false, triggerBurst:false, quickStop:false, sprintBoost:false, moonJump:false,
    radar:false, radarElevation:true, radarAimPulse:true, aimBodyGlow:false, radarRequireLOS:false, enemyArrows:false, targetHUD:false, killHUD:false, hitmarkers:false,
    peacefulBots:false, botSpin:false, aimTargetLine:false, espTeam:false, botNames:true,
    // V7: ten independently bindable EXTRA powers
    botMagnet:false, botRepulse:false, botOrbit:false, criticalHeal:false,
    armorRegen:false, ammoRegen:false, slowBots:false,
    // V8: Wall-lock and 9 independently bindable simulation powers
    legitWallLock:false, killAura:false, teamGuardian:false, silenceAura:false,
    blindAura:false, bounceAura:false, glassBots:false, vampire:false, enemyConfuse:false,
    disarmAura:false, killSound:false, flickPrecision:true, rocketRecoil:false };

  // V19.0 | FULL-QUALITY FPS BOOSTER
  // Preserve renderer pixel ratio, materials, textures, shadows and game logic.
  // Only allow Three.js's *native* frustum skip on small opaque static meshes
  // that previously had it explicitly disabled. Skip models, HUDs and effects.
  // Slow only VOIDWARE's optional 2D overlay—not the real game renderer.
  const fpsBoosterKey='voidwareV19_fps_booster';
  const fpsBoosterCfg={offscreenCulling:true,overlayHz:30,adaptiveOverlay:true,lightweightMenu:true,scanEveryMs:20000};
  try{
    const saved=JSON.parse(localStorage.getItem(fpsBoosterKey)||'{}');
    if(typeof saved.offscreenCulling==='boolean')fpsBoosterCfg.offscreenCulling=saved.offscreenCulling;
    if(Number.isFinite(+saved.overlayHz))fpsBoosterCfg.overlayHz=Math.max(15,Math.min(120,+saved.overlayHz));
    if(typeof saved.adaptiveOverlay==='boolean')fpsBoosterCfg.adaptiveOverlay=saved.adaptiveOverlay;
    if(typeof saved.lightweightMenu==='boolean')fpsBoosterCfg.lightweightMenu=saved.lightweightMenu;
  }catch{}
  const fpsBoosterSave=()=>{try{localStorage.setItem(fpsBoosterKey,JSON.stringify(fpsBoosterCfg))}catch{}};
  const fpsBoosterState={
    frames:0,lastFpsAt:nativeGamePerfNow(),realFps:0,lastScan:0,lastUiUpdate:-Infinity,
    scannedMeshes:0,optimizedMeshes:new Map(),overlayDraws:0,overlaySkipped:0,
    lastOverlayAt:-Infinity,blankedOverlay:false,error:'',currentOverlayHz:30
  };
  function fpsBoosterRestoreCulling(){
    for(const [node,original] of fpsBoosterState.optimizedMeshes){
      try{if(node.frustumCulled===true)node.frustumCulled=original}catch{}
    }
    fpsBoosterState.optimizedMeshes.clear();
    fpsBoosterState.scannedMeshes=0;
  }
  function fpsBoosterCullScan(realNow=nativeGamePerfNow()){
    if(!flags.fpsBooster||!fpsBoosterCfg.offscreenCulling||!g.scene?.traverse)return;
    if(realNow-fpsBoosterState.lastScan<fpsBoosterCfg.scanEveryMs)return;
    fpsBoosterState.lastScan=realNow;
    let scanned=0;
    try{
      g.scene.traverse(node=>{
        // Never change skins, animated players, chams, transparency, large surfaces,
        // special effects, sprites or viewmodels.
        if(!node?.isMesh||node.isSkinnedMesh||node.isInstancedMesh||
           !node.visible||node.frustumCulled!==false||node.renderOrder>0)return;
        if(++scanned>5000)return;
        const sphere=node.geometry?.boundingSphere;
        if(!sphere||!Number.isFinite(sphere.radius)||sphere.radius<=0||sphere.radius>12)return;
        const m=node.material;
        if(!m||Array.isArray(m)||m.transparent||m.depthTest===false||
           m.side===2||m.alphaTest>0||m.isShaderMaterial||m.isRawShaderMaterial)return;
        let parent=node.parent,animated=false;
        for(let depth=0;parent&&depth<8;parent=parent.parent,depth++){
          if(parent.isSkinnedMesh||parent.userData?.animation||parent.userData?.noCulling){
            animated=true;break;
          }
        }
        if(animated)return;
        fpsBoosterState.optimizedMeshes.set(node,false);
        node.frustumCulled=true; // The engine now skips this object only when off screen.
      });
      fpsBoosterState.scannedMeshes=scanned;
    }catch(e){fpsBoosterState.error=String(e?.message||e);fpsBoosterRestoreCulling();}
  }
  function fpsBoosterEnable(on){
    if(!on){
      fpsBoosterRestoreCulling();fpsBoosterState.lastOverlayAt=-Infinity;
      fpsBoosterState.blankedOverlay=false;return;
    }
    if(flags.fpsBoost){
      flags.fpsBoost=false;odRestoreFps(); // Never combine with old low-resolution FPS boost.
    }
    fpsBoosterState.lastScan=-Infinity;
    fpsBoosterCullScan();
  }
  function fpsBoosterTick(){
    const t=nativeGamePerfNow(); // Immune to V18.9 game speed's modified clock.
    fpsBoosterState.frames++;
    const elapsed=t-fpsBoosterState.lastFpsAt;
    if(elapsed>=1000){
      fpsBoosterState.realFps=Math.round(fpsBoosterState.frames*1000/elapsed);
      fpsBoosterState.frames=0;fpsBoosterState.lastFpsAt=t;
    }
    if(flags.fpsBooster)fpsBoosterCullScan(t);
    // Desktop DOM updates are surprisingly expensive on 8GB integrated GPUs.
    // Refresh dashboard stats twice a second, not 40–100 times per second.
    if(activeTab==='fps:lab'&&panel.style.display!=='none'&&t-fpsBoosterState.lastUiUpdate>=500){
      fpsBoosterState.lastUiUpdate=t;
      const e=content.querySelector('#dw-fps-native');
      if(e)e.textContent=String(fpsBoosterState.realFps);
      const c=content.querySelector('#dw-fps-cull');
      if(c)c.textContent=String(fpsBoosterState.optimizedMeshes.size);
      const info=content.querySelector('#dw-fps-overlay');
      if(info)info.textContent=String(fpsBoosterState.overlayDraws);
      const hz=content.querySelector('#dw-fps-effective-hz');
      if(hz)hz.textContent=String(fpsBoosterState.currentOverlayHz);
    }
  }
  function fpsBoosterAllowOverlay(){
    if(!flags.fpsBooster)return true;
    const t=nativeGamePerfNow();
    // Smooth HUD remains on screen between redraws; 3D renderer runs normally.
    // At lower FPS spend less CPU on expensive canvas redraws.
    const measured=fpsBoosterState.realFps;
    const hasAimSensitiveOverlay=flags.aimBodyGlow||flags.aimTargetLine||flags.hitmarkers;
    const smartCap=!fpsBoosterCfg.adaptiveOverlay?fpsBoosterCfg.overlayHz:
      measured>0&&measured<46?(hasAimSensitiveOverlay?40:24):
      measured>0&&measured<65?(hasAimSensitiveOverlay?45:30):
      measured>100?60:45;
    const refreshHz=Math.max(15,Math.min(fpsBoosterCfg.overlayHz,smartCap));
    fpsBoosterState.currentOverlayHz=refreshHz;
    if(t-fpsBoosterState.lastOverlayAt<1000/refreshHz){
      fpsBoosterState.overlaySkipped++;return false;
    }
    fpsBoosterState.lastOverlayAt=t;fpsBoosterState.overlayDraws++;return true;
  }
  function fpsBoosterRender(){
    section('⚡ FULL QUALITY · FPS BOOSTER',
      'Optimize invisible objects and optional overlay work without reducing texture resolution, render scale or lighting. 100+ FPS depends on hardware and the browser.');
    const cards=grid();
    tile(cards,'⚡ ENABLE FULL QUALITY BOOST','Enable conservative off-screen frustum culling and limit unnecessary VOIDWARE overlay redraws.',null,'fpsBooster');
    tile(cards,'↺ RESTORE DEFAULT','Turn off the optimizer and restore all originally changed mesh culling flags.',()=>{
      flags.fpsBooster=false;fpsBoosterEnable(false);renderTab()
    });
    section('LIVE PERFORMANCE','Uses the real browser clock, so the game-speed hack cannot fake these numbers.');
    const stats=document.createElement('div');stats.className='dw-grid';
    const statistic=(title,id,value)=>{
      const c=document.createElement('div');c.className='dw-feature-note';
      const l=document.createElement('div');l.textContent=title;l.style.cssText='font-size:12px;color:#a7a8ba';
      const v=document.createElement('strong');v.id=id;v.textContent=String(value);
      v.style.cssText='font-size:24px;color:#b89aff;display:block;margin-top:6px';
      c.append(l,v);stats.append(c);
    };
    statistic('Browser RAF FPS','dw-fps-native',fpsBoosterState.realFps);
    statistic('Safe culling candidates','dw-fps-cull',fpsBoosterState.optimizedMeshes.size);
    statistic('Overlay redraws','dw-fps-overlay',fpsBoosterState.overlayDraws);
    statistic('Effective overlay Hz','dw-fps-effective-hz',fpsBoosterState.currentOverlayHz);
    content.append(stats);
    section('SAFE OPTIMIZATIONS','Nothing here lowers the original 3D resolution or removes visible models.');
    selector('Off-screen frustum culling', [['on','ON · small opaque objects'],['off','OFF · original culling']],
      fpsBoosterCfg.offscreenCulling?'on':'off',v=>{
        fpsBoosterCfg.offscreenCulling=v==='on';fpsBoosterSave();
        if(!fpsBoosterCfg.offscreenCulling)fpsBoosterRestoreCulling();
        else if(flags.fpsBooster){fpsBoosterState.lastScan=-Infinity;fpsBoosterCullScan();}
      });
    selector('Adaptive overlay refresh for PEAQ 8GB', [['on','ON · reduces CPU at low FPS'],['off','OFF · fixed refresh']],
      fpsBoosterCfg.adaptiveOverlay?'on':'off',v=>{
        fpsBoosterCfg.adaptiveOverlay=v==='on';fpsBoosterSave();
      });
    slider('Max VOIDWARE 2D overlay refresh',15,120,5,fpsBoosterCfg.overlayHz,v=>{
      fpsBoosterCfg.overlayHz=v;fpsBoosterSave();
    },' Hz');
    selector('Lightweight background UI', [['on','ON · skip hidden-menu repaint'],['off','OFF · classic updates']],
      fpsBoosterCfg.lightweightMenu?'on':'off',v=>{
        fpsBoosterCfg.lightweightMenu=v==='on';fpsBoosterSave();
      });
    const info=document.createElement('p');info.className='dw-desc';
    info.textContent='Tuned for older 8GB laptops: adaptive 2D overlays, throttled dashboard updates, hidden-menu paint avoidance and less frequent 3D scene scans. Actual 3D graphics resolution, textures and gameplay timing remain unchanged. Gains vary with CPU/GPU bottlenecks.';
    content.append(info);
    const actions=grid();
    tile(actions,'◉ GO TO OLD BOOSTER','Legacy low-resolution booster (separate; lowers graphics quality).',()=>showMenu('performance'));
    tile(actions,'⟳ RESCAN SCENE','Recheck new scene objects for safe off-screen culling.',()=>{fpsBoosterState.lastScan=-Infinity;fpsBoosterCullScan();renderTab()});
  }

  // V16.2: ten independent Rage settings. Nothing changes until enabled.
  const ragePlusDefs=[
    {id:'rageLowHP',name:'Lowest HP Priority',desc:'Acquire enemies with the least remaining health first.'},
    {id:'rageLowArmor',name:'Lowest Armor Priority',desc:'Acquire enemies with the lowest armor first.'},
    {id:'rageFastest',name:'Fast Mover Priority',desc:'Acquire moving enemies by measured horizontal velocity.'},
    {id:'rageMaxRange',name:'Maximum Target Range',desc:'Reject targets beyond the adjustable maximum range.'},
    {id:'rageMinRange',name:'Minimum Target Range',desc:'Ignore enemies inside the adjustable minimum range.'},
    {id:'rageVisOnly',name:'Visible Targets Only',desc:'Prevent Rage auto-fire and selection through solid cover, even with Wallbang enabled.'},
    {id:'rageHoldMouse1',name:'Mouse1 Auto-Fire Gate',desc:'Auto Shoot works only while the fire button is held.'},
    {id:'rageHoldMouse2',name:'Mouse2 Auto-Fire Gate',desc:'Auto Shoot works only while right mouse is held.'},
    {id:'rageBurst3',name:'Three-Shot Burst Limit',desc:'Auto Shoot pauses after three confirmed bullets, then starts a new burst.'},
    {id:'rageEarlyReload',name:'Early Tactical Reload',desc:'Reload before the magazine is empty while in an active match.'}
  ];
  for(const o of ragePlusDefs)flags[o.id]=false;
  const ragePlusStore='voidwareV16_2_rage';
  const ragePlusCfg={maxRange:85,minRange:7,burstCooldownMs:460,reloadAt:3};
  try{const x=JSON.parse(localStorage.getItem(ragePlusStore)||'{}');if(x&&typeof x==='object'){
    for(const key of Object.keys(ragePlusCfg))if(Number.isFinite(Number(x[key])))ragePlusCfg[key]=Number(x[key]);
  }}catch{}
  const ragePlusSave=()=>{try{localStorage.setItem(ragePlusStore,JSON.stringify(ragePlusCfg));}catch{}};
  const ragePlusState={burstTarget:null,burstShots:0,burstUntil:0,lastReloadAt:0,autoFireContext:false};
  function ragePlusReset(){ragePlusState.burstTarget=null;ragePlusState.burstShots=0;ragePlusState.burstUntil=0;ragePlusState.autoFireContext=false;}
  function ragePlusOff(){for(const o of ragePlusDefs)flags[o.id]=false;ragePlusReset();}
  // V18.2 — Unlimited practice utility. Only refill equipment represented by the
  // current local game build; never change C4, buy money, or the objective timer.
  // Individual switches are in Rage; generic tick supports the supported shapes
  // (weapon state, grenade count, or utility inventory) without assuming every
  // Clutcher release stores throwables in the same place.
  const utilityTypes=[
    {id:'smoke', flag:'utilSmoke', title:'Infinite Smoke Grenades', aliases:['smokegrenade','smoke']},
    {id:'flash', flag:'utilFlash', title:'Infinite Flashbangs', aliases:['flashbang','flash']},
    {id:'he', flag:'utilHE', title:'Infinite HE Grenades', aliases:['hegrenade','fraggrenade','he','frag']},
    {id:'molotov', flag:'utilMolotov', title:'Infinite Molotovs', aliases:['molotov','firebomb','molotovgrenade','tfire','molly']},
    {id:'incendiary', flag:'utilIncendiary', title:'Infinite Incendiaries', aliases:['incgrenade','incendiarygrenade','incendiary','inc','incgren','firegrenade','ctfiregrenade','ctincendiary','incendiarygren']},
    {id:'decoy', flag:'utilDecoy', title:'Infinite Decoys', aliases:['decoygrenade','decoy']},
    {id:'taser', flag:'utilTaser', title:'Infinite Taser Charges', aliases:['zeus','taser','zeusx27']}
  ];
  flags.utilAll=false;
  for(const u of utilityTypes)flags[u.flag]=false;
  const utilStore='voidwareV18_2_infiniteUtility';
  const utilitySettings={refillTo:2, refreshMs:110};
  try{
    const from=JSON.parse(localStorage.getItem(utilStore)||'{}');
    if(Number.isFinite(+from.refillTo))utilitySettings.refillTo=Math.max(1,Math.min(10,Math.round(+from.refillTo)));
    if(Number.isFinite(+from.refreshMs))utilitySettings.refreshMs=Math.max(50,Math.min(500,Math.round(+from.refreshMs)));
  }catch{}
  const utilitySave=()=>{try{localStorage.setItem(utilStore,JSON.stringify(utilitySettings))}catch{}};
  const utilityRuntime={last:0,touched:0,found:[],writes:0,restores:0,fireDetected:false};
  const utilityNormalize=x=>String(x??'').toLowerCase().replace(/[^a-z0-9]/g,'');
  // Some Clutcher builds call the CT fire grenade `incgrenade`, others use
  // `incendiary`, or hold it inside an array instead of a count object.
  function utilityFindKind(raw){
    const key=utilityNormalize(raw);
    if(!key)return null;
    const prefixes=['','weapon','item','grenade','equipment'];
    for(const type of utilityTypes){
      for(const alias of type.aliases){
        for(const prefix of prefixes)if(key===prefix+alias)return type;
      }
    }
    return null;
  }
  const utilityEnabled=u=>!!(flags.utilAll||flags[u.flag]);
  const utilityRoots=()=>{
    const w=g.weapons||{},p=g.player||{},gr=g.grenades||{},inv=g.inventory||{};
    const pairs=[['weapons.states',w.states],['weapons.grenades',w.grenades],
      ['weapons.grenadeCounts',w.grenadeCounts],['weapons.grenadeAmmo',w.grenadeAmmo],
      ['weapons.grenadeInventory',w.grenadeInventory],['weapons.grenadeInv',w.grenadeInv],
      ['weapons.ownedGrenades',w.ownedGrenades],['weapons.throwables',w.throwables],
      ['weapons.utility',w.utility],['weapons.equipment',w.equipment],
      ['player.grenades',p.grenades],['player.utility',p.utility],
      ['player.grenadeInventory',p.grenadeInventory],['player.grenadeCounts',p.grenadeCounts],
      ['player.inventory.grenades',p.inventory?.grenades],
      ['player.inventory.utility',p.inventory?.utility],
      ['grenades.inventory',gr.inventory],['grenades.counts',gr.counts],
      ['inventory.grenades',inv.grenades],['inventory.utility',inv.utility]];
    const seen=new Set();
    return pairs.filter(([,obj])=>{if(!obj||typeof obj!=='object'||seen.has(obj))return false;seen.add(obj);return true;});
  };
  // Remember only genuinely observed owned grenades. If throwing removes their
  // array entry/map key entirely, restore THAT item in the same local inventory.
  // Never add a grenade that the player did not previously own/equip.
  const utilityMemories=new WeakMap();
  const utilityIdFields=['id','weapon','type','name','weaponId','itemId'];
  const utilityNumFields=['ammo','count','quantity','charges','uses','remaining','amount','reserve','stock','qty','usesLeft'];
  function utilityRemember(root,kind,record){
    if(!kind||!root||typeof root!=='object')return;
    let mem=utilityMemories.get(root);
    if(!mem){mem=new Map();utilityMemories.set(root,mem);}
    mem.set(kind.id,{...record,team:g.player?.team});
  }
  function utilityRefill(force=false){
    if(!active||g.state!=='playing'||!g.player?.alive)return 0;
    if(!force&&!flags.utilAll&&!utilityTypes.some(utilityEnabled))return 0;
    const wanted=utilitySettings.refillTo,observed=new Set();
    const seen=new WeakSet();
    let writes=0,restores=0;
    const mark=kind=>{if(kind)observed.add(kind.id)};
    function fillNumeric(holder,key){
      const old=holder[key];
      if(typeof old==='number'&&Number.isFinite(old)&&old<wanted){
        try{holder[key]=wanted;if(holder[key]===wanted)writes++}catch{}
      }
    }
    function fillValue(obj,key,kind){
      if(!kind||!utilityEnabled(kind))return;
      mark(kind);
      const val=obj[key];
      if(typeof val==='number'){fillNumeric(obj,key);return;}
      if(!val||typeof val!=='object')return;
      for(const f of utilityNumFields)fillNumeric(val,f);
    }
    // Walk only known inventory/state roots; maximum depth 2 to avoid
    // walking the 3D scene or weapon definitions on every frame.
    function scan(root,depth=0){
      if(!root||typeof root!=='object'||seen.has(root))return;
      seen.add(root);
      if(root instanceof Map){
        for(const [key,val] of [...root]){
          const kind=utilityFindKind(key)||utilityFindKind(val&&typeof val==='object'?(val.id||val.weapon||val.type||val.name):'');
          if(kind){
            utilityRemember(root,kind,{shape:'map',key,valueType:typeof val,template:val&&typeof val==='object'?{...val}:null});
            if(utilityEnabled(kind)){
              mark(kind);
              if(typeof val==='number'&&val<wanted){root.set(key,wanted);writes++}
              else if(val&&typeof val==='object')for(const f of utilityNumFields)fillNumeric(val,f);
            }
          }else if(depth<2&&val&&typeof val==='object')scan(val,depth+1);
        }
        const memory=utilityMemories.get(root);
        if(memory)for(const [typeId,entry] of memory){
          const kind=utilityTypes.find(x=>x.id===typeId);
          if(!kind||!utilityEnabled(kind)||entry.team!==g.player.team||entry.shape!=='map'||root.has(entry.key))continue;
          const val=entry.valueType==='number'?wanted:entry.template?{...entry.template}:null;
          if(val!==null){
            if(val&&typeof val==='object')for(const f of utilityNumFields)if(typeof val[f]==='number')val[f]=wanted;
            try{root.set(entry.key,val);writes++;restores++}catch{}
          }
        }
      }else if(Array.isArray(root)){
        const stringCount=new Map();
        for(const item of root){
          if(typeof item==='string'){
            const kind=utilityFindKind(item);
            if(!kind)continue;
            utilityRemember(root,kind,{shape:'string-array',id:item});
            stringCount.set(kind.id,(stringCount.get(kind.id)||0)+1);
            mark(kind);
          }else if(item&&typeof item==='object'){
            const id=utilityIdFields.map(f=>item[f]).find(x=>x!=null);
            const kind=utilityFindKind(id);
            if(kind){
              utilityRemember(root,kind,{shape:'object-array',template:{...item}});
              fillValue({item},'item',kind);
            }else if(depth<2)scan(item,depth+1);
          }
        }
        const memory=utilityMemories.get(root);
        if(memory)for(const [typeId,entry] of memory){
          const kind=utilityTypes.find(x=>x.id===typeId);
          if(!kind||!utilityEnabled(kind)||entry.team!==g.player.team)continue;
          if(entry.shape==='string-array'){
            const have=stringCount.get(typeId)||0;
            for(let n=have;n<wanted;n++){root.push(entry.id);writes++;restores++}
          }else if(entry.shape==='object-array'){
            const has=root.some(item=>item&&typeof item==='object'&&utilityFindKind(utilityIdFields.map(f=>item[f]).find(x=>x!=null))?.id===typeId);
            if(!has){
              const copy={...entry.template};
              for(const f of utilityNumFields)if(typeof copy[f]==='number')copy[f]=wanted;
              root.push(copy);writes++;restores++;
            }
          }
        }
      }else{
        for(const [key,val] of Object.entries(root)){
          const kind=utilityFindKind(key)||utilityFindKind(val&&typeof val==='object'?(val.id||val.weapon||val.type||val.name):'');
          if(kind){
            utilityRemember(root,kind,{shape:'object-key',key,valueType:typeof val,template:val&&typeof val==='object'?{...val}:null});
            fillValue(root,key,kind);
          }else if(depth<2&&val&&typeof val==='object')scan(val,depth+1);
        }
        const memory=utilityMemories.get(root);
        if(memory)for(const [typeId,entry] of memory){
          const kind=utilityTypes.find(x=>x.id===typeId);
          if(!kind||!utilityEnabled(kind)||entry.team!==g.player.team||entry.shape!=='object-key'||entry.key in root)continue;
          try{
            root[entry.key]=entry.valueType==='number'?wanted:entry.template?{...entry.template}:undefined;
            if(root[entry.key]!==undefined){fillValue(root,entry.key,kind);writes++;restores++}
          }catch{}
        }
      }
    }
    for(const [,root] of utilityRoots())scan(root);
    // Some game builds use only g.weapons.state() for the equipped grenade.
    const w=g.weapons||{},currentKind=utilityFindKind(w.current);
    if(currentKind&&typeof w.state==='function'){
      try{const st=w.state();if(st)fillValue({selected:st},'selected',currentKind)}catch{}
    }
    if(utilityEnabled(utilityTypes[6])&&(w.zeusOwned||w.states?.zeus)){
      mark(utilityTypes[6]);
      if(typeof w.zeusRecharge==='number'&&w.zeusRecharge!==0){w.zeusRecharge=0;writes++}
    }
    utilityRuntime.found=[...observed];utilityRuntime.fireDetected=observed.has('incendiary')||observed.has('molotov');
    utilityRuntime.writes+=writes;utilityRuntime.restores+=restores;
    utilityRuntime.touched=performance.now();
    return writes;
  }
  function utilityTick(now){
    if(now-utilityRuntime.last<utilitySettings.refreshMs)return;
    utilityRuntime.last=now;utilityRefill();
  }
  function utilityStatus(){
    const found=new Set(utilityRuntime.found);
    for(const [,root] of utilityRoots()){
      if(Array.isArray(root)){
        for(const item of root){const id=typeof item==='string'?item:item&&typeof item==='object'?(item.id||item.weapon||item.type||item.name||item.weaponId||item.itemId):'';
          const kind=utilityFindKind(id);if(kind)found.add(kind.id)}
      }else if(root instanceof Map){for(const [key,val] of root){const kind=utilityFindKind(key)||utilityFindKind(val?.id||val?.type);if(kind)found.add(kind.id)}}
      else for(const [key,val] of Object.entries(root)){
        const kind=utilityFindKind(key)||utilityFindKind(val&&typeof val==='object'?(val.id||val.type):'');if(kind)found.add(kind.id);
      }
    }
    const selected=utilityFindKind(g.weapons?.current);
    if(selected)found.add(selected.id);
    return [...found];
  }
  function rageAllowed(bot){
    if(!bot?.alive||bot.team===g.player.team||(bot.spawnProt||0)>0)return false;
    const dist=Math.hypot(bot.x-g.player.x,bot.z-g.player.z);
    if(flags.rageMaxRange&&dist>ragePlusCfg.maxRange)return false;
    if(flags.rageMinRange&&dist<ragePlusCfg.minRange)return false;
    if(flags.rageVisOnly&&behindWall(bot))return false;
    return true;
  }
  function rageTargetScore(bot,angle,dist){
    // Alternative priorities are mutually exclusive. Angle breaks ties.
    if(flags.rageLowHP)return (Number.isFinite(bot.health)?bot.health:100)+angle*.015+dist*.0001;
    if(flags.rageLowArmor)return (Number.isFinite(bot.armor)?bot.armor:100)+angle*.015+dist*.0001;
    if(flags.rageFastest)return -Math.hypot(bot.vx||0,bot.vz||0)+angle*.003+dist*.0001;
    return targetMode==='crosshair'?angle+dist*.005:dist;
  }
  function rageFireReady(target,now){
    if(flags.rageHoldMouse1&&!g.input?.mouse1)return false;
    if(flags.rageHoldMouse2&&!g.input?.mouse2)return false;
    if(!flags.rageBurst3)return true;
    if(ragePlusState.burstTarget!==target){ragePlusState.burstTarget=target;ragePlusState.burstShots=0;ragePlusState.burstUntil=0;}
    if(ragePlusState.burstShots<3)return true;
    if(now<ragePlusState.burstUntil)return false;
    ragePlusState.burstShots=0;return true;
  }
  function rageOnConfirmedShot(now){
    if(!ragePlusState.autoFireContext||!flags.rageBurst3)return;
    ragePlusState.burstShots++;
    if(ragePlusState.burstShots>=3)ragePlusState.burstUntil=now+ragePlusCfg.burstCooldownMs;
  }
  function rageEarlyReloadTick(now){
    if(!flags.rageEarlyReload||!g.weapons?.startReload||g.weapons.reloading||now-ragePlusState.lastReloadAt<650)return;
    const w=g.weapons,d=w.def?.(),st=w.state?.();
    if(!d||['knife','grenade','c4','zeus'].includes(d.class)||!st)return;
    const at=Math.max(1,Math.round(ragePlusCfg.reloadAt));
    if(Number.isFinite(st.ammo)&&st.ammo<=at&&Number(st.reserve)>0){
      ragePlusState.lastReloadAt=now;
      try{w.startReload();}catch(e){console.warn('[VOIDWARE] Early reload:',e);}
    }
  }
  let speed = 1.0, spinDeg = 720, spinPhase = 0, skin = 'default';
  let selectedGun = 'awp';
  // V8.3: Local audio + third-person body appearance only (no server/inventory changes).
  let soundPreset='bell', soundVolume=0.33, soundComboAt=0, soundCombo=0, soundContext=null;
  let modelChoice='auto', modelRandomTeam='CT', modelColor='original', modelSize=1;
  let modelAppliedStyle='original', modelMaterials=new Map(), avatarBaseScale=null;

  let rageFov = 90, targetMode = 'crosshair', thirdDistance = 3.65, thirdHeight = .38;
  let fireRate=22, gravityScale=1, flySpeed=46, flyBoost=2.5, flySmooth=14, blinkDistance=15, airSteer=14, airMaxSpeed=11, legitFov=38, legitStrength=22, triggerRadius=.36;
  // V11.1 ROCKET RECOIL - velocity impulse opposite the view direction on confirmed shots.
  let rocketPower=24, rocketVertical=1, rocketMaxSpeed=145, rocketShots=0;
  const rocketSettingsKey='deathWonRocketV11_1';
  try {
    const rs=JSON.parse(localStorage.getItem(rocketSettingsKey)||'{}');
    if(Number.isFinite(rs.power))rocketPower=Math.max(2,Math.min(90,rs.power));
    if(Number.isFinite(rs.vertical))rocketVertical=Math.max(0,Math.min(3,rs.vertical));
    if(Number.isFinite(rs.max))rocketMaxSpeed=Math.max(20,Math.min(240,rs.max));
  } catch {}
  function saveRocket(){try{localStorage.setItem(rocketSettingsKey,JSON.stringify({power:rocketPower,vertical:rocketVertical,max:rocketMaxSpeed}))}catch{}}
  const strafeCfgKey='voidwareV18_8_controlledStrafe';
  try{
    const x=JSON.parse(localStorage.getItem(strafeCfgKey)||'{}');
    if(Number.isFinite(+x.steer))airSteer=Math.max(2,Math.min(25,+x.steer));
    if(Number.isFinite(+x.cap))airMaxSpeed=Math.max(6,Math.min(30,+x.cap));
  }catch{}
  const strafeSave=()=>{try{localStorage.setItem(strafeCfgKey,JSON.stringify({steer:airSteer,cap:airMaxSpeed}))}catch{}};
  let flightVel={x:0,y:0,z:0}, prevStrafeYaw=null, blinkUndo=null, checkpoint=null;
  let aimActivation='mouse2', aimBone='upper', triggerDelay=90, triggerOnset=0, triggerPrev=null;
  let flickFov=360, flickMaxDist=150, flickFiring=false; // O = original instant, Shift+O = smooth head flick
  const smoothStore='voidwareV16_1_smoothFlick';
  let smoothAimMs=260, smoothReturnMs=320, smoothShotHoldMs=65;
  let smoothFlickJob=null;
  try {
    const saved=JSON.parse(localStorage.getItem(smoothStore)||'{}');
    if(Number.isFinite(saved.aimMs))smoothAimMs=Math.max(120,Math.min(850,saved.aimMs));
    if(Number.isFinite(saved.returnMs))smoothReturnMs=Math.max(120,Math.min(850,saved.returnMs));
    if(Number.isFinite(saved.holdMs))smoothShotHoldMs=Math.max(0,Math.min(300,saved.holdMs));
  }catch(e){}
  const saveSmoothFlick=()=>{try{localStorage.setItem(smoothStore,JSON.stringify({aimMs:smoothAimMs,returnMs:smoothReturnMs,holdMs:smoothShotHoldMs}))}catch(e){}};
  let rageFocus=null, legitFocus=null, targetHudText='', killCount=0, hitmarkerUntil=0, lastHudUpdate=0;
  let radarSize=174, radarRange=48, radarHeightThreshold=0.8, autoScopeAt=0, showRing=true;
  // V18.5: own radar above the game's interface. Position preference is saved locally.
  let radarCorner='top-left';
  const radarCfgKey='voidwareV18_5_radar';
  try{ const x=JSON.parse(localStorage.getItem(radarCfgKey)||'{}');
    if(['top-left','top-right','bottom-left','bottom-right'].includes(x.corner))radarCorner=x.corner;
    if(Number.isFinite(+x.range))radarRange=Math.min(100,Math.max(15,+x.range));
    if(Number.isFinite(+x.height))radarHeightThreshold=Math.min(4,Math.max(.3,+x.height));
    if(typeof x.lineOfSight==='boolean')flags.radarRequireLOS=x.lineOfSight;
  }catch{}
  const radarSave=()=>{try{localStorage.setItem(radarCfgKey,JSON.stringify({corner:radarCorner,range:radarRange,height:radarHeightThreshold,lineOfSight:flags.radarRequireLOS}))}catch{}};
  const radarStats={frames:0,drawn:0,aimed:null,aimSource:'none',lastError:'',lastState:'waiting'};
  // V18.7 | Local-only purple chams, separately adjustable from the radar pulse.
  const voidChamsCfg={aimRadiusPx:14,holdMs:180,opacity:0.90};
  const voidChamsKey='voidwareV18_7_aimChams';
  try{
    const saved=JSON.parse(localStorage.getItem(voidChamsKey)||'{}');
    if(Number.isFinite(+saved.aimRadiusPx))voidChamsCfg.aimRadiusPx=Math.max(0,Math.min(90,+saved.aimRadiusPx));
    if(Number.isFinite(+saved.holdMs))voidChamsCfg.holdMs=Math.max(0,Math.min(1500,+saved.holdMs));
    if(Number.isFinite(+saved.opacity))voidChamsCfg.opacity=Math.max(.25,Math.min(1,+saved.opacity));
  }catch{}
  const voidChamsSave=()=>{try{localStorage.setItem(voidChamsKey,JSON.stringify(voidChamsCfg))}catch{}};
  let legitWallFov=100, auraRadius=9, bounceEvery=1000, lastAuraKill=0, lastBounce=0;
  const themes={
    violet:['#aa78ff','#6b43dd','#b898f7','#0a0c16','#171626'],
    cobalt:['#4bbcff','#246fdb','#8cdcff','#050d1a','#102438'],
    crimson:['#ff637d','#aa244e','#ffa4af','#14070e','#270f1b'],
    emerald:['#36efb8','#117f71','#80ffd5','#04120f','#082b23'],
    gold:['#f7c76d','#95642e','#ffe1a3','#141006','#2c2211']
  };
  const uiStore='deathWonV8_ui';let uiTheme='violet',uiScale=1,uiOpacity=.98,espThickness=1.6,liveGlow=true;
  let menuFxMode='pop', menuFxDuration=320;
  try {const saved=JSON.parse(localStorage.getItem(uiStore)||'{}');
    if(themes[saved.theme])uiTheme=saved.theme;
    if(['pop','slide','zoom','off'].includes(saved.menuFxMode))menuFxMode=saved.menuFxMode;
    if(Number.isFinite(saved.menuFxDuration))menuFxDuration=Math.max(140,Math.min(650,saved.menuFxDuration));
    if(Number.isFinite(saved.scale))uiScale=Math.max(.78,Math.min(1.1,saved.scale));
    if(Number.isFinite(saved.opacity))uiOpacity=Math.max(.86,Math.min(1,saved.opacity));
    if(Number.isFinite(saved.espThickness))espThickness=Math.max(.7,Math.min(4,saved.espThickness));
    if(Number.isFinite(saved.wallFov))legitWallFov=Math.max(10,Math.min(240,saved.wallFov));
    if(Number.isFinite(saved.flickFov))flickFov=Math.max(15,Math.min(360,saved.flickFov));
    if(Number.isFinite(saved.flickMaxDist))flickMaxDist=Math.max(5,Math.min(300,saved.flickMaxDist));
    if(Number.isFinite(saved.auraRadius))auraRadius=Math.max(3,Math.min(25,saved.auraRadius));
  }catch(e){}
  const saveUi=()=>{try{localStorage.setItem(uiStore,JSON.stringify({theme:uiTheme,scale:uiScale,opacity:uiOpacity,espThickness,wallFov:legitWallFov,flickFov,flickMaxDist,auraRadius,menuFxMode,menuFxDuration}))}catch(e){}};
  let botPeaceLast=0, lastScopeWeapon='', msgThrottle=0;
  let lastCriticalHeal=0, ammoRegenAccumulator=0, orbitLastUpdate=0, megaSnapshot=null;
  let forcedTarget=null, suppressSilent=false, lastChamsScan=0;
  let activeTab = 'rage', active = true, avatar = null, avatarPromise = false, avatarTeam = '', avatarGun = '', avatarLoadTries = 0;
  let lastFrame = performance.now(), lastMsg = '', nextAvatarRetry = 0;
  const storedFreeze = new Map(), savedMaterials = new Map();
  const originalFireBullet = g.fireBullet;
  const originalAddKill = g.hud.addKill;
  const originalMaxSpeed = g.weapons.maxSpeed;
  const originalWeaponFire = g.weapons.fire;
  const originalWeaponUpdate = g.weapons.update;
  const originalPlayerShoot = g.playerShoot;
  const originalCs2Play = g.cs2?.play;
  const originalViewmodelKick = g.viewmodel?.kick;
  const originalPlayerUpdate = g.player.update;
  const chamsMeshes = new Map();
  const originalRaycast = g.physics?.raycast;
  const cameraPosition = g.camera?.position;
  const originalCamSet = cameraPosition?.set;
  const hadCamSet = cameraPosition ? Object.prototype.hasOwnProperty.call(cameraPosition, 'set') : false;
  const viewmodel = g.viewmodel?.scene;
  const viewmodelWasVisible = viewmodel?.visible;
  const firstPersonRig = g.cs2;
  const originalRigVisible = firstPersonRig?.setVisible;
  const hadRigVisible = firstPersonRig ? Object.prototype.hasOwnProperty.call(firstPersonRig, 'setVisible') : false;

  // -------------------- VOIDWARE | OBSIDIAN DARK UI --------------------
  const style = document.createElement('style');
  style.id = 'death-won-style';
  style.textContent = `
    #death-won-curtain{position:fixed;inset:0;z-index:2147483645;display:none;opacity:.45;pointer-events:auto;
      background:radial-gradient(ellipse at 50% 50%,#10102133,#000a);cursor:default} 
    #death-won-panel,#death-won-panel * {box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif}
    #death-won-panel {position:fixed;inset:auto;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483646;
      width:min(1000px,97vw);height:min(675px,94vh);overflow:hidden;display:none;color:#f5f6fc;text-align:left;
      background:radial-gradient(ellipse at 100% 0%,#15142b 0%,transparent 43%),linear-gradient(155deg,#0b0d14 0%,#070910 69%,#05060a 100%);
      border:1px solid #343048;border-radius:20px;box-shadow:0 48px 120px #000e,0 0 0 1px #191528,0 0 85px #754ab32c;
      user-select:none;letter-spacing:normal;pointer-events:auto}
    #death-won-panel button,#death-won-panel input,#death-won-panel select{font:inherit}
    #death-won-panel .dw-top{height:83px;display:flex;gap:16px;align-items:center;padding:17px 24px;
      background:linear-gradient(95deg,#161321,#0c1018 75%,#111126);border-bottom:1px solid #252a39}
    #death-won-panel .dw-mark{width:47px;height:47px;border-radius:13px;display:grid;place-items:center;font-size:25px;
      color:#fff;background:linear-gradient(145deg,#7954e8,#393078);box-shadow:inset 0 1px #ffffff32,0 7px 24px #6143c344}
    #death-won-panel .dw-title{font-size:20px;font-weight:950;letter-spacing:2.6px;color:#f9f7ff;line-height:1.2}
    #death-won-panel .dw-title b{color:#ac8eff}
    #death-won-panel .dw-sub{font-size:10px;font-weight:700;letter-spacing:1.5px;color:#949cb6;margin-top:5px}
    #death-won-panel .dw-topright{margin-left:auto;display:flex;gap:10px;align-items:center}
    #death-won-panel .dw-online{font-size:11px;font-weight:800;white-space:nowrap;padding:8px 12px;color:#72e5c9;
      border:1px solid #28534e;background:#10221e;border-radius:20px}
    #death-won-panel .dw-version{font-size:10px;font-weight:800;padding:8px 10px;color:#b9b6cf;border:1px solid #333546;border-radius:8px}
    #death-won-panel .dw-x{width:35px;height:35px;border-radius:9px;border:1px solid #34394a;background:#191b27;color:#d6d6e6;
      font-weight:800;font-size:22px;cursor:pointer;transition:.16s}
    #death-won-panel .dw-x:hover{border-color:#946ce6;background:#292039;color:white}
    #death-won-panel .dw-main{display:flex;height:calc(100% - 124px)}
    #death-won-panel .dw-nav{width:213px;flex-shrink:0;padding:15px 11px 10px;border-right:1px solid #252b38;
      background:#0c0e15;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#313746 transparent}
    #death-won-panel .dw-navlabel{color:#626e88;text-transform:uppercase;font-size:9px;letter-spacing:2px;font-weight:900;padding:7px 12px 13px}
    #death-won-panel .dw-tab{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;
      margin-bottom:5px;padding:12px 12px;background:transparent;border:1px solid transparent;color:#9199af;
      border-radius:10px;transition:background .13s,border-color .13s;font-size:12px;font-weight:760}
    #death-won-panel .dw-tab:hover{background:#1a2030;color:#f5f5fc}
    #death-won-panel .dw-tab.active{background:linear-gradient(100deg,#302345,#201b33);color:#e4d5ff;
      border-color:#584277;box-shadow:inset 3px 0 #ac78ff,0 5px 12px #0003}
    #death-won-panel .dw-tabicon{width:21px;text-align:center;font-size:17px;opacity:.95}
    #death-won-panel .dw-navhint{font-size:10px;color:#6e758b;border-top:1px solid #242a36;padding:13px 10px 7px;margin-top:14px;line-height:1.65}
    #death-won-panel .dw-content{flex:1;min-width:0;padding:24px 27px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#484258 #12131b}
    #death-won-panel .dw-heading{font-size:19px;font-weight:900;color:#f5f4fd;letter-spacing:-.35px;margin:0 0 5px}
    #death-won-panel .dw-desc{font-size:11px;color:#959db5;line-height:1.55;margin:0 0 20px}
    #death-won-panel .dw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
    #death-won-panel .dw-toggle,#death-won-panel .dw-action{position:relative;text-align:left;cursor:pointer;
      width:100%;min-height:104px;padding:15px 14px 34px;background:#151923;border:1px solid #303546;border-radius:11px;
      color:#e5e9f5;transition:background .12s,border-color .12s,transform .12s}
    #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{border-color:#6d5a9f;background:#1d2131;transform:translateY(-1px)}
    #death-won-panel .dw-toggle.on{border-color:#865bd4;background:linear-gradient(100deg,#28203c,#1a1b2b);box-shadow:inset 3px 0 #a477ff}
    #death-won-panel .dw-toggle.on .dw-name{color:#e8d7ff}
    #death-won-panel .dw-name{font-size:12px;font-weight:840;color:#e9ebf7;line-height:1.3;padding-right:72px}
    #death-won-panel .dw-hint{font-size:10px;color:#8e97ad;line-height:1.5;margin-top:7px;padding-right:0}
    #death-won-panel .dw-indicator{position:absolute;right:13px;top:13px;font-weight:800;font-size:10px;color:#777d90}
    #death-won-panel .dw-toggle.on .dw-indicator{color:#c2a1ff}
    #death-won-panel .dw-shortcut{position:absolute;right:12px;bottom:9px;font-size:9px;font-weight:780;
      color:#8996b0;background:#202838;border:1px solid #343d50;border-radius:5px;padding:3px 6px;max-width:92px;overflow:hidden;text-overflow:ellipsis}
    #death-won-panel .dw-shortcut.unbound{opacity:.45}
    #death-won-panel .dw-section{margin-top:20px;border-top:1px solid #292d3a;padding-top:17px}
    #death-won-panel .dw-range{background:#141824;border:1px solid #2d3342;border-radius:10px;margin-bottom:11px;padding:14px}
    #death-won-panel .dw-range .dw-name{padding-right:0}
    #death-won-panel input[type=range]{accent-color:#a67dff;width:100%;margin-top:13px;cursor:pointer}
    #death-won-panel select,#death-won-panel input[type=number],#death-won-panel input[type=text]{width:100%;background:#0d1119;
      border:1px solid #353d50;border-radius:8px;color:#f0f0fb;padding:11px;outline:none;font-size:12px;margin-top:8px}
    #death-won-panel select:focus,#death-won-panel input:focus{border-color:#a778ff;box-shadow:0 0 0 2px #a778ff25}
    #death-won-panel .dw-bottom{height:41px;background:#0c0f17;border-top:1px solid #252b39;display:flex;
      gap:8px;align-items:center;padding:0 20px;font-size:10px;color:#778196}
    #death-won-panel .dw-bottom strong{color:#c5a4ff;font-size:10px;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #death-won-panel .dw-krow{display:flex;align-items:center;gap:13px;padding:12px 13px;border:1px solid #292f3e;
      background:#141924;border-radius:10px;margin-bottom:8px}
    #death-won-panel .dw-krowtext{flex:1;min-width:0;font-size:12px;color:#e3e8f7;font-weight:750}
    #death-won-panel .dw-kg{font-size:9px;color:#8d9bb7;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:.7px}
    #death-won-panel .dw-bind{min-width:100px;max-width:170px;text-align:center;padding:9px 10px;border:1px solid #53416d;
      background:#241c33;border-radius:7px;color:#d3bbfb;cursor:pointer;font-weight:800;font-size:11px}
    #death-won-panel .dw-bind:hover{background:#3a2a50;border-color:#9167d3}
    #death-won-panel .dw-clear{padding:8px 10px;border:1px solid #374054;border-radius:7px;background:#1c2230;color:#aeb6cd;cursor:pointer}
    #death-won-panel .dw-search{margin:0 0 17px!important}
    #death-won-panel .dw-pulse{border-color:#c58bff!important;background:#472a6d!important;color:white!important;animation:dw-blink 1s infinite}
    @keyframes dw-blink{50%{box-shadow:0 0 18px #9f62ec55}}
    #death-won-panel .dw-quick{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:19px}
    #death-won-panel .dw-quickchip{font-size:10px;color:#c5ceec;background:#1b2130;border:1px solid #32394d;border-radius:18px;padding:7px 11px}
    #death-won-panel .dw-badge{padding:4px 8px;background:#202639;border:1px solid #39425b;border-radius:6px;color:#cab5fa;font-size:10px;font-weight:800}
    #death-won-panel .dw-feature-note{font-size:10px;color:#a9b5d3;border:1px solid #343a56;background:#111827;line-height:1.7;border-radius:10px;padding:12px 15px;margin:13px 0}
    #death-won-panel .dw-toggle.on{box-shadow:inset 3px 0 #a477ff,0 0 0 1px #6d47941b}
    #death-won-panel .dw-content::-webkit-scrollbar{width:7px}#death-won-panel .dw-content::-webkit-scrollbar-thumb{background:#292439;border-radius:8px}
    #death-won-panel .dw-mark{background:linear-gradient(140deg,var(--dw-accent,#914dfa),var(--dw-deep,#5620a9));box-shadow:inset 0 1px #ffffff55,0 3px 25px var(--dw-accent,#9164ff4d);animation:dw-mark-breathe 3.2s ease-in-out infinite}
    @keyframes dw-mark-breathe{0%,100%{filter:brightness(.9)}50%{filter:brightness(1.22)}}
    #death-won-panel{background:radial-gradient(ellipse at 94% 0%,var(--dw-dim,#171626),transparent 47%),linear-gradient(155deg,var(--dw-bg,#0a0c16),#050609 86%)!important;
      border-color:color-mix(in srgb,var(--dw-accent,#aa78ff) 36%,#222934)!important;isolation:isolate}
    #death-won-panel .dw-top{position:relative;background:linear-gradient(105deg,var(--dw-dim,#171626),#080b12 77%)!important;overflow:hidden}
    #death-won-panel .dw-top:after{content:'';position:absolute;bottom:0;left:0;height:2px;width:100%;background:linear-gradient(90deg,transparent,var(--dw-accent,#aa78ff),transparent);opacity:.85}
    #death-won-panel .dw-title b{color:var(--dw-accent,#aa78ff)!important;text-shadow:0 0 20px color-mix(in srgb,var(--dw-accent,#aa78ff) 32%,transparent)}
    #death-won-panel .dw-tab.active{border-color:var(--dw-accent,#aa78ff)!important;box-shadow:inset 3px 0 var(--dw-accent,#aa78ff),0 8px 24px #0007!important;background:linear-gradient(100deg,var(--dw-dim,#302345),#141722)!important}
    #death-won-panel .dw-toggle.on{border-color:var(--dw-accent,#aa78ff)!important;box-shadow:inset 3px 0 var(--dw-accent,#aa78ff),0 0 24px #0004!important}
    #death-won-panel .dw-toggle.on .dw-indicator,#death-won-panel .dw-toggle.on .dw-name{color:var(--dw-accent,#aa78ff)!important}
    #death-won-panel .dw-toggle,#death-won-panel .dw-action{box-shadow:0 8px 23px #0002;backdrop-filter:blur(14px)}
    #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{border-color:var(--dw-accent,#aa78ff)!important;box-shadow:0 9px 28px #0009;transform:translateY(-2px)}
    #death-won-panel .dw-online{color:var(--dw-accent,#aa78ff)!important;border-color:color-mix(in srgb,var(--dw-accent,#aa78ff) 25%,#17232c)!important}
    #death-won-panel .dw-range{border-color:#384055;background:linear-gradient(135deg,#171b28,#0d111c)}
    #death-won-panel input[type=range]{accent-color:var(--dw-accent,#aa78ff)}
    #death-won-panel button:focus-visible,#death-won-panel select:focus-visible,#death-won-panel input:focus-visible{outline:2px solid var(--dw-accent,#aa78ff);outline-offset:2px}
    #death-won-panel .dw-brand-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 20px}
    #death-won-panel .dw-theme{width:48px;height:42px;border-radius:12px;border:1px solid #465063;cursor:pointer;transition:.15s}
    #death-won-panel .dw-theme:hover{transform:translateY(-2px)}
    #death-won-panel .dw-theme.selected{outline:2px solid #fff;outline-offset:3px}
    #death-won-panel .dw-kicker{padding:9px 12px;border:1px solid #384256;border-radius:9px;background:#0c1220;color:#aeb9d2;font-size:11px;margin-bottom:14px;line-height:1.5}
    #death-won-panel .dw-title{letter-spacing:3.5px}
    #death-won-panel .dw-action{background:linear-gradient(145deg,#151c28,#12151f)}
    #death-won-esp{position:fixed;inset:0;z-index:2147483642;pointer-events:none;width:100vw;height:100vh;overflow:hidden}
    #death-won-esp-canvas{width:100%;height:100%;display:block;pointer-events:none}
    #death-won-center{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483643;pointer-events:none;
      display:none;color:#b98bff;font:bold 20px Arial;text-shadow:0 0 8px #7444ba}
    #death-won-flight-hud{position:fixed;top:13px;left:50%;transform:translateX(-50%);z-index:2147483620;pointer-events:none;
      background:#080c15dc;color:#c2c9e4;border:1px solid #68418d9c;border-radius:12px;padding:8px 16px;
      backdrop-filter:blur(12px);font:700 11px/1.5 ui-sans-serif,system-ui,Arial;letter-spacing:.45px;text-align:center;
      box-shadow:0 10px 35px #0009,0 0 16px #9949e92a}
    #death-won-flight-hud b{color:#d7afff}
    @media(max-width:650px){#death-won-panel .dw-nav{width:133px;padding:11px 5px}#death-won-panel .dw-tab{font-size:10px;padding:10px 6px;gap:4px}
      #death-won-panel .dw-content{padding:17px 12px}#death-won-panel .dw-grid{grid-template-columns:1fr}
      #death-won-panel .dw-version{display:none}#death-won-panel .dw-top{padding:14px 12px}}
  `;
  style.textContent+=`
    #death-won-panel{background:linear-gradient(155deg,#070813 2%,#0b0b15 47%,#070a13 100%)!important;box-shadow:0 34px 130px #000e,0 0 0 1px #b088ff42!important;}\n    #death-won-panel .dw-top{background:linear-gradient(100deg,#131024,#090913 60%,#091323)!important;border-bottom:1px solid #7956af4a!important}\n    #death-won-panel .dw-action,#death-won-panel .dw-toggle{transition:transform .15s ease,border-color .15s ease,background .15s ease!important}\n    #death-won-panel .dw-action:hover,#death-won-panel .dw-toggle:hover{transform:translateY(-2px)!important;border-color:#a37bfd!important}\n    #death-won-panel .dw-tab:hover{background:#29203d!important}\n    #death-won-panel .dw-kicker{background:linear-gradient(90deg,#201332,#17111c)!important;color:#ddc3ff!important}
  `;

  style.textContent+=`
    /* VOIDWARE V10.3 ONYX — restrained high-contrast design */
    #death-won-panel {
      width:min(1120px,96vw)!important;height:min(730px,94vh)!important;
      background:#090c12!important;border:1px solid #252b38!important;
      border-radius:16px!important;box-shadow:0 34px 100px #000d,0 0 0 1px #ffffff05!important;
      color:#e9edf7!important;
    }
    #death-won-panel .dw-top {height:72px!important;padding:12px 22px!important;background:#10141c!important;border-bottom:1px solid #242b39!important;}
    #death-won-panel .dw-mark {width:40px!important;height:40px!important;border-radius:12px!important;
      background:var(--dw-accent,#9d86fc)!important;color:#0b0e15!important;box-shadow:none!important;animation:none!important;font-size:22px!important;}
    #death-won-panel .dw-title {font-size:17px!important;letter-spacing:2.3px!important;}
    #death-won-panel .dw-title b {text-shadow:none!important;}
    #death-won-panel .dw-sub {letter-spacing:1.6px!important;font-size:9px!important;color:#76849d!important;}
    #death-won-panel .dw-online {padding:6px 10px!important;background:#111e1d!important;border:1px solid #254841!important;
      color:#6ee3b6!important;font-size:10px!important;}
    #death-won-panel .dw-version {color:#8390a6!important;background:transparent!important;border:0!important;}
    #death-won-panel .dw-main {height:calc(100% - 113px)!important;}
    #death-won-panel .dw-nav {width:223px!important;padding:16px 10px!important;background:#0d1017!important;
      border-right:1px solid #252b37!important;}
    #death-won-panel .dw-navlabel {color:#7f8ca3!important;font-size:10px!important;}
    #death-won-panel .dw-tab {min-height:37px!important;padding:8px 10px!important;gap:10px!important;
      margin-bottom:2px!important;border-radius:8px!important;font-size:11px!important;color:#9ba6b7!important;}
    #death-won-panel .dw-tab:hover {background:#1c2330!important;color:#fff!important;}
    #death-won-panel .dw-tab.active {background:#26243b!important;border-color:#413c60!important;
      box-shadow:inset 2px 0 var(--dw-accent,#ac91fc)!important;color:#fff!important;}
    #death-won-panel .dw-tabicon {font-size:15px!important;width:18px!important;}
    #death-won-panel .dw-content {padding:27px 31px 42px!important;background:#090c12!important;}
    #death-won-panel .dw-heading {font-size:21px!important;font-weight:790!important;letter-spacing:-.5px!important;}
    #death-won-panel .dw-desc {color:#8491a8!important;font-size:11px!important;margin-bottom:20px!important;}
    #death-won-panel .dw-grid {gap:9px!important;}
    #death-won-panel .dw-toggle,#death-won-panel .dw-action {min-height:86px!important;padding:13px 14px 26px!important;
      background:#131821!important;border:1px solid #282f3d!important;border-radius:10px!important;
      box-shadow:none!important;backdrop-filter:none!important;transform:none!important;transition:background .14s,border-color .14s!important;}
    #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover {background:#1a2130!important;
      border-color:#56516e!important;transform:none!important;box-shadow:none!important;}
    #death-won-panel .dw-toggle.on {background:#211e33!important;border-color:#62538e!important;
      box-shadow:inset 2px 0 var(--dw-accent,#ac91fc)!important;}
    #death-won-panel .dw-name {font-size:12px!important;font-weight:750!important;line-height:1.35!important;}
    #death-won-panel .dw-hint {font-size:10px!important;line-height:1.45!important;color:#8a97ae!important;}
    #death-won-panel .dw-shortcut {right:10px!important;bottom:7px!important;font-weight:760!important;
      font-size:9px!important;padding:2px 6px!important;background:#1b2330!important;border-color:#353e51!important;}
    #death-won-panel .dw-range {padding:13px!important;background:#111720!important;border:1px solid #293241!important;}
    #death-won-panel .dw-bottom {height:41px!important;background:#0d1118!important;}
    #death-won-panel .dw-home-hero {background:linear-gradient(110deg,#18162b,#111923)!important;border-color:#2c2b45!important;}
    #death-won-panel .dw-launch-btn {background:#141b25!important;box-shadow:none!important;}
    #death-won-panel .dw-kicker,#death-won-panel .dw-feature-note {background:#101521!important;border-color:#283043!important;}
    #death-won-panel .dw-flick-feature {padding:15px 17px;margin:0 0 17px;border:1px solid #584d80;
      background:linear-gradient(100deg,#22203a,#131923);border-radius:12px;color:#dcd5fc;font:650 12px/1.5 system-ui;}
    #death-won-panel .dw-flick-feature kbd {display:inline-block;margin:0 7px;border:1px solid #7467a0;
      background:#292642;padding:3px 8px;border-radius:5px;font-size:12px;color:#fff;}
    #death-won-panel .dw-x {border-radius:8px!important;background:#202633!important;}
    @media(max-width:700px){#death-won-panel .dw-nav{width:150px!important}#death-won-panel .dw-content{padding:17px 12px!important}
      #death-won-panel .dw-grid{grid-template-columns:1fr!important}#death-won-panel .dw-version{display:none!important}}
    @media(prefers-reduced-motion:reduce){#death-won-panel *{animation:none!important;transition:none!important}}
  `;

  // V12 SUPERNOVA VISUAL THEME — restrained premium dark, fast GPU-friendly CSS.
  style.textContent += `
  #death-won-panel{--dw-accent:#a77cff!important;--dw-deep:#6d4eff!important;--dw-light:#dad0ff!important;
    background:#070a11!important;border:1px solid #343a53!important;box-shadow:0 40px 140px #000e,0 0 0 1px #7d6bdb18!important;
    font-family:Inter,ui-sans-serif,system-ui,Arial!important;color:#f3f2ff!important;}
  #death-won-panel .dw-top{background:linear-gradient(105deg,#101425 0%,#0b111a 70%,#0b0e17 100%)!important;
    border-bottom:1px solid #292e42!important;min-height:74px!important;}
  #death-won-panel .dw-title{font-size:19px!important;letter-spacing:2.2px!important;font-weight:900!important;}
  #death-won-panel .dw-title b{color:#b394ff!important;text-shadow:none!important;}
  #death-won-panel .dw-sub{font-size:9px!important;letter-spacing:2px!important;color:#a9a6c3!important;}
  #death-won-panel .dw-mark{background:linear-gradient(145deg,#8553ff,#2b4b75)!important;
    border:1px solid #af94ff!important;box-shadow:0 0 20px #8057ff55!important;border-radius:13px!important;}
  #death-won-panel .dw-main{background:#090c14!important;}
  #death-won-panel .dw-nav{background:#0a0e17!important;border-right:1px solid #242d3e!important;}
  #death-won-panel .dw-navlabel{color:#919bb4!important;letter-spacing:1.4px!important;}
  #death-won-panel .dw-navsearch-wrap,#death-won-panel .dw-search{background:#141925!important;border:1px solid #30364c!important;
    border-radius:10px!important;color:#e6e9ff!important;}
  #death-won-panel .dw-group-head{color:#d4d6e6!important;font-size:10px!important;letter-spacing:1px!important;}
  #death-won-panel .dw-tab{border-radius:9px!important;min-height:35px!important;margin:2px 5px!important;
    transition:background .13s,border-color .13s!important;}
  #death-won-panel .dw-tab.active{background:linear-gradient(100deg,#302249,#1d2440)!important;
    box-shadow:inset 2px 0 #b997ff!important;border-color:#51436d!important;color:#f3ebff!important;}
  #death-won-panel .dw-tab:hover{background:#222638!important;}
  #death-won-panel .dw-content{background:radial-gradient(ellipse at top right,#17142b 0%,#090d14 45%)!important;
    padding:24px 26px!important;}
  #death-won-panel .dw-heading{font-size:20px!important;line-height:1.24!important;font-weight:850!important;letter-spacing:-.4px!important;}
  #death-won-panel .dw-desc{color:#99a2bd!important;line-height:1.65!important;font-size:12px!important;}
  #death-won-panel .dw-toggle,#death-won-panel .dw-action{background:linear-gradient(145deg,#151925,#121723)!important;
    border:1px solid #2b3447!important;border-radius:13px!important;padding:16px!important;
    box-shadow:none!important;transition:background .12s,border-color .12s,transform .12s!important;}
  #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{background:#1d2432!important;border-color:#7666ac!important;transform:translateY(-1px)!important;}
  #death-won-panel .dw-toggle.on{background:linear-gradient(135deg,#25203e,#172235)!important;
    border-color:#8d75da!important;box-shadow:inset 0 0 0 1px #8364be29!important;}
  #death-won-panel .dw-indicator{color:#b99dff!important;}
  #death-won-panel .dw-name{color:#f4f2ff!important;letter-spacing:-.15px!important;}
  #death-won-panel .dw-shortcut{background:#25283a!important;color:#bdbed6!important;border:1px solid #353b50!important;}
  #death-won-panel .dw-range{background:#111827!important;border-color:#31374e!important;border-radius:13px!important;}
  #death-won-panel .dw-home-hero{background:linear-gradient(105deg,#211638,#132339)!important;
    border:1px solid #433a6b!important;border-radius:16px!important;}
  #death-won-panel .dw-bottom{background:#0b0f19!important;border-top:1px solid #232a3a!important;}
  #death-won-panel .dw-sn-intro{display:flex;align-items:center;gap:9px;padding:12px 15px;margin:12px 0 18px;
    border:1px solid #4e4876;border-radius:11px;background:linear-gradient(100deg,#201b34,#142333);font:11px system-ui;
    letter-spacing:.5px;color:#b8c0dc;}
  #death-won-panel .dw-sn-intro b{color:#e8d8ff;letter-spacing:1.1px;font-weight:850;}
  #death-won-panel .dw-sn-foot{padding:12px 14px;margin-top:18px;border-left:2px solid #8e7ae6;
    border-radius:6px;background:#141827;color:#a8a5c1;font:11px/1.6 system-ui;}
  #death-won-panel input[type=range]{accent-color:#aa82ff!important;}
  @media(max-width:700px){#death-won-panel .dw-content{padding:14px!important}
    #death-won-panel .dw-sn-intro{display:block;font-size:10px!important}}
  `;

  style.textContent += `
    #death-won-panel .dw-global-results{max-height:39%;overflow-y:auto;min-height:0;
      background:#101522;border:1px solid #343b55;border-radius:10px;margin-bottom:10px;
      scrollbar-width:thin;flex-shrink:1}
    #death-won-panel .dw-global-results[hidden]{display:none!important}
    #death-won-panel .dw-search-head{font:800 9px/1 system-ui;letter-spacing:1.3px;color:#b29bde;padding:12px 11px 8px}
    #death-won-panel .dw-search-hit{display:block;width:100%;text-align:left;padding:9px 11px;
      background:transparent;color:#e1ddf8;border:0;border-top:1px solid #1a2031;font:600 11px system-ui;cursor:pointer}
    #death-won-panel .dw-search-hit:hover{background:#302549;color:white}
    #death-won-panel .dw-search-empty{padding:10px 11px;color:#9a9fb5;font:11px system-ui}
  `;
  style.textContent += `
  /* V13.1 OBSIDIAN GLASS — lightweight, readable, compact. No costly backdrop-filter. */
  #death-won-panel{border-radius:18px!important;box-shadow:0 32px 110px #000e,0 0 0 1px #b7a3ff13,0 0 64px #7a51ba14!important}
  #death-won-panel .dw-top{min-height:77px!important;padding:14px 23px!important}
  #death-won-panel .dw-top:after{background:linear-gradient(90deg,transparent 0%,var(--dw-accent) 35%,#45bcff 66%,transparent)!important;opacity:.7}
  #death-won-panel .dw-mark{position:relative;filter:none!important;animation:none!important;box-shadow:0 8px 24px #8d55ff35!important}
  #death-won-panel .dw-nav{width:234px!important;flex-basis:234px!important;padding:12px 10px!important;background:#090c14!important}
  #death-won-panel .dw-navlabel{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;white-space:nowrap!important}
  #death-won-panel .dw-navtotal{border-radius:6px;background:#181a2b;border:1px solid #293049;color:#c5b5fd;padding:2px 8px;font-size:10px;font-weight:800}
  #death-won-panel .dw-navsearch-wrap{position:sticky;top:0;z-index:3;min-height:43px;box-shadow:0 7px 22px #03071077}
  #death-won-panel #dw-nav-search{min-width:0;max-width:100%;font-weight:600;font-size:12px!important}
  #death-won-panel .dw-group-head{padding:12px 9px!important;border-radius:8px!important}
  #death-won-panel .dw-tab{font-weight:660!important;min-height:39px!important;padding:9px 10px!important;gap:8px!important}
  #death-won-panel .dw-tab.active{box-shadow:inset 3px 0 var(--dw-accent)!important}
  #death-won-panel .dw-content{padding:22px 26px!important}
  #death-won-panel .dw-heading{font-size:22px!important;font-weight:850!important;margin-bottom:7px!important}
  #death-won-panel .dw-grid{gap:10px!important}
  #death-won-panel .dw-toggle,#death-won-panel .dw-action{min-height:97px!important;padding:14px 14px 31px!important;border-radius:12px!important}
  #death-won-panel .dw-name{font-size:12px!important;font-weight:790!important;padding-right:48px!important}
  #death-won-panel .dw-hint{font-size:10.5px!important;line-height:1.55!important}
  #death-won-panel .dw-search-hit{border-radius:6px;margin:2px 3px;width:calc(100% - 6px);padding:10px 12px}
  #death-won-panel .dw-search-hit:focus-visible{outline:2px solid var(--dw-accent)}
  #death-won-panel .dw-search-target{animation:dw-searched 1.65s ease-out!important}
  @keyframes dw-searched{0%,45%{border-color:#d8a8ff!important;box-shadow:0 0 0 2px #8d64ff7a!important}100%{box-shadow:none}}
  #death-won-panel button:focus-visible{outline:2px solid var(--dw-accent)!important;outline-offset:2px}
  #death-won-panel .dw-bottom{height:43px!important;color:#b3afc8!important}
  @media(max-width:800px){#death-won-panel .dw-nav{width:174px!important;flex-basis:174px!important}
    #death-won-panel .dw-grid{grid-template-columns:1fr!important}}
  `;

  style.textContent += `
  /* V14.1 FATALITY-STYLE UI RESKIN — inspired by premium cheat menus, without copying brand assets. */
  #death-won-curtain{background:rgba(2,3,7,.70)!important;opacity:1!important}
  #death-won-panel{
    width:min(1280px,98vw)!important;height:min(740px,95vh)!important;border-radius:10px!important;
    background:linear-gradient(180deg,#0c0d14 0%,#090a10 100%)!important;
    border:1px solid #2a2338!important;
    box-shadow:0 24px 100px rgba(0,0,0,.72),0 0 0 1px rgba(255,255,255,.025) inset!important;
    overflow:hidden!important;
  }
  #death-won-panel::before{content:'';position:absolute;left:0;top:0;right:0;height:3px;z-index:3;
    background:linear-gradient(90deg,#742744 0%,#d44486 48%,#7b61ff 100%)}
  #death-won-panel .dw-top{
    min-height:58px!important;height:58px!important;padding:0 14px!important;gap:12px!important;
    background:linear-gradient(180deg,#131422 0%,#0e0f17 100%)!important;border-bottom:1px solid #1e2230!important;
  }
  #death-won-panel .dw-mark{
    width:24px!important;height:24px!important;border-radius:5px!important;font-size:13px!important;
    border:1px solid #8f60c9!important;background:linear-gradient(180deg,#713f99 0%,#3b2b65 100%)!important;
    box-shadow:0 0 0 1px rgba(255,255,255,.03) inset,0 4px 16px rgba(123,97,255,.20)!important;
  }
  #death-won-panel .dw-title{font-size:17px!important;font-weight:900!important;letter-spacing:1px!important}
  #death-won-panel .dw-title b{color:#f0e8ff!important;text-shadow:none!important}
  #death-won-panel .dw-sub{display:none!important}
  #death-won-panel .dw-online,#death-won-panel .dw-version,#death-won-panel .dw-head-btn,#death-won-panel .dw-x{
    background:#151825!important;border:1px solid #2b3042!important;color:#d7d9e6!important;border-radius:4px!important;
    box-shadow:none!important;
  }
  #death-won-panel .dw-online{padding:6px 9px!important;font-size:10px!important;color:#a7efd0!important;border-color:#26483d!important;background:#101a17!important}
  #death-won-panel .dw-head-btn{padding:7px 10px!important;cursor:pointer}
  #death-won-panel .dw-version{padding:6px 9px!important;font-size:10px!important;color:#c8bbf2!important}
  #death-won-panel .dw-x{width:28px!important;height:28px!important;font-size:18px!important}
  #death-won-panel .dw-main{background:#0a0b12!important;height:calc(100% - 96px)!important}
  #death-won-panel .dw-nav{
    width:238px!important;flex-basis:238px!important;background:#0c0d14!important;border-right:1px solid #181b24!important;
    padding:10px 8px 10px!important;
  }
  #death-won-panel .dw-navlabel{
    font-size:9px!important;letter-spacing:1.4px!important;padding:6px 10px 10px!important;color:#f0ecf8!important;
  }
  #death-won-panel .dw-navtotal{
    background:#151827!important!important;border:1px solid #2b3044!important;border-radius:3px!important;color:#c9baf3!important
  }
  #death-won-panel .dw-navsearch-wrap{
    min-height:36px!important;border-radius:4px!important;background:#10131d!important;border:1px solid #22283a!important;
    box-shadow:none!important;display:flex!important;align-items:center!important;gap:8px!important;padding:0 10px!important;
  }
  #death-won-panel #dw-nav-search{background:transparent!important;border:0!important;margin:0!important;padding:0!important;color:#e8ebfb!important}
  #death-won-panel .dw-navhint{
    border-top:1px solid #1a1e29!important;color:#8e95aa!important;padding:11px 9px 6px!important;font-size:10px!important;
  }
  #death-won-panel .dw-group-head{
    border:1px solid #1b1f2d!important;background:#0f121b!important;border-radius:4px!important;color:#8f97ad!important;
    padding:8px 10px!important;margin-top:6px!important;font-size:10px!important;letter-spacing:.8px!important;
  }
  #death-won-panel .dw-group-head:hover{background:#131725!important;color:#e6d6ff!important}
  #death-won-panel .dw-group-count{background:#181c2a!important;border:1px solid #2a3143!important;border-radius:3px!important;padding:1px 5px!important;color:#c9baf0!important}
  #death-won-panel .dw-group-body{padding:4px 0 8px!important}
  #death-won-panel .dw-tab{
    margin:2px 0!important;min-height:30px!important;padding:7px 9px!important;gap:8px!important;border-radius:3px!important;
    font-size:11px!important;font-weight:700!important;color:#9ba2b7!important;background:transparent!important;border:1px solid transparent!important;
  }
  #death-won-panel .dw-tab:hover{background:#121726!important!important;color:#f4f5fb!important;border-color:#242b40!important}
  #death-won-panel .dw-tab.active{
    background:linear-gradient(180deg,#251932 0%,#1b1326 100%)!important;color:#ffffff!important;
    border-color:#4f3567!important;box-shadow:inset 2px 0 #d44486!important,0 0 18px rgba(212,68,134,.14)!important;
  }
  #death-won-panel .dw-tabicon{width:17px!important;font-size:13px!important;opacity:.92!important}
  #death-won-panel .dw-content{
    padding:18px 18px 16px!important;background:linear-gradient(180deg,#0b0c13 0%,#0a0b11 100%)!important;
  }
  #death-won-panel .dw-heading{
    margin:0 0 4px!important;font-size:14px!important;font-weight:900!important;letter-spacing:1.1px!important;
    text-transform:uppercase!important;color:#f2effa!important;
  }
  #death-won-panel .dw-desc{font-size:10px!important;line-height:1.45!important;color:#8d94a7!important;margin:0 0 14px!important}
  #death-won-panel .dw-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
  #death-won-panel .dw-toggle,#death-won-panel .dw-action{
    min-height:84px!important;padding:11px 11px 25px!important;border-radius:4px!important;
    background:linear-gradient(180deg,#111520 0%,#0f131c 100%)!important;border:1px solid #1f2535!important;
    box-shadow:none!important;transform:none!important;
  }
  #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{
    background:#151a27!important;border-color:#313a52!important;transform:none!important;box-shadow:none!important;
  }
  #death-won-panel .dw-toggle.on{
    background:linear-gradient(180deg,#1a1626 0%,#171321 100%)!important;border-color:#5e4279!important;
    box-shadow:inset 2px 0 #d44486!important,0 0 18px rgba(212,68,134,.10)!important;
  }
  #death-won-panel .dw-name{font-size:11px!important;font-weight:800!important;line-height:1.32!important;color:#f1f3fa!important;padding-right:52px!important}
  #death-won-panel .dw-hint{font-size:9.5px!important;line-height:1.35!important;color:#8891a6!important;margin-top:5px!important}
  #death-won-panel .dw-indicator{top:10px!important;right:10px!important;font-size:9px!important;color:#979fb5!important}
  #death-won-panel .dw-toggle.on .dw-indicator{color:#f09bcb!important}
  #death-won-panel .dw-shortcut{
    right:8px!important;bottom:7px!important;font-size:8.5px!important;padding:2px 6px!important;border-radius:3px!important;
    color:#b3b9ca!important;background:#181d29!important;border:1px solid #2d3448!important;
  }
  #death-won-panel .dw-section{margin-top:14px!important;padding-top:13px!important;border-top:1px solid #171b26!important}
  #death-won-panel .dw-range,
  #death-won-panel .dw-krow,
  #death-won-panel .dw-feature-note,
  #death-won-panel .dw-home-hero,
  #death-won-panel .dw-launch-btn,
  #death-won-panel .dw-sn-intro,
  #death-won-panel .dw-sn-foot,
  #death-won-panel .dw-flick-feature,
  #death-won-panel .dw-global-results{
    background:#10131d!important;border:1px solid #202638!important;border-radius:4px!important;box-shadow:none!important;
  }
  #death-won-panel .dw-range{padding:11px!important;margin-bottom:8px!important}
  #death-won-panel select,#death-won-panel input[type=number],#death-won-panel input[type=text],#death-won-panel input[type=search]{
    background:#0b0f18!important;border:1px solid #242c3d!important;border-radius:3px!important;padding:10px!important;
  }
  #death-won-panel select:focus,#death-won-panel input:focus{border-color:#6d4ca0!important;box-shadow:0 0 0 1px rgba(167,124,255,.25)!important}
  #death-won-panel input[type=range]{accent-color:#d44486!important}
  #death-won-panel .dw-bind,#death-won-panel .dw-clear{border-radius:3px!important}
  #death-won-panel .dw-search-head{color:#ca9be4!important}
  #death-won-panel .dw-search-hit{border-top-color:#1b2233!important;font-size:10px!important}
  #death-won-panel .dw-search-hit:hover{background:#1b1530!important}
  #death-won-panel .dw-bottom{
    height:38px!important;background:#090a10!important;border-top:1px solid #171b24!important;color:#8e95aa!important;font-size:9.5px!important;
  }
  #death-won-panel .dw-bottom strong{color:#e5d8ff!important}
  #death-won-panel .dw-content::-webkit-scrollbar,#death-won-panel .dw-nav::-webkit-scrollbar{width:8px;height:8px}
  #death-won-panel .dw-content::-webkit-scrollbar-thumb,#death-won-panel .dw-nav::-webkit-scrollbar-thumb{background:#202636;border-radius:20px}
  @media (max-width: 1200px){#death-won-panel .dw-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media (max-width: 800px){#death-won-panel .dw-grid{grid-template-columns:1fr!important}#death-won-panel .dw-nav{width:180px!important;flex-basis:180px!important}}
  `;


  style.textContent += `
  /* V14.2 FATALITY-INSPIRED LAYOUT */
  #death-won-panel .dw-superbar{height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 12px;
    background:linear-gradient(180deg,#0e1017 0%,#0b0d14 100%);border-bottom:1px solid #171b24}
  #death-won-panel .dw-topcats{display:flex;align-items:center;gap:6px;overflow:auto;scrollbar-width:none}
  #death-won-panel .dw-topcats::-webkit-scrollbar{display:none}
  #death-won-panel .dw-topcat{height:26px;padding:0 12px;border-radius:3px;border:1px solid #222739;background:#11141d;color:#a9b0c3;
    font:800 10px/24px Inter,system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;white-space:nowrap}
  #death-won-panel .dw-topcat:hover{background:#151928;color:#f4f6fb;border-color:#313851}
  #death-won-panel .dw-topcat.active{background:linear-gradient(180deg,#2a1932 0%,#1c1424 100%);color:#fff;border-color:#5c3867;box-shadow:inset 0 2px #d44486}
  #death-won-panel .dw-supermeta{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#687086;padding-right:6px;white-space:nowrap}
  #death-won-panel .dw-main{height:calc(100% - 134px)!important}
  #death-won-panel .dw-nav{width:206px!important;flex-basis:206px!important}
  #death-won-panel .dw-content{padding:14px 14px 12px!important}
  #death-won-panel .dw-heading{font-size:13px!important}
  #death-won-panel .dw-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important}
  #death-won-panel .dw-toggle,#death-won-panel .dw-action{min-height:76px!important;padding:10px 10px 24px!important}
  #death-won-panel .dw-name{font-size:10.5px!important;padding-right:50px!important}
  #death-won-panel .dw-hint{font-size:9px!important;line-height:1.3!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  #death-won-panel .dw-indicator{font-size:8.5px!important}
  #death-won-panel .dw-range{padding:10px!important;border-radius:3px!important}
  #death-won-panel label[style*="display:block"]{display:block;background:#10131d;border:1px solid #202638;border-radius:3px;padding:9px 10px 10px;margin-bottom:8px!important}
  #death-won-panel .dw-krow{padding:9px 10px!important;border-radius:3px!important}
  #death-won-panel .dw-group-head{padding:7px 9px!important}
  #death-won-panel .dw-search-head{padding:9px 10px 7px!important}
  @media (max-width: 1280px){#death-won-panel .dw-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media (max-width: 1024px){#death-won-panel .dw-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media (max-width: 800px){#death-won-panel .dw-grid{grid-template-columns:1fr!important}#death-won-panel .dw-nav{width:170px!important;flex-basis:170px!important}}
  `;


  style.textContent += `
  #death-won-panel .dw-v14-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;margin:6px 0 17px!important}
  @media (max-width: 1280px){#death-won-panel .dw-v14-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media (max-width: 1024px){#death-won-panel .dw-v14-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media (max-width: 800px){#death-won-panel .dw-v14-grid{grid-template-columns:1fr!important}}
  `;


  style.textContent += `
    #death-won-panel .dw-v14-grid .dw-toggle[data-bind-id^="flag:v15_"]{
      min-height:99px!important;background:#121626!important;border-color:#30324a!important}
    #death-won-panel .dw-v14-grid .dw-toggle[data-bind-id^="flag:v15_"].on{
      border-color:#c078e0!important;box-shadow:inset 3px 0 #df77b9!important}
    #death-won-panel .dw-v14-grid .dw-toggle[data-bind-id^="flag:v15_"] .dw-name{
      font-size:11px!important;line-height:1.4!important}
  `;


  style.textContent += `
  #death-won-panel .v17-box{margin:0 0 10px;padding:15px;background:#11131e;border:1px solid #3a2c57;border-radius:7px;max-width:100%;min-width:0}
  #death-won-panel .v17-title{font:800 12px/1.3 ui-sans-serif,system-ui;letter-spacing:.5px;color:#eacfff;margin-bottom:6px}
  #death-won-panel .v17-sub{font:11px/1.5 ui-sans-serif,system-ui;color:#a5a4c1;margin:6px 0 9px}
  #death-won-panel .v17-button{cursor:pointer;display:inline-flex;align-items:center;margin:3px 6px 3px 0;padding:9px 12px;background:#252039;border:1px solid #584778;border-radius:5px;color:#e7dcff;font:700 10px ui-sans-serif,system-ui}
  #death-won-panel .v17-button:hover{background:#392950;border-color:#c18cff}
  #death-won-panel .v17-inline{display:flex;align-items:center;flex-wrap:wrap;border-bottom:1px solid #252238;padding:4px 0;gap:3px}
  #death-won-panel .v17-field{display:inline-flex;flex-direction:column;min-width:min(215px,100%);max-width:100%;gap:6px;margin:6px 14px 8px 0!important;padding:0!important;font:700 10px ui-sans-serif,system-ui;color:#c4bce1;border:none!important;background:transparent!important}
  #death-won-panel .v17-select{max-width:300px;width:100%;padding:8px;color:#f0e8ff;background:#161320;border:1px solid #443656;border-radius:4px}
  #death-won-panel .v17-field input[type=range]{margin:3px 0;accent-color:#b681f7;width:100%}
  #death-won-panel .v17-range-title{display:flex;justify-content:space-between;gap:15px;min-width:200px}
  #death-won-panel .v17-favname{width:200px;display:inline-block;max-width:40%;font:600 11px ui-sans-serif,system-ui;color:#ece2ff}
  #death-won-panel .v17-graph{display:block;width:100%;max-width:100%;border:1px solid #332a49;border-radius:5px;background:#0b0c16;margin:8px 0}
  #death-won-panel .v17-data,#death-won-panel #v17-live-stats{font:700 11px/1.5 ui-monospace,monospace;color:#bfe5ef;background:#15182a;padding:11px;margin:9px 0;border:1px solid #303f5d;border-radius:5px}
  #death-won-panel .v17-timeline{max-height:300px;overflow-y:auto;background:#0a0b15;padding:9px 12px;color:#c1b8d7;font:11px/1.8 ui-monospace,monospace}
  #death-won-panel .v17-timeline div{border-bottom:1px solid #1b1e2e;padding:3px 0}
  `;

  style.textContent += `
  #death-won-panel .sl-notice{background:#1b1423;border:1px solid #6c3d84;color:#d6bfeb;font:bold 11px/1.6 system-ui;padding:10px 13px;border-radius:4px;margin-bottom:10px}
  #death-won-panel .sl-layout{display:grid;grid-template-columns:minmax(340px,1fr) minmax(360px,1fr);gap:11px;align-items:start}
  #death-won-panel .sl-column{display:grid;gap:10px;min-width:0}
  #death-won-panel .sl-panel{background:#10111b;border:1px solid #322843;border-radius:5px;padding:13px;min-width:0;overflow:hidden}
  #death-won-panel .sl-panel h3{margin:0 0 11px;color:#dac8f4;font:900 11px/1.3 system-ui;letter-spacing:1.2px}
  #death-won-panel .sl-line{display:grid;grid-template-columns:minmax(160px,1fr) minmax(140px,.48fr);gap:9px;align-items:end}
  #death-won-panel .sl-field{display:flex;flex-direction:column;gap:5px;font:700 10px system-ui;color:#c9b9de;margin-bottom:10px}
  #death-won-panel .sl-field input{width:100%;border:1px solid #4b3b5a;border-radius:4px;padding:8px;background:#0a0b13;color:#f4efff;font:600 12px system-ui}
  #death-won-panel .sl-line .v17-field{width:100%;min-width:0;max-width:none}
  #death-won-panel .sl-line .v17-select{width:100%}
  #death-won-panel .sl-results{display:flex;gap:5px;flex-wrap:wrap;max-height:122px;overflow-y:auto;margin-top:8px}
  #death-won-panel .sl-result{border:1px solid #3b324e;background:#1a1828;color:#cec8e9;cursor:pointer;border-radius:3px;padding:5px 8px;font:650 10px system-ui}
  #death-won-panel .sl-result:hover{border-color:#ad73d9;background:#302441;color:#fff}
  #death-won-panel .sl-custom{color:#e5c1fb;border-color:#725289}
  #death-won-panel .sl-buttons{display:flex;flex-wrap:wrap;gap:7px;margin-top:7px}
  #death-won-panel .sl-buttons .v17-button{margin:0!important;padding:8px 10px!important;font-size:10px!important}
  #death-won-panel .sl-preview{display:block;width:100%;height:auto;border-radius:5px;border:1px solid #423550;background:#070b14}
  #death-won-panel .sl-muted{font:11px/1.6 system-ui;color:#9f94b3;margin:8px 0}
  #death-won-panel .sl-inventory{max-height:225px;overflow-y:auto;display:grid;gap:5px}
  #death-won-panel .sl-inv-item{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:5px;background:#171523;border:1px solid #322a42;border-radius:4px;padding:4px}
  #death-won-panel .sl-inv-item.selected{border-color:#a373e4}
  #death-won-panel .sl-inv-item button{border:0;border-radius:3px;background:#1f1a2b;color:#d7c9ed;font:650 10px system-ui;text-align:left;padding:7px;cursor:pointer;min-width:0}
  #death-won-panel .sl-inv-item button:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #death-won-panel .sl-inv-item button:hover{background:#3c2c56}
  #death-won-panel .sl-roll-panel{margin-top:12px}
  #death-won-panel .sl-ribbon{position:relative;height:77px;overflow:hidden;border:1px solid #4a355d;background:#080812;border-radius:5px;margin:10px 0}
  #death-won-panel .sl-ribbon:after{content:'';position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fbc36f;box-shadow:0 0 11px #ffbe69;z-index:2}
  #death-won-panel .sl-ribbon-track{display:flex;gap:0;align-items:center;height:100%;width:max-content;transform:translateX(0)}
  #death-won-panel .sl-roll-cell{flex:0 0 171px;max-width:171px;height:68px;border:1px solid #403354;padding:14px 9px;background:linear-gradient(130deg,#241c34,#111524);color:#ecddfb;font:700 11px/1.4 system-ui;display:flex;align-items:center;justify-content:center;text-align:center}
  #death-won-panel .sl-roll-result{text-align:center;font:900 13px/1.5 system-ui;color:#e7c38d;letter-spacing:.6px;min-height:25px}
  @media(max-width:1000px){#death-won-panel .sl-layout{grid-template-columns:1fr}#death-won-panel .sl-line{grid-template-columns:1fr}}
  `;

  document.head.append(style);
  const panel = document.createElement('div');panel.id='death-won-panel';
  panel.innerHTML = `<div class="dw-top"><div class="dw-mark">V</div><div><div class="dw-title">VOID<b>WARE</b></div><div class="dw-sub">VOIDWARE V19.1 <span class="dw-dot">·</span> Studio edition</div></div>
    <div class="dw-topright"><span class="dw-online" id="dw-bot-status">● LOCAL MATCH</span><button class="dw-head-btn" id="dw-open-home" title="Home dashboard">Home</button><span class="dw-version">v18.2</span><button class="dw-x" id="dw-close" title="Close menu">×</button></div></div>
    <div class="dw-superbar" role="navigation" aria-label="Main categories"><div class="dw-topcats" id="dw-topcats"></div><span class="dw-supermeta">Local bot sandbox</span></div>
    <div class="dw-subbar" role="navigation" aria-label="Category sub-tabs">
      <button class="dw-sub-arrow" id="dw-sub-left" type="button" title="Scroll tabs left" aria-label="Scroll tabs left">‹</button>
      <div id="dw-nav" class="dw-subnav" role="tablist" aria-label="Pages"></div>
      <button class="dw-sub-arrow" id="dw-sub-right" type="button" title="Scroll tabs right" aria-label="Scroll tabs right">›</button>
      <label class="dw-navsearch-wrap"><span>⌕</span><input id="dw-nav-search" type="search" placeholder="Search settings..." autocomplete="off" aria-label="Search powers and tabs"></label>
    </div>
    <div class="dw-main"><main class="dw-content" id="dw-content"></main></div>
    <div class="dw-bottom"><strong id="dw-status">READY</strong><span style="margin-left:auto">U MENU · O VISIBLE FLICK · END RESET</span></div>`;
  document.body.append(panel);panel.style.display='none';
  const curtain=document.createElement('div');curtain.id='death-won-curtain';
  document.body.insertBefore(curtain,panel);

  function applyTheme(){
    const [accent,deep,light,bg,dim]=themes[uiTheme];
    panel.style.setProperty('--dw-accent',accent,'important');panel.style.setProperty('--dw-deep',deep,'important');
    panel.style.setProperty('--dw-light',light);panel.style.setProperty('--dw-bg',bg);panel.style.setProperty('--dw-dim',dim);
    panel.style.opacity=String(uiOpacity);
    panel.style.transform='translate(-50%,-50%) scale('+uiScale+')';
    saveUi();
  }
  applyTheme();
  const nav=panel.querySelector('#dw-nav'), content=panel.querySelector('#dw-content'), statusEl=panel.querySelector('#dw-status');
  const topCatsEl=panel.querySelector('#dw-topcats');
  const visibleCountEl=panel.querySelector('#dw-nav-visible-total');
  const topCategories=[
    ['home','Home',['home','finder','presets','performance']],
    ['fps','FPS Boost',['fps:lab']],
    ['rage','Rage',['rage','mega','v15:aim','v15:trigger','v14:aim','v14:arsenal','v14:combat','v14:chaos','paradox','paradox131','omega:combat','ov:combat','sn:mayhem','re:cosmic','re:tech','re:mutations']],
    ['legit','Legit',['v17:aim','legit','legitpro','v16:aim','v16:trigger','move','rocket','ov:movement','ov:blink','omega:movement','sn:rocket','sn:mobility','v15:movement','v14:movement']],
    ['visuals','Visuals',['visual','ov:visual','sn:visuals','omega:studio','v15:visuals','v14:visuals','re:visual']],
    ['misc','Misc',['v17:replay','bots','extras','nightfall','ov:survival','ov:formations','ov:control','ov:physics','ov:challenge','sn:gravity','sn:circus','sn:arena','sn:survival','sn:challenge','v14:survival','v14:bots','v14:physics','v14:arena','re:goofy','omega:goofy','omega:zeus']],
    ['skins','Skins',['v17:skins','v17:armory','guns','models','audio','v16:weapon','ov:weapons','v15:weapons','sn:arsenal']],
    ['config','Config',['v17:studio','custom','hotkeys']]
  ];
  for(const [cat,id] of [['rage','v18:rage'],['legit','v18:legit'],['skins','v18:skins'],['config','v18:studio'],['misc','v18:replay']]){topCategories.find(x=>x[0]===cat)[2].unshift(id);}
  const topCatByTab=new Map(); for(const [cid,_label,ids] of topCategories){for(const id of ids)if(!topCatByTab.has(id))topCatByTab.set(id,cid);}
  let currentTopCategory=topCatByTab.get(activeTab)||'rage';
  const topCatButtons=new Map();
  const tabsForCategory=cid=>(topCategories.find(x=>x[0]===cid)?.[2]||[]).filter(id=>tabInfo.has(id));
  const categoryForTab=id=>topCatByTab.get(id)||'misc';
  function renderTopCats(){
    topCatsEl.replaceChildren();
    for(const [cid,label] of topCategories){
      const b=document.createElement('button');b.type='button';b.className='dw-topcat'+(cid===currentTopCategory?' active':'');b.textContent=label;
      b.addEventListener('click',()=>{if(!tabsForCategory(cid).includes(activeTab)){selectTab(tabsForCategory(cid)[0]||'home');}else{currentTopCategory=cid;renderTopCats();refreshNav();}});
      topCatsEl.append(b);topCatButtons.set(cid,b);
    }
  }
  const esp=document.createElement('div');esp.id='death-won-esp';document.body.append(esp);
  const espCanvas=document.createElement('canvas');espCanvas.id='death-won-esp-canvas';esp.append(espCanvas);
  const ctx=espCanvas.getContext('2d');
  const cross=document.createElement('div');cross.id='death-won-center';cross.textContent='+';document.body.append(cross);
  const flyHud=document.createElement('div');flyHud.id='death-won-flight-hud';flyHud.style.display='none';document.body.append(flyHud);
  const v6Hud=document.createElement('div');v6Hud.id='dw-v6-hud';v6Hud.style.cssText='position:fixed;z-index:2147483635;left:14px;top:14px;color:#dbe9ff;background:#070c18d9;border:1px solid #28436a;box-shadow:0 0 30px #0cf2;border-radius:11px;font:700 12px/1.5 ui-sans-serif,system-ui;padding:9px 13px;display:none;pointer-events:none;white-space:pre-line';document.body.append(v6Hud);
  const notice=(msg)=>{lastMsg=msg;statusEl.textContent=msg;console.log('[VOIDWARE]',msg)};
  const onlineEl=panel.querySelector('#dw-bot-status');
  const enemyBots=()=>g.botMgr.bots.filter(b=>b.alive && b.team!==g.player.team);
  const allBots=()=>g.botMgr.bots.filter(b=>b.alive);
  const safe=(fn)=>{try{return fn()}catch(e){console.error('[VOIDWARE]',e);notice('ERROR: '+e.message)}};
  function section(label, hint='') {
    const el=document.createElement('div');el.innerHTML=`<h3 class="dw-heading"></h3><p class="dw-desc"></p>`;
    el.querySelector('h3').textContent=label;el.querySelector('p').textContent=hint;content.append(el);
  }
  function grid(){const el=document.createElement('div');el.className='dw-grid';content.append(el);return el}
  // Stable action/flag IDs let shortcuts work even when a tab is not open.
  const actions = new Map();
  // VOIDWARE V9.1: 100 new local-bot lab powers, all in one self-contained script.
  const odPowers=[{"id":"regenerative-core","name":"Regenerative Core","mode":"t","desc":"Steadily recover health.","group":"survival","icon":"🛡"},{"id":"sprint-medic","name":"Sprint Medic","mode":"t","desc":"Heal while moving quickly.","group":"survival","icon":"🛡"},{"id":"overshield-engine","name":"Overshield Engine","mode":"t","desc":"Build armor beyond 100.","group":"survival","icon":"🛡"},{"id":"helmet-insurance","name":"Helmet Insurance","mode":"t","desc":"Automatically re-equip helmet.","group":"survival","icon":"🛡"},{"id":"last-breath","name":"Last Breath","mode":"t","desc":"Emergency heal at critical HP.","group":"survival","icon":"🛡"},{"id":"team-field-medic","name":"Team Field Medic","mode":"t","desc":"Regenerate nearby friendly bots.","group":"survival","icon":"🛡"},{"id":"armor-lock","name":"Armor Lock","mode":"t","desc":"Never let armor fall under a minimum.","group":"survival","icon":"🛡"},{"id":"restore-vitals","name":"Restore Vitals","mode":"a","desc":"Full heal and standard armor.","group":"survival","icon":"🛡"},{"id":"life-siphon","name":"Life Siphon","mode":"a","desc":"Steal life from surrounding enemies.","group":"survival","icon":"🛡"},{"id":"borrow-armor","name":"Borrow Enemy Armor","mode":"a","desc":"Take some armor from the nearest enemy.","group":"survival","icon":"🛡"},{"id":"forward-thrusters","name":"Forward Thrusters","mode":"t","desc":"Extra acceleration while running forward.","group":"movement","icon":"⚡"},{"id":"reverse-gear","name":"Reverse Gear","mode":"t","desc":"Extra acceleration while moving backward.","group":"movement","icon":"⚡"},{"id":"side-surge","name":"Side Surge","mode":"t","desc":"Quicker left/right movement.","group":"movement","icon":"⚡"},{"id":"crouch-turbo","name":"Crouch Turbo","mode":"t","desc":"Gain forward momentum when crouching.","group":"movement","icon":"⚡"},{"id":"fall-cushion","name":"Fall Cushion","mode":"t","desc":"Slow down on dangerous descents.","group":"movement","icon":"⚡"},{"id":"hover-while-space","name":"Space Hover","mode":"t","desc":"Hold Space while airborne to gain lift.","group":"movement","icon":"⚡"},{"id":"air-handbrake","name":"Air Handbrake","mode":"t","desc":"Use CTRL in mid-air to reduce drift.","group":"movement","icon":"⚡"},{"id":"sky-kick","name":"Sky Kick","mode":"a","desc":"Launch yourself straight up.","group":"movement","icon":"⚡"},{"id":"dash-left","name":"Dash Left","mode":"a","desc":"Instant sideways dash left.","group":"movement","icon":"⚡"},{"id":"dash-right","name":"Dash Right","mode":"a","desc":"Instant sideways dash right.","group":"movement","icon":"⚡"},{"id":"od-forward","name":"Safe Blink Forward","mode":"a","desc":"Ground-checked blink forward.","group":"blink","icon":"⌁"},{"id":"od-backward","name":"Safe Blink Backward","mode":"a","desc":"Ground-checked blink backward.","group":"blink","icon":"⌁"},{"id":"od-left","name":"Safe Blink Left","mode":"a","desc":"Ground-checked blink to the left.","group":"blink","icon":"⌁"},{"id":"od-right","name":"Safe Blink Right","mode":"a","desc":"Ground-checked blink to the right.","group":"blink","icon":"⌁"},{"id":"nearest-ally","name":"Visit Teammate","mode":"a","desc":"Teleport beside a friendly bot.","group":"blink","icon":"⌁"},{"id":"nearest-enemy","name":"Visit Enemy","mode":"a","desc":"Teleport beside an enemy bot.","group":"blink","icon":"⌁"},{"id":"behind-enemy","name":"Behind Enemy","mode":"a","desc":"Appear behind the closest enemy.","group":"blink","icon":"⌁"},{"id":"save-anchor","name":"Set Recall Anchor","mode":"a","desc":"Save this position.","group":"blink","icon":"⌁"},{"id":"recall-anchor","name":"Recall Anchor","mode":"a","desc":"Return to your saved spot.","group":"blink","icon":"⌁"},{"id":"fix-ground","name":"Safe Ground Snap","mode":"a","desc":"Correct altitude to stand above nearby ground.","group":"blink","icon":"⌁"},{"id":"ring","name":"Circle of Bots","mode":"a","desc":"Place bots around you in a ring.","group":"formations","icon":"◇"},{"id":"double-ring","name":"Double Ring","mode":"a","desc":"Two rings of bots at different ranges.","group":"formations","icon":"◇"},{"id":"line","name":"Bot Parade","mode":"a","desc":"Line up bots sideways in front of you.","group":"formations","icon":"◇"},{"id":"column","name":"Bot Column","mode":"a","desc":"Single-file column in front of you.","group":"formations","icon":"◇"},{"id":"grid","name":"Bot Grid","mode":"a","desc":"Arrange enemies in a rectangular grid.","group":"formations","icon":"◇"},{"id":"wave","name":"Bot Wave","mode":"a","desc":"Arrange bots in a wave pattern.","group":"formations","icon":"◇"},{"id":"spiral","name":"Bot Spiral","mode":"a","desc":"Arrange bots in an outward spiral.","group":"formations","icon":"◇"},{"id":"wedge","name":"Bot Wedge","mode":"a","desc":"Make a V-shaped bot formation.","group":"formations","icon":"◇"},{"id":"checker","name":"Bot Checkerboard","mode":"a","desc":"Stagger bots in a checkerboard.","group":"formations","icon":"◇"},{"id":"scatter","name":"Bot Scatter","mode":"a","desc":"Spread bots around the arena.","group":"formations","icon":"◇"},{"id":"fear-zone","name":"Fear Zone","mode":"t","desc":"Nearby bots back away.","group":"control","icon":"◉"},{"id":"silence-zone","name":"Quiet Zone","mode":"t","desc":"Nearby bots pause their gunfire.","group":"control","icon":"◉"},{"id":"slow-turn","name":"Slow Turning","mode":"t","desc":"Limit how quickly enemy bots turn.","group":"control","icon":"◉"},{"id":"bot-speed-cap","name":"Speed Limit","mode":"t","desc":"Limit enemy horizontal velocity.","group":"control","icon":"◉"},{"id":"panic-jam","name":"Weapon Jam","mode":"t","desc":"Delay enemy firing near you.","group":"control","icon":"◉"},{"id":"pulse-flash","name":"Flash Pulse","mode":"t","desc":"Periodically blind nearby enemies.","group":"control","icon":"◉"},{"id":"head-spinners","name":"Head Spinners","mode":"t","desc":"Spin enemy bot yaw while nearby.","group":"control","icon":"◉"},{"id":"crowd-push","name":"Crowd Push","mode":"a","desc":"Push nearby bots away.","group":"control","icon":"◉"},{"id":"crowd-pull","name":"Crowd Pull","mode":"a","desc":"Pull nearby bots toward you.","group":"control","icon":"◉"},{"id":"disarm-near","name":"Disarm Nearest","mode":"a","desc":"Replace nearest enemy gun with a knife.","group":"control","icon":"◉"},{"id":"burning-aura","name":"Damage Over Time","mode":"t","desc":"Damage enemies nearby without instant deletion.","group":"combat","icon":"☠"},{"id":"acid-armor","name":"Acid Armor Aura","mode":"t","desc":"Slowly corrode enemy armor.","group":"combat","icon":"☠"},{"id":"execute-low","name":"Execute Low HP","mode":"t","desc":"Finish enemies below a low-health threshold.","group":"combat","icon":"☠"},{"id":"health-limit","name":"Health Limiter","mode":"t","desc":"Cap the health of all enemies.","group":"combat","icon":"☠"},{"id":"armor-limit","name":"Armor Limiter","mode":"t","desc":"Cap enemy armor while enabled.","group":"combat","icon":"☠"},{"id":"knockback-pulse","name":"Knockback Pulse","mode":"t","desc":"Periodic radial knockback.","group":"combat","icon":"☠"},{"id":"chain-elimination","name":"Chain Elimination","mode":"t","desc":"A player kill damages a nearby second target.","group":"combat","icon":"☠"},{"id":"one-shot-mark","name":"One-Shot Mark","mode":"a","desc":"Set the nearest enemy to one HP.","group":"combat","icon":"☠"},{"id":"all-armor-break","name":"Armor Break All","mode":"a","desc":"Remove armor from all enemies.","group":"combat","icon":"☠"},{"id":"enemy-debuff-wave","name":"Enemy Debuff Wave","mode":"a","desc":"Damage, blind and slow all enemies.","group":"combat","icon":"☠"},{"id":"mag-reserve","name":"Pocket Reserve","mode":"t","desc":"Top up current weapon reserve gradually.","group":"weapons","icon":"✦"},{"id":"clip-rescue","name":"Clip Rescue","mode":"t","desc":"Restore a few rounds when the clip is nearly empty.","group":"weapons","icon":"✦"},{"id":"hotshot","name":"Hotshot","mode":"t","desc":"Reduce firing cooldown (independent of Rapid Fire).","group":"weapons","icon":"✦"},{"id":"scout-boost","name":"Scout Boost","mode":"t","desc":"Keep a full SSG 08 magazine when equipped.","group":"weapons","icon":"✦"},{"id":"auto-secondary","name":"Sidearm Backup","mode":"t","desc":"Equip a pistol if the primary is empty.","group":"weapons","icon":"✦"},{"id":"swap-roulette","name":"Weapon Roulette","mode":"a","desc":"Give a random primary gun.","group":"weapons","icon":"✦"},{"id":"heavy-awp","name":"AWP Supply","mode":"a","desc":"Give an AWP plus ammo.","group":"weapons","icon":"✦"},{"id":"scout-kit","name":"Scout Supply","mode":"a","desc":"Give a Scout plus ammo.","group":"weapons","icon":"✦"},{"id":"ak-kit","name":"AK Supply","mode":"a","desc":"Give an AK plus ammo.","group":"weapons","icon":"✦"},{"id":"deagle-kit","name":"Deagle Supply","mode":"a","desc":"Give a Deagle plus ammo.","group":"weapons","icon":"✦"},{"id":"low-gravity-bots","name":"Low Gravity Bots","mode":"t","desc":"Give bots an upward nudge.","group":"physics","icon":"☄"},{"id":"heavy-gravity-bots","name":"Heavy Gravity Bots","mode":"t","desc":"Pull bots toward the floor.","group":"physics","icon":"☄"},{"id":"floaters","name":"Floaters","mode":"t","desc":"Let enemies hover upward gently.","group":"physics","icon":"☄"},{"id":"feather-fall-bots","name":"Bot Feather Fall","mode":"t","desc":"Reduce falling speed of bots.","group":"physics","icon":"☄"},{"id":"speed-up-bots","name":"Fast Enemies","mode":"t","desc":"Make enemy movement more intense.","group":"physics","icon":"☄"},{"id":"sticky-bots","name":"Sticky Bots","mode":"t","desc":"Dampen enemy movement.","group":"physics","icon":"☄"},{"id":"popcorn","name":"Popcorn Bots","mode":"t","desc":"Periodically bounce enemy bots.","group":"physics","icon":"☄"},{"id":"meteor-strike","name":"Meteor Launch","mode":"a","desc":"Launch enemy bots upward.","group":"physics","icon":"☄"},{"id":"gravity-slam","name":"Gravity Slam","mode":"a","desc":"Push airborne bots downward.","group":"physics","icon":"☄"},{"id":"freeze-velocity","name":"Momentum Freeze","mode":"a","desc":"Zero all bot velocities.","group":"physics","icon":"☄"},{"id":"floor-rings","name":"Enemy Floor Rings","mode":"t","desc":"Draw animated rings at enemy feet.","group":"visual","icon":"◈"},{"id":"skull-pins","name":"Skull Pins","mode":"t","desc":"Skull labels over bot heads.","group":"visual","icon":"◈"},{"id":"velocity-rays","name":"Velocity Rays","mode":"t","desc":"Draw enemy movement vectors.","group":"visual","icon":"◈"},{"id":"ally-beacons","name":"Ally Beacons","mode":"t","desc":"Teal indicators over teammate bots.","group":"visual","icon":"◈"},{"id":"danger-halo","name":"Danger Halo","mode":"t","desc":"Highlight nearby enemies with red circles.","group":"visual","icon":"◈"},{"id":"speedometer","name":"Speedometer","mode":"t","desc":"Draw your ground speed on screen.","group":"visual","icon":"◈"},{"id":"fps-meter","name":"FPS Meter","mode":"t","desc":"Display live measured browser frame rate.","group":"visual","icon":"◈"},{"id":"compact-compass","name":"Compass HUD","mode":"a","desc":"Toggle the compass overlay.","group":"visual","icon":"◈"},{"id":"hide-visuals","name":"Hide All Visuals","mode":"a","desc":"Turn off visual powers and ESP instantly.","group":"visual","icon":"◈"},{"id":"visual-party","name":"Visual Party","mode":"a","desc":"Turn on the four major new markers.","group":"visual","icon":"◈"},{"id":"boss-enemy","name":"Boss Enemy","mode":"t","desc":"Boost a selected enemy into a boss.","group":"challenge","icon":"⚔"},{"id":"enemy-overclock","name":"Enemy Overclock","mode":"t","desc":"Enemies move and shoot faster.","group":"challenge","icon":"⚔"},{"id":"zombie-walk","name":"Zombie Walk","mode":"t","desc":"Enemies walk slowly toward you.","group":"challenge","icon":"⚔"},{"id":"fragile-hero","name":"Fragile Hero","mode":"t","desc":"Keep your health capped at a risky level.","group":"challenge","icon":"⚔"},{"id":"no-scope-trainer","name":"No-Scope Trainer","mode":"t","desc":"Unscope automatically for sniper practice.","group":"challenge","icon":"⚔"},{"id":"target-carousel","name":"Target Carousel","mode":"t","desc":"Periodically select a new enemy.","group":"challenge","icon":"⚔"},{"id":"sudden-death","name":"Sudden Death","mode":"t","desc":"All living enemies have low HP.","group":"challenge","icon":"⚔"},{"id":"duel-setup","name":"1v1 Duel Setup","mode":"a","desc":"Leave one enemy standing; revive and heal it.","group":"challenge","icon":"⚔"},{"id":"sniper-gauntlet","name":"Sniper Gauntlet","mode":"a","desc":"Give bots snipers and cap their HP.","group":"challenge","icon":"⚔"},{"id":"reset-challenge","name":"Reset Challenge","mode":"a","desc":"Respawn bots and restore standard HP.","group":"challenge","icon":"⚔"}];
  const odById=new Map(odPowers.map(p=>[p.id,p]));
  const odFlagById=new Map(odPowers.filter(p=>p.mode==='t').map(p=>[p.id,'od_'+p.id.replace(/-/g,'_')]));
  const odLabelByFlag=new Map(Array.from(odFlagById,([k,v])=>[v,odById.get(k).name]));
  for(const k of odFlagById.values())flags[k]=false;
  flags.fpsBoost=false;
  const odStorage='deathWonV9_prefs';
  const odProfileStorage='deathWonV9_slots';
  let odPrefs={levels:{},fpsPreset:'balanced',espRate:30,quality:.8,selected:{}};
  try {const x=JSON.parse(localStorage.getItem(odStorage)||'{}');
    if(x&&typeof x==='object'){
      odPrefs.levels=x.levels&&typeof x.levels==='object'?x.levels:{};
      odPrefs.selected=x.selected&&typeof x.selected==='object'?x.selected:{};
      odPrefs.fpsPreset=['balanced','fast','extreme'].includes(x.fpsPreset)?x.fpsPreset:'balanced';
      odPrefs.espRate=Math.min(60,Math.max(5,Number(x.espRate)||30));
      odPrefs.quality=Math.min(1,Math.max(.45,Number(x.quality)||.8));
    }
  }catch(e){}
  const odSave=()=>{try{localStorage.setItem(odStorage,JSON.stringify(odPrefs))}catch(e){}};
  const odPowerLevel=id=>Math.min(4,Math.max(.25,Number(odPrefs.levels[id])||1));
  let odAnchor=null,odLastTick=0,odLastEsp=0,odLastFpsAt=0,odFpsFrames=0,odMeasuredFPS=0;
  let odLastPulse=0,odLastHeal=0,odLastCarousel=0,odLastBlink=0,odOverlayOn=false;
  const odPulseTimes=Object.create(null);
  const odPulseReady=(key,now,ms)=>{if(now-(odPulseTimes[key]||0)<ms)return false;odPulseTimes[key]=now;return true;};
  let odFrameDt=0,odBoss=null,odFpsSnapshot=null,odRendererRatio=null,odWasPlaying=false;
  let odWeaponHotshotOriginal=null,odFpsLastApply=0;
  const odGroups={"survival":["🛡","SURVIVAL & ARMOR"],"movement":["⚡","MOVEMENT ENGINE"],"blink":["⌁","TELEPORT LAB"],"formations":["◇","FORMATION FORGE"],"control":["◉","BOT CONTROL"],"combat":["☠","COMBAT MUTATORS"],"weapons":["✦","WEAPON WORKSHOP"],"physics":["☄","PHYSICS CHAOS"],"visual":["◈","VISUAL OVERDRIVE"],"challenge":["⚔","CHALLENGE MODES"]};

  const actionId = title => 'action:'+String(title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const storageKey='deathWonV4_hotkeys';
  const defaults={'nav:menu':'KeyU','nav:rage':'KeyP','nav:mega':'KeyQ','nav:panic':'End','action:delete-all-bots':'KeyI','flag:wallbang':'KeyV','flag:re_black_hole':'Alt+KeyB','flag:re_chicken_army':'Alt+KeyC','flag:re_time_stop':'Alt+KeyT','flag:noRecoil':'Alt+KeyR','flag:noSpread':'Alt+KeyN','flag:legitWallLock':'Alt+KeyL','action:stop-legit-lock':'Alt+KeyK','action:visible-head-flick':'KeyO','action:smooth-head-flick':'Shift+KeyO','flag:rocketRecoil':'Alt+KeyJ'};
  let bindings={...defaults};
  try {const prev=JSON.parse(localStorage.getItem(storageKey)||'{}');if(prev&&typeof prev==='object'&&!Array.isArray(prev)){
    for(const [id,key] of Object.entries(prev))if(typeof key==='string'&&key.length<85)bindings[id]=key;
  }}catch(e){console.warn('[VOIDWARE] Hotkey settings unavailable:',e)}
  const saveBindings=()=>{try{localStorage.setItem(storageKey,JSON.stringify(bindings))}catch(e){console.warn('[VOIDWARE] Cannot save hotkeys:',e)}};
  const displayKey=raw=>{
    if(!raw)return 'Not bound';
    return raw.split('+').map(x=>x.startsWith('Key')?x.slice(3):x.startsWith('Digit')?x.slice(5):x.startsWith('Numpad')?'Num '+x.slice(6):x==='Space'?'Space':x==='Shift'?'Shift':x==='Control'?'Ctrl':x==='Alt'?'Alt':x==='Meta'?'Win':x.replace(/^Arrow/,'' )).join(' + ');
  };
  const keyCode=e=>{
    if(!e?.code||['ControlLeft','ControlRight','ShiftLeft','ShiftRight','AltLeft','AltRight','MetaLeft','MetaRight'].includes(e.code))return '';
    return [e.ctrlKey?'Control':null,e.altKey?'Alt':null,e.shiftKey?'Shift':null,e.metaKey?'Meta':null,e.code].filter(Boolean).join('+');
  };
  let capturingId=null, bindingFilter='';
  function setBinding(id,chord){
    for(const key of Object.keys(bindings))if(key!==id&&bindings[key]===chord&&chord)bindings[key]='';
    bindings[id]=chord;saveBindings();notice((chord?displayKey(chord):'Unbound')+' → '+describeHotkey(id));
    if(activeTab==='hotkeys')renderHotkeyRows();else renderTab();
  }
  function describeHotkey(id){
    if(id==='nav:menu')return 'Toggle menu';if(id==='nav:rage')return 'Open Rage tab';if(id==='nav:mega')return 'Open Mega Rage tab';if(id==='nav:panic')return 'Emergency reset';
    if(id.startsWith('flag:v131_'))return v131Powers.find(p=>'flag:v131_'+p[0]===id)?.[1]||id.slice(5);
    if(id.startsWith('flag:v14_'))return 'V14 '+(v14ById.get(id.slice(5))?.name||id.slice(5));
    if(id.startsWith('flag:lp_'))return 'Legit Pro '+(legitProDefs.find(x=>x.flag===id.slice(5))?.name||id.slice(5));
    if(id.startsWith('flag:v15_'))return 'Practical '+(v15Powers.find(p=>p.id===id.slice(5))?.name||id.slice(5));
    if(id==='flag:utilAll')return 'Unlimited Utility · All';
    if(id.startsWith('flag:util'))return utilityTypes.find(item=>item.flag===id.slice(5))?.title||id.slice(5);
    if(id.startsWith('flag:'))return ({megaRage:'Mega Rage Mode',rage360:'360° Rage',rageSticky:'Sticky Rage Target',rageLead:'Target Prediction',rageHead:'Head Priority',
      autoReload:'Auto Reload',autoScope:'Auto Scope',killSound:'Kill Sound',rocketRecoil:'Rocket Recoil',legitSticky:'Sticky Legit Aim',legitVisible:'Visible Only Aim',legitDeadzone:'Aim Deadzone',legitWallLock:'Lock Through Walls',flickPrecision:'Flick Precision',
      aimFovRing:'FOV Ring',triggerBurst:'Trigger Burst',quickStop:'Quick Stop',sprintBoost:'Sprint Boost',moonJump:'Moon Jump',
      radar:'Radar',radarElevation:'Radar Height Arrows',radarAimPulse:'Radar Green Aim Pulse',aimBodyGlow:'Purple Void Aim Chams',enemyArrows:'Offscreen Arrows',targetHUD:'Target HUD',killHUD:'Kill Counter',hitmarkers:'Hit Markers',
      peacefulBots:'Bot Ceasefire',botSpin:'Bot Dance',aimTargetLine:'Target Line',espTeam:'Show Teammates',botNames:'Name Labels',botMagnet:'Enemy Magnet',botRepulse:'Enemy Repulsor',botOrbit:'Orbit Army',criticalHeal:'Critical Auto Heal',armorRegen:'Armor Regen',ammoRegen:'Reserve Ammo Regen',slowBots:'Slow-Motion Enemies',killAura:'Kill Aura',teamGuardian:'Team Guardian',silenceAura:'Silence Field',blindAura:'Flash Field',bounceAura:'Bounce Field',glassBots:'Glass Enemies',vampire:'Vampire Healing',enemyConfuse:'Confusion Field',disarmAura:'Disarm Aura',wallbang:'Wallbang',wallIcon:'Wallbang Kill Icon',freeze:'Freeze Bots',autoBhop:'Hold-Space BHOP',autoStrafe:'Auto Strafe',showCrosshair:'Center Dot',infinity:'Infinite Ammo',god:'Auto Heal',esp:'Box ESP',third:'Third Person',spin:'Spinbot',silent:'Silent Aim',autoShoot:'Auto Shoot',triggerbot:'Triggerbot',legitAim:'Legit Aim',fastFire:'Rapid Fire',chams:'Chams',glow:'Glow',fly:'Fly',noRecoil:'No Recoil',noSpread:'No Spread',espHealth:'Health Bars',espTracers:'ESP Tracers',flyNoclip:'Flight Phase Mode',speedHud:'Flight HUD'}[id.slice(5)]||rePowers?.find?.(p=>reFlag(p.id)===id.slice(5))?.name||odLabelByFlag.get(id.slice(5))||omegaPowers.find(p=>'omega_'+p.id===id.slice(5))?.name||id.slice(5));
    return actions.get(id)?.title||id.replace(/^action:/,'').replace(/-/g,' ');
  }
  function toggleFlag(id,handler=null){
    flags[id]=!flags[id];
    if(id==='fpsBooster')fpsBoosterEnable(flags[id]);
    if(id==='gameSpeedHack'){
      if(flags[id]){if(!gameClockInstall())flags[id]=false;}
      gameClockSetRate(flags[id]?gameClockRate:1);
    }
    // If either radar enhancement is enabled, automatically show the mini-radar.
    if((id==='radarElevation'||id==='radarAimPulse')&&flags[id])flags.radar=true;
    if(id==='radarRequireLOS')radarSave();
    if(flags[id]&&['rageLowHP','rageLowArmor','rageFastest'].includes(id)){
      for(const other of ['rageLowHP','rageLowArmor','rageFastest'])if(other!==id){
        flags[other]=false;
        // Update old buttons instantly when another priority takes precedence.
        const b=panel.querySelector('[data-bind-id="flag:'+other+'"]');
        if(b){b.classList.remove('on');const icon=b.querySelector('.dw-indicator');if(icon)icon.textContent='○ OFF';}
      }
    }
    if(id.startsWith('rage')&&ragePlusDefs.some(o=>o.id===id))ragePlusReset();
    if(id==='megaRage'){
      const preset=['silent','autoShoot','wallbang','wallIcon','fastFire','rage360','rageSticky','rageLead','rageHead'];
      if(flags.megaRage){
        megaSnapshot={flags:Object.fromEntries(preset.map(k=>[k,flags[k]])),rageFov};
        for(const k of preset) flags[k]=true;
        rageFov=360;
      } else if(megaSnapshot){
        Object.assign(flags,megaSnapshot.flags);
        rageFov=megaSnapshot.rageFov;
        megaSnapshot=null;
      }
    }
    if(flags[id]&&['botMagnet','botRepulse','botOrbit'].includes(id)){
      for(const k of ['botMagnet','botRepulse','botOrbit'])if(k!==id)flags[k]=false;
    }
    // V8.2: Turning wall-lock OFF must immediately release the target and
    // restore normal visibility. Previously enabling wall-lock set
    // legitVisible=false, but disabling it left that override behind forever.
    if(id.startsWith('v14_aim_')&&flags[id])for(const p of v14Catalog)if(p.group==='aim'&&p.flag!==id&&p.mode==='toggle')flags[p.flag]=false;
    if(id==='v15_weapons_01')v15WeaponSwitch(flags[id],'noRecoil');
    if(id==='v15_weapons_02')v15WeaponSwitch(flags[id],'noSpread');
    if(id.startsWith('v15_aim_')&&flags[id])for(const p of v15Powers)if(p.group==='aim'&&p.id!==id)flags[p.id]=false;
    if(id.startsWith('v15_trigger_')&&flags[id])for(const p of v15Powers)if(p.group==='trigger'&&p.id!==id)flags[p.id]=false;
    if(id==='fpsBoost')odApplyFps();
    if(id==='v131_fusion_reactor'&&flags[id])v131EquipFusion();
    if(id.startsWith('omega_'))omegaOnToggle(id.slice(6));
    if(id==='legitWallLock'){
      if(flags.legitWallLock){
        flags.legitVisible=false;
      }else{
        flags.legitVisible=true;
        legitFocus=null;
        triggerPrev=null;
        triggerOnset=0;
      }
    }
    if(id==='legitVisible'&&flags.legitVisible){
      flags.legitWallLock=false;
      legitFocus=null;
      triggerPrev=null;
      triggerOnset=0;
    }
    if((id==='legitAim'&&!flags.legitAim)||(id==='legitSticky'&&!flags.legitSticky)){
      legitFocus=null;
    }
    if(['legitWallLock','legitVisible','legitAim','legitSticky'].includes(id)&&activeTab==='legit'&&panel.style.display!=='none'){
      queueMicrotask(()=>{if(active)renderTab()});
    }
    if(id==='chams'){if(!flags.chams)clearChams();else applyChams()}
    if(id==='freeze'&&!flags.freeze)unfreeze();
    if(id.startsWith('re_')){const p=rePowers?.find?.(x=>reFlag(x.id)===id);if(p)reSwitchSideEffect(p.id);}
    if(handler && id!=='chams' && id!=='freeze'&&!id.startsWith('re_'))handler();
    notice(describeHotkey('flag:'+id)+' '+(flags[id]?'ON':'OFF'));
  }
  function tile(parent,title,hint,handler,flag){
    const id=flag?'flag:'+flag:actionId(title);
    if(!flag&&typeof handler==='function')actions.set(id,{title,handler,tab:activeTab});
    const b=document.createElement('button');b.type='button';b.className=flag?'dw-toggle':'dw-action';b.dataset.bindId=id;
    const render=()=>{
      b.classList.toggle('on',!!(flag&&flags[flag]));b.replaceChildren();
      const state=document.createElement('span');state.className='dw-indicator';state.textContent=flag?(flags[flag]?'● ON':'○ OFF'):'↗';
      const name=document.createElement('div');name.className='dw-name';name.textContent=title;
      const details=document.createElement('div');details.className='dw-hint';details.textContent=hint;
      const shortcut=document.createElement('span');shortcut.className='dw-shortcut'+(bindings[id]?'':' unbound');
      shortcut.textContent=displayKey(bindings[id]);shortcut.title='Set a key in the HOTKEYS tab';
      b.append(state,name,details,shortcut);
    };
    b.addEventListener('click',()=>safe(()=>{
      if(flag)toggleFlag(flag,handler);
      else{handler?.();if(id!=='action:visible-head-flick')notice(title+' done');}
      if(b.isConnected)render();
    }));render();parent.append(b);return b;
  }
  function selector(label, options, selection, cb){
    const wrap=document.createElement('label');wrap.style.cssText='display:block;font-size:12px;color:#c2d5f3;margin-bottom:12px;font-weight:700';wrap.textContent=label;
    const sel=document.createElement('select');for(const [value,text] of options){const op=document.createElement('option');op.value=value;op.textContent=text;sel.append(op)}sel.value=selection;sel.addEventListener('change',()=>safe(()=>cb(sel.value)));wrap.append(sel);content.append(wrap);return sel;
  }
  function slider(label,min,max,step,current,update,suffix='×'){
    const box=document.createElement('div');box.className='dw-range';
    const title=document.createElement('div');title.className='dw-name';const v=document.createElement('span');v.style.cssText='float:right;color:#87c8ff';
    const range=document.createElement('input');range.type='range';range.min=min;range.max=max;range.step=step;range.value=current;
    const show=val=>{v.textContent=Number(val).toFixed(step>=1?0:1)+suffix};title.textContent=label;title.append(v);show(current);
    range.addEventListener('input',()=>{update(Number(range.value));show(range.value)});box.append(title,range);content.append(box)
  }
  function numericControl(label, min, max, current, callback, unit='deg/s') {
    const box=document.createElement('div');box.className='dw-range';
    const row=document.createElement('div');row.className='dw-name';row.textContent=label;
    const hint=document.createElement('span');hint.style.cssText='float:right;color:#a88fc8;font-size:11px';hint.textContent=unit;row.append(hint);
    const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step='1';input.value=String(current);
    const save=()=>{const n=Number(input.value);if(!Number.isFinite(n))return;const value=Math.max(min,Math.min(max,Math.round(n)));callback(value);input.value=String(value);};
    input.addEventListener('change',save);input.addEventListener('keydown',e=>{if(e.code==='Enter'){save();input.blur()}});
    box.append(row,input);content.append(box);return input;
  }

  // V12 SUPERNOVA: 100 new distinct local bot-lab controls across 10 themed labs.
  // Performance: simulation updates limited to 12 Hz, visual overlays to 30 FPS.
  const snPowers = [{"id":"rocket-overdrive","name":"Rocket Overdrive","mode":"t","desc":"Every shot gives stronger backwards thrust.","group":"rocket","icon":"🚀"},{"id":"rocket-jump","name":"Skyshot Booster","mode":"t","desc":"Downward shots add a huge upward jump.","group":"rocket","icon":"🚀"},{"id":"rocket-strafe","name":"Sidewinder Recoil","mode":"t","desc":"Strafing while shooting adds lateral thrust.","group":"rocket","icon":"🚀"},{"id":"rocket-magnet","name":"Magnet Bullets","mode":"t","desc":"Shots tug a nearby enemy toward your muzzle.","group":"rocket","icon":"🚀"},{"id":"rocket-shockwave","name":"Muzzle Shockwave","mode":"t","desc":"Shooting pushes nearby enemies outward.","group":"rocket","icon":"🚀"},{"id":"rocket-sparks","name":"Rocket Exhaust","mode":"t","desc":"Animated rocket rings while firing.","group":"rocket","icon":"🚀"},{"id":"rocket-salvo","name":"Rocket Salvo","mode":"a","desc":"Launch every nearby bot away from your position.","group":"rocket","icon":"🚀"},{"id":"backblast","name":"Backblast Button","mode":"a","desc":"Instantly propel yourself backward.","group":"rocket","icon":"🚀"},{"id":"stratosphere","name":"Stratosphere Launch","mode":"a","desc":"Launch vertically like a rocket.","group":"rocket","icon":"🚀"},{"id":"rocket-brake","name":"Emergency Air Brake","mode":"a","desc":"Instantly stop your momentum.","group":"rocket","icon":"🚀"},{"id":"air-skates","name":"Air Skates","mode":"t","desc":"Glide faster when airborne.","group":"mobility","icon":"⚡"},{"id":"jet-burst","name":"Hold-Space Jet","mode":"t","desc":"Hold Space midair for an upward jet assist.","group":"mobility","icon":"⚡"},{"id":"wall-runner","name":"Wallrunner","mode":"t","desc":"Extra momentum close to a wall.","group":"mobility","icon":"⚡"},{"id":"dash-engine","name":"Shift Thrusters","mode":"t","desc":"Hold Shift and W for directional turbo.","group":"mobility","icon":"⚡"},{"id":"low-drag","name":"Low-Drag Boots","mode":"t","desc":"Preserve airborne horizontal velocity.","group":"mobility","icon":"⚡"},{"id":"anti-fall","name":"Feather Landing","mode":"t","desc":"Limit downward falling speed.","group":"mobility","icon":"⚡"},{"id":"omni-dash","name":"Omni Dash","mode":"a","desc":"Dash in the direction you face.","group":"mobility","icon":"⚡"},{"id":"vertical-elevator","name":"Vertical Elevator","mode":"a","desc":"Boost yourself straight upward.","group":"mobility","icon":"⚡"},{"id":"rewind-position","name":"Five-Second Rewind","mode":"a","desc":"Return to a recently saved position.","group":"mobility","icon":"⚡"},{"id":"inertia-stop","name":"Inertia Stop","mode":"a","desc":"Stop all player velocity immediately.","group":"mobility","icon":"⚡"},{"id":"bot-feather","name":"Bot Feather Gravity","mode":"t","desc":"Lift bots upward gently.","group":"gravity","icon":"🌌"},{"id":"bot-anchor","name":"Bot Heavy Gravity","mode":"t","desc":"Pull bots downward hard.","group":"gravity","icon":"🌌"},{"id":"bot-jumpers","name":"Bot Jump Party","mode":"t","desc":"Bots bounce into the air repeatedly.","group":"gravity","icon":"🌌"},{"id":"bot-hover","name":"Floating Bots","mode":"t","desc":"Stabilize bots in low gravity.","group":"gravity","icon":"🌌"},{"id":"gravity-sway","name":"Gravity Sidewind","mode":"t","desc":"Push enemies side to side.","group":"gravity","icon":"🌌"},{"id":"gravity-orbit","name":"Orbit Gravity","mode":"t","desc":"Make enemies orbit around you.","group":"gravity","icon":"🌌"},{"id":"moon-wave","name":"Moon Wave","mode":"a","desc":"Give every bot a floating upward kick.","group":"gravity","icon":"🌌"},{"id":"slam-all","name":"Gravity Slam","mode":"a","desc":"Force everyone downward suddenly.","group":"gravity","icon":"🌌"},{"id":"launch-random","name":"Random Rocket Bot","mode":"a","desc":"Launch one random bot into the sky.","group":"gravity","icon":"🌌"},{"id":"freeze-velocity","name":"Zero Velocity","mode":"a","desc":"Instantly halt every bot.","group":"gravity","icon":"🌌"},{"id":"follow-leader","name":"Follow the Leader","mode":"t","desc":"Bots chase the one in front of them.","group":"circus","icon":"🎪"},{"id":"keep-distance","name":"Social Distancing","mode":"t","desc":"Bots repel each other when too close.","group":"circus","icon":"🎪"},{"id":"conga-line","name":"Conga Line","mode":"t","desc":"Bots follow your path in a wavy line.","group":"circus","icon":"🎪"},{"id":"disco-feet","name":"Disco Feet","mode":"t","desc":"Make bots do tiny side steps.","group":"circus","icon":"🎪"},{"id":"bot-whirlpool","name":"Human Whirlpool","mode":"t","desc":"Bots circle a common center.","group":"circus","icon":"🎪"},{"id":"pretend-dead","name":"Pacifist Performance","mode":"t","desc":"Delay bot gunfire during their performance.","group":"circus","icon":"🎪"},{"id":"box-lineup","name":"Box Formation","mode":"a","desc":"Line up bots into a box.","group":"circus","icon":"🎪"},{"id":"pyramid","name":"Human Pyramid","mode":"a","desc":"Stack bots in a rising triangle.","group":"circus","icon":"🎪"},{"id":"checker-dance","name":"Checkerboard Dance","mode":"a","desc":"Create a staggered dancing formation.","group":"circus","icon":"🎪"},{"id":"crowd-shuffle","name":"Crowd Shuffle","mode":"a","desc":"Randomize everyone’s positions locally.","group":"circus","icon":"🎪"},{"id":"safe-circle","name":"Safe Circle","mode":"t","desc":"Damage enemies wandering too far away.","group":"arena","icon":"🛡"},{"id":"orbit-shield","name":"Orbit Shield","mode":"t","desc":"Repel threats when they get too close.","group":"arena","icon":"🛡"},{"id":"fire-ring","name":"Ring of Fire","mode":"t","desc":"Damage enemies standing in a ring.","group":"arena","icon":"🛡"},{"id":"slow-zone","name":"Slow Zone","mode":"t","desc":"Reduce nearby bot movement speed.","group":"arena","icon":"🛡"},{"id":"tornado-corridor","name":"Wind Tunnel","mode":"t","desc":"Wind pushes bots sideways in front of you.","group":"arena","icon":"🛡"},{"id":"bounce-pad","name":"Bounce Pads","mode":"t","desc":"Grounded bots hop upwards nearby.","group":"arena","icon":"🛡"},{"id":"arena-reset","name":"Arena Reset","mode":"a","desc":"Respawn all bots into the match.","group":"arena","icon":"🛡"},{"id":"close-combat","name":"Close Combat","mode":"a","desc":"Bring enemies into a close range circle.","group":"arena","icon":"🛡"},{"id":"chaos-wave","name":"Chaos Wave","mode":"a","desc":"Blast enemies away with a radial shockwave.","group":"arena","icon":"🛡"},{"id":"arena-spread","name":"Arena Spread","mode":"a","desc":"Spread bots around the arena.","group":"arena","icon":"🛡"},{"id":"ammo-fountain","name":"Ammo Fountain","mode":"t","desc":"Gradually replenish reserve ammo.","group":"arsenal","icon":"🔫"},{"id":"taser-reactor","name":"Taser Reactor","mode":"t","desc":"Rapidly recharge your Zeus taser.","group":"arsenal","icon":"🔫"},{"id":"scout-sprint","name":"Scout Sprint","mode":"t","desc":"Speed boost whenever holding a Scout.","group":"arsenal","icon":"🔫"},{"id":"heavy-metal","name":"AWP Ammo Core","mode":"t","desc":"Restore AWP rounds while equipped.","group":"arsenal","icon":"🔫"},{"id":"sniper-focus","name":"Sniper Focus","mode":"t","desc":"Auto-scope an equipped sniper.","group":"arsenal","icon":"🔫"},{"id":"lucky-crit","name":"Lucky Crit Pulse","mode":"t","desc":"Occasional bonus damage on enemy hits.","group":"arsenal","icon":"🔫"},{"id":"give-scout","name":"Instant Scout","mode":"a","desc":"Equip SSG 08 with full ammunition.","group":"arsenal","icon":"🔫"},{"id":"give-taser","name":"Infinite Zeus Kit","mode":"a","desc":"Equip Zeus and refill its charge.","group":"arsenal","icon":"🔫"},{"id":"enemy-glass","name":"Glass Enemies","mode":"a","desc":"Reduce enemy health to low values.","group":"arsenal","icon":"🔫"},{"id":"rapid-resupply","name":"Rapid Resupply","mode":"a","desc":"Refill every owned magazine and reserve.","group":"arsenal","icon":"🔫"},{"id":"critical-shield","name":"Critical Shield","mode":"t","desc":"Rebuild armor while health is critical.","group":"survival","icon":"❤️"},{"id":"sprint-regen","name":"Sprint Regeneration","mode":"t","desc":"Heal while moving quickly.","group":"survival","icon":"❤️"},{"id":"armor-generator","name":"Armor Generator","mode":"t","desc":"Generate additional armor over time.","group":"survival","icon":"❤️"},{"id":"shield-pulse","name":"Personal Shield Pulse","mode":"t","desc":"Push away bots whenever you get hurt.","group":"survival","icon":"❤️"},{"id":"panic-jump","name":"Panic Jump","mode":"t","desc":"Get a jump burst at low health.","group":"survival","icon":"❤️"},{"id":"cooldown-medic","name":"Medic Overclock","mode":"t","desc":"Recover health every few seconds.","group":"survival","icon":"❤️"},{"id":"heal-team","name":"Team Medkit","mode":"a","desc":"Restore teammates’ health.","group":"survival","icon":"❤️"},{"id":"heal-self","name":"Instant Medkit","mode":"a","desc":"Restore your own health.","group":"survival","icon":"❤️"},{"id":"armor-max","name":"Fortress Armor","mode":"a","desc":"Top up your armor and helmet.","group":"survival","icon":"❤️"},{"id":"safe-respawn","name":"Instant Recovery","mode":"a","desc":"Respawn yourself after being eliminated.","group":"survival","icon":"❤️"},{"id":"laser-cross","name":"Laser Crosshair","mode":"t","desc":"Show a responsive neon crosshair.","group":"visuals","icon":"◈"},{"id":"rainbow-trails","name":"Rainbow Enemy Trails","mode":"t","desc":"Colorful bot motion lines.","group":"visuals","icon":"◈"},{"id":"orbit-hud","name":"Orbit HUD","mode":"t","desc":"Animated ring around your crosshair.","group":"visuals","icon":"◈"},{"id":"comet-fx","name":"Comet FX","mode":"t","desc":"Glowing comet points over enemies.","group":"visuals","icon":"◈"},{"id":"danger-bars","name":"Danger Bars","mode":"t","desc":"Show distance indicators for close bots.","group":"visuals","icon":"◈"},{"id":"hologram-ring","name":"Hologram Ring","mode":"t","desc":"Futuristic pulsing HUD ring.","group":"visuals","icon":"◈"},{"id":"purple-flash","name":"Purple Flash","mode":"a","desc":"Trigger a purple screen flash.","group":"visuals","icon":"◈"},{"id":"screen-confetti","name":"Screen Confetti","mode":"a","desc":"Make confetti explode on your display.","group":"visuals","icon":"◈"},{"id":"pulse-wave","name":"Neon Pulse","mode":"a","desc":"Play a neon shockwave animation.","group":"visuals","icon":"◈"},{"id":"neon-shutdown","name":"Turn Off V12 FX","mode":"a","desc":"Disable all new visual overlays.","group":"visuals","icon":"◈"},{"id":"one-hp-mode","name":"One HP Hero","mode":"t","desc":"Keep yourself at one HP for a challenge.","group":"challenge","icon":"🏆"},{"id":"duel-hunter","name":"Duel Hunter","mode":"t","desc":"Keep only one enemy active.","group":"challenge","icon":"🏆"},{"id":"chaser-bots","name":"Chaser Bots","mode":"t","desc":"Make enemies chase your position.","group":"challenge","icon":"🏆"},{"id":"ice-bots","name":"Icy Enemies","mode":"t","desc":"Make enemy movement extremely slippery.","group":"challenge","icon":"🏆"},{"id":"hot-potato","name":"Hot Potato","mode":"t","desc":"Randomly mark and launch an enemy.","group":"challenge","icon":"🏆"},{"id":"trickshot-score","name":"Trickshot Counter","mode":"t","desc":"Count launches caused by your shots.","group":"challenge","icon":"🏆"},{"id":"start-duel","name":"Instant 1v1","mode":"a","desc":"Prepare one opponent for a duel.","group":"challenge","icon":"🏆"},{"id":"super-boss","name":"Super Boss","mode":"a","desc":"Turn a bot into a powerful boss.","group":"challenge","icon":"🏆"},{"id":"freeze-enemies","name":"Freeze Rivals","mode":"a","desc":"Stop enemies for a short duration.","group":"challenge","icon":"🏆"},{"id":"weapon-roulette","name":"Weapon Roulette","mode":"a","desc":"Equip a random weapon.","group":"challenge","icon":"🏆"},{"id":"popcorn-boom","name":"Popcorn Boom","mode":"t","desc":"Random bots pop upward like popcorn.","group":"mayhem","icon":"💥"},{"id":"bot-bowling","name":"Bot Bowling","mode":"t","desc":"Colliding enemies knock each other away.","group":"mayhem","icon":"💥"},{"id":"magnetic-crowd","name":"Magnetic Crowd","mode":"t","desc":"Pull enemies into a swirling cluster.","group":"mayhem","icon":"💥"},{"id":"rocket-dance","name":"Rocket Dance","mode":"t","desc":"Bots bounce to an invisible beat.","group":"mayhem","icon":"💥"},{"id":"anti-grav","name":"Anti-Gravity Party","mode":"t","desc":"Make enemies gently float upward.","group":"mayhem","icon":"💥"},{"id":"swarm-bot","name":"Swarm Bot Mode","mode":"t","desc":"Bots swarm toward a moving point.","group":"mayhem","icon":"💥"},{"id":"tornado-launch","name":"Super Tornado","mode":"a","desc":"Spin and launch all nearby bots.","group":"mayhem","icon":"💥"},{"id":"air-bowling","name":"Air Bowling","mode":"a","desc":"Knock every bot away from a chosen target.","group":"mayhem","icon":"💥"},{"id":"meteor-festival","name":"Meteor Festival","mode":"a","desc":"Launch enemies upward in staggered bursts.","group":"mayhem","icon":"💥"},{"id":"clean-slate","name":"Clean Slate","mode":"a","desc":"Reset positions, movement and visual effects.","group":"mayhem","icon":"💥"}];
  const snGroups = {"rocket":["🚀","ROCKET SCIENCE"],"mobility":["⚡","HYPERMOBILITY"],"gravity":["🌌","GRAVITY ENGINE"],"circus":["🎪","BOT CIRCUS"],"arena":["🛡","ARENA CONTROL"],"arsenal":["🔫","ARSENAL EXPERIMENTS"],"survival":["❤️","SURVIVAL SYSTEMS"],"visuals":["◈","NEON VISUAL STUDIO"],"challenge":["🏆","CHALLENGE ARENA"],"mayhem":["💥","SUPERNOVA MAYHEM"]};
  const snById = new Map(snPowers.map(x=>[x.id,x]));
  const snFlag = id => 'sn_'+id;
  for(const p of snPowers)if(p.mode==='t')flags[snFlag(p.id)]=false;
  const snStorage='deathWonV12Supernova';
  let snSettings={strength:{},chosen:{},effectDensity:1,showFx:true};
  try {const d=JSON.parse(localStorage.getItem(snStorage)||'{}');
    if(d&&typeof d==='object')snSettings={...snSettings,...d};
    if(!snSettings.strength||typeof snSettings.strength!=='object')snSettings.strength={};
    if(!snSettings.chosen||typeof snSettings.chosen!=='object')snSettings.chosen={};
  }catch{}
  const snSave=()=>{try{localStorage.setItem(snStorage,JSON.stringify(snSettings))}catch{}};
  const snLevel=id=>Math.max(.25,Math.min(4,Number(snSettings.strength[id])||1));
  const snOn=id=>!!flags[snFlag(id)];
  const snBots=()=>enemyBots().slice(0,24);
  let snLastTick=0,snLastPaint=0,snLastShot=-100,snLastHp=100,snFlashUntil=0,snFlashes=[],snShotCount=0,
      snPosHist=[],snLastHot=0,snLastBounce=0,snBoss=null,snDuel=null,snCounter=0;
  const snRate={};
  const snReady=(id,now,delay)=>{if(now-(snRate[id]||0)<delay)return false;snRate[id]=now;return true;};
  const snRand=(a,b)=>a+Math.random()*(b-a);
  const snDir=()=>{const p=g.player,y=p.yaw||0,c=Math.cos(p.pitch||0);
    return {x:-Math.sin(y)*c,y:Math.sin(p.pitch||0),z:-Math.cos(y)*c};};
  const snSide=()=>({x:Math.cos(g.player.yaw||0),z:-Math.sin(g.player.yaw||0)});
  const snDist=b=>Math.hypot(b.x-g.player.x,b.z-g.player.z);
  const snAlive=()=>g.state==='playing'&&g.player?.alive;
  const snClosest=()=>snBots().sort((a,b)=>snDist(a)-snDist(b))[0]||null;
  function snImpulse(b,dx,dy,dz,force=1){if(!b||!b.alive)return;
    b.vx=(Number(b.vx)||0)+dx*force;b.vy=(Number(b.vy)||0)+dy*force;b.vz=(Number(b.vz)||0)+dz*force;}
  function snPushOut(b,power){const p=g.player,dx=b.x-p.x,dz=b.z-p.z,n=Math.hypot(dx,dz)||1;
    snImpulse(b,dx/n,0.24,dz/n,power);}
  function snNudgeToward(b,x,z,power){const dx=x-b.x,dz=z-b.z,len=Math.hypot(dx,dz)||1;
    snImpulse(b,dx/len,0,dz/len,power);}
  function snFlash(color='#a873ff',kind='pulse'){
    if(snFlashes.length>Math.floor(32*Math.max(.25,Math.min(2,snSettings.effectDensity))))snFlashes.shift();snFlashes.push({at:performance.now(),color,kind});
  }
  function snDmg(b,dmg){if(!b?.alive||!Number.isFinite(dmg))return;
    const hp=Math.max(1,Number(b.health)||100);b.health=hp-Math.max(.1,dmg);
    if(b.health<=0){try{g.killEntity(b,g.player,g.weapons.def?.()||null,false)}catch{b.health=1;}}}
  function snSafeMove(x,z){const p=g.player;const gy=odToGround?.(x,z,p,p.y);
    if(!gy||!Number.isFinite(gy.y))return false;
    if(Math.abs(gy.y-p.y)>2.4)return false;
    p.x=gy.x;p.y=gy.y;p.z=gy.z;return true;}
  function snShot(now){
    const w=g.weapons,p=g.player,dir=snDir(),side=snSide();snShotCount++;
    if(snOn('rocket-overdrive')){const k=14*snLevel('rocket-overdrive');p.vx-=dir.x*k;p.vy-=dir.y*k;p.vz-=dir.z*k;}
    if(snOn('rocket-jump')&&dir.y<-.12)p.vy+=(-dir.y)*16*snLevel('rocket-jump');
    if(snOn('rocket-strafe')){const k=g.input?.keys,s=k?.has('KeyD')?1:k?.has('KeyA')?-1:0;
      p.vx+=side.x*9*s*snLevel('rocket-strafe');p.vz+=side.z*9*s*snLevel('rocket-strafe');}
    if(snOn('rocket-magnet')){const b=snClosest();if(b)snNudgeToward(b,p.x,p.z,5*snLevel('rocket-magnet'));}
    if(snOn('rocket-shockwave'))for(const b of snBots())if(snDist(b)<11)snPushOut(b,5*snLevel('rocket-shockwave'));
    if(snOn('rocket-sparks'))snFlash('#ffbd64','ring');
    if(snOn('lucky-crit')&&Math.random()<.24){const b=snClosest();if(b)snDmg(b,15*snLevel('lucky-crit'));}
    if(snOn('shield-pulse')&&p.health<snLastHp-1){for(const b of snBots())if(snDist(b)<8)snPushOut(b,5);}
    if(snOn('trickshot-score'))snCounter++;
  }
  function snAction(id){
    const p=g.player,bots=snBots(),bot=snClosest(),k=snLevel(id),d=snDir(),sd=snSide();
    if(!snAlive()&&id!=='safe-respawn'&&id!=='clean-slate'&&id!=='neon-shutdown'){notice('Enter a bot match first');return;}
    switch(id){
      case 'rocket-salvo':for(const b of bots)if(snDist(b)<25)snPushOut(b,28*k);snFlash('#f59e6a');break;
      case 'backblast':p.vx-=d.x*35*k;p.vy-=d.y*35*k;p.vz-=d.z*35*k;break;
      case 'stratosphere':p.vy=Math.max(p.vy||0,27*k);snFlash('#70caff','ring');break;
      case 'rocket-brake':p.vx=p.vy=p.vz=0;break;
      case 'omni-dash':p.vx+=d.x*25*k;p.vz+=d.z*25*k;break;
      case 'vertical-elevator':p.vy=Math.max(p.vy||0,18*k);break;
      case 'rewind-position':{const old=snPosHist[0];if(old)snSafeMove(old.x,old.z);break;}
      case 'inertia-stop':p.vx=p.vy=p.vz=0;break;
      case 'moon-wave':for(const b of bots)snImpulse(b,0,14*k,0);break;
      case 'slam-all':for(const b of bots)b.vy=-35*k;break;
      case 'launch-random':{const b=bots[Math.floor(Math.random()*bots.length)];if(b)b.vy=35*k;break;}
      case 'freeze-velocity':for(const b of bots)b.vx=b.vy=b.vz=0;break;
      case 'box-lineup':for(let j=0;j<bots.length;j++){const a=j/bots.length*Math.PI*2,r=9*k;bots[j].x=p.x+Math.sign(Math.cos(a))*r;bots[j].z=p.z+Math.sign(Math.sin(a))*r;}break;
      case 'pyramid':for(let j=0;j<bots.length;j++){const row=Math.floor(Math.sqrt(2*j));bots[j].x=p.x+6+(j-row*(row+1)/2-row/2)*2;bots[j].z=p.z-9+row*2;bots[j].vy=3;}break;
      case 'checker-dance':for(let j=0;j<bots.length;j++){bots[j].x=p.x+(j%5-2)*3;bots[j].z=p.z-11+Math.floor(j/5)*3;bots[j].vy=5;}break;
      case 'crowd-shuffle':for(const b of bots){b.x+=snRand(-10,10)*k;b.z+=snRand(-10,10)*k;}break;
      case 'arena-reset':for(const b of g.botMgr.bots)try{b.spawn?.()}catch{}break;
      case 'close-combat':for(let j=0;j<bots.length;j++){const a=j/bots.length*Math.PI*2;bots[j].x=p.x+Math.sin(a)*6;bots[j].z=p.z+Math.cos(a)*6;}break;
      case 'chaos-wave':for(const b of bots)snPushOut(b,18*k);snFlash('#9c83ff');break;
      case 'arena-spread':for(const b of bots){b.x=p.x+snRand(-26,26)*k;b.z=p.z+snRand(-26,26)*k;}break;
      case 'give-scout':g.weapons.give?.('ssg08');break;
      case 'give-taser':g.weapons.zeusOwned=true;g.weapons.states.zeus={ammo:1,reserve:999};g.weapons.equip?.('zeus');break;
      case 'enemy-glass':for(const b of bots)b.health=Math.min(b.health||100,Math.max(1,20/k));break;
      case 'rapid-resupply':for(const st of Object.values(g.weapons.states||{})){if(st&&Number.isFinite(st.ammo)){st.ammo=Math.max(st.ammo,90);st.reserve=999;}}break;
      case 'heal-team':for(const b of g.botMgr.bots)if(b.alive&&b.team===p.team)b.health=100;break;
      case 'heal-self':p.health=100;g.hud?.updateHealth?.();break;
      case 'armor-max':p.armor=200;p.helmet=true;g.hud?.updateHealth?.();break;
      case 'safe-respawn':if(!p.alive)g.respawnPlayer?.();else p.health=100;break;
      case 'purple-flash':snFlash('#9759ff','solid');break;
      case 'screen-confetti':for(let j=0;j<18;j++)snFlash(`hsl(${j*22} 90% 65%)`,'confetti');break;
      case 'pulse-wave':snFlash('#63d7ff','ring');break;
      case 'neon-shutdown':for(const z of snPowers.filter(x=>x.group==='visuals'&&x.mode==='t'))flags[snFlag(z.id)]=false;snFlashes=[];break;
      case 'start-duel':for(let j=0;j<bots.length;j++){if(j>0)bots[j].respawnT=99999, g.killEntity?.(bots[j],null,null,false);}if(bot){bot.health=100;bot.weapon='ak47';}break;
      case 'super-boss':if(bot){bot.health=650*k;bot.armor=350*k;bot.weapon='negev';snBoss=bot;}break;
      case 'freeze-enemies':for(const b of bots){b.vx=b.vy=b.vz=0;b.nextFire=g.time+9*k;}break;
      case 'weapon-roulette':g.weapons.give?.(['ak47','awp','ssg08','m4a4','deagle','nova','negev'][Math.floor(Math.random()*7)]);break;
      case 'tornado-launch':for(const b of bots){const dx=b.x-p.x,dz=b.z-p.z;snImpulse(b,-dz*.9,20,dx*.9,Math.min(2,k));}break;
      case 'air-bowling':if(bot){for(const b of bots){const v={x:b.x-bot.x,z:b.z-bot.z},l=Math.hypot(v.x,v.z)||1;snImpulse(b,v.x/l,3,v.z/l,19*k);}}break;
      case 'meteor-festival':bots.forEach((b,i)=>{b.vy=16*k+i%5*5;b.vx+=snRand(-4,4);});snFlash('#fda96c');break;
      case 'clean-slate':for(const z of snPowers)if(z.mode==='t')flags[snFlag(z.id)]=false;
        snFlashes=[];for(const b of g.botMgr?.bots||[])if(b.alive){b.vx=b.vy=b.vz=0;}break;
    }
    notice('✦ SUPERNOVA · '+(snById.get(id)?.name||id));
  }
  function snTick(dt,now){
    if(!snAlive())return;
    const shot=g.weapons?.lastShotT;
    if(typeof shot==='number'&&shot>snLastShot && Math.abs(g.time-shot)<1.1){snLastShot=shot;snShot(now);}
    if(now-snLastTick<80)return;
    const secs=Math.min(.22,(now-snLastTick)/1000||.08);snLastTick=now;
    const p=g.player,bots=snBots(),degree=(now*.001),speed=Math.hypot(p.vx||0,p.vz||0);
    if(snReady('history',now,200)){snPosHist.push({x:p.x,y:p.y,z:p.z});if(snPosHist.length>25)snPosHist.shift();}
    if(snOn('air-skates')&&!p.onGround){p.vx*=1+.55*secs*snLevel('air-skates');p.vz*=1+.55*secs*snLevel('air-skates');}
    if(snOn('jet-burst')&&g.input?.keys?.has('Space')&&!p.onGround)p.vy+=14*secs*snLevel('jet-burst');
    if(snOn('wall-runner')&&!p.onGround&&typeof g.physics?.raycast==='function'){
      const side=snSide();try{const hit=g.physics.raycast(p.x,p.y+1,p.z,side.x,0,side.z,1.2,2);
        if(hit){p.vx+=snDir().x*3*secs;p.vz+=snDir().z*3*secs;}}catch{}}
    if(snOn('dash-engine')&&g.input?.keys?.has('ShiftLeft')&&g.input?.keys?.has('KeyW')){
      const v=snDir();p.vx+=v.x*9*secs*snLevel('dash-engine');p.vz+=v.z*9*secs*snLevel('dash-engine');}
    if(snOn('low-drag')&&!p.onGround){p.vx*=1+.12*secs;p.vz*=1+.12*secs;}
    if(snOn('anti-fall'))p.vy=Math.max(p.vy||0,-4*snLevel('anti-fall'));
    if(snOn('critical-shield')&&p.health<35)p.armor=Math.min(220,(p.armor||0)+25*secs);
    if(snOn('sprint-regen')&&speed>6)p.health=Math.min(100,p.health+8*secs*snLevel('sprint-regen'));
    if(snOn('armor-generator'))p.armor=Math.min(180,(p.armor||0)+6*secs*snLevel('armor-generator'));
    if(snOn('panic-jump')&&p.health<25&&p.onGround&&snReady('panic',now,4000))p.vy=12*snLevel('panic-jump');
    if(snOn('cooldown-medic')&&snReady('medic',now,2600))p.health=Math.min(100,p.health+13*snLevel('cooldown-medic'));
    if(snOn('shield-pulse')&&p.health<snLastHp-3){for(const b of bots)if(snDist(b)<8)snPushOut(b,14);}
    snLastHp=p.health;
    if(snOn('ammo-fountain')){const s=g.weapons.state?.();if(s&&Number.isFinite(s.reserve))s.reserve=Math.min(999,s.reserve+2*secs*snLevel('ammo-fountain'));}
    if(snOn('taser-reactor')){g.weapons.zeusRecharge=0;if(g.weapons.states?.zeus)g.weapons.states.zeus.ammo=1;}
    if(snOn('scout-sprint')&&g.weapons.current==='ssg08'){const d=snDir();p.vx+=d.x*2*secs;p.vz+=d.z*2*secs;}
    if(snOn('heavy-metal')&&g.weapons.current==='awp'&&g.weapons.states?.awp)g.weapons.states.awp.ammo=10;
    if(snOn('sniper-focus')&&['awp','ssg08','scar20'].includes(g.weapons.current)&&g.weapons.scopeLevel===0){try{g.weapons.setScope?.(1)}catch{}}
    if(snOn('one-hp-mode'))p.health=1;
    if(snOn('duel-hunter'))for(let j=1;j<bots.length;j++)bots[j].nextFire=g.time+1.5;
    if(snOn('trickshot-score')&&snReady('score',now,1400)){};
    const c=Math.min(bots.length,24);
    for(let j=0;j<c;j++){
      const b=bots[j],dist=snDist(b),lvl=id=>snLevel(id);
      if(snOn('bot-feather'))b.vy+=10*secs*lvl('bot-feather');
      if(snOn('bot-anchor'))b.vy-=10*secs*lvl('bot-anchor');
      if(snOn('bot-jumpers')&&dist<38&&b.onGround&&snReady('jump'+j,now,1350))b.vy=8*lvl('bot-jumpers');
      if(snOn('bot-hover'))b.vy+=(2-(b.vy||0))*Math.min(1,secs*3);
      if(snOn('gravity-sway'))b.vx+=Math.sin(degree*2+j)*5*secs;
      if(snOn('gravity-orbit')){const ang=degree*.8+j*Math.PI*2/Math.max(1,c),r=10;
        snNudgeToward(b,p.x+Math.cos(ang)*r,p.z+Math.sin(ang)*r,8*secs*lvl('gravity-orbit'));}
      if(snOn('follow-leader')&&j>0)snNudgeToward(b,bots[j-1].x,bots[j-1].z,3*secs);
      if(snOn('keep-distance'))for(let q=j+1;q<c;q++){const o=bots[q],dx=b.x-o.x,dz=b.z-o.z,l=Math.hypot(dx,dz)||1;
        if(l<3){snImpulse(b,dx/l,0,dz/l,4*secs);snImpulse(o,-dx/l,0,-dz/l,4*secs);}}
      if(snOn('conga-line'))snNudgeToward(b,p.x+Math.sin(degree-j*.6)*j*1.2,p.z+Math.cos(degree-j*.6)*j*1.2,4*secs);
      if(snOn('disco-feet')){b.vx+=Math.sin(degree*6+j)*3*secs;b.vz+=Math.cos(degree*6+j)*3*secs;}
      if(snOn('bot-whirlpool')){const dx=b.x-p.x,dz=b.z-p.z;snImpulse(b,-dz/(dist||1),0,dx/(dist||1),5*secs);}
      if(snOn('pretend-dead'))b.nextFire=Math.max(b.nextFire||0,g.time+.2);
      if(snOn('safe-circle')&&dist>22)snDmg(b,3*secs*lvl('safe-circle'));
      if(snOn('orbit-shield')&&dist<6)snPushOut(b,4*secs*lvl('orbit-shield'));
      if(snOn('fire-ring')&&dist>8&&dist<12)snDmg(b,7*secs*lvl('fire-ring'));
      if(snOn('slow-zone')&&dist<12){b.vx*=.92;b.vz*=.92;}
      if(snOn('tornado-corridor')&&dist<27){const d=snDir(),s=snSide();if((b.x-p.x)*d.x+(b.z-p.z)*d.z>0){b.vx+=s.x*5*secs;b.vz+=s.z*5*secs;}}
      if(snOn('bounce-pad')&&dist<18&&b.onGround&&snReady('bounce'+j,now,1550))b.vy=9;
      if(snOn('chaser-bots'))snNudgeToward(b,p.x,p.z,5*secs);
      if(snOn('ice-bots')){b.vx*=1+.1*secs;b.vz*=1+.1*secs;}
      if(snOn('hot-potato')&&j===Math.floor(degree)%Math.max(1,c)&&snReady('potato',now,1300))b.vy+=11;
      if(snOn('popcorn-boom')&&snReady('pop'+j,now,2000+300*j))b.vy+=9*lvl('popcorn-boom');
      if(snOn('bot-bowling')&&dist<12)for(const other of bots)if(other!==b&&Math.hypot(other.x-b.x,other.z-b.z)<1.8)snPushOut(other,4*secs);
      if(snOn('magnetic-crowd'))snNudgeToward(b,p.x+8,p.z+8,5*secs);
      if(snOn('rocket-dance')&&snReady('dance'+j,now,700+80*j))b.vy+=6;
      if(snOn('anti-grav'))b.vy+=8*secs;
      if(snOn('swarm-bot'))snNudgeToward(b,p.x+Math.sin(degree)*8,p.z+Math.cos(degree)*8,7*secs);
    }
    const live=enemyBots().length;
    if(snOn('laser-cross')||snOn('rainbow-trails')||snOn('orbit-hud')||snOn('comet-fx')||snOn('danger-bars')||snOn('hologram-ring'))snSettings.showFx=true;
    if(snSettings.showFx&&snFlashes.length>0)snFlashes=snFlashes.filter(f=>now-f.at<1100);
    if((snOn('orbit-hud')||snOn('hologram-ring'))&&snReady('ring',now,230))snFlash('#7adcfb','ring');
  }
  function snVisualActive(){return snSettings.showFx&&(snFlashes.length||snPowers.some(p=>p.group==='visuals'&&p.mode==='t'&&snOn(p.id)));}
  function snDraw(base,w,h,project){
    if(!snSettings.showFx||!snVisualActive()||panel.style.display!=='none')return;
    const now=performance.now();if(now-snLastPaint<(flags.fpsBoost?70:32))return;snLastPaint=now;
    const centerX=w/2,centerY=h/2;
    base.save();base.lineCap='round';
    if(snOn('laser-cross')){base.strokeStyle='#42ffebbb';base.lineWidth=2;for(const v of [-1,1]){
      base.beginPath();base.moveTo(centerX+v*9,centerY);base.lineTo(centerX+v*27,centerY);base.moveTo(centerX,centerY+v*9);base.lineTo(centerX,centerY+v*27);base.stroke();}}
    if(snOn('orbit-hud')||snOn('hologram-ring')){const radius=snOn('hologram-ring')?68:34;
      base.lineWidth=2;base.strokeStyle='#9e7cf4a9';base.beginPath();base.arc(centerX,centerY,radius,now*.002,now*.002+Math.PI*1.25);base.stroke();}
    if(snOn('rainbow-trails')||snOn('comet-fx')||snOn('danger-bars'))for(let i=0;i<Math.min(14,snBots().length);i++){
      const b=snBots()[i],pos=project(b.x,(b._visY??b.y)+1.3,b.z);if(!pos)continue;
      if(snOn('rainbow-trails')){base.strokeStyle=`hsla(${(now*.03+i*35)%360},95%,70%,.72)`;base.lineWidth=1.6;
        base.beginPath();base.moveTo(pos.x,pos.y);base.lineTo(pos.x-((b.vx||0)*6),pos.y+((b.vz||0)*6));base.stroke();}
      if(snOn('comet-fx')){base.fillStyle='#a5eeff';base.shadowColor='#69ddff';base.shadowBlur=12;base.beginPath();base.arc(pos.x,pos.y,3.6,0,Math.PI*2);base.fill();base.shadowBlur=0;}
      if(snOn('danger-bars')&&snDist(b)<23){base.fillStyle='#ff639bcc';base.fillRect(pos.x-18,pos.y-15,36*(1-snDist(b)/23),3);}}
    for(const f of snFlashes.slice(-20)){
      const age=(now-f.at)/1100;if(age>=1)continue;base.strokeStyle=f.color;base.fillStyle=f.color;base.globalAlpha=Math.max(0,(1-age)*.7);
      if(f.kind==='solid'){base.fillRect(0,0,w,h);}
      else if(f.kind==='confetti'){const seed=f.at%7,xx=(f.at*13+Math.sin(age*12)*w/3+seed*73)%w,yy=(f.at*7+age*h*1.1+seed*50)%h;
        base.fillRect(xx,yy,7,13);}
      else{base.lineWidth=5-3*age;base.beginPath();base.arc(centerX,centerY,15+age*Math.min(w,h)*.8,0,Math.PI*2);base.stroke();}
    }
    base.restore();
  }
  function snRenderTab(){
    const group=activeTab.slice(3),items=snPowers.filter(p=>p.group===group),meta=snGroups[group];
    section(meta[0]+' '+meta[1],`V12 SUPERNOVA · ${items.length} new experimental powers · independent intensity and hotkeys`);
    const pill=document.createElement('div');pill.className='dw-sn-intro';pill.innerHTML='<b>✦ ENGINEERING LAB</b><span> REAL BOT PHYSICS · LOCAL MATCH · PRESS END TO RESET</span>';content.append(pill);
    const box=grid();for(const p of items)if(p.mode==='t')tile(box,p.icon+' '+p.name,p.desc+' • '+snLevel(p.id).toFixed(1)+'×',null,snFlag(p.id));
      else tile(box,p.icon+' '+p.name,p.desc+' • '+snLevel(p.id).toFixed(1)+'×',()=>snAction(p.id));
    section('FINE-TUNE','Pick one ability to adjust its strength without affecting the others.');
    const picked=snSettings.chosen[group]&&items.some(p=>p.id===snSettings.chosen[group])?snSettings.chosen[group]:items[0].id;
    selector('SELECT AN ABILITY',items.map(p=>[p.id,p.name]),picked,v=>{snSettings.chosen[group]=v;snSave();renderTab()});
    slider('Ability strength · '+snById.get(picked).name,.25,4,.05,snLevel(picked),v=>{snSettings.strength[picked]=v;snSave()},'×');
    const tools=grid();tile(tools,'⌨ Custom Hotkey','Assign any key to '+snById.get(picked).name+'.',()=>{bindingFilter=snById.get(picked).name;showMenu('hotkeys')});
    tile(tools,'⛔ Turn Off Lab','Disable all toggles in this lab.',()=>{for(const p of items)if(p.mode==='t')flags[snFlag(p.id)]=false;renderTab()});
    if(group==='visuals'){const v=grid();tile(v,'◈ Visual FX','Enable or disable V12 overlays (FPS friendly).',()=>{snSettings.showFx=!snSettings.showFx;snSave();renderTab()});
      slider('Effect density',.25,2,.25,snSettings.effectDensity,v=>{snSettings.effectDensity=v;snSave()},'×');}
    const note=document.createElement('p');note.className='dw-sn-foot';note.textContent='These are experimental local bot-lobby effects. Visual modes use lightweight overlays; walls, game rules and animation assets can limit the result.';content.append(note);
  }
  function snClear(){snFlashes=[];for(const p of snPowers)if(p.mode==='t')flags[snFlag(p.id)]=false;}

  // OBSIDIAN NAVIGATION: category folders, search and instant page navigation.
  const tabs=[['home','⌂','Dashboard'],['re:cosmic','🌌','Cosmic Chaos'],['re:goofy','🐔','Goofy Mayhem'],['re:tech','⚡','Tech & Time'],['re:mutations','💥','Mutations'],['re:visual','🎉','World Chaos'],['rage','🎯','Rage'],['mega','☠','Mega Rage'],['legit','◎','Legit Aimbot'],['legitpro','◎','Legit Pro +10'],['move','⚡','Movement'],['rocket','🚀','Rocket Recoil'],['guns','◆','Weapons & Skins'],['audio','♫','Kill Sounds'],['models','♟','Model Changer'],['visual','◈','ESP & Radar'],['bots','▣','Bot Lab'],['extras','✶','Extras +10'],['nightfall','✦','Nightfall +16'],['finder','⌕','Power Finder'],['presets','✧','Preset Vault'],['performance','▤','FPS Boost'],['ov:survival','🛡','Survival & Armor'],['ov:movement','⚡','Movement Engine'],['ov:blink','⌁','Teleport Lab'],['ov:formations','◇','Formation Forge'],['ov:control','◉','Bot Control'],['ov:combat','☠','Combat Mutators'],['ov:weapons','✦','Weapon Workshop'],['ov:physics','☄','Physics Chaos'],['ov:visual','◈','Visual Overdrive'],['ov:challenge','⚔','Challenge Modes'],['paradox','✦','Paradox V13'],['paradox131','✧','Paradox V13.1 +15'],['v14:aim','🎯','Aim Core'],['v14:arsenal','🔫','Arsenal'],['v14:movement','🚀','Movement X'],['v14:survival','🛡','Survival X'],['v14:bots','🤖','Bot Director'],['v14:physics','🪐','Physics X'],['v14:combat','💥','Combat Events'],['v14:visuals','👁','Visual Engine'],['v14:arena','🏟','Arena Control'],['v14:chaos','☠','Chaos Combos'],['custom','⚙','Customize'],['hotkeys','⌨','Hotkeys'],['omega:combat','⚔','Omega Combat'],['omega:movement','🚀','Omega Movement'],['omega:goofy','🎪','Omega Goofy'],['omega:studio','🎨','Omega Studio'],['omega:zeus','⚡','Infinite Taser'],['sn:rocket','🚀','Rocket Science'],['sn:mobility','⚡','Hypermobility'],['sn:gravity','🌌','Gravity Engine'],['sn:circus','🎪','Bot Circus'],['sn:arena','🛡','Arena Control'],['sn:arsenal','🔫','Arsenal Experiments'],['sn:survival','❤️','Survival Systems'],['sn:visuals','◈','Neon Visual Studio'],['sn:challenge','🏆','Challenge Arena'],['sn:mayhem','💥','Supernova Mayhem'],['v15:aim','🎯','Practical Aimbot'],['v15:trigger','◎','Practical Triggerbot'],['v15:weapons','🔫','Practical Weapons'],['v15:visuals','👁','Practical ESP'],['v15:movement','⇢','Practical Movement'],['v16:aim','◎','Subtle Aim +10'],['v16:trigger','◉','Trigger Discipline +10'],['v16:weapon','🔧','Weapon Handling +10'],['v17:aim','🎯','Aim Training V17'],['v17:armory','🔫','Armory Studio V17'],['v17:skins','💎','Skin Lab V17'],['v17:studio','⚙','Control Studio V17'],['v17:replay','📊','Replay Analyzer V17']];
  tabs.push(['fps:lab','⚡','Full Quality FPS Booster']);
  tabs.push(['v18:rage','☠','V18 Rage Lab'],['v18:legit','◎','V18 Aim & Peek'],['v18:skins','◆','V18 Skin Workshop'],['v18:studio','✧','V18 HUD & Themes'],['v18:replay','◉','V18 Replay Lab']);
  const tabInfo=new Map(tabs.map(t=>[t[0],t]));
  // Ensure every previous menu page appears under a top-level category.
  const uncategorized=tabs.map(t=>t[0]).filter(id=>!topCatByTab.has(id));
  for(const id of uncategorized){topCategories.find(c=>c[0]==='misc')[2].push(id);topCatByTab.set(id,'misc');}

  const navGroups=[
    ['start','ESSENTIALS',['home','finder','presets','performance']],
    ['combat','COMBAT & VISUALS',['rage','mega','legit','visual','guns','audio','models']],
    ['core','MOVEMENT & BOTS',['move','rocket','bots','extras','nightfall']],
    ['chaos','REALITY BREAKER',['re:cosmic','re:goofy','re:tech','re:mutations','re:visual']],
    ['labs','OVERDRIVE LABS',['ov:survival','ov:movement','ov:blink','ov:formations','ov:control','ov:combat','ov:weapons','ov:physics','ov:visual','ov:challenge']],
    ['omega','OMEGA V11',['omega:combat','omega:movement','omega:goofy','omega:studio','omega:zeus']],
    ['supernova','V12 • SUPERNOVA',['sn:rocket','sn:mobility','sn:gravity','sn:circus','sn:arena','sn:arsenal','sn:survival','sn:visuals','sn:challenge','sn:mayhem']],
    ['paradox','V13 • PARADOX',['paradox','paradox131']],
    ['v14','V14 • ABSOLUTE CHAOS',['v14:aim','v14:arsenal','v14:movement','v14:survival','v14:bots','v14:physics','v14:combat','v14:visuals','v14:arena','v14:chaos']],
    ['config','SETTINGS',['custom','hotkeys']]
  ];
  const navElems=new Map();
  let navFilter='';
  for(const [id,iconName,displayName] of tabs){
    const button=document.createElement('button');button.type='button';
    button.className='dw-tab dw-subtab';button.dataset.tab=id;
    button.setAttribute('role','tab');button.setAttribute('aria-selected','false');
    const icon=document.createElement('span');icon.className='dw-tabicon';icon.textContent=iconName;
    const name=document.createElement('span');name.className='dw-tabname';name.textContent=displayName;
    button.append(icon,name);button.addEventListener('click',()=>selectTab(id));
    nav.append(button);navElems.set(id,button);
  }
  panel.querySelector('#dw-sub-left').addEventListener('click',()=>nav.scrollBy({left:-270,behavior:'smooth'}));
  panel.querySelector('#dw-sub-right').addEventListener('click',()=>nav.scrollBy({left:270,behavior:'smooth'}));
  renderTopCats();
  // V12.1 UNIVERSAL SEARCH: tabs AND actual powers; previous search matched tabs only.
  const resultTray=document.createElement('div');
  resultTray.className='dw-global-results';resultTray.hidden=true;
  nav.parentElement.insertBefore(resultTray,nav);
  const featuredSearch=[
    ['Blue Gem Karambit','guns','knife bluegem case hardened skin'],
    ['Speedometer','ov:visual','speed meter velocity display hud'],
    ['No Recoil','rage','recoil gun spray'],
    ['No Spread','rage','accuracy bullets'],
    ['Spinbot','rage','spin speed'],
    ['Third Person','rage','view player body'],
    ['ESP & Chams','visual','glow boxes'],
    ['Aim Assist','legit','legit aimbot'],
    ['Visible Head Flick','legit','headshot flick o'],
    ['Rocket Recoil','rocket','rocket launch backwards'],
    ['Infinite Taser Range','omega:zeus','zeus long range'],
    ['FPS Boost','performance','performance optimization'],
    ['Kill Sounds','audio','sound effect'],
    ['Model Changer','models','player skin character']
  ];
  function globalSearchCatalog(){
    const items=[...tabs.map(t=>({title:t[2],tab:t[0],icon:t[1],terms:t[2]}))];
    const add=(name,tab,icon='✦',terms='')=>items.push({title:name,tab,icon,terms:name+' '+terms});
    for(const p of odPowers)add(p.name,'ov:'+p.group,p.icon,p.desc||'');
    for(const p of rePowers)add(p.name,'re:'+p.group,p.icon,p.desc||'');
    for(const p of omegaPowers)add(p.name,'omega:'+p.group,p.icon,p.desc||'');
    for(const p of snPowers)add(p.name,'sn:'+p.group,p.icon,p.desc||'');
    for(const p of paradoxPowers)add(p[1],'paradox','✦',p[3]);
    for(const p of v131Powers)add(p[1],'paradox131','✧',p[3]);
    for(const p of v14Catalog)add(p.name,p.tab,'⚡','v14 '+p.group+' '+p.name);
    for(const p of v15Powers)add(p.name,p.tab,'◈','practical v14.4 '+p.group+' '+p.desc);
    for(const p of legitProDefs)add(p.name,'legitpro','◎',p.desc+' legit aimbot professional aim');
    for(const opt of v16Opts)add(opt.name,opt.tab,'◉',opt.desc+' legit bot match');
    add('Skin Lab · Dragon Lore & Custom Skins','v17:skins','💎','case hardened float pattern local inventory fake case roll');
    add('Advanced Weapon Fusion Workshop','paradox131','🔧','customizable gun fusion donor save load preset');
    add('Set Portal Entrance','paradox','🔵');add('Set Portal Exit','paradox','🟠');add('Equip Fused Weapon','paradox','🔧');
    add('Auto Win Round','mega','🏆','local match win bots instant round');
    add('Auto Win Match','mega','👑','local match win bots score end game');
    for(const [name,tab,terms] of featuredSearch)add(name,tab,'⌕',terms);
    // Remove duplicates, but prefer the fully described lab result.
    return [...new Map(items.map(i=>[i.title.toLowerCase()+'|'+i.tab,i])).values()];
  }
  function getSearchHits(){
    const terms=navFilter.split(/\s+/).filter(Boolean);
    if(!terms.length)return [];
    return globalSearchCatalog().filter(x=>terms.every(t=>x.terms.toLowerCase().includes(t)))
      .sort((a,b)=>Number(b.title.toLowerCase().startsWith(navFilter))-Number(a.title.toLowerCase().startsWith(navFilter)))
      .slice(0,18);
  }
  function openSearchResult(tab,title=''){
    navFilter='';navSearch.value='';refreshNav();selectTab(tab);
    if(title){
      const match=[...content.querySelectorAll('.dw-action,.dw-toggle')].find(b=>
        b.querySelector('.dw-name')?.textContent?.toLowerCase().includes(title.toLowerCase()));
      if(match){match.classList.add('dw-search-target');match.scrollIntoView?.({block:'center',behavior:'smooth'});
        setTimeout(()=>{if(match.isConnected)match.classList.remove('dw-search-target')},1750)}
    }
    // Releasing keyboard focus is important because browser game captures keystrokes.
    navSearch.blur();
  }
  function drawSearchResults(){
    resultTray.replaceChildren();resultTray.hidden=!navFilter;
    if(!navFilter)return;
    const hits=getSearchHits();
    const summary=document.createElement('div');summary.className='dw-search-head';
    summary.textContent=hits.length?('FOUND '+hits.length+' MATCH'+(hits.length===1?'':'ES')):'NO MATCHES';
    resultTray.append(summary);
    for(const hit of hits){
      const b=document.createElement('button');b.type='button';b.className='dw-search-hit';
      b.textContent=hit.icon+'  '+hit.title;
      b.title='Open '+tabInfo.get(hit.tab)?.[2];
      b.addEventListener('click',()=>openSearchResult(hit.tab,hit.title));resultTray.append(b);
    }
    if(!hits.length){const hint=document.createElement('div');hint.className='dw-search-empty';hint.textContent='Try “Blue Gem”, “Speedometer”, “Recoil” or “Rocket”.';resultTray.append(hint)}
  }
  const navSearch=panel.querySelector('#dw-nav-search');
  navSearch.addEventListener('input',()=>{navFilter=navSearch.value.trim().toLowerCase();refreshNav()});
  // Allow typing normally while Clutcher's global keyboard shortcuts are active.
  for(const eventName of ['keydown','keyup','keypress'])navSearch.addEventListener(eventName,e=>e.stopPropagation());
  navSearch.addEventListener('keydown',e=>{if(e.key==='Escape'){navSearch.value='';navFilter='';refreshNav();navSearch.blur();e.stopPropagation();}else if(e.key==='Enter'){
    const hit=getSearchHits()[0];
    if(hit){e.preventDefault();openSearchResult(hit.tab,hit.title)}
    else{const first=[...navElems].find(([id,b])=>b.style.display!=='none'&&tabInfo.get(id)[2].toLowerCase().includes(navFilter));
      if(first){e.preventDefault();openSearchResult(first[0])}}
  }});
  function refreshNav(){
    drawSearchResults();
    const orderedTabs=tabsForCategory(currentTopCategory);
    const allowed=new Set(orderedTabs);
    const orderIndex=new Map(orderedTabs.map((id,i)=>[id,i]));
    for(const [id,button] of navElems){
      button.style.order=String(orderIndex.get(id)??999);
      const label=tabInfo.get(id)?.[2]||'';
      button.hidden=!allowed.has(id) || (!!navFilter && !label.toLowerCase().includes(navFilter));
      button.style.display=button.hidden?'none':'';
      button.classList.toggle('active',id===activeTab);
      button.setAttribute('aria-selected',String(id===activeTab));
    }
    for(const [cid,button] of topCatButtons)button.classList.toggle('active',cid===currentTopCategory);
  }
  function selectTab(id){
    if(!tabInfo.has(id))id='home';
    const category=categoryForTab(id);
    const categoryChanged=category!==currentTopCategory;
    activeTab=id;currentTopCategory=category;
    if(categoryChanged)nav.scrollLeft=0;
    renderTopCats();refreshNav();renderTab();content.scrollTop=0;
    const button=navElems.get(id);
    if(button&&!navFilter)button.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
  }
  panel.querySelector('#dw-open-home').addEventListener('click',()=>selectTab('home'));


  // -------------------- GAME COMMANDS --------------------
  function killBots(enemiesOnly){let count=0;for(const b of (enemiesOnly?enemyBots():allBots())){
    try {g.killEntity(b,g.player,g.weapons.def?.()||null,false,null,false);count++}catch(e){console.warn(e)}}notice('Eliminated '+count+' bots ☠');}
  function revive(){let count=0;for(const b of g.botMgr.bots)if(!b.alive){try{b.respawnT=0;b.spawn();count++}catch(e){console.warn(e)}}notice('Respawned '+count+' bots');}
  function freezeBots(){for(const b of g.botMgr.bots){if(storedFreeze.has(b)||typeof b.update!=='function')continue;
    storedFreeze.set(b,{fn:b.update,own:Object.prototype.hasOwnProperty.call(b,'update')});b.update=()=>{};}}
  function unfreeze(){for(const [b,v] of storedFreeze){if(v.own)b.update=v.fn;else delete b.update;}storedFreeze.clear();}
  function heal(){const p=g.player;p.health=100;p.armor=100;p.helmet=true;g.hud?.updateHealth?.()}
  function giveGun(id){g.weapons.give(id);g.hud?.updateWeapon?.();notice('Gave '+id.toUpperCase());avatarGun=''}
  function nearest(){
    const p=g.player;
    if(flags.rageSticky&&rageAllowed(rageFocus)){
      const rr=Math.hypot(rageFocus.x-p.x,rageFocus.z-p.z);
      if(rr<300)return rageFocus;
    }
    const cosPitch=Math.cos(p.pitch||0);
    const fx=-Math.sin(p.yaw||0)*cosPitch, fy=Math.sin(p.pitch||0),fz=-Math.cos(p.yaw||0)*cosPitch;
    let closest=null, best=Infinity;
    for(const b of enemyBots()){
      if(!rageAllowed(b))continue;
      const tx=b.x-p.x,ty=(b._visY??b.y)+1.05-p.y-(p.eyeH||1.6),tz=b.z-p.z;
      const dist=Math.hypot(tx,ty,tz)||.001;
      const dot=Math.max(-1,Math.min(1,(fx*tx+fy*ty+fz*tz)/dist));
      const angle=Math.acos(dot)*180/Math.PI;
      if(!flags.rage360&&angle>rageFov/2)continue;
      const score=rageTargetScore(b,angle,dist);
      if(score<best){best=score;closest=b}
    }
    rageFocus=closest;return closest;
  }
  function behindWall(victim){if(!originalRaycast||!victim)return false;
    const p=g.player,sx=p.x,sy=p.y+(p.eyeH||1.6),sz=p.z;
    const dx=victim.x-sx,dy=(victim._visY??victim.y)+1.05-sy,dz=victim.z-sz;
    const dist=Math.hypot(dx,dy,dz);if(dist<.01)return false;
    try{const hit=originalRaycast.call(g.physics,sx,sy,sz,dx/dist,dy/dist,dz/dist,dist,2);return !!hit&&hit.t<dist-.35}
    catch{return false;}
  }
  // V10.3 - One-shot visible-head flick. Never uses Rage silent or wallbang hooks.
  // All ray tests use the original physics implementation. Targets are real living enemies.
  function visibleHeadFlick(){
    if(!active||g.state!=='playing'||!g.player?.alive){notice('Flickshot: enter an active bot match');return;}
    if(panel.style.display!=='none'){notice('Close the menu, then press O to flick');return;}
    if(!validGun()){notice('Flickshot: weapon cooling down, empty, or reloading');return;}
    const p=g.player,eyeY=p.y+(p.eyeH||1.6),cosP=Math.cos(p.pitch||0);
    const forward={x:-Math.sin(p.yaw||0)*cosP,y:Math.sin(p.pitch||0),z:-Math.cos(p.yaw||0)*cosP};
    let closest=null, point=null, shortest=Infinity;
    for(const b of enemyBots()){
      if(!b.alive||b.spawnProt>0)continue;
      const h=Math.min(Math.max(.9,(b.height||1.8)-.18),1.62);
      const aim={x:b.x,y:(b._visY??b.y)+h,z:b.z};
      const dx=aim.x-p.x,dy=aim.y-eyeY,dz=aim.z-p.z;
      const d=Math.hypot(dx,dy,dz);if(d<.25||d>flickMaxDist)continue;
      const dot=(dx*forward.x+dy*forward.y+dz*forward.z)/d;
      const angle=Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI;
      if(angle>flickFov*.5)continue;
      // Clear direct line of sight to the precise head point; body visibility isn't enough.
      if(typeof originalRaycast==='function'){
        try{const wall=originalRaycast.call(g.physics,p.x,eyeY,p.z,dx/d,dy/d,dz/d,d,2);
          if(wall&&wall.t<d-.12)continue;
        }catch(err){console.warn('[VOIDWARE] Flick LOS unavailable:',err);continue;}
      }else{notice('Flickshot: visibility raycast unavailable');return;}
      if(d<shortest){shortest=d;closest=b;point=aim;}
    }
    if(!closest){notice('Flickshot: no visible enemy head within range');return;}
    // Update actual player aim so the camera visibly flicks. This is NOT silent aim.
    const deltaX=point.x-p.x,deltaY=point.y-eyeY,deltaZ=point.z-p.z;
    p.yaw=Math.atan2(-deltaX,-deltaZ);
    p.pitch=Math.max(-1.55,Math.min(1.55,Math.atan2(deltaY,Math.hypot(deltaX,deltaZ))));
    // Protect the shot from Rage's silent-aim and through-wall overrides.
    flickFiring=true;
    const oldForced=forcedTarget,oldSuppress=suppressSilent;
    forcedTarget=null;suppressSilent=true;
    // Recoil aim offsets are independent of the 3D muzzle animations.
    const recoilP=g.weapons.punchP,recoilY=g.weapons.punchY;
    g.weapons.punchP=0;g.weapons.punchY=0;
    try{g.weapons.fire();notice('FLICK → '+(closest.name||'enemy')+' · '+shortest.toFixed(1)+'m');}
    catch(err){console.error('[VOIDWARE] Flickshot:',err);notice('Flickshot error: '+err.message);}
    finally{flickFiring=false;forcedTarget=oldForced;suppressSilent=oldSuppress;
      if(!flags.noRecoil){g.weapons.punchP=recoilP;g.weapons.punchY=recoilY;}}
  }
  // V16.1 Smooth Head Flick: visibly ease onto one unobstructed head, fire one native shot,
  // then ease back to the ORIGINAL yaw/pitch. This does not invoke killEntity or wallbang.
  // Independent of the legacy instant O-key flick; Shift+O is the default bind.
  const smoothAngle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
  const smoothEase=t=>.5-.5*Math.cos(Math.PI*Math.min(1,Math.max(0,t)));
  const smoothHeadPoint=b=>({x:b.x,y:(b._visY??b.y)+Math.min(Math.max(.9,(b.height||1.8)-.18),1.62),z:b.z});
  function smoothVisibleHead(b,point){
    if(!b?.alive||b.spawnProt>0||typeof originalRaycast!=='function')return false;
    const p=g.player,eyeY=p.y+(p.eyeH||1.6);
    const dx=point.x-p.x,dy=point.y-eyeY,dz=point.z-p.z,dist=Math.hypot(dx,dy,dz);
    if(!Number.isFinite(dist)||dist<.25||dist>flickMaxDist)return false;
    try{
      const hit=originalRaycast.call(g.physics,p.x,eyeY,p.z,dx/dist,dy/dist,dz/dist,dist,2);
      return !hit||hit.t>=dist-.12;
    }catch(e){console.warn('[VOIDWARE] Smooth flick LOS unavailable:',e);return false;}
  }
  function cancelSmoothHeadFlick(restore=true){
    const job=smoothFlickJob;if(!job)return;
    smoothFlickJob=null;
    if(job.raf!=null)cancelAnimationFrame(job.raf);
    if(restore&&active&&g.player===job.player){job.player.yaw=job.oldYaw;job.player.pitch=job.oldPitch;}
  }
  function smoothHeadFlick(){
    if(smoothFlickJob){notice('Smooth flick is already running');return;}
    if(!active||g.state!=='playing'||!g.player?.alive){notice('Smooth flick: enter a bot match');return;}
    if(panel.style.display!=='none'){notice('Close menu, then press Shift+O');return;}
    if(!validGun()){notice('Smooth flick: weapon not ready');return;}
    const p=g.player,eyeY=p.y+(p.eyeH||1.6),c=Math.cos(p.pitch||0);
    const forward={x:-Math.sin(p.yaw||0)*c,y:Math.sin(p.pitch||0),z:-Math.cos(p.yaw||0)*c};
    let target=null,shortest=Infinity;
    for(const b of enemyBots()){
      const point=smoothHeadPoint(b),dx=point.x-p.x,dy=point.y-eyeY,dz=point.z-p.z,d=Math.hypot(dx,dy,dz);
      if(!Number.isFinite(d)||d<.25||d>flickMaxDist)continue;
      const dot=(dx*forward.x+dy*forward.y+dz*forward.z)/d;
      const angle=Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI;
      if(angle>flickFov*.5||!smoothVisibleHead(b,point))continue;
      if(d<shortest){target=b;shortest=d;}
    }
    if(!target){notice('Smooth flick: no visible head in range');return;}
    const job={player:p,target,oldYaw:p.yaw||0,oldPitch:p.pitch||0,
      aimFrom:performance.now(),stage:'aim',raf:null,returnFrom:0,returnYaw:0,returnPitch:0};
    smoothFlickJob=job;
    const step=now=>{
      if(smoothFlickJob!==job)return;
      if(!active||g.state!=='playing'||!p.alive||g.player!==p||panel.style.display!=='none'||document.hidden){
        cancelSmoothHeadFlick();return;
      }
      if(job.stage==='aim'){
        const point=smoothHeadPoint(target);
        if(!smoothVisibleHead(target,point)){cancelSmoothHeadFlick();notice('Smooth flick: target lost');return;}
        const dx=point.x-p.x,dy=point.y-(p.y+(p.eyeH||1.6)),dz=point.z-p.z;
        const yaw=Math.atan2(-dx,-dz),pitch=Math.max(-1.55,Math.min(1.55,Math.atan2(dy,Math.hypot(dx,dz))));
        const t=Math.min(1,(now-job.aimFrom)/smoothAimMs),e=smoothEase(t);
        p.yaw=smoothAngle(job.oldYaw,yaw,e);p.pitch=job.oldPitch+(pitch-job.oldPitch)*e;
        if(t>=1){
          if(!validGun()){cancelSmoothHeadFlick();notice('Smooth flick: gun unavailable');return;}
          // Precisely settle on the tracked head before the one real shot.
          p.yaw=yaw;p.pitch=pitch;
          const oldForced=forcedTarget,oldSuppress=suppressSilent;
          const recoilP=g.weapons.punchP,recoilY=g.weapons.punchY;
          flickFiring=true;forcedTarget=null;suppressSilent=true;
          g.weapons.punchP=0;g.weapons.punchY=0;
          try{
            g.weapons.fire();notice('SMOOTH FLICK → '+(target.name||'enemy')+' · returning');
          }catch(err){console.error('[VOIDWARE] Smooth flick:',err);notice('Smooth flick: '+err.message);}
          finally{
            flickFiring=false;forcedTarget=oldForced;suppressSilent=oldSuppress;
            if(!flags.noRecoil){g.weapons.punchP=recoilP;g.weapons.punchY=recoilY;}
          }
          job.returnYaw=p.yaw;job.returnPitch=p.pitch;job.returnFrom=now+smoothShotHoldMs;job.stage='return';
        }
      }else if(job.stage==='return'){
        const t=Math.min(1,Math.max(0,(now-job.returnFrom)/smoothReturnMs)),e=smoothEase(t);
        p.yaw=smoothAngle(job.returnYaw,job.oldYaw,e);p.pitch=job.returnPitch+(job.oldPitch-job.returnPitch)*e;
        if(t>=1){p.yaw=job.oldYaw;p.pitch=job.oldPitch;smoothFlickJob=null;return;}
      }
      job.raf=requestAnimationFrame(step);
    };
    job.raf=requestAnimationFrame(step);
  }
  // Aim direction is taken from the genuine first-person yaw and pitch.
  function aimVector(){
    const p=g.player, c=Math.cos(p.pitch||0);
    return {x:-Math.sin(p.yaw||0)*c,y:Math.sin(p.pitch||0),z:-Math.cos(p.yaw||0)*c};
  }
  function validGun(){
    const w=g.weapons, d=w.def?.(),st=w.state?.();
    return !!d && !['knife','grenade','c4','zeus'].includes(d.class)
      && !w.reloading && (w.drawT||0)<=0 && (st?.ammo||0)>0 && g.time>=(w.nextFire||0);
  }
  function fireNow(target=null,legit=false){
    if(!active||g.state!=='playing'||!g.player.alive||panel.style.display!=='none'||!validGun())return;
    forcedTarget=target;suppressSilent=legit;
    try{g.weapons.fire()}catch(err){console.warn('[VOIDWARE] Auto fire:',err)}
    finally{forcedTarget=null;suppressSilent=false}
  }
  // V6 shared aiming coordinates. The target may move between mouse input and bullet firing.
  function aimHeight(bot){
    const h=bot.height||1.8;
    if(flags.rageHead&&flags.autoShoot)return Math.min(h-.12,1.61);
    if(aimBone==='head')return Math.min(h-.12,1.62);
    if(aimBone==='chest')return Math.min(h-.25,1.22);
    return Math.min(h-.23,1.37);
  }
  function aimSpot(bot, predicted=false){
    const originY=bot._visY??bot.y;
    const dist=Math.hypot(bot.x-g.player.x,bot.z-g.player.z);
    const lead=predicted?Math.min(.20,dist/700):0;
    return {x:bot.x+(bot.vx||0)*lead,y:originY+aimHeight(bot)+(bot.vy||0)*lead,z:bot.z+(bot.vz||0)*lead};
  }
  function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
  function angularError(bot){
    const p=g.player,spot=aimSpot(bot),sy=p.y+(p.eyeH||1.6);
    const yaw=Math.atan2(-(spot.x-p.x),-(spot.z-p.z));
    const pitch=Math.atan2(spot.y-sy,Math.hypot(spot.x-p.x,spot.z-p.z));
    return Math.hypot(angleDiff(yaw,p.yaw||0),pitch-(p.pitch||0))*180/Math.PI;
  }
  function aimButtonHeld(){
    const keys=g.input?.keys;
    switch(aimActivation){
      case 'always':return true;
      case 'mouse1':return !!g.input?.mouse1;
      case 'shift':return !!(keys?.has?.('ShiftLeft')||keys?.has?.('ShiftRight'));
      default:return !!g.input?.mouse2;
    }
  }
  // V8.2: one-click release so no sticky/occluded target survives a toggle.
  function stopLegitLock(){
    flags.legitAim=false;
    flags.legitWallLock=false;
    flags.legitSticky=false;
    flags.legitVisible=true;
    legitFocus=null;
    legitProReset();
    triggerPrev=null;
    triggerOnset=0;
    notice('LEGIT LOCK RELEASED — wall targeting OFF');
    if(activeTab==='legit'&&panel.style.display!=='none')renderTab();
  }
  // Legit aim & triggerbot: only visible bots close to the actual crosshair.
  function sightTarget(maxAngleDeg, requireHit=false, forLegitPro=false){
    const p=g.player, dir=aimVector(),ex=p.x,ey=p.y+(p.eyeH||1.6),ez=p.z;
    let best=null, bestAngle=Infinity;
    for(const b of enemyBots()){
      if(b.spawnProt>0||(flags.legitVisible&&!flags.legitWallLock&&behindWall(b)))continue;
      const by=b._visY??b.y;
      const pts=[by+.45,by+.95,by+1.45];
      for(const y of pts){
        const tx=b.x-ex,ty=y-ey,tz=b.z-ez,dist=Math.hypot(tx,ty,tz);
        if(dist<.3||(forLegitPro&&lpOn('range')&&dist>legitProCfg.maxDistance))continue;
        const along=tx*dir.x+ty*dir.y+tz*dir.z;
        if(along<=0)continue;
        const cos=Math.max(-1,Math.min(1,along/dist));
        const angle=Math.acos(cos)*180/Math.PI;
        const perp=Math.sqrt(Math.max(0,dist*dist-along*along));
        if(angle<=maxAngleDeg && (!requireHit||perp<=triggerRadius) && angle<bestAngle){best=b;bestAngle=angle;}
      }
    }
    return best;
  }
  // V14.5 LEGIT PRO: 10 practical modifications of the existing legitimate aim engine.
  // All modes are opt-in and have no effect while the original Legit Aim Assist is disabled.
  const legitProDefs=[
    {key:'reaction', name:'Reaction Delay',desc:'Wait before moving toward a newly acquired target.'},
    {key:'switch',name:'Switch Cooldown',desc:'Prevent rapid target hopping after locking an enemy.'},
    {key:'adaptive',name:'Adaptive Smooth',desc:'Automatically slow correction as the crosshair reaches the hitbox.'},
    {key:'step',name:'Angular Step Limit',desc:'Cap maximum aim rotation on each update.'},
    {key:'lead',name:'Velocity Prediction',desc:'Lead moving enemies using their actual bot velocity.'},
    {key:'dynamicFov',name:'Dynamic Scoped FOV',desc:'Narrow acquisition cone while using a scope.'},
    {key:'scopeGate',name:'Sniper Scope Gate',desc:'Require an active scope for sniper-class weapons.'},
    {key:'range',name:'Aim Range Limit',desc:'Reject bots outside the selected distance.'},
    {key:'hitbox',name:'Velocity Hitbox Select',desc:'Track chest on fast-moving enemies and head on slower enemies.'},
    {key:'recoil',name:'Recoil Compensation',desc:'Compensate for camera punch instead of globally disabling weapon recoil.'}
  ].map(x=>({...x,flag:'lp_'+x.key}));
  for(const opt of legitProDefs)flags[opt.flag]=false;
  const legitProStorage='deathWonV145_legitpro';
  const legitProDefaults={reactionMs:120,switchMs:440,maxStepDeg:2.2,leadSeconds:.12,scopeFovRatio:.50,maxDistance:90,movingSpeed:3.0,recoilRatio:.65};
  let legitProCfg={...legitProDefaults};
  try{const loaded=JSON.parse(localStorage.getItem(legitProStorage)||'{}');if(loaded&&typeof loaded==='object'){
    for(const [key,value] of Object.entries(legitProDefaults)){
      const n=Number(loaded[key]);if(Number.isFinite(n))legitProCfg[key]=n;
    }
  }}catch{}
  const legitProSave=()=>{try{localStorage.setItem(legitProStorage,JSON.stringify(legitProCfg))}catch{}};
  const lpOn=key=>!!flags['lp_'+key];
  const legitProState={candidate:null,candidateSince:0,focus:null,lockedAt:0,lastError:0,lastAimTarget:null,lastAppliedFactor:0,lastSpot:null};
  function legitProReset(){legitProState.candidate=null;legitProState.candidateSince=0;legitProState.focus=null;legitProState.lockedAt=0;legitProState.lastAimTarget=null;legitProState.lastAppliedFactor=0;legitProState.lastSpot=null;}
  function legitProDisable(){for(const opt of legitProDefs)flags[opt.flag]=false;legitProReset();}
  function legitProRangePass(bot){return !lpOn('range')||Math.hypot(bot.x-g.player.x,bot.z-g.player.z)<=legitProCfg.maxDistance;}
  function legitProVisiblePass(bot){return !!bot?.alive&&bot.team!==g.player.team&&!(bot.spawnProt>0)&&
    (flags.legitWallLock||!flags.legitVisible||!behindWall(bot));}
  function legitProScopedFov(){const scoped=(g.weapons.scopeLevel||0)>0;
    return lpOn('dynamicFov')&&scoped?Math.max(2,legitFov*legitProCfg.scopeFovRatio):legitFov;
  }
  function legitProRender(){
    section('LEGIT PRO // AIM ENGINE','10 real, independent aim-engine modifiers. Enable the original Legit Aim Assist to use these options.');
    const status=document.createElement('div');status.className='dw-v14-status';status.textContent=
      'BASE AIM '+(flags.legitAim?'ON':'OFF')+' / '+legitProDefs.filter(o=>flags[o.flag]).length+' OPTIONS ENABLED / BOT-LOBBY AIMING';content.append(status);
    const actions=grid();
    tile(actions,'◎ '+(flags.legitAim?'DISABLE':'ENABLE')+' LEGIT AIM','Master switch: uses the existing Legit Aimbot engine.',()=>{toggleFlag('legitAim');legitProReset();renderTab()});
    tile(actions,'↺ RESET PRO SETTINGS','Switch off only these ten aim-engine modifiers.',()=>{legitProDisable();renderTab()});
    const items=grid();items.classList.add('dw-v14-grid');
    for(const o of legitProDefs)tile(items,o.name,o.desc,()=>{legitProReset()},o.flag);
    section('PRECISE CONFIGURATION','Tune the modifiers independently. They take effect in-game while the menu is closed.');
    slider('Target reaction',0,500,10,legitProCfg.reactionMs,v=>{legitProCfg.reactionMs=v;legitProSave()},' ms');
    slider('Target-switch cooldown',0,1200,20,legitProCfg.switchMs,v=>{legitProCfg.switchMs=v;legitProSave()},' ms');
    slider('Maximum aim rotation per 60-Hz frame',.2,10,.2,legitProCfg.maxStepDeg,v=>{legitProCfg.maxStepDeg=v;legitProSave()},'°');
    slider('Velocity prediction',0,.4,.02,legitProCfg.leadSeconds,v=>{legitProCfg.leadSeconds=v;legitProSave()},' s');
    slider('Scoped FOV multiplier',.2,1,.05,legitProCfg.scopeFovRatio,v=>{legitProCfg.scopeFovRatio=v;legitProSave()},'×');
    slider('Maximum bot range',10,250,5,legitProCfg.maxDistance,v=>{legitProCfg.maxDistance=v;legitProSave()},' m');
    slider('Fast-bot speed threshold',.5,15,.5,legitProCfg.movingSpeed,v=>{legitProCfg.movingSpeed=v;legitProSave()},' u/s');
    slider('Recoil compensation strength',0,1,.05,legitProCfg.recoilRatio,v=>{legitProCfg.recoilRatio=v;legitProSave()},'×');
  }

  function assistAim(dt){
    // The original master, hotkeys, visibility rules, and activation remain intact.
    if(!flags.legitAim||!aimButtonHeld()||flags.autoShoot||panel.style.display!=='none'){
      legitFocus=null;legitProReset();return;
    }
    if(!v16AimAllowed()){legitFocus=null;legitProReset();return;}
    const sniper=/^(awp|ssg08|scar20|g3sg1)$/i.test(g.weapons.current||'')||
      !!g.weapons.def?.()?.zoom;
    if(lpOn('scopeGate')&&sniper&&(g.weapons.scopeLevel||0)<=0){legitFocus=null;legitProReset();return;}
    const now=performance.now(),fov=legitProScopedFov();
    let captureFov=(flags.legitWallLock?legitWallFov:fov);
    if(v16Flag('aim',0))captureFov=Math.min(captureFov,v16Cfg.microFov);
    let bot=null;
    if(flags.legitSticky&&legitProVisiblePass(legitFocus)&&legitProRangePass(legitFocus)&&
       angularError(legitFocus)<captureFov*.8)bot=legitFocus;
    if(!bot)bot=sightTarget(captureFov/2,false,true);
    // Target-switch cooldown: don't snap immediately from one target to another.
    if(lpOn('switch')&&legitProState.focus?.alive&&bot!==legitProState.focus&&
       now-legitProState.lockedAt<legitProCfg.switchMs){
      if(legitProVisiblePass(legitProState.focus)&&legitProRangePass(legitProState.focus)&&
         angularError(legitProState.focus)<captureFov*.8)bot=legitProState.focus;
      else bot=null;
    }
    if(!bot){legitFocus=null;legitProState.candidate=null;return;}
    if(bot!==legitProState.candidate){legitProState.candidate=bot;legitProState.candidateSince=now;}
    // Human reaction delay applies once per target acquisition, not every frame.
    if(lpOn('reaction')&&now-legitProState.candidateSince<legitProCfg.reactionMs){legitFocus=null;return;}
    if(bot!==legitProState.focus){legitProState.focus=bot;legitProState.lockedAt=now;}
    legitFocus=bot;
    const p=g.player,spot=aimSpot(bot,false);
    if(v16Flag('aim',9))spot.y=(bot._visY??bot.y)+1.13;
    if(lpOn('lead')){
      spot.x+=(Number(bot.vx)||0)*legitProCfg.leadSeconds;
      spot.y+=(Number(bot.vy)||0)*legitProCfg.leadSeconds;
      spot.z+=(Number(bot.vz)||0)*legitProCfg.leadSeconds;
    }
    if(lpOn('hitbox')){
      const speed=Math.hypot(Number(bot.vx)||0,Number(bot.vz)||0);
      spot.y=(bot._visY??bot.y)+Math.min((bot.height||1.8)-.12,
        speed>=legitProCfg.movingSpeed?1.12:1.62);
      if(lpOn('lead'))spot.y+=(Number(bot.vy)||0)*legitProCfg.leadSeconds;
    }
    const eyeY=p.y+(p.eyeH||1.6),dx=spot.x-p.x,dy=spot.y-eyeY,dz=spot.z-p.z;
    let yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
    if(lpOn('recoil')){
      // Camera punch angles are clamped to a safe radian range; never mutate weapon recoil.
      const punchYaw=Math.max(-.13,Math.min(.13,Number(g.weapons.punchY)||0));
      const punchPitch=Math.max(-.13,Math.min(.13,Number(g.weapons.punchP)||0));
      yaw-=punchYaw*legitProCfg.recoilRatio;
      pitch-=punchPitch*legitProCfg.recoilRatio;
    }
    const delta=angleDiff(yaw,p.yaw||0),pd=pitch-(p.pitch||0),err=Math.hypot(delta,pd)*180/Math.PI;
    legitProState.lastError=err;legitProState.lastAimTarget=bot;legitProState.lastSpot={...spot};
    if(flags.legitDeadzone&&err<.12)return;
    let factor=1-Math.exp(-Math.max(.1,legitStrength)*Math.min(dt,.05));
    if(lpOn('adaptive'))factor*=.23+.77*Math.min(1,err/6);
    if(v16Flag('aim',8))factor*=v16Cfg.softFactor;
    let moveYaw=delta*factor,movePitch=pd*factor;
    if(lpOn('step')){
      const max=Math.max(.001,legitProCfg.maxStepDeg*Math.PI/180*Math.max(.15,Math.min(3,dt*60)));
      const size=Math.hypot(moveYaw,movePitch);
      if(size>max){moveYaw*=max/size;movePitch*=max/size;}
    }
    legitProState.lastAppliedFactor=factor;
    p.yaw=(p.yaw||0)+moveYaw;
    p.pitch=Math.max(-1.56,Math.min(1.56,(p.pitch||0)+movePitch));
  }
  // V8.1: Recoil hotfix. The game recalculates recoil during weapon.update,
  // and firing creates fresh punch state, so clearing it in RAF alone was too late.
  function clearWeaponRecoil() {
    const w=g.weapons;
    if(typeof w.clearViewPunch==='function') {
      w.clearViewPunch();  // Clears accumulated aim/view punch and the recoil pattern state.
    } else {
      for(const k of ['punchP','punchY','shkP','shkY','shkR','sprayP','sprayY','shkPV','shkRV']) w[k]=0;
      const p=w.punch;
      if(p) for(const k of ['aimPitch','aimYaw','velPitch','velYaw','viewPitch','viewYaw']) p[k]=0;
    }
  }
  // V9.1: The playerShoot offsets are where Clutcher applies final random spread.
  // Keep aiming, weapon audio, hit detection and kill feed intact, but send an
  // actual (0,0) spread offset for shots fired by the local player.
  if(typeof originalPlayerShoot==='function') {
    g.playerShoot=function(weapon,offX,offY,...rest){
      return originalPlayerShoot.call(this,weapon,
        active&&(flags.noSpread||(flickFiring&&flags.flickPrecision))?0:offX,
        active&&(flags.noSpread||(flickFiring&&flags.flickPrecision))?0:offY,...rest);
    };
  }
  // The viewmodel.kick hook only controls one weapon renderer. Clutcher can
  // also animate the *CS2 rig* via cs2.play('shoot'), which was left intact
  // by V8.1/V9. Suppress that visual kick only when No Recoil is enabled.
  if(g.cs2&&typeof originalCs2Play==='function') {
    g.cs2.play=function(anim,...args){
      // Preserve muzzle and shoot animations even when recoil is disabled.
      return originalCs2Play.call(this,anim,...args);
    };
  }
  if(typeof originalWeaponUpdate==='function') {
    g.weapons.update=function(...args){
      if(active&&flags.noRecoil)clearWeaponRecoil();
      try {return originalWeaponUpdate.apply(this,args)}
      finally {if(active&&flags.noRecoil)clearWeaponRecoil();}
    };
  }
  if(typeof originalViewmodelKick==='function') {
    g.viewmodel.kick=function(...args){
      if(active&&flags.noRecoil)return;
      return originalViewmodelKick.apply(this,args);
    };
  }
  // Keep the game's sound, animation and projectile code; only shorten the cooldown.
  if(typeof originalWeaponFire==='function'){
    g.weapons.fire=function(...args){
      if(active&&flags.noRecoil)clearWeaponRecoil();
      const shotBefore=this.lastShotT, ammoBefore=this.state?.()?.ammo;
      let ret;
      try {ret=originalWeaponFire.apply(this,args)}
      finally {if(active&&flags.noRecoil)clearWeaponRecoil();}
      // Only apply rocket thrust if the weapon actually fired, not on empty clicks.
      const ammoAfter=this.state?.()?.ammo;
      const confirmedShot=this.lastShotT!==shotBefore ||
        (Number.isFinite(ammoBefore)&&Number.isFinite(ammoAfter)&&ammoAfter<ammoBefore);
      if(active&&g.state==='playing'&&g.player?.alive&&confirmedShot){
        rageOnConfirmedShot(performance.now());paradoxShotBoost();
      }
      if(active&&flags.rocketRecoil&&g.state==='playing'&&g.player?.alive&&confirmedShot){
        const def=this.def?.();
        if(def&&!['knife','grenade','c4','zeus'].includes(def.class)){
          const p=g.player, yaw=p.yaw||0, pitch=p.pitch||0;
          const horizontal=Math.cos(pitch);
          // Forward = [-sin(yaw)*cos(pitch), sin(pitch), -cos(yaw)*cos(pitch)]
          // Rocket recoil is the exact opposite (pitch down -> upward thrust).
          const dx=Math.sin(yaw)*horizontal,dy=-Math.sin(pitch)*rocketVertical,dz=Math.cos(yaw)*horizontal;
          const len=Math.hypot(dx,dy,dz)||1,mag=rocketPower/len;
          let vx=(p.vx||0)+dx*mag,vy=(p.vy||0)+dy*mag,vz=(p.vz||0)+dz*mag;
          const total=Math.hypot(vx,vy,vz);
          if(total>rocketMaxSpeed){const k=rocketMaxSpeed/total;vx*=k;vy*=k;vz*=k;}
          p.vx=vx;p.vy=vy;p.vz=vz;
          rocketShots++;
        }
      }
      if(active&&flags.fastFire&&g.state==='playing'&&this.current!=='knife'){
        this.nextFire=Math.min(this.nextFire,g.time+1/Math.max(2,fireRate));
      }
      return ret;
    };
  }
  // V5 movement pilot. The original update still reads the mouse and refreshes
  // stance, but a dedicated 3D flight controller handles position and speed.
  function keyDown(input,code){return !!input?.keys?.has?.(code)}
  function actionDown(input,name){try{return !!input?.downA?.(name)}catch{return false}}
  function flightInput(input,yaw){
    const fw=Number(actionDown(input,'forward'))-Number(actionDown(input,'back'));
    const side=Number(actionDown(input,'right'))-Number(actionDown(input,'left'));
    const up=Number(actionDown(input,'jump')||keyDown(input,'Space'));
    const down=Number(keyDown(input,'ControlLeft')||keyDown(input,'ControlRight')||actionDown(input,'crouch'));
    const turbo=keyDown(input,'ShiftLeft')||keyDown(input,'ShiftRight');
    const sn=Math.sin(yaw),cs=Math.cos(yaw);
    let x=-sn*fw+cs*side,z=-cs*fw-sn*side,y=up-down;
    const len=Math.hypot(x,y,z);if(len>1){x/=len;y/=len;z/=len}
    return {x,y,z,turbo};
  }
  function flyMoveAxis(player,axis,delta){
    if(!delta)return;
    const from={x:player.x,y:player.y,z:player.z};
    const to={...from,[axis]:from[axis]+delta};
    if(!flags.flyNoclip){
      // Three separate collision samples approximate the avatar's standing capsule.
      const dist=Math.abs(delta),sign=Math.sign(delta);
      const dx=axis==='x'?sign:0,dy=axis==='y'?sign:0,dz=axis==='z'?sign:0;
      for(const y of [.3,Math.max(.55,player.height*.5),Math.max(.8,player.height-.16)]){
        const hit=originalRaycast?.call(g.physics,from.x,from.y+y,from.z,dx,dy,dz,dist+.28,1);
        if(hit && hit.t<dist+.24) return;
      }
      if(typeof g.physics?.solidAt==='function'){
        const r=Math.min(player.radius||.4,.45);
        for(const x of [-r,r])for(const z of [-r,r])for(const h of [.18,Math.max(.65,player.height-.12)]){
          if(g.physics.solidAt(to.x+x,to.y+h,to.z+z))return;
        }
      }
    }
    player[axis]=to[axis];
  }
  function pilotFly(p,dt,input){
    const control=panel.style.display==='none'?flightInput(input,p.yaw||0):{x:0,y:0,z:0,turbo:false};
    const mult=control.turbo?flyBoost:1;
    const desired={x:control.x*flySpeed*mult,y:control.y*flySpeed*mult,z:control.z*flySpeed*mult};
    const blend=1-Math.exp(-Math.max(2,flySmooth)*dt);
    for(const axis of ['x','y','z']){
      flightVel[axis]+=(desired[axis]-flightVel[axis])*blend;
      if(Math.abs(flightVel[axis])<.03 && desired[axis]===0)flightVel[axis]=0;
    }
    // Sub-stepping avoids crossing a thin wall at high flight speeds.
    const distance=Math.hypot(flightVel.x,flightVel.y,flightVel.z)*dt;
    const steps=Math.max(1,Math.ceil(distance/.42));
    for(let step=0;step<steps;step++){
      flyMoveAxis(p,'x',flightVel.x*dt/steps);
      flyMoveAxis(p,'z',flightVel.z*dt/steps);
      flyMoveAxis(p,'y',flightVel.y*dt/steps);
    }
    p.vx=p.vy=p.vz=0;p.onGround=false;p.onLadder=false;p.jumpBuffer=0;
    // Avoid automatic fall-reset when flying below the map.
    p._safeX=p.x;p._safeY=p.y;p._safeZ=p.z;
  }
  // V18.8: Preserve native movement speed; steer existing air momentum only.
  // No velocity pumping, forced forward acceleration or Movement Speed multiplier.
  // Airborne A/D works even after the jump key is released.
  function applyAirStrafe(p,dt,input){
    if(!flags.autoStrafe||!p.alive||p.onGround||p.onLadder||flags.fly)return;
    if(!Number.isFinite(dt)||dt<=0||dt>.2)return;
    let vx=Number(p.vx),vz=Number(p.vz);
    if(!Number.isFinite(vx)||!Number.isFinite(vz))return;
    let velocity=Math.hypot(vx,vz);
    const cap=Math.max(6,Math.min(30,airMaxSpeed));
    // Clamp even with no directional input, preventing runaway boosts on landing loops.
    if(velocity>cap){const f=cap/velocity;vx*=f;vz*=f;velocity=cap;
      p.vx=vx;p.vz=vz;
    }
    // From a standstill, never manufacture momentum.
    if(velocity<.35)return;
    const yaw=Number(p.yaw)||0;
    const fw=Number(actionDown(input,'forward'))-Number(actionDown(input,'back'));
    const side=Number(actionDown(input,'right'))-Number(actionDown(input,'left'));
    const turn=prevStrafeYaw===null?0:Math.atan2(Math.sin(yaw-prevStrafeYaw),Math.cos(yaw-prevStrafeYaw));
    const turning=Math.abs(turn)>.0015;
    // When turning the mouse, gently follow the new forward heading.
    // No automatic forward motion just because the player is airborne.
    if(!fw&&!side&&!(turning&&actionDown(input,'jump')))return;
    const forward=fw||(!side&&turning?1:0);
    const sin=Math.sin(yaw),cos=Math.cos(yaw);
    const wishX=-sin*forward+cos*side,wishZ=-cos*forward-sin*side;
    if(Math.hypot(wishX,wishZ)<.05)return;
    const targetAngle=Math.atan2(wishZ,wishX);
    const currentAngle=Math.atan2(vz,vx);
    const delta=Math.atan2(Math.sin(targetAngle-currentAngle),Math.cos(targetAngle-currentAngle));
    const maxTurn=Math.max(.5,Math.min(5.5,airSteer*.24))*Math.min(dt,.05);
    const angle=currentAngle+Math.max(-maxTurn,Math.min(maxTurn,delta));
    p.vx=Math.cos(angle)*velocity;
    p.vz=Math.sin(angle)*velocity;
  }
  if(typeof originalPlayerUpdate==='function'){
    g.player.update=function(dt,input,...rest){
      const flying=active&&flags.fly&&g.state==='playing'&&this.alive;
      const before={x:this.x,y:this.y,z:this.z};const wasGround=!!this.onGround;
      if(flying){this.vx=this.vy=this.vz=0;this.onGround=false;this.jumpBuffer=0;}
      if(active&&flags.quickStop&&!flying&&this.onGround &&
          !['forward','back','left','right'].some(k=>actionDown(input,k))){
        this.vx*=.38;this.vz*=.38;
      }
      if(active&&flags.moonJump&&!flying&&this.onGround&&actionDown(input,'jump')){
        this.vy=Math.max(this.vy||0,10.6);
      }
      if(active&&flags.autoBhop&&!flying&&actionDown(input,'jump')&&this.onGround&&!this.onLadder){
        this.jumpBuffer=Math.max(this.jumpBuffer||0,.14);
      }
      const ret=originalPlayerUpdate.call(this,dt,input,...rest);
      if(active&&g.state==='playing'&&this.alive&&Number.isFinite(dt)&&dt>0&&dt<.2){
        if(flying){
          // Prevent the original physics tick from stealing our 3D flight steering.
          this.x=before.x;this.y=before.y;this.z=before.z;
          pilotFly(this,dt,input);
        }else{
          if(flags.moonJump&&wasGround&&!this.onGround&&actionDown(input,'jump'))this.vy=Math.max(this.vy||0,11);
          flightVel.x=flightVel.y=flightVel.z=0;
          if(gravityScale!==1&&!this.onGround&&!this.onLadder){
            this.vy+=(1-gravityScale)*20.32*dt;
          }
          applyAirStrafe(this,dt,input);
        }
      }
      prevStrafeYaw=this.yaw||0;
      return ret;
    };
  }
  // Ground-safe blink: horizontal travel only, checking floor and collision every 0.5m.
  function validFooting(x,y,z,p){
    const h=p.height||1.8,r=Math.min(p.radius||.4,.42);
    if(typeof g.physics?.solidAt==='function'){
      for(const dx of [-r,r])for(const dz of [-r,r])for(const dy of [.12,.75,h-.1]){
        if(g.physics.solidAt(x+dx,y+dy,z+dz))return false;
      }
    }
    return true;
  }
  function findGround(x,y,z){
    const n=g.physics?.groundHeight?.(x,y+1.2,z);
    return Number.isFinite(n) && n > (g.map?.voidY??-20)+.2?n:null;
  }
  function safeMoveSpot(x,y,z,p){
    const gy=findGround(x,y,z);if(gy===null)return null;
    if(Math.abs(gy-y)>1.0||!validFooting(x,gy+.07,z,p))return null;
    return {x,y:gy+.07,z};
  }
  function teleportToBot(){
    const b=sightTarget(180)||enemyBots()[0];
    if(!b)return notice('No living enemy bots');
    const p=g.player;
    const candidates=[[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[2,1.6],[-2,-1.6]];
    for(const [dx,dz] of candidates){
      const goal=safeMoveSpot(b.x+dx,b.y,b.z+dz,p);
      if(goal){blinkUndo={x:p.x,y:p.y,z:p.z};Object.assign(p,goal);p.vx=p.vy=p.vz=0;p.onGround=true;
        return notice('Teleported safely near '+(b.name||'enemy'));}
    }
    notice('No safe ground near enemy');
  }
  function blinkForward(){
    const p=g.player;if(!p?.alive)return;
    const fwdX=-Math.sin(p.yaw||0),fwdZ=-Math.cos(p.yaw||0);
    const origin={x:p.x,y:p.y,z:p.z};
    const base=findGround(origin.x,origin.y,origin.z);
    if(base===null||Math.abs(origin.y-base)>1.8)return notice('Blink needs nearby ground — land first');
    let pos={x:origin.x,y:base+.07,z:origin.z},walked=0;
    const increment=.48;
    while(walked<blinkDistance-.001){
      const step=Math.min(increment,blinkDistance-walked),tx=pos.x+fwdX*step,tz=pos.z+fwdZ*step;
      const gy=findGround(tx,pos.y,tz);
      if(gy===null||gy-pos.y>.53||pos.y-gy>.85)break; // no ledges/steep cliffs
      const next={x:tx,y:gy+.07,z:tz};
      let blocked=false;
      for(const h of [.30,.95,Math.max(.8,(p.height||1.8)-.15)]){
        const hit=originalRaycast?.call(g.physics,pos.x,pos.y+h,pos.z,fwdX,0,fwdZ,step+(p.radius||.4),1);
        if(hit && hit.t<step+(p.radius||.4)-.04){blocked=true;break;}
      }
      if(blocked||!validFooting(next.x,next.y,next.z,p))break;
      pos=next;walked+=step;
    }
    if(walked<.25)return notice('Blink blocked — no safe landing');
    blinkUndo={...origin};Object.assign(p,pos);
    p.vx=p.vy=p.vz=0;p.onGround=true;p._safeX=p.x;p._safeY=p.y;p._safeZ=p.z;
    notice('SAFE BLINK '+walked.toFixed(1)+'m · use Blink Back to undo');
  }
  function undoBlink(){
    if(!blinkUndo)return notice('Nothing to undo');
    const p=g.player,spot=safeMoveSpot(blinkUndo.x,blinkUndo.y,blinkUndo.z,p);
    if(!spot)return notice('Old position is no longer safe');
    blinkUndo={x:p.x,y:p.y,z:p.z};Object.assign(p,spot);p.vx=p.vy=p.vz=0;p.onGround=true;
    notice('Blink reversed');
  }
  function saveCheckpoint(){checkpoint={x:g.player.x,y:g.player.y,z:g.player.z};notice('Checkpoint saved')}
  function returnCheckpoint(){
    if(!checkpoint)return notice('Save a checkpoint first');
    const p=g.player,spot=safeMoveSpot(checkpoint.x,checkpoint.y,checkpoint.z,p);
    if(!spot)return notice('Checkpoint unsafe or midair');
    blinkUndo={x:p.x,y:p.y,z:p.z};Object.assign(p,spot);p.vx=p.vy=p.vz=0;p.onGround=true;
    notice('Returned to checkpoint');
  }
  function airDash(){
    const p=g.player,x=-Math.sin(p.yaw||0),z=-Math.cos(p.yaw||0);
    p.vx+=x*19;p.vz+=z*19;p.vy=Math.max(p.vy||0,2.5);p.onGround=false;
    notice('AIR DASH');
  }
  // Modify each bot agent's *own* materials, never their shared originals.
  function clearChams(){
    clearAimBodyGlow();
    for(const [mesh,old] of chamsMeshes){
      try{const modified=mesh.material;
        mesh.material=old.material;mesh.renderOrder=old.renderOrder;mesh.frustumCulled=old.frustumCulled;
        for(const m of (Array.isArray(modified)?modified:[modified]))m?.dispose?.();
      }catch(e){console.warn('[VOIDWARE] Restore cham:',e)}
    }
    chamsMeshes.clear();
  }
  function applyChams(){
    // Only release aim-chams when enabling legacy cyan chams for the first time.
    if(bodyGlowMeshes.size && !chamsMeshes.size)clearAimBodyGlow();
    if(!flags.chams){if(chamsMeshes.size)clearChams();return;}
    for(const bot of enemyBots()){
      const root=bot.cs2Agent?.root;if(!root)continue;
      root.traverse?.(node=>{
        if((!node.isMesh&&!node.isSkinnedMesh)||chamsMeshes.has(node)||!node.material)return;
        try{
          const old={material:node.material,renderOrder:node.renderOrder,frustumCulled:node.frustumCulled};
          const color=0x45c4fc;
          const clone=(mat)=>{
            const copy=mat.clone();copy.color?.setHex(color);
            copy.emissive?.setHex(0x166baa);if('emissiveIntensity' in copy)copy.emissiveIntensity=1.45;
            copy.depthTest=false;copy.depthWrite=false;copy.transparent=true;copy.opacity=.88;
            copy.side=2;copy.needsUpdate=true;return copy;
          };
          node.material=Array.isArray(node.material)?node.material.map(clone):clone(node.material);
          node.renderOrder=999;node.frustumCulled=false;chamsMeshes.set(node,old);
        }catch(e){console.warn('[VOIDWARE] Chams:',e)}
      });
    }
  }
  // All modifications to raycasts are scoped ONLY to the one local-player bullet call.
  // Original physics is restored immediately, even if the shot throws.
  g.fireBullet=function(shooter,x,y,z,dx,dy,dz,def){
    if(flickFiring||shooter!==g.player||(!flags.wallbang&&!flags.silent&&!forcedTarget))return originalFireBullet.apply(this,arguments);
    const target=forcedTarget||((flags.silent&&!suppressSilent)?nearest():null);
    const blocked=target?behindWall(target):false;
    if(target&&(!blocked||flags.wallbang)){
      const aim=aimSpot(target,flags.rageLead),tx=aim.x-x,ty=aim.y-y,tz=aim.z-z;
      const len=Math.hypot(tx,ty,tz)||1;
      dx=tx/len;dy=ty/len;dz=tz/len;
    }
    const oldRay=g.physics.raycast;
    if(flags.wallbang)g.physics.raycast=function(){return null};
    try {originalFireBullet.call(this,shooter,x,y,z,dx,dy,dz,def)}
    finally {g.physics.raycast=oldRay}
    // Animated hitboxes may miss on redirected rays. Use local kill fallback only
    // for a valid target selected when the player has actually fired a shot.
    if((flags.silent||forcedTarget)&&target?.alive&&(!blocked||flags.wallbang)&&g.state==='playing'){
      g.killEntity(target,g.player,def||g.weapons.def?.()||null,true,null,blocked);
    }
  };
  // -------------------- V8.3 | LOCAL KILL SOUND LAB --------------------
  function getKillAudio(){
    if(!soundContext){
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)return null;
      try{soundContext=new C();}catch(err){console.warn('[VOIDWARE] Audio unavailable:',err);return null;}
    }
    if(soundContext.state==='suspended')soundContext.resume().catch(()=>{});
    return soundContext;
  }
  function playKillSound(headshot=false,preview=false){
    if(!preview&&!flags.killSound)return;
    const ac=getKillAudio();if(!ac||soundVolume<=0)return;
    const now=performance.now();
    if(!preview){soundCombo=(now-soundComboAt<2800)?Math.min(6,soundCombo+1):0;soundComboAt=now;}
    const combo=preview?0:soundCombo;
    const volume=Math.min(.4,Math.max(0,soundVolume))*.58;
    const start=ac.currentTime+.006;
    const presets={
      bell:  [[1000,1430,.19,'sine'],[1510,1990,.13,'sine']],
      classic:[[720,930,.105,'triangle'],[890,1300,.09,'sine']],
      arcade:[[540,920,.1,'square'],[920,1270,.085,'triangle']],
      laser: [[1750,450,.17,'sawtooth']],
      bass:  [[260,100,.17,'sine'],[440,180,.11,'triangle']]
    };
    const notes=presets[soundPreset]||presets.bell;
    for(let j=0;j<notes.length;j++){
      const [startHz,endHz,duration,wave]=notes[j],durationSec=Math.max(.04,duration);
      try{
        const o=ac.createOscillator(), gain=ac.createGain(), pitch=1+combo*.045+(headshot?.16:0);
        o.type=wave;
        o.frequency.setValueAtTime(startHz*pitch,start);
        o.frequency.exponentialRampToValueAtTime(Math.max(35,endHz*pitch),start+durationSec);
        gain.gain.setValueAtTime(.0001,start);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume*(j===0?1:.58)),start+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,start+durationSec);
        o.connect(gain);gain.connect(ac.destination);
        o.start(start);o.stop(start+durationSec+.025);
        o.onended=()=>{try{o.disconnect();gain.disconnect()}catch{}};
      }catch(err){console.warn('[VOIDWARE] Sound error:',err)}
    }
  }
  g.hud.addKill=function(killer,weapon,victim,headshot,info={}){
    if(killer===g.player){
      if(flags.vampire&&victim&&killer!==victim){g.player.health=Math.min(100,(g.player.health||0)+25);g.hud?.updateHealth?.();}
      killCount++;
      if(flags.killSound)playKillSound(!!headshot);
      if(flags.hitmarkers)hitmarkerUntil=performance.now()+280;
      if(flags.wallIcon&&victim&&(info.pierced||behindWall(victim)))info={...info,pierced:true};
    }
    return originalAddKill.call(this,killer,weapon,victim,headshot,info);
  };
  if(typeof originalMaxSpeed==='function'){
    g.weapons.maxSpeed=function(){return originalMaxSpeed.call(this)*speed*(flags.sprintBoost&&g.input?.downA?.('forward')?1.8:1)};
  }

  // -------------------- BODY, CAMERA & SKIN VISUALS --------------------
  function tintModel(root){if(!root||skin==='default')return;
    const palette={bluegem:[0x0538cd,0x007bff,0x052e80,0x03b5ed],sapphire:[0x1539b5,0x1539b5],ruby:[0xb20935,0xe71e53],gold:[0xd1a52b,0xffd871],neon:[0x8a3fff,0x15d9f8]}[skin];
    if(!palette)return;
    let idx=0;
    root.traverse?.(node=>{
      if(!node.isMesh&&!node.isSkinnedMesh)return;
      for(const mat of (Array.isArray(node.material)?node.material:[node.material])){
        if(!mat?.color)continue;
        if(!savedMaterials.has(mat))savedMaterials.set(mat,{ color:mat.color.clone(), emissive:mat.emissive?.clone?.()||null });
        mat.color.setHex(palette[(idx++)%palette.length]);
        if(mat.emissive && skin==='neon')mat.emissive.setHex(0x07162c);
      }
    });
  }
  function resetMaterials(){for(const [mat,state] of savedMaterials){try{mat.color.copy(state.color);if(state.emissive&&mat.emissive)mat.emissive.copy(state.emissive)}catch{}}savedMaterials.clear()}
  function applySkin(){resetMaterials();tintModel(viewmodel);tintModel(avatar?.heldWeapon)}
  function avatarWeaponId(){return g.weapons.current==='knife'&&skin==='bluegem'?'knife_karambit':g.weapons.current||'knife'}
  // V12.1: Real first-person Karambit asset preview where supported by Clutcher's viewmodel rig.
  // No inventory item is created, and the Blue Gem color is a client-only visual tint.
  let fpGemLoading=false,fpGemLastTry=0,fpOriginalKnifeId=null,fpGemTintedGun=null;
  function tintGemGun(){
    if(skin!=='bluegem'||g.weapons.current!=='knife')return;
    const gun=g.cs2?.rig?._paintGun||g.cs2?.rig?.gun;
    if(gun && gun!==fpGemTintedGun){tintModel(gun);fpGemTintedGun=gun;}
  }
  function syncBlueGemFirstPerson(force=false){
    if(!active||skin!=='bluegem'||g.weapons.current!=='knife'||flags.third)return;
    const cs=g.cs2,rig=cs?.rig;
    if(typeof cs?.setWeapon!=='function'||!rig){return}
    if(rig.weaponId==='knife_karambit'){tintGemGun();return}
    const now=performance.now();if(fpGemLoading||(!force&&now-fpGemLastTry<2000))return;
    fpGemLastTry=now;fpGemLoading=true;
    if(!fpOriginalKnifeId)fpOriginalKnifeId=rig.weaponId||'knife_'+(g.player.team==='T'?'t':'ct');
    Promise.resolve(cs.setWeapon('knife_karambit',{team:g.player.team})).then(success=>{
      fpGemLoading=false;
      if(!active||skin!=='bluegem'||g.weapons.current!=='knife')return;
      if(success===false){notice('1P Karambit asset unavailable. Try Third Person.');return}
      tintGemGun();
    }).catch(err=>{fpGemLoading=false;console.warn('[VOIDWARE] First person Karambit:',err)});
  }
  function restoreFirstPersonKnife(){
    if(g.cs2?.rig?.weaponId!=='knife_karambit')return;
    const original=fpOriginalKnifeId||'knife_'+(g.player.team==='T'?'t':'ct');
    Promise.resolve(g.cs2?.setWeapon?.(original,{team:g.player.team})).catch(()=>{});
  }
  function chooseSkin(value){
    if(skin==='bluegem'&&value!=='bluegem')restoreFirstPersonKnife();
    skin=value;avatarGun='';fpGemTintedGun=null;applySkin();
    if(value==='bluegem'){
      // Give the user something immediately visible, instead of silently recoloring a hidden body.
      if(g.weapons.current!=='knife')g.weapons.equip('knife');
      if(flags.third)ensureAvatar();else syncBlueGemFirstPerson(true);
      notice('Blue Gem preview enabled · knife equipped · try 1P / 3P');
    }else notice('Colorway: '+value+' (local preview)');
  }

  // -------------------- V8.3 | THIRD-PERSON MODEL CHANGER --------------------
  function appearanceTeam(){
    const own=g.player.team==='T'?'T':'CT';
    if(modelChoice==='ct')return 'CT';
    if(modelChoice==='t')return 'T';
    if(modelChoice==='enemy')return own==='T'?'CT':'T';
    if(modelChoice==='random')return modelRandomTeam;
    return own;
  }
  function restoreModelColors(){
    for(const [node,orig] of modelMaterials){
      try{
        const now=node.material;
        node.material=orig;
        for(const material of (Array.isArray(now)?now:[now])){
          if(material&&!((Array.isArray(orig)?orig:[orig]).includes(material)))material.dispose?.();
        }
      }catch(e){console.warn('[VOIDWARE] restore model:',e)}
    }
    modelMaterials.clear();modelAppliedStyle='original';
  }
  function applyModelColors(){
    restoreModelColors();
    if(!avatar?.root || modelColor==='original')return;
    const presets={cobalt:[0x1f5aff,0x4bb7ff],crimson:[0xd82f55,0xff7592],gold:[0xefb532,0xffdc7a],
      neon:[0x9a40ff,0x11f2ff],emerald:[0x0ea575,0x7affc9],ghost:[0x94ceec,0xc6f4ff]};
    const colors=presets[modelColor];if(!colors)return;
    let index=0;
    avatar.root.traverse?.(node=>{
      if(!(node.isMesh||node.isSkinnedMesh)||!node.material)return;
      // Keep the held weapon's independent colorway intact.
      for(let a=node;a;a=a.parent)if(a===avatar.heldWeapon)return;
      const originals=Array.isArray(node.material)?node.material:[node.material];
      const clones=originals.map(mat=>{
        const copy=mat?.clone?.()||mat;
        if(copy!==mat&&copy?.color)copy.color.setHex(colors[(index++)%colors.length]);
        if(copy!==mat&&copy?.emissive)copy.emissive.setHex(modelColor==='ghost'?0x143e54:0x0a0810);
        if(copy!==mat&&modelColor==='ghost'){copy.transparent=true;copy.opacity=.58;copy.depthWrite=false}
        return copy;
      });
      modelMaterials.set(node,node.material);
      node.material=Array.isArray(node.material)?clones:clones[0];
    });
    modelAppliedStyle=modelColor;
  }
  function setModelChoice(value){
    if(!['auto','ct','t','enemy','random'].includes(value))return;
    modelChoice=value;
    if(value==='random')modelRandomTeam=Math.random()<.5?'CT':'T';
    const required=appearanceTeam();
    if(avatar&&avatarTeam!==required){disposeAvatar();nextAvatarRetry=0;}
    notice('Model: '+value.toUpperCase()+(flags.third?'':' · enable Third Person to see it'));
  }
  function rerollModel(){
    modelChoice='random';modelRandomTeam=Math.random()<.5?'CT':'T';
    if(avatar){disposeAvatar();nextAvatarRetry=0;}
    notice('Random model: '+modelRandomTeam+' · Third Person view');
  }
  function ensureAvatar(){
    if(!active||avatarPromise||avatar||!flags.third||g.state!=='playing'||performance.now()<nextAvatarRetry)return;
    const prototypeAgent=g.previewAgent||g.botMgr.bots.find(b=>b.cs2Agent)?.cs2Agent;
    const Ctor=prototypeAgent?.constructor;
    if(!Ctor||typeof Ctor.prototype?.load!=='function'){nextAvatarRetry=performance.now()+2500;return;}
    avatarPromise=true;avatarLoadTries++;
    try {
      const agent=new Ctor(g.renderer), team=appearanceTeam();
      Promise.resolve(agent.load(team)).then(loaded=>{
        avatarPromise=false;if(!active){agent.dispose?.();return}
        avatar=loaded||agent;avatarTeam=team;avatarGun='';avatarBaseScale=avatar.root?.scale?.clone?.()||null;g.scene.add(avatar.root);applyModelColors();
        avatar.root.visible=false;notice('3D player model ready ✓');
      }).catch(e=>{avatarPromise=false;nextAvatarRetry=performance.now()+3500;console.warn('[VOIDWARE] Avatar loading:',e);notice('Body load failed; retrying')});
    }catch(e){avatarPromise=false;nextAvatarRetry=performance.now()+3500;console.warn(e)}
  }
  function disposeAvatar(){if(!avatar)return;restoreModelColors();try{avatar.root?.parent?.remove(avatar.root);avatar.dispose?.()}catch(e){console.warn(e)}avatar=null;avatarGun='';avatarBaseScale=null;}
  // Camera follows the real aim angle. Only camera position moves backward.
  if(cameraPosition&&typeof originalCamSet==='function'){
    cameraPosition.set=function(x,y,z){
      if(!active||!flags.third||g.state!=='playing'||!g.player.alive)return originalCamSet.call(this,x,y,z);
      const yaw=g.player.yaw||0;
      let ox=Math.sin(yaw)*thirdDistance+Math.cos(yaw)*.2;
      let oy=thirdHeight;
      let oz=Math.cos(yaw)*thirdDistance-Math.sin(yaw)*.2;
      const len=Math.hypot(ox,oy,oz);
      try {const hit=originalRaycast?.call(g.physics,x,y,z,ox/len,oy/len,oz/len,len,2);
        if(hit&&hit.t<len){const fraction=Math.max(.05,(hit.t-.2)/len);ox*=fraction;oy*=fraction;oz*=fraction}}
      catch {}
      return originalCamSet.call(this,x+ox,y+oy,z+oz);
    };
  }
  if(firstPersonRig&&typeof originalRigVisible==='function'){
    firstPersonRig.setVisible=function(visible,...args){return originalRigVisible.call(this,!flags.third&&visible,...args)};
  }


  // -------------------- V6 EXTRA BOT TOYS --------------------
  function botDisarm(){let count=0;for(const b of allBots()){b.weapon='knife';b._dry=['knife'];count++;}notice('Disarmed '+count+' bots');}
  function botCeasefire(){if(!flags.peacefulBots)return;for(const b of g.botMgr.bots)if(b.alive)b.nextFire=Math.max(b.nextFire||0,g.time+.8);}
  function botTurnAround(){for(const b of allBots()){b.yaw=(b.yaw||0)+Math.PI;}notice('Bots turned around');}
  function botFullHeal(){for(const b of allBots()){b.health=100;b.armor=100;}notice('All bots healed');}
  function botLaunch(){for(const b of allBots()){b.vy=Math.max(b.vy||0,10);}notice('Bot rocket launch');}
  function botShuffle(){const p=g.player;let n=0;
    for(const b of allBots()){const a=n*2.39996,r=7+Math.sqrt(n)*2;
      const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
      const goal=safeMoveSpot(x,p.y,z,b);
      if(goal){Object.assign(b,goal);b.vx=b.vy=b.vz=0;}n++;}
    notice('Bot constellation');
  }
  // -------------------- V7 / TEN NEW EXTRAS --------------------
  // These abilities only manipulate bot entities in the local game instance.
  function selectedEnemy(){
    const list=enemyBots();if(!list.length)return null;
    return rageFocus?.alive&&rageFocus.team!==g.player.team?rageFocus:
      list.reduce((best,b)=>Math.hypot(b.x-g.player.x,b.z-g.player.z)<Math.hypot(best.x-g.player.x,best.z-g.player.z)?b:best);
  }
  function applyExtraBotFields(dt,now){
    const p=g.player;
    if(flags.botOrbit){
      if(now-orbitLastUpdate<45)return;
      orbitLastUpdate=now;
      const list=enemyBots(),count=list.length;
      list.forEach((b,i)=>{
        const phase=now*.00065+i*2*Math.PI/Math.max(count,1);
        const x=p.x+Math.cos(phase)*5.8,z=p.z+Math.sin(phase)*5.8;
        const spot=safeMoveSpot(x,p.y,z,b);
        if(spot){Object.assign(b,spot);b.vx=0;b.vz=0;b.vy=0;b.yaw=Math.atan2(-(p.x-x),-(p.z-z));}
      });return;
    }
    if(!flags.botMagnet&&!flags.botRepulse)return;
    for(const b of enemyBots()){
      const dx=b.x-p.x,dz=b.z-p.z,dist=Math.hypot(dx,dz)||.01;
      if(flags.botMagnet&&dist>3.8&&dist<40){
        const ax=-dx/dist*28*dt,az=-dz/dist*28*dt;
        b.vx=Math.max(-12,Math.min(12,(b.vx||0)+ax));
        b.vz=Math.max(-12,Math.min(12,(b.vz||0)+az));
      }else if(flags.botRepulse&&dist<14){
        const a=38*dt;
        b.vx=Math.max(-22,Math.min(22,(b.vx||0)+dx/dist*a));
        b.vz=Math.max(-22,Math.min(22,(b.vz||0)+dz/dist*a));
      }
    }
  }
  function swapEnemy(){
    const b=selectedEnemy(),p=g.player;if(!b)return notice('No enemy to swap');
    const pNew=safeMoveSpot(b.x,b.y,b.z,p),bNew=safeMoveSpot(p.x,p.y,p.z,b);
    if(!pNew||!bNew)return notice('No safe swap positions');
    const old={x:p.x,y:p.y,z:p.z};blinkUndo=old;
    Object.assign(p,pNew);Object.assign(b,bNew);
    p.vx=p.vy=p.vz=b.vx=b.vy=b.vz=0;
    notice('Swapped with '+(b.name||'enemy'));
  }
  function pullEnemy(){
    const b=selectedEnemy(),p=g.player;if(!b)return notice('No enemy to pull');
    const x=p.x-Math.sin(p.yaw||0)*4,z=p.z-Math.cos(p.yaw||0)*4;
    const spot=safeMoveSpot(x,p.y,z,b);
    if(!spot)return notice('No safe spot in front of you');
    Object.assign(b,spot);b.vx=b.vy=b.vz=0;
    notice('Pulled '+(b.name||'enemy')+' into view');
  }
  function launchEnemy(){
    const b=selectedEnemy();if(!b)return notice('No enemy to launch');
    b.vy=22;b.onGround=false;
    notice('Launched '+(b.name||'enemy'));
  }
  // V8 / NIGHTFALL -- new local-bot features. Scoped to bot objects in the current match.
  function enemiesAround(radius=auraRadius){const p=g.player;return enemyBots().filter(b=>Math.hypot(b.x-p.x,b.z-p.z)<=radius);}
  function applyNightfall(dt,now){
    const p=g.player,near=enemiesAround(),nearFriends=allBots().filter(b=>b.team===p.team&&Math.hypot(b.x-p.x,b.z-p.z)<=auraRadius);
    if(flags.killAura&&now-lastAuraKill>330){const b=near.find(b=>b.spawnProt<=0);if(b){lastAuraKill=now;g.killEntity(b,p,g.weapons.def?.()||null,false,null,false);}}
    if(flags.teamGuardian){for(const b of nearFriends){b.health=Math.min(100,Math.max(b.health||0,80));b.armor=Math.min(100,Math.max(b.armor||0,75));}}
    if(flags.silenceAura){for(const b of near)b.nextFire=Math.max(b.nextFire||0,g.time+.7);}
    if(flags.blindAura){for(const b of near)b.blindUntil=Math.max(b.blindUntil||0,g.time+.8);}
    if(flags.bounceAura&&now-lastBounce>bounceEvery){lastBounce=now;for(const b of near){b.vy=Math.max(b.vy||0,9);b.onGround=false;}}
    if(flags.glassBots){for(const b of enemyBots())b.health=Math.min(b.health||100,1);}
    if(flags.enemyConfuse){for(const b of near){b.yaw=(b.yaw||0)+dt*8;b.vx=(b.vx||0)*Math.max(.4,1-3*dt);b.vz=(b.vz||0)*Math.max(.4,1-3*dt);}}
    if(flags.disarmAura){for(const b of near){b.weapon='knife';b._dry=['knife'];}}
  }
  function shockwave(){let n=0,p=g.player;for(const b of enemiesAround(auraRadius*2)){
    const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz)||1;
    b.vx=dx/d*35;b.vz=dz/d*35;b.vy=11;b.onGround=false;n++;
  }notice('SHOCKWAVE: '+n+' bots launched');}
  function flashAll(){let n=0;for(const b of enemyBots()){b.blindUntil=g.time+16;n++;}notice('Flashed '+n+' enemy bots');}
  function glassNow(){let n=0;for(const b of enemyBots()){b.health=1;n++;}notice('One-HP enemies: '+n);}
  function sniperArmy(){let n=0;for(const b of allBots()){b.weapon='ssg08';b._dry=['ssg08'];n++;}notice('Scout army: '+n);}
  function allBotReset(){let n=0;for(const b of g.botMgr.bots){try{b.respawnT=0;b.spawn();n++;}catch(e){}}notice('Respawned '+n+' bots');}
  function freezeTarget(){const b=selectedEnemy();if(!b)return notice('No enemy selected');
    b.nextFire=g.time+30;b.blindUntil=g.time+30;b.vx=b.vz=0;notice('Stunned '+(b.name||'enemy')+' for 30s');}
  function summonCircle(){let n=0,p=g.player;for(const b of enemyBots()){
    const a=(n+1)*2.39996,x=p.x+Math.cos(a)*6,z=p.z+Math.sin(a)*6;
    const safeSpot=safeMoveSpot(x,p.y,z,b);
    if(safeSpot){Object.assign(b,safeSpot);b.vx=b.vy=b.vz=0;n++;}
  }notice('Summoned '+n+' nearby enemies');}
  function toggleMega(){toggleFlag('megaRage');renderTab()}
  function airBrake(){g.player.vx=0;g.player.vz=0;notice('Airbrake applied')}
  function healWeakBot(){const b=enemyBots().sort((a,b)=>(a.health||100)-(b.health||100))[0];if(b){b.health=100;b.armor=100;notice('Healed '+(b.name||'bot'))}}
  function cycleRageTarget(){const list=enemyBots();if(!list.length)return notice('No living enemies');rageFocus=list[(list.indexOf(rageFocus)+1)%list.length];notice('Rage locked: '+(rageFocus.name||'BOT'))}
  function closestVisible(){return sightTarget(120,false)}
  function aimStatusText(){const b=legitFocus?.alive?legitFocus:rageFocus?.alive?rageFocus:null;
    return b?'TARGET: '+String(b.name||'BOT').slice(0,18)+' · '+Math.hypot(b.x-g.player.x,b.z-g.player.z).toFixed(0)+'m':'NO TARGET'}


  function odSaveSlot(n){
    const data={name:'OVERDRIVE SLOT '+n,at:new Date().toLocaleString(), flags:Object.fromEntries(Object.entries(flags).filter(([k])=>k!=='fpsBoost')),levels:{...odPrefs.levels},theme:uiTheme};
    try{const all=JSON.parse(localStorage.getItem(odProfileStorage)||'{}');all[n]=data;localStorage.setItem(odProfileStorage,JSON.stringify(all));notice('Saved power preset '+n)}catch(e){notice('Could not save preset')}
  }
  function odLoadSlot(n){
    try {const data=JSON.parse(localStorage.getItem(odProfileStorage)||'{}')[n];if(!data)return notice('Slot '+n+' is empty');
      panicReset();for(const [key,value] of Object.entries(data.flags||{}))if(key in flags&&key!=='fpsBoost')flags[key]=!!value;
      if(data.levels&&typeof data.levels==='object'){odPrefs.levels={...data.levels};odSave()}
      if(themes[data.theme]){uiTheme=data.theme;applyTheme()}
      if(flags.freeze)freezeBots();if(flags.chams)applyChams();notice('Loaded preset '+n);renderTab();
    }catch(e){console.warn(e);notice('Preset load failed')}
  }
  function odQuickPreset(which){
    panicReset();
    const powers={
      marks:['floor-rings','skull-pins','danger-halo','fps-meter'],
      rescue:['regenerative-core','sprint-medic','overshield-engine','helmet-insurance','fall-cushion'],
      mayhem:['fear-zone','pulse-flash','head-spinners','low-gravity-bots','popcorn','visual-party']
    }[which]||[];
    for(const id of powers){if(odFlagById.has(id))flags[odFlagById.get(id)]=true;else if(id==='visual-party')odAction(id)}
    notice('Loaded '+which.toUpperCase()+' quick preset');renderTab();
  }

  // ----- VOIDWARE V9 OVERDRIVE: predictable bot-only behavior -----
  const odClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const odVec=(yaw,f=1,r=0)=>({x:-Math.sin(yaw)*f+Math.cos(yaw)*r,z:-Math.cos(yaw)*f-Math.sin(yaw)*r});
  const odIs=id=>flags[odFlagById.get(id)]===true;
  const odStrength=id=>odPowerLevel(id);
  function odNearest(team='enemy'){
    const p=g.player,ls=g.botMgr.bots.filter(b=>b.alive&&(team==='any'||(team==='ally'?b.team===p.team:b.team!==p.team)));
    ls.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));return ls[0]||null;
  }
  const odAliveEnemies=()=>g.botMgr.bots.filter(b=>b.alive&&b.team!==g.player.team);
  function odAround(distance,enemy=true){const p=g.player;return g.botMgr.bots.filter(b=>b.alive&&(!enemy||b.team!==p.team)&&Math.hypot(b.x-p.x,b.z-p.z)<distance)}
  function odToGround(x,z,entity=g.player,refY=g.player.y){
    // Scan downward from well above current elevation; reject walls and deep voids.
    const ray=g.physics?.raycast;
    if(typeof ray!=='function')return null;
    const originY=refY+8;
    let hit;
    try{hit=ray.call(g.physics,x,originY,z,0,-1,0,19,2)}catch{return null}
    if(!hit||!Number.isFinite(hit.t)||hit.t<0)return null;
    const y=originY-hit.t+.06;
    if(!Number.isFinite(y)||Math.abs(y-refY)>9)return null;
    // Collision samples at chest and head height: do not place avatar inside geometry.
    for(const h of [.4,1.05,1.7]){
      try{if(ray.call(g.physics,x,y+h,z,0,1,0,.18,2))return null}catch{return null}
    }
    return {x,y,z};
  }
  function odTeleport(where){const p=g.player,sp=odToGround(where.x,where.z,p,where.y??p.y);
    if(!sp){notice('No safe teleport landing spot');return false}
    p.x=sp.x;p.y=sp.y;p.z=sp.z;p.vx=p.vy=p.vz=0;notice('Teleported safely');return true;}
  function odFormation(form){const p=g.player,bots=odAliveEnemies(),yaw=p.yaw||0;
    if(!bots.length)return notice('No enemies to arrange');const level=odStrength(form);let moved=0;
    for(let i=0;i<bots.length;i++){
      const n=bots.length, r=5+level*.8,ang=i*Math.PI*2/Math.max(n,1),col=i%6,row=Math.floor(i/6);
      let xx=0,zz=0;
      switch(form){
        case 'ring':xx=Math.sin(ang)*r;zz=Math.cos(ang)*r;break;
        case 'double-ring':{const rr=r+(i%2)*4;xx=Math.sin(i*2.4)*rr;zz=Math.cos(i*2.4)*rr;break}
        case 'line':xx=(i-(n-1)/2)*2.1;zz=-r;break;
        case 'column':xx=0;zz=-r-i*2.1;break;
        case 'grid':xx=(col-2.5)*2.4;zz=-r-row*2.4;break;
        case 'wave':xx=(i-(n-1)/2)*2.1;zz=-r-2*Math.sin(i*1.8);break;
        case 'spiral':{const rr=r+i*1.35;xx=Math.sin(i*1.36)*rr;zz=Math.cos(i*1.36)*rr;break}
        case 'wedge':xx=(i%2?1:-1)*Math.ceil((i+1)/2)*2.25;zz=-r-Math.ceil((i+1)/2)*1.1;break;
        case 'checker':xx=(col-2.5)*2.3+(row%2)*1.1;zz=-r-row*3.5;break;
        case 'scatter':{const rr=r+Math.sqrt(i+1)*4.5;xx=Math.sin(i*2.399)*rr;zz=Math.cos(i*2.399)*rr;break}
      }
      // Rotate local offsets into game world using the player's yaw.
      const d=odVec(yaw,-zz,xx),sp=odToGround(p.x+d.x,p.z+d.z,bots[i]);
      if(sp){Object.assign(bots[i],sp);bots[i].vx=bots[i].vy=bots[i].vz=0;moved++}
    }
    notice(form.toUpperCase()+' formation: '+moved+' bots');
  }
  function odPush(b,sign,intensity){const p=g.player,dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz)||1;
    b.vx=(b.vx||0)+sign*dx/d*intensity;b.vz=(b.vz||0)+sign*dz/d*intensity;}
  function odAction(id){
    const p=g.player, n=odStrength(id),b=odNearest(),friends=()=>g.botMgr.bots.filter(e=>e.alive&&e.team===p.team);
    if(!p.alive||g.state!=='playing')return notice('Enter a running bot match first');
    const dir=odVec(p.yaw||0),side=odVec(p.yaw||0,0,1);
    if(['ring','double-ring','line','column','grid','wave','spiral','wedge','checker','scatter'].includes(id))return odFormation(id);
    switch(id){
      case 'restore-vitals':p.health=100;p.armor=100;p.helmet=true;g.hud?.updateHealth?.();break;
      case 'life-siphon':{let hp=0;for(const e of odAround(6+n*3)) {const loss=Math.min(e.health||0,12*n);e.health=Math.max(1,(e.health||1)-loss);hp+=loss}p.health=Math.min(250,(p.health||0)+hp);g.hud?.updateHealth?.();break;}
      case 'borrow-armor':if(b){const amt=Math.min(b.armor||0,25*n);b.armor-=amt;p.armor=Math.min(250,(p.armor||0)+amt);}break;
      case 'sky-kick':p.vy=10+12*n;p.onGround=false;break;
      case 'dash-left':p.vx-=side.x*(8+10*n);p.vz-=side.z*(8+10*n);break;
      case 'dash-right':p.vx+=side.x*(8+10*n);p.vz+=side.z*(8+10*n);break;
      case 'od-forward':case 'od-backward':case 'od-left':case 'od-right':{
        let d=dir,s=1;if(id==='od-backward')s=-1;
        if(id==='od-left'){d=side;s=-1}if(id==='od-right'){d=side;s=1}
        odTeleport({x:p.x+d.x*s*(4+4*n),z:p.z+d.z*s*(4+4*n)});break;}
      case 'nearest-ally':case 'nearest-enemy':case 'behind-enemy':{
        const q=odNearest(id==='nearest-ally'?'ally':'enemy');if(!q)return notice('No bot in that team');
        const a=(id==='behind-enemy'?q.yaw:(p.yaw||0))||0,di=odVec(a,0,id==='behind-enemy'?-2:3);
        odTeleport({x:q.x+di.x,z:q.z+di.z,y:q.y});break;}
      case 'save-anchor':odAnchor={x:p.x,y:p.y,z:p.z};notice('Recall anchor saved');return;
      case 'recall-anchor':if(!odAnchor)return notice('Set an anchor first');odTeleport(odAnchor);break;
      case 'fix-ground':odTeleport({x:p.x,y:p.y,z:p.z});break;
      case 'crowd-push':for(const e of odAround(10*n))odPush(e,+1,15*n);break;
      case 'crowd-pull':for(const e of odAround(16*n))odPush(e,-1,12*n);break;
      case 'disarm-near':if(b){b.weapon='knife';b._dry=['knife'];}break;
      case 'one-shot-mark':if(b)b.health=1;break;
      case 'all-armor-break':for(const e of odAliveEnemies())e.armor=0;break;
      case 'enemy-debuff-wave':for(const e of odAliveEnemies()){e.health=Math.max(1,(e.health||1)-18*n);e.blindUntil=g.time+3*n;e.vx*=.3;e.vz*=.3;}break;
      case 'swap-roulette':{const choices=['awp','ak47','ssg08','deagle','m4a4','negev','mp9','p90'];giveGun(choices[Math.floor(Math.random()*choices.length)]);break;}
      case 'heavy-awp':giveGun('awp');break;
      case 'scout-kit':giveGun('ssg08');break;
      case 'ak-kit':giveGun('ak47');break;
      case 'deagle-kit':giveGun('deagle');break;
      case 'meteor-strike':for(const e of odAliveEnemies()){e.vy=12+10*n;e.onGround=false;}break;
      case 'gravity-slam':for(const e of odAliveEnemies()){e.vy=-9-9*n;e.onGround=false;}break;
      case 'freeze-velocity':for(const e of allBots())e.vx=e.vy=e.vz=0;break;
      case 'compact-compass':odOverlayOn=!odOverlayOn;notice('Compass '+(odOverlayOn?'ON':'OFF'));return;
      case 'hide-visuals':for(const i of odPowers.filter(e=>e.group==='visual'&&e.mode==='t'))flags[odFlagById.get(i.id)]=false;
        flags.esp=flags.glow=flags.radar=flags.enemyArrows=flags.aimFovRing=false;odOverlayOn=false;break;
      case 'visual-party':for(const v of ['floor-rings','skull-pins','velocity-rays','danger-halo'])flags[odFlagById.get(v)]=true;break;
      case 'duel-setup':{let e=odAliveEnemies()[0];if(!e){const bot=g.botMgr.bots.find(e=>e.team!==p.team);bot?.spawn?.();e=bot;}for(const other of odAliveEnemies())if(other!==e)g.killEntity(other,p,g.weapons.def?.()||null,false);if(e){e.health=100;e.armor=100;}break;}
      case 'sniper-gauntlet':for(const e of odAliveEnemies()){e.weapon='awp';e._dry=['awp'];e.health=50;}break;
      case 'reset-challenge':for(const e of g.botMgr.bots){e.respawnT=0;e.spawn?.();e.health=100;e.armor=100;}break;
      default:notice('Action not supported in this game build: '+id);return;
    }
    notice((odById.get(id)?.name||id)+' activated');
  }
  // Toggle powers are applied on a 20 Hz maximum fixed-rate loop, not once per animation frame.
  function odTick(now){
    if(!active||g.state!=='playing'||!g.player?.alive)return;
    if(now-odLastTick<50)return;
    const dt=Math.min(.18,(now-(odLastTick||now-50))/1000);odLastTick=now;
    const p=g.player, enemies=odAliveEnemies(),pNear=enemies.filter(b=>Math.hypot(b.x-p.x,b.z-p.z)<=12), level=odStrength;
    let healthChanged=false;
    const nearby=(rad)=>enemies.filter(b=>Math.hypot(b.x-p.x,b.z-p.z)<rad);
    const hasMovement=!!(p.vx||p.vz), horiz=Math.hypot(p.vx||0,p.vz||0), yaw=p.yaw||0;
    if(odIs('regenerative-core')){p.health=Math.min(100,(p.health||0)+dt*6*level('regenerative-core'));healthChanged=true}
    if(odIs('sprint-medic')&&horiz>5){p.health=Math.min(110,(p.health||0)+dt*9*level('sprint-medic'));healthChanged=true}
    if(odIs('overshield-engine')){p.armor=Math.min(250,(p.armor||0)+dt*12*level('overshield-engine'));healthChanged=true}
    if(odIs('helmet-insurance'))p.helmet=true;
    if(odIs('last-breath')&&p.health>0&&p.health<22&&now-odLastHeal>2500){odLastHeal=now;p.health=Math.min(100,p.health+40*level('last-breath'));healthChanged=true}
    if(odIs('team-field-medic'))for(const b of g.botMgr.bots){if(b.alive&&b.team===p.team&&Math.hypot(b.x-p.x,b.z-p.z)<12)b.health=Math.min(100,(b.health||0)+dt*9*level('team-field-medic'));}
    if(odIs('armor-lock')){p.armor=Math.max(p.armor||0,Math.min(150,20*level('armor-lock')));healthChanged=true}
    if(healthChanged&&now-odLastHeal>170){odLastHeal=now;g.hud?.updateHealth?.()}
    const fw=odVec(yaw,1),right=odVec(yaw,0,1);
    const k=g.input?.keys;
    if(odIs('forward-thrusters')&&(k?.has('KeyW')||g.input?.downA?.('forward'))){p.vx+=fw.x*dt*11*level('forward-thrusters');p.vz+=fw.z*dt*11*level('forward-thrusters')}
    if(odIs('reverse-gear')&&k?.has('KeyS')){p.vx-=fw.x*dt*11*level('reverse-gear');p.vz-=fw.z*dt*11*level('reverse-gear')}
    if(odIs('side-surge')){const n=(Number(k?.has('KeyD'))-Number(k?.has('KeyA')))*dt*11*level('side-surge');p.vx+=right.x*n;p.vz+=right.z*n}
    if(odIs('crouch-turbo')&&p.crouching){p.vx+=fw.x*dt*10*level('crouch-turbo');p.vz+=fw.z*dt*10*level('crouch-turbo')}
    if(odIs('fall-cushion')&&p.vy<-4)p.vy=Math.max(p.vy,-3.5/level('fall-cushion'));
    if(odIs('hover-while-space')&&!p.onGround&&k?.has('Space'))p.vy=Math.max(p.vy,1.5*level('hover-while-space'));
    if(odIs('air-handbrake')&&!p.onGround&&(k?.has('ControlLeft')||k?.has('ControlRight'))){p.vx*=.75;p.vz*=.75}
    if(odIs('fear-zone'))for(const b of nearby(10*level('fear-zone')))odPush(b,1,dt*9);
    if(odIs('silence-zone'))for(const b of nearby(11*level('silence-zone')))b.nextFire=Math.max(b.nextFire||0,g.time+.3);
    if(odIs('slow-turn'))for(const b of nearby(14)){b.yaw=(b.yaw||0)*.99;}
    if(odIs('bot-speed-cap'))for(const b of enemies){const cap=8/level('bot-speed-cap'),v=Math.hypot(b.vx||0,b.vz||0);if(v>cap){b.vx*=cap/v;b.vz*=cap/v}}
    if(odIs('panic-jam'))for(const b of nearby(16))b.nextFire=Math.max(b.nextFire||0,g.time+.6*level('panic-jam'));
    if(odIs('pulse-flash')&&odPulseReady('pulse-flash',now,1600)){for(const b of nearby(13))b.blindUntil=Math.max(b.blindUntil||0,g.time+level('pulse-flash'))}
    if(odIs('head-spinners'))for(const b of nearby(15))b.yaw=(b.yaw||0)+dt*6*level('head-spinners');
    if(odIs('burning-aura'))for(const b of nearby(7+2*level('burning-aura')))b.health=Math.max(1,(b.health||1)-dt*12*level('burning-aura'));
    if(odIs('acid-armor'))for(const b of nearby(10))b.armor=Math.max(0,(b.armor||0)-dt*25*level('acid-armor'));
    if(odIs('execute-low'))for(const b of enemies)if(b.health>0&&b.health<9*level('execute-low'))g.killEntity(b,p,g.weapons.def?.()||null,false);
    if(odIs('health-limit'))for(const b of enemies)b.health=Math.min(b.health||100,Math.max(5,65/level('health-limit')));
    if(odIs('armor-limit'))for(const b of enemies)b.armor=Math.min(b.armor||0,Math.max(0,60/level('armor-limit')));
    if(odIs('knockback-pulse')&&odPulseReady('knockback-pulse',now,1500)){for(const b of nearby(9))odPush(b,1,8*level('knockback-pulse'));}
    const weapon=g.weapons,st=weapon.state?.();
    if(odIs('mag-reserve')&&st&&Number.isFinite(st.reserve))st.reserve=Math.min(300,st.reserve+dt*8*level('mag-reserve'));
    if(odIs('clip-rescue')&&st&&st.ammo>=0&&st.ammo<=2)st.ammo=Math.min(12,st.ammo+Math.max(1,Math.round(level('clip-rescue'))));
    if(odIs('hotshot')&&weapon.current!=='knife'&&weapon.nextFire>g.time)weapon.nextFire=Math.min(weapon.nextFire,g.time+dt/level('hotshot'));
    if(odIs('scout-boost')&&weapon.current==='ssg08'&&st?.ammo<10)st.ammo=10;
    if(odIs('auto-secondary')&&st?.ammo===0&&weapon.slots?.[2]&&weapon.current!==weapon.slots[2])weapon.equip(weapon.slots[2]);
    if(odIs('low-gravity-bots'))for(const b of enemies)b.vy=(b.vy||0)+dt*4*level('low-gravity-bots');
    if(odIs('heavy-gravity-bots'))for(const b of enemies)b.vy=(b.vy||0)-dt*14*level('heavy-gravity-bots');
    if(odIs('floaters'))for(const b of enemies){b.vy=Math.max(b.vy||0,.5*level('floaters'))}
    if(odIs('feather-fall-bots'))for(const b of enemies)b.vy=Math.max(b.vy||0,-2/level('feather-fall-bots'));
    if(odIs('speed-up-bots'))for(const b of enemies){const k=Math.min(1.04,1+dt*.5*level('speed-up-bots'));b.vx*=k;b.vz*=k}
    if(odIs('sticky-bots'))for(const b of enemies){b.vx*=.80;b.vz*=.80}
    if(odIs('popcorn')&&odPulseReady('popcorn',now,1100)){for(const b of enemies){b.vy=6+level('popcorn')*3;b.onGround=false}}
    if(odIs('boss-enemy')){const b=odNearest();if(b){odBoss=b;b.health=Math.max(b.health||0,150*level('boss-enemy'));b.armor=Math.max(b.armor||0,125)}}
    if(odIs('enemy-overclock'))for(const b of enemies){b.vx*=1.03;b.vz*=1.03;b.nextFire=Math.min(b.nextFire||g.time,g.time+.2)}
    if(odIs('zombie-walk'))for(const b of enemies){odPush(b,-1,dt*5*level('zombie-walk'));b.vx*=.95;b.vz*=.95;}
    if(odIs('fragile-hero')){p.health=Math.min(p.health||0,Math.max(1,40/level('fragile-hero')));healthChanged=true}
    if(odIs('no-scope-trainer')&&weapon.scopeLevel>0)weapon.setScope?.(0);
    if(odIs('target-carousel')&&now-odLastCarousel>1500/level('target-carousel')){odLastCarousel=now;cycleRageTarget()}
    if(odIs('sudden-death'))for(const b of enemies)b.health=Math.min(b.health||100,Math.max(1,15/level('sudden-death')));
  }
  let odNativeKill=g.killEntity,odChainGuard=false;
  const odWrappedKill=function(...args){const victim=args[0],attacker=args[1],before=!!victim?.alive;
    const result=odNativeKill.apply(this,args);
    if(!odChainGuard&&before&&attacker===g.player&&odIs('chain-elimination')){
      odChainGuard=true;
      try {const other=odAliveEnemies().filter(e=>e!==victim).sort((a,b)=>Math.hypot(a.x-victim.x,a.z-victim.z)-Math.hypot(b.x-victim.x,b.z-victim.z))[0];
        if(other){other.health-=35*odStrength('chain-elimination');if(other.health<=0)g.killEntity(other,g.player,g.weapons.def?.()||null,false)}
      }finally{odChainGuard=false}
    }
    return result;
  };
  g.killEntity=odWrappedKill;
  function odVisualOn(){return odOverlayOn||odPowers.some(p=>p.group==='visual'&&p.mode==='t'&&odIs(p.id));}
  function odVisualDraw(ctx,w,h){
    if(!odVisualOn()||!g.camera||panel.style.display!=='none')return;
    const cam=g.camera,pp=g.player;
    const point=(x,y,z)=>{try{const a=cam.position.clone().set(x,y,z).project(cam);if(a.z<-1||a.z>1)return null;return {x:(a.x+1)*w/2,y:(1-a.y)*h/2}}catch{return null}};
    ctx.save();ctx.textAlign='center';ctx.font='bold 12px ui-sans-serif,system-ui';
    for(const b of g.botMgr.bots){if(!b.alive)continue;
      const enemy=b.team!==pp.team;if(!enemy&&!odIs('ally-beacons'))continue;
      const y=b._visY??b.y,q=point(b.x,y+1.8,b.z),foot=point(b.x,y+.04,b.z);if(!q)continue;
      if(enemy){
        if(odIs('skull-pins')){ctx.fillStyle='#ff7894';ctx.fillText('☠',q.x,q.y-12)}
        if(odIs('floor-rings')&&foot){ctx.strokeStyle='#ca85ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(foot.x,foot.y,20,6,0,0,Math.PI*2);ctx.stroke()}
        if(odIs('velocity-rays')){const vv=point(b.x+(b.vx||0)*.25,y+1,b.z+(b.vz||0)*.25),orig=point(b.x,y+1,b.z);
          if(vv&&orig){ctx.strokeStyle='#56e9ff';ctx.beginPath();ctx.moveTo(orig.x,orig.y);ctx.lineTo(vv.x,vv.y);ctx.stroke()}}
        if(odIs('danger-halo')&&Math.hypot(pp.x-b.x,pp.z-b.z)<10){ctx.strokeStyle='#ff405c';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(q.x,q.y,23,0,Math.PI*2);ctx.stroke()}
      }else if(odIs('ally-beacons')){ctx.fillStyle='#55edc9';ctx.fillText('◆',q.x,q.y-10)}
    }
    ctx.textAlign='left';ctx.font='bold 12px ui-sans-serif,system-ui';ctx.fillStyle='#c6c9df';
    let yy=h-36;
    if(odIs('speedometer')){ctx.fillText('SPEED '+Math.hypot(pp.vx||0,pp.vz||0).toFixed(1),20,yy);yy-=19}
    if(odIs('fps-meter')){ctx.fillText('FPS '+Math.round(odMeasuredFPS),20,yy);yy-=19}
    if(odOverlayOn){ctx.fillText('HEADING '+Math.round(((pp.yaw||0)*180/Math.PI%360+360)%360)+'°',20,yy)}
    ctx.restore();
  }
  function odApplyFps(){
    if(!flags.fpsBoost){odRestoreFps();return}
    const preset=odPrefs.fpsPreset;
    if(!odFpsSnapshot){
      odFpsSnapshot={third:flags.third,chams:flags.chams,glow:flags.glow,esp:flags.esp,espHealth:flags.espHealth};
      odRendererRatio=g.renderer?.getPixelRatio?.()??null;
    }
    flags.third=false;flags.glow=false;flags.chams=false;clearChams();
    if(preset==='extreme'){flags.esp=false;flags.espHealth=false}
    const quality=odPrefs.quality*(preset==='extreme'?.66:preset==='fast'?.85:1);
    if(g.renderer?.setPixelRatio)try{g.renderer.setPixelRatio(Math.max(.35,quality))}catch(e){console.warn('FPS quality:',e)}
    panel.classList.add('dw-low-fx');
    notice('FPS BOOST '+preset.toUpperCase()+' · render '+Math.round(quality*100)+'%');
  }
  function odRestoreFps(){
    if(odRendererRatio!=null&&g.renderer?.setPixelRatio)try{g.renderer.setPixelRatio(odRendererRatio)}catch(e){}
    if(odFpsSnapshot){Object.assign(flags,odFpsSnapshot);if(flags.chams)applyChams();}
    odFpsSnapshot=null;odRendererRatio=null;panel.classList.remove('dw-low-fx');
  }
  // Extra style is deliberately flatter and cheaper when Boost is enabled.
  style.textContent += `
    #death-won-panel {width:min(1030px,97vw);background:#05070e!important;border:1px solid #272d41!important;border-radius:17px!important;box-shadow:0 35px 100px #000e!important}
    #death-won-panel .dw-top{background:#0d101a!important}
    #death-won-panel .dw-nav{background:#070a11!important;width:220px}
    #death-won-panel .dw-tab{min-height:38px}
    #death-won-panel .dw-grid{gap:10px}
    #death-won-panel .dw-toggle,#death-won-panel .dw-action{background:#101521;border:1px solid #262f43;min-height:96px;border-radius:11px}
    #death-won-panel .dw-toggle.on{background:linear-gradient(120deg,#201b36,#111625)}
    #death-won-panel .dw-shortcut{background:#141c2b}
    #death-won-panel.dw-low-fx *,#death-won-panel.dw-low-fx *::before,#death-won-panel.dw-low-fx *::after{animation:none!important;backdrop-filter:none!important;transition:none!important;box-shadow:none!important}
    #death-won-panel .dw-content{scrollbar-color:#252e45 #070a10}
    #death-won-panel .dw-search{padding:15px 16px!important;font-size:13px!important;border-color:#495078!important}
    #death-won-panel .dw-kicker{border-color:#393759;background:#121522}
  `;


  // V10.2 OBSIDIAN: cohesive dark UI. Only CSS and navigation changed; existing powers are preserved.
  style.textContent += `
    #death-won-panel{--dw-stroke:#232a3a;--dw-raised:#101522;--dw-ink:#f0f3fb;--dw-muted:#8e9ab0;
      width:min(1080px,97vw)!important;height:min(744px,94vh)!important;border-radius:18px!important;
      background:linear-gradient(160deg,#090d14 0%,#0a0e18 100%)!important;border:1px solid #343950!important;
      box-shadow:0 32px 90px #000d,0 0 0 1px #ffffff08!important}
    #death-won-panel .dw-top{height:74px!important;padding:14px 23px!important;
      background:linear-gradient(100deg,#101525,#0a0d16 90%)!important;border-bottom:1px solid var(--dw-stroke)!important}
    #death-won-panel .dw-mark{height:43px!important;width:43px!important;font-size:23px!important;border-radius:13px!important;animation:none!important}
    #death-won-panel .dw-title{letter-spacing:1.9px!important;font-size:19px!important}
    #death-won-panel .dw-sub{letter-spacing:.6px!important;font-size:10px!important;color:#93a0ba!important;margin-top:3px!important}
    #death-won-panel .dw-dot{padding:0 6px;color:var(--dw-accent,#aa78ff)}
    #death-won-panel .dw-head-btn{border:1px solid #30394d;background:#141c2a;color:#cbd3e4;
      border-radius:9px;padding:9px 12px;font-size:11px;font-weight:750;cursor:pointer;white-space:nowrap}
    #death-won-panel .dw-head-btn:hover{color:#fff;border-color:var(--dw-accent,#a77aff)}
    #death-won-panel .dw-main{height:calc(100% - 116px)!important}
    #death-won-panel .dw-nav{width:245px!important;display:flex;flex-direction:column;
      padding:17px 12px 10px!important;background:#080c14!important;border-right:1px solid var(--dw-stroke)!important;overflow:hidden!important}
    #death-won-panel .dw-navlabel{padding:2px 9px 13px!important;display:flex;justify-content:space-between;
      color:#8995ad!important;letter-spacing:1.5px!important;font-size:10px!important}
    #death-won-panel .dw-navtotal{color:#62718b;font-size:9px}
    #death-won-panel .dw-navsearch-wrap{display:flex;align-items:center;gap:9px;padding:0 12px;
      height:39px;min-height:39px;background:#111723;border:1px solid #293244;border-radius:10px;color:#7e8da7;margin-bottom:13px}
    #death-won-panel .dw-navsearch-wrap:focus-within{border-color:var(--dw-accent,#a47dff)}
    #death-won-panel .dw-navsearch-wrap input{all:unset!important;display:block!important;width:100%!important;color:#e9edfa!important;
      font:500 12px system-ui,sans-serif!important;min-width:0!important}
    #death-won-panel .dw-navsearch-wrap input::placeholder{color:#69778f}
    #death-won-panel #dw-nav{min-height:0;overflow:auto;flex:1;scrollbar-width:thin;scrollbar-color:#374158 transparent;padding-right:2px}
    #death-won-panel .dw-nav-group{padding-bottom:7px;margin-bottom:4px;border-bottom:1px solid #1b2434}
    #death-won-panel .dw-group-head{border:0;background:transparent;color:#8592aa;width:100%;cursor:pointer;
      display:flex;align-items:center;gap:7px;padding:11px 8px 9px;text-align:left;font:800 9px/1.2 system-ui,sans-serif;
      letter-spacing:1.15px}
    #death-won-panel .dw-group-head:hover{color:#d8e0f3}
    #death-won-panel .dw-group-title{flex:1}
    #death-won-panel .dw-group-count{color:#66768f;font-size:10px;letter-spacing:normal}
    #death-won-panel .dw-group-chevron{font-size:13px;transition:transform .16s}
    #death-won-panel .dw-group-head[aria-expanded=false] .dw-group-chevron{transform:rotate(-90deg)}
    #death-won-panel .dw-group-body[hidden]{display:none!important}
    #death-won-panel .dw-tab{min-height:34px!important;margin:2px 0!important;padding:9px 10px!important;gap:10px!important;
      font-size:12px!important;font-weight:600!important;color:#a5b0c6!important;border:1px solid transparent!important;border-radius:9px!important}
    #death-won-panel .dw-tab:hover{background:#151e2d!important;color:#edf1fb!important}
    #death-won-panel .dw-tab.active{background:color-mix(in srgb,var(--dw-accent,#9c72ff) 12%,#0d1524)!important;
      border-color:color-mix(in srgb,var(--dw-accent,#9c72ff) 32%,#1a2438)!important;
      box-shadow:inset 2px 0 var(--dw-accent,#a879ff)!important;color:#f0eaff!important}
    #death-won-panel .dw-tabicon{font-size:15px!important;width:20px!important}
    #death-won-panel .dw-tabname{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    #death-won-panel .dw-navhint{font-size:10px!important;color:#7d8ba6!important;padding:12px 8px 5px!important;line-height:1.8!important;flex:none}
    #death-won-panel .dw-navhint b{color:#cbd5ec}
    #death-won-panel .dw-navhint span{color:#57617b;padding:0 4px}
    #death-won-panel .dw-content{padding:25px 27px!important;background:linear-gradient(160deg,#0d121d,#0b1019)!important}
    #death-won-panel .dw-heading{font-size:20px!important;font-weight:820!important;letter-spacing:-.65px!important}
    #death-won-panel .dw-desc{font-size:12px!important;color:#97a3bb!important;margin-bottom:17px!important}
    #death-won-panel .dw-grid{gap:10px!important}
    #death-won-panel .dw-toggle,#death-won-panel .dw-action{
      min-height:86px!important;padding:15px 15px 32px!important;border:1px solid #283248!important;
      border-radius:11px!important;background:#111827!important;box-shadow:none!important;backdrop-filter:none!important;
      transform:none!important;transition:background .15s,border-color .15s!important}
    #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{background:#172235!important;
      border-color:color-mix(in srgb,var(--dw-accent,#a679ff) 60%,#29354a)!important;transform:none!important;box-shadow:none!important}
    #death-won-panel .dw-toggle.on{background:color-mix(in srgb,var(--dw-accent,#a679ff) 11%,#0e1625)!important;
      border-color:color-mix(in srgb,var(--dw-accent,#a679ff) 45%,#253149)!important;
      box-shadow:inset 3px 0 var(--dw-accent,#a679ff)!important}
    #death-won-panel .dw-name{font-size:12px!important;letter-spacing:.1px;line-height:1.35}
    #death-won-panel .dw-hint{font-size:11px!important;line-height:1.55!important;color:#909db5!important}
    #death-won-panel .dw-indicator{font-size:10px!important}
    #death-won-panel .dw-shortcut{font-size:9px!important;background:#172235!important;border-color:#2b354a!important}
    #death-won-panel .dw-range{background:#111826!important;border-color:#293346!important;border-radius:11px!important}
    #death-won-panel .dw-bottom{background:#090e17!important;border-top:1px solid #263043!important;color:#8090a9!important}
    #death-won-panel .dw-feature-note{background:#121a2a!important;border:1px solid #2c3850!important;border-radius:10px!important}
    #death-won-panel .dw-home-hero{border:1px solid color-mix(in srgb,var(--dw-accent,#ae83ff) 30%,#263348);
      background:radial-gradient(ellipse at top right,color-mix(in srgb,var(--dw-accent,#ae83ff) 14%,transparent),transparent 64%),#101727;
      border-radius:15px;padding:23px 24px;margin-bottom:15px}
    #death-won-panel .dw-home-eyebrow{font:800 10px system-ui;letter-spacing:1.5px;color:var(--dw-accent,#b897ff)}
    #death-won-panel .dw-home-hero h2{font-size:23px;letter-spacing:-.7px;font-weight:850;margin:7px 0;color:#f8faff}
    #death-won-panel .dw-home-highlight{color:var(--dw-accent,#af81ff)}
    #death-won-panel .dw-home-hero p{font:500 12px/1.6 system-ui;color:#a0abc4;margin:0;max-width:540px}
    #death-won-panel .dw-home-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:23px}
    #death-won-panel .dw-home-stat{border:1px solid #273247;background:#101724;border-radius:11px;padding:13px}
    #death-won-panel .dw-home-stat strong{display:block;font-size:23px;color:#f2f4fb;font-weight:800}
    #death-won-panel .dw-home-stat span{font-size:9px;letter-spacing:.8px;color:#8190ab;font-weight:750}
    #death-won-panel .dw-launch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:23px}
    #death-won-panel .dw-launch-btn{display:flex;align-items:center;gap:11px;border:1px solid #283248;background:#121a29;
      border-radius:11px;padding:13px 11px;text-align:left;cursor:pointer;color:#e9eef8;min-width:0;transition:border-color .15s,background .15s}
    #death-won-panel .dw-launch-btn:hover{border-color:var(--dw-accent,#a879ff);background:#192238}
    #death-won-panel .dw-launch-icon{font-size:19px;flex:none}
    #death-won-panel .dw-launch-btn strong{display:block;font-size:11px}
    #death-won-panel .dw-launch-btn small{display:block;margin-top:4px;font-size:9px;color:#8897b1}
    #death-won-panel .dw-launch-arrow{margin-left:auto;color:#8797b8}
    #death-won-panel .dw-home-tip{font-size:11px;color:#8f9eb8;margin:17px 0}
    #death-won-panel .dw-krow{background:#111a27!important;border-color:#293549!important}
    @media(max-width:810px){
      #death-won-panel .dw-nav{width:194px!important}
      #death-won-panel .dw-content{padding:18px!important}
      #death-won-panel .dw-grid{grid-template-columns:1fr!important}
      #death-won-panel .dw-launch{grid-template-columns:repeat(2,minmax(0,1fr))}
      #death-won-panel .dw-home-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
      #death-won-panel .dw-sub{font-size:9px!important}
    }
    @media(max-width:520px){
      #death-won-panel .dw-nav{width:146px!important;padding:10px 6px!important}
      #death-won-panel .dw-top{padding:10px 12px!important}
      #death-won-panel .dw-head-btn,#death-won-panel .dw-version,#death-won-panel .dw-online{display:none!important}
      #death-won-panel .dw-content{padding:12px!important}
      #death-won-panel .dw-launch{grid-template-columns:1fr}
      #death-won-panel .dw-home-stats{gap:5px}
      #death-won-panel .dw-home-hero{padding:12px}
      #death-won-panel .dw-home-hero h2{font-size:17px}
      #death-won-panel .dw-group-head{font-size:8px}
    }
  `;

  // -------------------- DRAW THE TABS --------------------

  // ======================= V10 REALITY BREAKER / 35 NEW POWERS =======================
  const rePowers = [{"id": "black-hole", "name": "Black Hole", "group": "cosmic", "mode": "t", "desc": "Pull enemies into a purple vortex; place the center ahead of you", "icon": "🕳"}, {"id": "god-mode-2", "name": "God Mode 2.0", "group": "cosmic", "mode": "t", "desc": "Regenerate health and zap your closest enemy with lightning", "icon": "⚡"}, {"id": "meteor-shower", "name": "Meteor Shower", "group": "cosmic", "mode": "t", "desc": "Launch enemy bots upward in bursts, with falling-fire visuals", "icon": "☄"}, {"id": "matrix-mode", "name": "Matrix Mode", "group": "cosmic", "mode": "t", "desc": "Slow enemies and their firing while you move normally", "icon": "🟩"}, {"id": "chicken-army", "name": "Chicken Army", "group": "cosmic", "mode": "t", "desc": "Chicken emblems follow bots; their guns become knives", "icon": "🐔"}, {"id": "floor-is-lava", "name": "Floor Is Lava", "group": "cosmic", "mode": "t", "desc": "Grounded enemies take damage under a fiery screen effect", "icon": "🌋"}, {"id": "disco-inferno", "name": "Disco Inferno", "group": "cosmic", "mode": "t", "desc": "Make bots dance instead of shooting; rainbow spotlights", "icon": "🪩"}, {"id": "uno-reverse", "name": "UNO Reverse", "group": "goofy", "mode": "t", "desc": "Reflect damage dealt to you back toward the attacker", "icon": "🔄"}, {"id": "yeet-cannon", "name": "YEET Cannon", "group": "goofy", "mode": "t", "desc": "Your weapon hits fling enemy bots backwards and upward", "icon": "🚀"}, {"id": "big-head-mode", "name": "Big Head Mode", "group": "goofy", "mode": "t", "desc": "Make the head on each loaded bot character model huge", "icon": "🤡"}, {"id": "gravity-roulette", "name": "Gravity Roulette", "group": "goofy", "mode": "t", "desc": "Randomly change the direction of bot velocity every 5 seconds", "icon": "🎲"}, {"id": "bot-courtroom", "name": "Bot Courtroom", "group": "goofy", "mode": "a", "desc": "Sentence the nearest bot to a spectacular sky launch", "icon": "⚖"}, {"id": "portal-gun", "name": "Portal Gun", "group": "goofy", "mode": "a", "desc": "Press twice to place portals; step into Portal A to exit at B", "icon": "🌀"}, {"id": "clone-wars", "name": "Clone Wars", "group": "goofy", "mode": "a", "desc": "Recruit 3 existing bots to your team as copycat guards", "icon": "👥"}, {"id": "laser-eyes", "name": "Laser Eyes", "group": "tech", "mode": "t", "desc": "Damage the enemy you look at with a bright red laser", "icon": "👁"}, {"id": "time-stop", "name": "Time Stop", "group": "tech", "mode": "t", "desc": "Freeze bot movement and suppress their firing", "icon": "⏱"}, {"id": "tornado", "name": "Tornado", "group": "tech", "mode": "t", "desc": "Spin bots around a vortex with powerful lift", "icon": "🌪"}, {"id": "zero-g-party", "name": "Zero-G Party", "group": "tech", "mode": "t", "desc": "Make bots float and bounce in low gravity", "icon": "🪐"}, {"id": "pinball-bots", "name": "Pinball Bots", "group": "tech", "mode": "t", "desc": "Repel bots from each other as if they were pinballs", "icon": "🎱"}, {"id": "rocket-boots", "name": "Rocket Boots", "group": "tech", "mode": "t", "desc": "Hold Space to rise; leave a blazing exhaust trail", "icon": "👢"}, {"id": "rainbow-tracers", "name": "Rainbow Tracers", "group": "tech", "mode": "t", "desc": "Draw smooth rainbow streaks towards moving bots", "icon": "🌈"}, {"id": "neon-shockwave", "name": "Neon Shockwave", "group": "mutations", "mode": "a", "desc": "Push nearby bots away in a neon energy pulse", "icon": "💥"}, {"id": "bot-jenga", "name": "Bot Jenga", "group": "mutations", "mode": "a", "desc": "Arrange enemy bots in a vertical stack", "icon": "🧱"}, {"id": "zombie-horde", "name": "Zombie Horde", "group": "mutations", "mode": "t", "desc": "Disarm enemies and make them shuffle toward you", "icon": "🧟"}, {"id": "supernova", "name": "Supernova", "group": "mutations", "mode": "a", "desc": "Send every nearby enemy flying in an explosion of light", "icon": "🌞"}, {"id": "double-jump", "name": "Double Jump", "group": "mutations", "mode": "t", "desc": "Tap Space again in midair to get a second jump", "icon": "🦘"}, {"id": "boss-fight", "name": "Boss Fight", "group": "mutations", "mode": "a", "desc": "Turn the nearest living enemy into a powerful boss", "icon": "👹"}, {"id": "rubber-band-world", "name": "Rubber-Band World", "group": "mutations", "mode": "t", "desc": "Elastic bands tug bots toward their start positions", "icon": "🪀"}, {"id": "mirror-dimension", "name": "Mirror Dimension", "group": "visual", "mode": "t", "desc": "Make bots mirror your horizontal movement", "icon": "🪞"}, {"id": "laser-grid", "name": "Laser Grid", "group": "visual", "mode": "t", "desc": "Dangerous red grid lines on the map, with glowing overlay", "icon": "🔴"}, {"id": "tiny-titans", "name": "Tiny Titans", "group": "visual", "mode": "t", "desc": "Shrink visible bot character models and make them scurry", "icon": "🐜"}, {"id": "giant-mode", "name": "Giant Mode", "group": "visual", "mode": "t", "desc": "Make visible bot models towering giants", "icon": "🦣"}, {"id": "bouncy-castle", "name": "Bouncy Castle", "group": "visual", "mode": "t", "desc": "Constantly bounce enemies upwards for an absurd arena", "icon": "🏰"}, {"id": "freeze-tag", "name": "Freeze Tag", "group": "visual", "mode": "t", "desc": "Freeze enemies when you aim closely at them", "icon": "🧊"}, {"id": "confetti-cannons", "name": "Confetti Cannons", "group": "visual", "mode": "t", "desc": "Burst confetti on your kills, with colourful screen particles", "icon": "🎉"}];
  const reGroups = {
    cosmic:['🌌','COSMIC CATASTROPHES'], goofy:['🐔','GOOFY MAYHEM'],
    tech:['⚡','TECH & TIME'], mutations:['💥','MUTATIONS & EVENTS'],
    visual:['🎉','WORLD & VISUAL CHAOS']
  };
  const reById=new Map(rePowers.map(p=>[p.id,p]));
  const reFlag=id=>'re_'+id.replace(/-/g,'_');
  const reIs=id=>!!flags[reFlag(id)];
  for(const p of rePowers)if(p.mode==='t')flags[reFlag(p.id)]=false;
  const reStore='deathWonV10_reality_settings';
  let rePrefs={power: 'black-hole',levels:{},particles:true,quality:'balanced',showBadges:true};
  try{const t=JSON.parse(localStorage.getItem(reStore)||'{}');if(t&&typeof t==='object'){
    if(reById.has(t.power))rePrefs.power=t.power;
    if(t.levels&&typeof t.levels==='object')for(const [id,v] of Object.entries(t.levels))if(reById.has(id)&&Number.isFinite(Number(v)))rePrefs.levels[id]=Math.min(4,Math.max(.25,Number(v)));
    if(typeof t.particles==='boolean')rePrefs.particles=t.particles;
    if(typeof t.showBadges==='boolean')rePrefs.showBadges=t.showBadges;
    if(['performance','balanced','cinematic'].includes(t.quality))rePrefs.quality=t.quality;
  }}catch(e){}
  const reSave=()=>{try{localStorage.setItem(reStore,JSON.stringify(rePrefs))}catch(e){}};
  const reStr=id=>Math.max(.25,Math.min(4,Number(rePrefs.levels[id])||1));
  const reClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let reVortex=null,rePortalA=null,rePortalB=null,rePortalSafeUntil=0,reParticles=[],reMarks=[],
      reHeadScales=new Map(),reBodyScales=new Map(),reBandOrigin=new Map(),reBotDefaults=new Map(),
      reLast={meteor:0,lightning:0,roulette:0,flare:0,pop:0,laser:0,tag:0},reRoulettes={x:0,y:0,z:0},
      reJumpReady=false,reAirJumped=false,reLastSpace=false,rePulse=null,reKillPrev=null,reDealPrev=null;
  const reEnemies=()=>g.botMgr.bots.filter(b=>b.alive&&b.team!==g.player.team);
  const reDist=b=>Math.hypot(b.x-g.player.x,b.z-g.player.z);
  const reNear=(dist=25)=>reEnemies().filter(b=>reDist(b)<=dist);
  const reSorted=()=>reEnemies().sort((a,b)=>reDist(a)-reDist(b));
  const reForward=(distance=10)=>({x:g.player.x-Math.sin(g.player.yaw||0)*distance,y:g.player.y,z:g.player.z-Math.cos(g.player.yaw||0)*distance});
  const reParticle=(x,y,color,scale=1)=>{if(!rePrefs.particles||rePrefs.quality==='performance')return;
    const max=rePrefs.quality==='cinematic'?100:48;if(reParticles.length>max)reParticles.splice(0,reParticles.length-max);
    reParticles.push({x,y,vx:(Math.random()-.5)*6*scale,vy:-Math.random()*5*scale,age:0,life:.55+Math.random()*.65,color,size:3+Math.random()*4});};
  const reMark=(type,b,color='#ad6eff',ttl=800)=>{if(reMarks.length>30)reMarks.shift();reMarks.push({type,x:b.x,y:b.y+1,z:b.z,color,until:performance.now()+ttl})};
  const reKill=(b,weapon=null)=>{if(b?.alive){try{g.killEntity(b,g.player,weapon||g.weapons.def?.()||null,false)}catch(e){b.health=0;}return true}return false};
  const reDamage=(b,amount,weapon)=>{if(!b?.alive)return; b.health=Math.max(0,(b.health||100)-amount);if(b.health<=0)reKill(b,weapon)};
  const rePush=(b,dx,dz,force=25,lift=10)=>{const len=Math.hypot(dx,dz)||1;b.vx=(b.vx||0)+dx/len*force;b.vz=(b.vz||0)+dz/len*force;b.vy=Math.max(b.vy||0,lift);b.onGround=false};
  const reOriginal=(b)=>{if(!reBotDefaults.has(b))reBotDefaults.set(b,{weapon:b.weapon,dry:b._dry,health:b.health,armor:b.armor,name:b.name,team:b.team});return reBotDefaults.get(b)};
  const reName=id=>reById.get(id)?.name||id;
  const reSwitch=(id,on)=>{
    const key=reFlag(id);if(!(key in flags))return;
    const was=!!flags[key];flags[key]=typeof on==='boolean'?on:!was;
    if(id==='black-hole'&&flags[key])reVortex=reForward(9);
    if(id==='portal-gun')return;
    if(id==='tiny-titans'&&flags[key])flags[reFlag('giant-mode')]=false;
    if(id==='giant-mode'&&flags[key])flags[reFlag('tiny-titans')]=false;
    if(id==='time-stop'&&flags[key])flags[reFlag('disco-inferno')]=false;
    if(id==='disco-inferno'&&flags[key])flags[reFlag('time-stop')]=false;
    if(id==='chicken-army'&&!flags[key] || id==='zombie-horde'&&!flags[key]){
      for(const [b,o] of reBotDefaults){if(b.alive){b.weapon=o.weapon;if(o.dry)b._dry=o.dry;}}
    }
    if(['big-head-mode','tiny-titans','giant-mode'].includes(id)&&!flags[key])reRestoreScales();
    notice(reName(id)+' '+(flags[key]?'ON':'OFF'));
  };
  const reSetPos=(b,x,z,by=b.y)=>{
    let pos;try{pos=odToGround(x,z,b,by)}catch{}
    if(!pos)return false;b.x=pos.x;b.y=pos.y;b.z=pos.z;b.vx=b.vy=b.vz=0;return true;
  };
  // Model changes intentionally use existing bot agents; no external assets.
  function reRestoreScales(){for(const [bone,s] of reHeadScales){try{bone.scale.copy(s)}catch{}}reHeadScales.clear();
    for(const [node,s] of reBodyScales){try{node.scale.copy(s)}catch{}}reBodyScales.clear();}
  function reScaleModels(){
    if(!reIs('big-head-mode')&&!reIs('tiny-titans')&&!reIs('giant-mode')){if(reHeadScales.size||reBodyScales.size)reRestoreScales();return}
    for(const b of reEnemies().slice(0,24)){
      const agent=b.cs2Agent;if(!agent)continue;
      if(reIs('big-head-mode')){
        const bones=agent.bones;if(!bones)continue;
        const items=Array.isArray(bones)?bones:Object.values(bones);
        for(const bone of items){if(!bone?.name||!/head/i.test(bone.name)||!bone.scale)continue;
          if(!reHeadScales.has(bone))reHeadScales.set(bone,bone.scale.clone());
          bone.scale.copy(reHeadScales.get(bone)).multiplyScalar(2.5*reStr('big-head-mode'));
        }
      }else if(agent.root?.scale){const node=agent.root;if(!reBodyScales.has(node))reBodyScales.set(node,node.scale.clone());
        const scale=reIs('tiny-titans')?.55/reStr('tiny-titans'):2.2*reStr('giant-mode');node.scale.copy(reBodyScales.get(node)).multiplyScalar(reClamp(scale,.13,5));}
    }
  }
  function reDoAction(id){
    const p=g.player,en=reSorted(),b=en[0],v=reStr(id);if(g.state!=='playing'){notice('Enter a bot match first');return}
    switch(id){
      case 'bot-courtroom':if(!b)return notice('No defendant');reOriginal(b);b.nextFire=g.time+4;rePush(b,b.x-p.x,b.z-p.z,16*v,28*v);reMark('GUILTY',b,'#ff7777',1800);notice('GUILTY: '+(b.name||'bot')+'!');break;
      case 'portal-gun':{
        if(!rePortalA||rePortalB){rePortalA=odToGround(p.x,p.z,p,p.y)||{x:p.x,y:p.y,z:p.z};rePortalB=null;notice('PORTAL A placed · move elsewhere and press again');}
        else{const f=reForward(4),pos=odToGround(f.x,f.z,p,f.y);if(!pos)return notice('Portal B needs a safe floor');rePortalB=pos;notice('PORTALS LINKED · walk into A to exit at B');}break;
      }
      case 'clone-wars':{
        const allies=en.slice(0,Math.max(1,Math.min(6,Math.round(3*v))));for(const bot of allies){reOriginal(bot);bot.team=p.team;bot.name='CLONE '+Math.round(Math.random()*999);bot.weapon=g.weapons.current==='knife'?'ak47':g.weapons.current;bot.health=150;bot.armor=100;
          const f=reForward(-2);reSetPos(bot,f.x+(Math.random()-.5)*5,f.z+(Math.random()-.5)*5,p.y);
        }notice('Recruited '+allies.length+' existing bots as guards');break;
      }
      case 'neon-shockwave':case 'supernova':{
        const giant=id==='supernova',rad=(giant?65:18)*v;
        for(const bot of reNear(rad))rePush(bot,bot.x-p.x,bot.z-p.z,(giant?70:40)*v,(giant?36:17)*v);
        rePulse={x:p.x,y:p.y+1,z:p.z,started:performance.now(),color:giant?'#ffe473':'#5bedff',radius:rad};
        if(giant)for(const bot of reNear(rad))reDamage(bot,Math.round(35*v));
        notice(giant?'SUPERNOVA!':'NEON SHOCKWAVE!');break;
      }
      case 'bot-jenga':{
        const center=reForward(6);let n=0;for(const bot of en.slice(0,Math.round(8*v))){bot.x=center.x;bot.z=center.z;bot.y=p.y+n*1.5+.1;bot.vx=bot.vz=bot.vy=0;bot.nextFire=g.time+2;n++}notice(n+' bots stacked!');break;
      }
      case 'boss-fight':if(!b)return notice('No boss available');reOriginal(b);b.health=Math.round(600*v);b.armor=Math.round(300*v);b.weapon='negev';b._dry=['negev'];reMark('BOSS',b,'#f44c8d',2200);notice('BOSS BATTLE! '+b.health+' HP');break;
      default:notice('Unknown chaos action: '+id);
    }
  }
  function reTick(dt,now){
    const alive=g.state==='playing'&&g.player.alive;if(!alive)return;
    const p=g.player;const on=rePowers.some(x=>x.mode==='t'&&reIs(x.id));
    // Linked portals are active after using the Portal Gun action twice.
    if(rePortalA&&rePortalB&&now>rePortalSafeUntil&&Math.hypot(p.x-rePortalA.x,p.z-rePortalA.z)<1.35&&Math.abs(p.y-rePortalA.y)<2){
      const spot=odToGround(rePortalB.x,rePortalB.z,p,rePortalB.y);if(spot){Object.assign(p,spot);p.vx=p.vy=p.vz=0;rePortalSafeUntil=now+1400;notice('Portal jump!')}}
    if(!on&&!reParticles.length&&!rePulse&&!reMarks.length){if(reHeadScales.size||reBodyScales.size)reRestoreScales();return}
    if(reIs('god-mode-2')){p.health=100;p.armor=Math.max(100,p.armor||0);p.helmet=true;g.hud?.updateHealth?.();
      if(now-reLast.lightning>Math.max(160,740/reStr('god-mode-2'))){const target=reSorted()[0];if(target){reDamage(target,25*reStr('god-mode-2'));reMark('ZAP',target,'#79ecff',260);reLast.lightning=now;}}}
    if(reIs('matrix-mode')){for(const b of reEnemies()){const f=Math.max(.08,1-dt*14*reStr('matrix-mode'));b.vx=(b.vx||0)*f;b.vz=(b.vz||0)*f;b.nextFire=Math.max(b.nextFire||0,g.time+.1)}}
    if(reIs('chicken-army'))for(const b of reEnemies()){reOriginal(b);b.weapon='knife';b._dry=['knife'];b.nextFire=Math.max(b.nextFire||0,g.time+.6)}
    if(reIs('floor-is-lava'))for(const b of reEnemies())if(b.onGround||Math.abs(b.vy||0)<.1)reDamage(b,Math.min(20,dt*19*reStr('floor-is-lava')));
    if(reIs('disco-inferno'))for(const b of reEnemies()){b.yaw=(b.yaw||0)+dt*7*reStr('disco-inferno');b.nextFire=Math.max(b.nextFire||0,g.time+.2);b.vx=(b.vx||0)*.9;b.vz=(b.vz||0)*.9;}
    if(reIs('black-hole')){const c=reVortex||reForward(9);for(const b of reEnemies()){
      const dx=c.x-b.x,dz=c.z-b.z,d=Math.max(.6,Math.hypot(dx,dz));if(d>35*reStr('black-hole'))continue;
      const amount=dt*42*reStr('black-hole')/Math.max(1,d*.25);b.vx=(b.vx||0)+dx/d*amount-dz/d*amount*.55;b.vz=(b.vz||0)+dz/d*amount+dx/d*amount*.55;
      if(d<4)b.vy=Math.max(b.vy||0,6*reStr('black-hole'));
    }}
    if(reIs('meteor-shower')&&now-reLast.meteor>Math.max(270,1450/reStr('meteor-shower'))){const bot=reSorted()[Math.floor(Math.random()*Math.min(8,reEnemies().length))];
      if(bot){rePush(bot,bot.x-p.x,bot.z-p.z,9,20*reStr('meteor-shower'));reMark('☄',bot,'#ff7d43',750);}reLast.meteor=now;}
    if(reIs('laser-eyes')&&now-reLast.laser>Math.max(90,240/reStr('laser-eyes'))){
      const b= reEnemies().filter(b=>{const a=Math.atan2(-(b.x-p.x),-(b.z-p.z));let d=a-(p.yaw||0);d=Math.atan2(Math.sin(d),Math.cos(d));return Math.abs(d)<.14;}).sort((a,b)=>reDist(a)-reDist(b))[0];
      if(b){reDamage(b,12*reStr('laser-eyes'));reMark('LASER',b,'#ff254b',230)}reLast.laser=now;}
    if(reIs('time-stop'))for(const b of reEnemies()){b.vx=b.vy=b.vz=0;b.nextFire=Math.max(b.nextFire||0,g.time+.4);b.blindUntil=Math.max(b.blindUntil||0,g.time+.15);}
    if(reIs('tornado')){const c=reVortex||p;for(const b of reNear(40)){
      const dx=b.x-c.x,dz=b.z-c.z,d=Math.max(1,Math.hypot(dx,dz));b.vx=(b.vx||0)*.9-dz/d*dt*90*reStr('tornado');b.vz=(b.vz||0)*.9+dx/d*dt*90*reStr('tornado');b.vy=Math.max(b.vy||0,9*reStr('tornado'));}}
    if(reIs('zero-g-party'))for(const b of reEnemies()){b.vy=Math.max(-2,b.vy||0)+dt*4.5*reStr('zero-g-party');b.onGround=false;}
    if(reIs('pinball-bots')){const list=reEnemies().slice(0,22);for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
      const a=list[i],b=list[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<2.5&&d>.01){rePush(a,-dx,-dz,dt*50*reStr('pinball-bots'),4);rePush(b,dx,dz,dt*50*reStr('pinball-bots'),4);}}}
    if(reIs('gravity-roulette')&&now-reLast.roulette>5000){reRoulettes={x:(Math.random()-.5)*45,y:(Math.random()-.4)*24,z:(Math.random()-.5)*45};reLast.roulette=now;notice('GRAVITY ROULETTE changed!')}
    if(reIs('gravity-roulette'))for(const b of reEnemies()){b.vx=(b.vx||0)+reRoulettes.x*dt*reStr('gravity-roulette');b.vy=(b.vy||0)+reRoulettes.y*dt*reStr('gravity-roulette');b.vz=(b.vz||0)+reRoulettes.z*dt*reStr('gravity-roulette')}
    if(reIs('zombie-horde'))for(const b of reEnemies()){reOriginal(b);b.weapon='knife';b._dry=['knife'];const dx=p.x-b.x,dz=p.z-b.z,d=Math.max(1,Math.hypot(dx,dz));b.vx=dx/d*3.4*reStr('zombie-horde');b.vz=dz/d*3.4*reStr('zombie-horde');b.nextFire=g.time+1;}
    if(reIs('rubber-band-world'))for(const b of reEnemies()){if(!reBandOrigin.has(b))reBandOrigin.set(b,{x:b.x,z:b.z});const origin=reBandOrigin.get(b);
      b.vx=(b.vx||0)+(origin.x-b.x)*dt*10*reStr('rubber-band-world');b.vz=(b.vz||0)+(origin.z-b.z)*dt*10*reStr('rubber-band-world');}
    if(reIs('mirror-dimension'))for(const b of reEnemies()){b.vx=-(p.vx||0)*reStr('mirror-dimension');b.vz=-(p.vz||0)*reStr('mirror-dimension')}
    if(reIs('laser-grid'))for(const b of reEnemies())if(Math.abs((b.x%6+6)%6-3)<.3||Math.abs((b.z%6+6)%6-3)<.3)reDamage(b,dt*18*reStr('laser-grid'));
    if(reIs('bouncy-castle')&&now-reLast.pop>Math.max(200,700/reStr('bouncy-castle'))){for(const b of reEnemies())b.vy=17*reStr('bouncy-castle');reLast.pop=now;}
    if(reIs('freeze-tag')&&now-reLast.tag>160){const b=reEnemies().filter(b=>{const a=Math.atan2(-(b.x-p.x),-(b.z-p.z));const d=Math.atan2(Math.sin(a-p.yaw),Math.cos(a-p.yaw));return Math.abs(d)<.08}).sort((a,b)=>reDist(a)-reDist(b))[0];
      if(b){b.vx=b.vy=b.vz=0;b.nextFire=g.time+1;reMark('FROZEN',b,'#6defff',200);reLast.tag=now;}}
    if(reIs('rocket-boots')&&g.input?.keys?.has('Space')&&!p.onGround){p.vy=Math.max(p.vy||0,8*reStr('rocket-boots'));}
    if(reIs('double-jump')){const isSpace=g.input?.keys?.has('Space')||false;
      if(p.onGround)reAirJumped=false;
      if(isSpace&&!reLastSpace&&!p.onGround&&!reAirJumped){p.vy=10*reStr('double-jump');reAirJumped=true;}
      reLastSpace=isSpace;
    }else reLastSpace=false;
    if(reIs('big-head-mode')||reIs('tiny-titans')||reIs('giant-mode')||reHeadScales.size||reBodyScales.size)reScaleModels();
    for(const effect of reParticles){effect.age+=dt;effect.x+=effect.vx*dt*45;effect.y+=(effect.vy+effect.age*8)*dt*35;}
    reParticles=reParticles.filter(p=>p.age<p.life);
    reMarks=reMarks.filter(m=>m.until>now);
    if(rePulse&&now-rePulse.started>950)rePulse=null;
  }
  function reVisualOn(){return !!(rePortalA||rePulse||reMarks.length||reParticles.length||rePowers.some(x=>x.mode==='t'&&reIs(x.id)&&['black-hole','god-mode-2','meteor-shower','matrix-mode','chicken-army','floor-is-lava','disco-inferno','laser-eyes','tornado','rainbow-tracers','laser-grid','tiny-titans','giant-mode','bouncy-castle','confetti-cannons','big-head-mode','zero-g-party'].includes(x.id)));}
  function reDraw(ctx,w,h,project){
    if(!reVisualOn())return;
    const now=performance.now();
    ctx.save();
    if(reIs('matrix-mode')){ctx.fillStyle='#00ff3322';ctx.fillRect(0,0,w,h);ctx.fillStyle='#1cfb7177';ctx.font='bold 15px monospace';ctx.fillText('M A T R I X   M O D E',21,70);}
    if(reIs('floor-is-lava')){const gr=ctx.createLinearGradient(0,h*.6,0,h);gr.addColorStop(0,'#ff3c0000');gr.addColorStop(1,'#ff590044');ctx.fillStyle=gr;ctx.fillRect(0,h*.5,w,h*.5);}
    if(reIs('laser-grid')){ctx.strokeStyle='#ff31496e';ctx.shadowColor='#fb2c42';ctx.shadowBlur=9;ctx.lineWidth=1.6;
      for(let x=(now*.03)%100;x<w;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
      for(let y=0;y<h;y+=96){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
    if(reIs('disco-inferno')){const cols=['#ff4b9f','#54ffff','#ffed52','#78ff9a','#c183ff'];for(let i=0;i<4;i++){
      const x=(Math.sin(now*.001+i*1.5)*.38+.5)*w, y=(Math.cos(now*.0008+i)*.38+.5)*h;
      ctx.strokeStyle=cols[i];ctx.globalAlpha=.38;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,50+Math.sin(now*.003+i)*30,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}
    if(reIs('black-hole')&&reVortex){const a=project(reVortex.x,reVortex.y+1,reVortex.z);if(a){for(let i=0;i<4;i++){
      ctx.strokeStyle=['#ae6cfe','#713edc','#dfc3ff','#6a41fa'][i];ctx.lineWidth=2+i*.8;ctx.beginPath();ctx.arc(a.x,a.y,26+(i*19)+(now*.03)%15,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='#110520bb';ctx.beginPath();ctx.arc(a.x,a.y,18,0,Math.PI*2);ctx.fill();}}
    if(rePulse){const a=project(rePulse.x,rePulse.y,rePulse.z);if(a){const t=Math.min(1,(now-rePulse.started)/950);ctx.strokeStyle=rePulse.color;ctx.globalAlpha=1-t;ctx.lineWidth=6*(1-t)+1;ctx.beginPath();ctx.arc(a.x,a.y,16+t*280,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}
    if(rePortalA){for(const [pos,color,name] of [[rePortalA,'#4fbcff','A'],[rePortalB,'#ffb653','B']]){if(!pos)continue;const a=project(pos.x,pos.y+1,pos.z);if(!a)continue;
      ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=14;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(a.x,a.y,22,44,Math.sin(now*.002)*.04,0,Math.PI*2);ctx.stroke();ctx.fillStyle=color;ctx.font='bold 15px system-ui';ctx.fillText('PORTAL '+name,a.x+27,a.y-12);ctx.shadowBlur=0;}}
    if(reIs('rainbow-tracers')){for(const b of reEnemies().slice(0,22)){const a=project(b.x,(b._visY??b.y)+1.2,b.z);if(!a)continue;
      ctx.strokeStyle=`hsl(${(now*.1+reDist(b)*12)%360} 100% 65% / .8)`;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(w*.5,h);ctx.lineTo(a.x,a.y);ctx.stroke();}}
    if(reIs('laser-eyes')||reIs('god-mode-2'))for(const m of reMarks.filter(m=>m.type==='LASER'||m.type==='ZAP')){
      const a=project(m.x,m.y,m.z);if(!a)continue;ctx.strokeStyle=m.color;ctx.shadowColor=m.color;ctx.shadowBlur=16;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(a.x,a.y);ctx.stroke();ctx.shadowBlur=0;}
    for(const b of reEnemies().slice(0,26)){
      const pos=project(b.x,(b._visY??b.y)+2.25,b.z);if(!pos)continue;
      if(rePrefs.showBadges&&(reIs('chicken-army')||reIs('zombie-horde')||reIs('big-head-mode')||reIs('tiny-titans')||reIs('giant-mode'))){
        ctx.font='bold '+(reIs('chicken-army')?'29':'21')+'px system-ui';ctx.textAlign='center';
        ctx.fillText(reIs('chicken-army')?'🐔':reIs('zombie-horde')?'🧟':reIs('big-head-mode')?'🤡':reIs('tiny-titans')?'🐜':'🦣',pos.x,pos.y);}}
    for(const m of reMarks){const a=project(m.x,m.y,m.z);if(!a)continue;ctx.textAlign='center';ctx.fillStyle=m.color;ctx.shadowColor=m.color;ctx.shadowBlur=12;
      ctx.font='bold 16px system-ui';ctx.fillText(m.type,a.x,a.y);ctx.shadowBlur=0;}
    for(const p of reParticles){const age=1-p.age/p.life;ctx.fillStyle=p.color;ctx.globalAlpha=age;ctx.fillRect(p.x,p.y,p.size,p.size);ctx.globalAlpha=1;}
    ctx.restore();
  }
  // Damage reflection and yeet hooks run through Clutcher's own gameplay calls.
  reDealPrev=g.dealDamage;
  if(typeof reDealPrev==='function')g.dealDamage=function(victim,damage,attacker,...args){
    if(!active)return reDealPrev.call(this,victim,damage,attacker,...args);
    if(reIs('uno-reverse')&&victim===g.player&&attacker?.alive&&attacker!==victim){
      reDamage(attacker,Math.max(1,damage)*reStr('uno-reverse'),g.weapons.def?.());
      reMark('REVERSED',attacker,'#faba39',450);return;
    }
    if(reIs('yeet-cannon')&&attacker===g.player&&victim?.alive&&victim!==g.player){
      rePush(victim,victim.x-g.player.x,victim.z-g.player.z,38*reStr('yeet-cannon'),19*reStr('yeet-cannon'));
    }
    return reDealPrev.call(this,victim,damage,attacker,...args);
  };
  reKillPrev=g.killEntity;
  if(typeof reKillPrev==='function')g.killEntity=function(victim,killer,...args){
    if(active&&reIs('confetti-cannons')&&killer===g.player&&victim?.alive&&victim!==g.player){
      const x=window.innerWidth*.5,y=window.innerHeight*.35;
      for(let i=0;i<Math.round(15*reStr('confetti-cannons'));i++)reParticle(x,y,`hsl(${Math.random()*360} 100% 65%)`,reStr('confetti-cannons'));
      reMark('🎉',victim,'#ffef83',600);
    }
    return reKillPrev.call(this,victim,killer,...args);
  };
  function reDisableAll(){for(const power of rePowers){if(power.mode==='t'&&reIs(power.id))reSwitch(power.id,false);}
    reRestoreScales();rePortalA=rePortalB=null;reVortex=null;reParticles=[];reMarks=[];rePulse=null;
    reBandOrigin.clear();}
  function reRenderTab(){
    const group=activeTab.slice(3),info=reGroups[group];if(!info)return;
    section(info[0]+' REALITY BREAKER · '+info[1], 'VOIDWARE V10 · 7 new powers · Every control supports a hotkey; adjust power strength below. Offline bot sandbox only.');
    const kicker=document.createElement('div');kicker.className='dw-kicker';kicker.textContent='REALITY LAB '+(Object.keys(reGroups).indexOf(group)+1)+'/5 · 35 TOTAL · PRESS END TO STOP';content.append(kicker);
    const a=grid();const available=rePowers.filter(p=>p.group===group);
    for(const power of available){const label=power.icon+' '+power.name;const hint=power.desc+' · '+reStr(power.id).toFixed(2)+'×';
      if(power.mode==='t')tile(a,label,hint,null,reFlag(power.id));
      else tile(a,label,hint,()=>reDoAction(power.id));}
    content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
    const selected=available.some(p=>p.id===rePrefs.power)?rePrefs.power:available[0].id;
    selector('CUSTOMIZE A POWER',available.map(p=>[p.id,p.icon+' '+p.name]),selected,v=>{rePrefs.power=v;reSave();renderTab()});
    slider('Power intensity · '+reName(selected),.25,4,.05,reStr(selected),v=>{rePrefs.levels[selected]=v;reSave()},'×');
    selector('FX quality / particle budget',[['performance','PERFORMANCE · minimal particles'],['balanced','BALANCED'],['cinematic','CINEMATIC · more effects']],rePrefs.quality,v=>{rePrefs.quality=v;reSave()});
    const b=grid();tile(b,'🔧 Configure Hotkeys','Assign a key to any Reality Breaker power.',()=>{bindingFilter=selected==='portal-gun'?'Portal Gun':reName(selected);showMenu('hotkeys')});
    tile(b,'🚨 Disable all Reality powers','Turn off all 35 new modes and restore body model sizes.',()=>{reDisableAll();renderTab()});
    if(group==='cosmic')tile(b,'🕳 Move Black Hole','Relocate the vortex 9 meters in front of you.',()=>{reVortex=reForward(9);notice('Vortex moved')});
    if(group==='goofy')tile(b,'🌀 Clear Portals','Remove both linked portals.',()=>{rePortalA=rePortalB=null;notice('Portals cleared')});
    tile(b,'🎉 CHAOS PARTY','Turn on Chicken Army, Disco Inferno, and Rainbow Tracers.',()=>{for(const id of ['chicken-army','disco-inferno','rainbow-tracers'])reSwitch(id,true);renderTab()});
    const note=document.createElement('p');note.className='dw-desc dw-section';note.textContent='3D model swaps, true physical meteors and unlimited cloned players are not built into this game. These powers use actual bot physics, model scaling and lightweight 2D FX instead. Limit simultaneous FX for better FPS.';content.append(note);
  }
  // tile toggles flags before invoking handlers: these callbacks perform side effects only.
  function reSwitchSideEffect(id){
    const current=!!flags[reFlag(id)];
    // Called after standard tile's toggleFlag changed the flag.
    if(id==='black-hole'&&current)reVortex=reForward(9);
    if((id==='tiny-titans'||id==='giant-mode')&&current){flags[reFlag(id==='tiny-titans'?'giant-mode':'tiny-titans')]=false;reRestoreScales();}
    if(id==='big-head-mode'&&!current)reRestoreScales();
    if(id==='chicken-army'&&!current||id==='zombie-horde'&&!current){for(const [b,o] of reBotDefaults){if(b.alive){b.weapon=o.weapon;if(o.dry)b._dry=o.dry;}}}
    if(!current&&['giant-mode','tiny-titans'].includes(id))reRestoreScales();
    if(current&&id==='time-stop')flags[reFlag('disco-inferno')]=false;
    if(current&&id==='disco-inferno')flags[reFlag('time-stop')]=false;
  }

  // -------------------- V11 OMEGA | 24 EXTRA FEATURES + INFINITE ZEUS --------------------
  // Client-side bot-lobby modifications. Cinematic effects are lightweight previews,
  // not actual new 3D assets or full engine-level demo recordings.
  const omegaPowers=[
    {id:'bulletcam',name:'Bullet Cam',icon:'🎥',group:'combat',mode:'t',desc:'On a shot, animate a cinematic 2D bullet flight overlay.'},
    {id:'killreplay',name:'Kill Replay',icon:'☠',group:'combat',mode:'t',desc:'Show a short motion-trace replay after your eliminations.'},
    {id:'trickshot',name:'Trickshot Mode',icon:'🌀',group:'combat',mode:'t',desc:'Add dramatic spins and sparkle cues when jumping and firing.'},
    {id:'ricochet',name:'Ricochet Shots',icon:'↩',group:'combat',mode:'t',desc:'Reflect shots from solid geometry toward nearby enemies.'},
    {id:'lightning',name:'Lightning Gun',icon:'⚡',group:'combat',mode:'t',desc:'Your direct damage chains to nearby enemy bots.'},
    {id:'hitmarker',name:'Custom Hitmarkers',icon:'✦',group:'combat',mode:'t',desc:'Neon, rainbow or minimal hit confirmation styles.'},
    {id:'grapple',name:'Grappling Hook',icon:'🪝',group:'movement',mode:'a',desc:'Pull yourself toward the wall you are aiming at.'},
    {id:'wallrun',name:'Wall Running',icon:'🏃',group:'movement',mode:'t',desc:'Boost horizontal momentum and reduce falling when beside a wall.'},
    {id:'ghostdash',name:'Ghost Dash',icon:'👻',group:'movement',mode:'a',desc:'Safe short blink with an animated afterimage.'},
    {id:'jetpack',name:'Jetpack',icon:'🚀',group:'movement',mode:'t',desc:'Hold Space to rise with flame particles.'},
    {id:'landing',name:'Superhero Landing',icon:'💥',group:'movement',mode:'t',desc:'A hard landing sends nearby bots flying.'},
    {id:'rewind',name:'Time Rewind',icon:'⏪',group:'movement',mode:'a',desc:'Return to your saved position from about five seconds ago.'},
    {id:'ragdoll',name:'Ragdoll Cannon',icon:'💀',group:'goofy',mode:'a',desc:'Launch the closest enemy away like a cannonball.'},
    {id:'tinyarmy',name:'Tiny Army',icon:'🐜',group:'goofy',mode:'t',desc:'Render enemy bots at miniature size.'},
    {id:'giant',name:'Giant Mode',icon:'🗿',group:'goofy',mode:'t',desc:'Enlarge visible character models.'},
    {id:'dance',name:'Dance Battle',icon:'🪩',group:'goofy',mode:'t',desc:'Make enemies dance and pause their attacks.'},
    {id:'rubber',name:'Rubber Bullets',icon:'🏀',group:'goofy',mode:'t',desc:'Your shots bounce enemies instead of only damaging.'},
    {id:'traffic',name:'Bot Traffic Jam',icon:'🚗',group:'goofy',mode:'t',desc:'Make enemy bots follow the same slow winding queue.'},
    {id:'viewer',name:'Model Viewer',icon:'🧍',group:'studio',mode:'a',desc:'Pop up a rotatable character-style preview.'},
    {id:'crosshair',name:'Crosshair Designer',icon:'⊕',group:'studio',mode:'t',desc:'Custom crosshair color, width and gap.'},
    {id:'soundboard',name:'Meme Soundboard',icon:'🔊',group:'studio',mode:'a',desc:'Play a local arcade-style meme tone.'},
    {id:'killeffects',name:'Kill Effect Designer',icon:'🎉',group:'studio',mode:'t',desc:'Add colorful bursts for every player elimination.'},
    {id:'performance',name:'Performance Monitor',icon:'📊',group:'studio',mode:'t',desc:'Live FPS, active powers and enemy count.'},
    {id:'themes',name:'Theme Roulette',icon:'🎨',group:'studio',mode:'a',desc:'Cycle among your menu’s color accents.'},
    {id:'taserAmmo',name:'Unlimited Taser Ammo',icon:'♾',group:'zeus',mode:'t',desc:'Instantly recharge Zeus, with no single-shot limit.'},
    {id:'taserRange',name:'Infinite Taser Range',icon:'⚡',group:'zeus',mode:'t',desc:'Make Zeus range map-wide. Walls still block its arc.'},
    {id:'giveTaser',name:'Equip Zeus',icon:'🔫',group:'zeus',mode:'a',desc:'Give and equip a local Zeus taser.'}
  ];
  const omegaById=new Map(omegaPowers.map(p=>[p.id,p]));
  const omegaFlag=id=>'omega_'+id;
  for(const p of omegaPowers)if(p.mode==='t')flags[omegaFlag(p.id)]=false;
  const omegaStorage='deathWonV11_omega';
  const omegaConfig={levels:{},selected:{},hitTheme:'neon',killTheme:'neon',crossColor:'#90d9ff',crossGap:6,crossWidth:18};
  try{const t=JSON.parse(localStorage.getItem(omegaStorage)||'{}');if(t?.levels&&typeof t.levels==='object')for(const [id,n] of Object.entries(t.levels))if(omegaById.has(id)&&Number.isFinite(+n))omegaConfig.levels[id]=Math.max(.25,Math.min(4,+n));
    if(t?.selected)omegaConfig.selected=t.selected;
    for(const k of ['hitTheme','killTheme','crossColor','crossGap','crossWidth'])if(t?.[k]!==undefined)omegaConfig[k]=t[k];}catch{}
  const omegaSave=()=>{try{localStorage.setItem(omegaStorage,JSON.stringify(omegaConfig))}catch{}};
  const omegaLevel=id=>Math.max(.25,Math.min(4,Number(omegaConfig.levels[id])||1));
  const omegaEnabled=id=>!!flags[omegaFlag(id)];
  let omegaTrail=[],omegaHistory=[],omegaReplay=[],omegaReplayEnd=0,omegaGrapple=null,omegaShotAt=0,omegaLastShot=null,
      omegaLandingArmed=false,omegaLastLand=0,omegaLastChain=0,omegaLastKick=0,omegaLastRicochet=0,omegaLastTicker=0,omegaLastDanced=new Map(),omegaEffects=[],
      omegaModelScales=new Map(),omegaZeusDef=null,omegaZeusOriginalRange=null,omegaDealPrev=null,omegaKillPrev=null,omegaShotPrev=null,omegaZeusPrev=null;
  const omegaCanvas=document.createElement('canvas');omegaCanvas.id='death-won-omega-canvas';omegaCanvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483644';document.body.append(omegaCanvas);
  const omegaCtx=omegaCanvas.getContext('2d');
  const omegaHud=document.createElement('div');omegaHud.style.cssText='display:none;pointer-events:none;position:fixed;bottom:20px;left:18px;color:#cce4ff;background:#0b101bdd;border:1px solid #364b65;border-radius:10px;z-index:2147483645;padding:10px 13px;font:700 11px/1.65 system-ui;white-space:pre-line';document.body.append(omegaHud);
  const omegaViewer=document.createElement('div');omegaViewer.style.cssText='display:none;position:fixed;z-index:2147483647;inset:14% 25%;background:#0a0e19;border:1px solid #9c75f4;border-radius:18px;box-shadow:0 25px 80px #000e;color:#eae7ff;padding:20px;text-align:center;font:600 13px system-ui';document.body.append(omegaViewer);
  const omegaVh=document.createElement('div');omegaVh.style.cssText='font-size:18px;font-weight:900;letter-spacing:2px;margin:0 0 12px';omegaVh.textContent='OMEGA • MODEL STUDIO';
  const omegaVmodel=document.createElement('div');omegaVmodel.style.cssText='font-size:105px;line-height:1.2;transform-style:preserve-3d;transition:.15s;filter:drop-shadow(0 14px 16px #b57dff44);cursor:grab;user-select:none';omegaVmodel.textContent='🥷';
  const omegaVrange=document.createElement('input');omegaVrange.type='range';omegaVrange.min='0';omegaVrange.max='360';omegaVrange.value='25';omegaVrange.style.width='85%';omegaVrange.addEventListener('input',()=>omegaVmodel.style.transform='perspective(260px) rotateY('+omegaVrange.value+'deg)');omegaVmodel.style.transform='perspective(260px) rotateY(25deg)';
  const omegaVnote=document.createElement('p');omegaVnote.textContent='Stylized preview • uses no external 3D assets.';omegaVnote.style.cssText='font-size:11px;color:#8992b2';
  const omegaVclose=document.createElement('button');omegaVclose.textContent='CLOSE';omegaVclose.style.cssText='padding:10px 18px;border:1px solid #8457d4;border-radius:10px;background:#28203e;color:white;cursor:pointer';omegaVclose.addEventListener('click',()=>omegaViewer.style.display='none');
  omegaViewer.append(omegaVh,omegaVmodel,omegaVrange,omegaVnote,omegaVclose);
  const omegaGetZeus=()=>{const d=g.weapons.def?.();if(d?.class==='zeus'&&omegaZeusDef!==d){omegaZeusDef=d;omegaZeusOriginalRange=d.range;}return omegaZeusDef;};
  function omegaSyncZeus(){const def=omegaGetZeus();if(def)def.range=omegaEnabled('taserRange')?100000:(omegaZeusOriginalRange??2.7);
    if(omegaEnabled('taserAmmo')){if(g.weapons.states?.zeus){g.weapons.states.zeus.ammo=1;g.weapons.states.zeus.reserve=1;}
      g.weapons.zeusRecharge=0;if(g.weapons.current==='zeus')g.weapons.nextFire=Math.min(g.weapons.nextFire||g.time,g.time);}}
  function omegaOnToggle(id){
    if(id==='taserRange'||id==='taserAmmo')omegaSyncZeus();
    if(id==='tinyarmy'||id==='giant'){if(omegaEnabled(id)){const rival=id==='tinyarmy'?'giant':'tinyarmy';flags[omegaFlag(rival)]=false;}else omegaRestoreModels();}
    if(id==='crosshair'&&!omegaEnabled(id))omegaCtx.clearRect(0,0,omegaCanvas.width,omegaCanvas.height);
    if(id==='dance'&&!omegaEnabled(id))omegaLastDanced.clear();
  }
  function omegaRestoreModels(){for(const [node,original] of omegaModelScales){try{node.scale.copy(original)}catch{}}omegaModelScales.clear();}
  function omegaFx(type,color='#a388ff',size=1){if(omegaEffects.length>80)omegaEffects.shift();omegaEffects.push({type,x:innerWidth*.5,y:innerHeight*.5,t:performance.now(),color,size});}
  function omegaDoDamage(bot,amount){if(!bot?.alive)return;try{if(typeof g.dealDamage==='function')g.dealDamage(bot,amount,g.player,false,g.weapons.def?.(),false);else{bot.health-=amount;if(bot.health<=0)g.killEntity(bot,g.player,g.weapons.def?.()||null,false);}}catch{bot.health-=amount;if(bot.health<=0)g.killEntity(bot,g.player,g.weapons.def?.()||null,false);}}
  function omegaAction(id){
    const p=g.player,near=enemyBots().sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)),b=near[0],k=omegaLevel(id);
    if(id==='giveTaser'){g.weapons.zeusOwned=true;g.weapons.states.zeus??={ammo:1,reserve:0};g.weapons.equip('zeus');omegaSyncZeus();notice('⚡ Zeus equipped');return;}
    if(id==='viewer'){omegaViewer.style.display='block';return;}
    if(id==='soundboard'){try{const ac=getKillAudio?.();if(ac){const o=ac.createOscillator(),vol=ac.createGain();o.type='square';o.frequency.setValueAtTime(220,ac.currentTime);o.frequency.exponentialRampToValueAtTime(660,ac.currentTime+.15);vol.gain.setValueAtTime(.12,ac.currentTime);vol.gain.exponentialRampToValueAtTime(.002,ac.currentTime+.30);o.connect(vol);vol.connect(ac.destination);o.start();o.stop(ac.currentTime+.3);}}catch{}notice('🔊 Arcade sound');return;}
    if(id==='themes'){const seq=Object.keys(themes);uiTheme=seq[(seq.indexOf(uiTheme)+1)%seq.length];applyTheme();notice('Theme: '+uiTheme);return;}
    if(g.state!=='playing'||!p.alive){notice('Enter the bot match first');return;}
    if(id==='grapple'){
      const c=Math.cos(p.pitch||0),dx=-Math.sin(p.yaw||0)*c,dy=Math.sin(p.pitch||0),dz=-Math.cos(p.yaw||0)*c;
      const hit=originalRaycast?.call(g.physics,p.x,p.y+(p.eyeH||1.6),p.z,dx,dy,dz,75*k,2);
      if(!hit){notice('Grapple: point at a wall first');return;}
      const reach=Math.max(2,(hit.t||10)-1.25);omegaGrapple={x:p.x+dx*reach,y:p.y+(p.eyeH||1.6)+dy*reach,z:p.z+dz*reach,end:performance.now()+2800};omegaFx('grapple','#6cfaff');notice('Grapple connected');return;
    }
    if(id==='ghostdash'){
      const x=p.x,z=p.z,ang=p.yaw||0;let moved=false;
      for(let distance=13*k;distance>1;distance-=1.0){const tx=x-Math.sin(ang)*distance,tz=z-Math.cos(ang)*distance;
        const spot=safeMoveSpot(tx,p.y,tz,p);if(spot){blinkUndo={x:p.x,y:p.y,z:p.z};Object.assign(p,spot);p.vx=p.vy=p.vz=0;moved=true;break;}}
      omegaFx('dash','#a9dfff',k);notice(moved?'Ghost Dash!':'Ghost Dash blocked');return;
    }
    if(id==='rewind'){
      const now=performance.now(),prev=[...omegaHistory].reverse().find(s=>now-s.t>=5000)||omegaHistory[0];
      if(!prev)return notice('Rewind: move around for five seconds first');
      const pos=safeMoveSpot(prev.x,prev.y,prev.z,p);if(!pos)return notice('Rewind: old position is blocked');
      Object.assign(p,pos);p.vx=prev.vx;p.vy=prev.vy;p.vz=prev.vz;p.yaw=prev.yaw;omegaFx('rewind','#4ce4ff');notice('⏪ Back in time');return;
    }
    if(id==='ragdoll'){
      if(!b)return notice('No bot to launch');
      const dx=b.x-p.x,dz=b.z-p.z,l=Math.hypot(dx,dz)||1;b.vx=dx/l*90*k;b.vz=dz/l*90*k;b.vy=45*k;b.onGround=false;omegaFx('blast','#ffac70',k);notice('YEET!');return;
    }
  }
  function omegaTick(dt,now){
    const p=g.player;if(!p||!p.alive)return;
    if(!omegaHistory.length||now-omegaHistory[omegaHistory.length-1].t>80){omegaHistory.push({t:now,x:p.x,y:p.y,z:p.z,vx:p.vx||0,vy:p.vy||0,vz:p.vz||0,yaw:p.yaw||0});}
    while(omegaHistory.length>100||omegaHistory[0]&&now-omegaHistory[0].t>6200)omegaHistory.shift();
    if(omegaEnabled('taserAmmo')||omegaEnabled('taserRange'))omegaSyncZeus();
    const shotT=g.weapons.lastShotT;
    if(Number.isFinite(shotT)&&shotT!==omegaLastShot){omegaLastShot=shotT;
      if(omegaEnabled('bulletcam')||omegaEnabled('trickshot')){omegaShotAt=now;omegaFx(omegaEnabled('trickshot')?'spin':'bullet','#8bddff');}
    }
    const keys=g.input?.keys;
    if(omegaGrapple){const diff={x:omegaGrapple.x-p.x,y:omegaGrapple.y-p.y,z:omegaGrapple.z-p.z},d=Math.hypot(diff.x,diff.y,diff.z);
      if(d<2||now>omegaGrapple.end)omegaGrapple=null;else{const v=Math.min(58,22*omegaLevel('grapple'));p.vx=diff.x/d*v;p.vz=diff.z/d*v;p.vy=Math.max(-12,Math.min(35,diff.y/d*v));}}
    if(omegaEnabled('wallrun')&&!p.onGround&&Math.hypot(p.vx||0,p.vz||0)>2){
      const s=Math.sin(p.yaw||0),c=Math.cos(p.yaw||0);
      const nearWall=[1,-1].some(f=>{try{return !!originalRaycast?.call(g.physics,p.x,p.y+1.1,p.z,f*c,0,-f*s,.9,2)}catch{return false}});
      if(nearWall){p.vy=Math.max(p.vy||0,-.4);p.vx*=1+.2*dt*omegaLevel('wallrun');p.vz*=1+.2*dt*omegaLevel('wallrun');}
    }
    if(omegaEnabled('jetpack')&&keys?.has('Space')){p.vy=Math.max(p.vy||0,14*omegaLevel('jetpack'));if(now%100<25)omegaFx('thruster','#ff9d44');}
    if(omegaEnabled('landing')){
      if((p.vy||0)<-9&&!p.onGround)omegaLandingArmed=true;
      if(omegaLandingArmed&&p.onGround){omegaLandingArmed=false;omegaFx('blast','#ffcf61');
        for(const b of enemyBots()){const d=Math.hypot(b.x-p.x,b.z-p.z);if(d<13*omegaLevel('landing')){const m=Math.max(1,d);b.vx+=(b.x-p.x)/m*24;b.vz+=(b.z-p.z)/m*24;b.vy=18;}}}
    }
    if(omegaEnabled('dance')||omegaEnabled('traffic'))for(const [i,b] of enemyBots().entries()){
      if(omegaEnabled('dance')){b.yaw+=dt*5*omegaLevel('dance');b.nextFire=g.time+1;}
      if(omegaEnabled('traffic')){const leader=i?enemyBots()[i-1]:p,dx=leader.x-b.x,dz=leader.z-b.z,l=Math.hypot(dx,dz)||1;
        if(l>2){b.vx=dx/l*3*omegaLevel('traffic');b.vz=dz/l*3*omegaLevel('traffic');}}
    }
    if(omegaEnabled('tinyarmy')||omegaEnabled('giant'))for(const b of enemyBots().slice(0,26)){
      const node=b.cs2Agent?.root;if(!node?.scale)continue;
      if(!omegaModelScales.has(node))omegaModelScales.set(node,node.scale.clone());
      node.scale.copy(omegaModelScales.get(node)).multiplyScalar(omegaEnabled('giant')?Math.min(4,2.3*omegaLevel('giant')):Math.max(.17,.40/omegaLevel('tinyarmy')));
    }else if(omegaModelScales.size)omegaRestoreModels();
    if(omegaEnabled('performance')&&now-omegaLastTicker>350){omegaLastTicker=now;
      omegaHud.textContent='Ω PERFORMANCE\nFPS '+Math.round(odMeasuredFPS||0)+'  ·  BOTS '+enemyBots().length+'\nACTIVE '+Object.values(flags).filter(Boolean).length;
      omegaHud.style.display='block';}else if(!omegaEnabled('performance'))omegaHud.style.display='none';
  }
  function omegaVisualOn(){return omegaPowers.some(p=>['bulletcam','killreplay','trickshot','hitmarker','killeffects','crosshair'].includes(p.id)&&omegaEnabled(p.id))||omegaEffects.length>0||performance.now()<omegaReplayEnd;}
  function omegaDraw(base,w,h,project){
    if(!omegaCtx||panel.style.display!=='none')return;
    const ratio=Math.min(2,window.devicePixelRatio||1);if(omegaCanvas.width!==Math.round(w*ratio)||omegaCanvas.height!==Math.round(h*ratio)){omegaCanvas.width=Math.round(w*ratio);omegaCanvas.height=Math.round(h*ratio)}
    omegaCtx.setTransform(ratio,0,0,ratio,0,0);omegaCtx.clearRect(0,0,w,h);
    const now=performance.now();omegaCtx.save();
    if(omegaEnabled('crosshair')){const x=w/2,y=h/2,gap=+omegaConfig.crossGap||6,width=+omegaConfig.crossWidth||18;
      omegaCtx.lineWidth=2.5;omegaCtx.strokeStyle=omegaConfig.crossColor||'#90d9ff';omegaCtx.shadowColor=omegaCtx.strokeStyle;omegaCtx.shadowBlur=8;
      omegaCtx.beginPath();omegaCtx.moveTo(x-gap-width/2,y);omegaCtx.lineTo(x-gap,y);omegaCtx.moveTo(x+gap,y);omegaCtx.lineTo(x+gap+width/2,y);
      omegaCtx.moveTo(x,y-gap-width/2);omegaCtx.lineTo(x,y-gap);omegaCtx.moveTo(x,y+gap);omegaCtx.lineTo(x,y+gap+width/2);omegaCtx.stroke();omegaCtx.shadowBlur=0;}
    for(const fx of omegaEffects){const elapsed=(now-fx.t)/900;if(elapsed>=1)continue;
      omegaCtx.globalAlpha=1-elapsed;omegaCtx.strokeStyle=fx.color;omegaCtx.lineWidth=3;
      if(fx.type==='bullet'){const d=(elapsed*elapsed)*Math.min(w,h)*.5;omegaCtx.beginPath();omegaCtx.moveTo(w/2,h/2);omegaCtx.lineTo(w/2+d,h/2-d*.17);omegaCtx.stroke();}
      else if(fx.type==='spin'){omegaCtx.translate(w/2,h/2);omegaCtx.rotate(elapsed*Math.PI*2);omegaCtx.strokeRect(-45,-45,90,90);omegaCtx.setTransform(ratio,0,0,ratio,0,0);}
      else if(fx.type==='hit'){omegaCtx.font='900 34px system-ui';omegaCtx.textAlign='center';omegaCtx.fillStyle=fx.color;omegaCtx.fillText(omegaConfig.hitTheme==='minimal'?'×':'✦',w/2,h/2+8);}
      else if(fx.type==='kill'){for(let j=0;j<16;j++){const ang=j*Math.PI/8,r=elapsed*160;omegaCtx.beginPath();omegaCtx.moveTo(w/2+Math.cos(ang)*r,h*.38+Math.sin(ang)*r);omegaCtx.lineTo(w/2+Math.cos(ang)*(r+12),h*.38+Math.sin(ang)*(r+12));omegaCtx.stroke();}}
      else{omegaCtx.beginPath();omegaCtx.arc(w/2,h/2,elapsed*120*fx.size,0,Math.PI*2);omegaCtx.stroke();}}
    omegaEffects=omegaEffects.filter(f=>now-f.t<900);
    if(omegaReplayEnd>now){omegaCtx.fillStyle='#101629bf';omegaCtx.fillRect(w*.25,18,w*.5,40);omegaCtx.textAlign='center';omegaCtx.fillStyle='#b2dfff';omegaCtx.font='bold 15px system-ui';omegaCtx.fillText('◉ KILL REPLAY  ·  '+omegaReplay.join(' → '),w*.5,43);}
    omegaCtx.restore();
  }
  function omegaOffAll(){for(const p of omegaPowers)if(p.mode==='t')flags[omegaFlag(p.id)]=false;
    omegaRestoreModels();omegaGrapple=null;omegaReplayEnd=0;omegaEffects=[];omegaHud.style.display='none';omegaViewer.style.display='none';omegaSyncZeus();}
  function omegaCleanup(){omegaOffAll();if(g.dealDamage===omegaDealWrap)g.dealDamage=omegaDealPrev;
    if(g.killEntity===omegaKillWrap)g.killEntity=omegaKillPrev;
    if(g.zeusShot===omegaZeusWrap)g.zeusShot=omegaZeusPrev;
    if(omegaZeusDef)omegaZeusDef.range=omegaZeusOriginalRange;
    omegaCanvas.remove();omegaHud.remove();omegaViewer.remove();}
  const omegaDealWrap=function(victim,damage,attacker,...args){
    const result=omegaDealPrev.apply(this,arguments);
    if(active&&attacker===g.player&&victim?.team!==g.player.team&&victim!==g.player&&victim){
      if(omegaEnabled('hitmarker'))omegaFx('hit',omegaConfig.hitTheme==='rainbow'?`hsl(${Math.random()*360} 100% 65%)`:'#a4d8ff');
      if(omegaEnabled('rubber')){const p=g.player,dx=victim.x-p.x,dz=victim.z-p.z,d=Math.hypot(dx,dz)||1;victim.vx+=dx/d*16;victim.vz+=dz/d*16;victim.vy=Math.max(victim.vy||0,13);}
      if(omegaEnabled('lightning')&&performance.now()-omegaLastChain>170){omegaLastChain=performance.now();
        const targets=enemyBots().filter(b=>b!==victim&&Math.hypot(b.x-victim.x,b.z-victim.z)<17*omegaLevel('lightning')).slice(0,3);
        for(const bot of targets){bot.health-=Math.max(4,damage*.4);if(bot.health<=0)g.killEntity(bot,g.player,g.weapons.def?.()||null,false);reMark('⚡',bot,'#7adfff',450);}}
    }return result;};
  omegaDealPrev=g.dealDamage;if(typeof omegaDealPrev==='function')g.dealDamage=omegaDealWrap;
  const omegaKillWrap=function(victim,killer,...args){
    if(active&&killer===g.player&&victim!==g.player){
      if(omegaEnabled('killeffects'))omegaFx('kill',omegaConfig.killTheme==='rainbow'?`hsl(${Math.random()*360} 100% 65%)`:'#e8afff');
      if(omegaEnabled('killreplay')){omegaReplay=['SHOT',victim?.name||'BOT','ELIMINATED'];omegaReplayEnd=performance.now()+2300;}
    }return omegaKillPrev.apply(this,arguments);};
  omegaKillPrev=g.killEntity;if(typeof omegaKillPrev==='function')g.killEntity=omegaKillWrap;
  // The original Zeus attack uses the weapon's def.range; setting it to a huge value
  // retains Clutcher's own line-of-sight checks, hit and taser effects.
  const omegaZeusWrap=function(...args){omegaSyncZeus();return omegaZeusPrev.apply(this,args)};
  omegaZeusPrev=g.zeusShot;if(typeof omegaZeusPrev==='function')g.zeusShot=omegaZeusWrap;
  function omegaRenderTab(){
    const group=activeTab.slice(6),items=omegaPowers.filter(p=>p.group===group);
    const labels={combat:'COMBAT CINEMA',movement:'MOVEMENT TECH',goofy:'GOOFY MAYHEM',studio:'CUSTOM STUDIO',zeus:'ZEUS LAB'};
    section('Ω '+labels[group],'VOIDWARE V11 · '+(group==='zeus'?'Unlimited taser ammo and map-wide range':'6 experimental powers')+' · Customize each ability and hotkey.');
    const note=document.createElement('div');note.className='dw-kicker';note.textContent=group==='zeus'?'⚡ MAP-WIDE ZEUS · OFFLINE BOTS · WALLS STILL BLOCK':'Ω OMEGA EDITION · '+items.length+' CONTROLS · PRESS END TO RESET';content.append(note);
    const a=grid();for(const p of items){if(p.mode==='t')tile(a,p.icon+' '+p.name,p.desc+' · '+omegaLevel(p.id).toFixed(2)+'×',null,omegaFlag(p.id));
      else tile(a,p.icon+' '+p.name,p.desc+' · '+omegaLevel(p.id).toFixed(2)+'×',()=>omegaAction(p.id));}
    if(group==='zeus'){content.insertAdjacentHTML('beforeend','<div class="dw-feature-note">Infinite range means as far as the current map permits, not through solid walls. Enable Unlimited Taser Ammo separately, then equip Zeus. The game still requires aiming at the enemy.</div>');}
    content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
    const chosen=omegaConfig.selected[group]&&items.some(p=>p.id===omegaConfig.selected[group])?omegaConfig.selected[group]:items[0].id;
    selector('CUSTOMIZE AN OMEGA POWER',items.map(p=>[p.id,p.name]),chosen,v=>{omegaConfig.selected[group]=v;omegaSave();renderTab()});
    slider('Intensity · '+omegaById.get(chosen).name,.25,4,.05,omegaLevel(chosen),v=>{omegaConfig.levels[chosen]=v;omegaSave()},'×');
    if(group==='studio'){
      selector('Hitmarker style',[['neon','Neon cross'],['rainbow','Rainbow'],['minimal','Minimal']],omegaConfig.hitTheme,v=>{omegaConfig.hitTheme=v;omegaSave()});
      selector('Kill effect style',[['neon','Neon burst'],['rainbow','Rainbow burst']],omegaConfig.killTheme,v=>{omegaConfig.killTheme=v;omegaSave()});
      slider('Crosshair gap',1,20,1,Number(omegaConfig.crossGap),v=>{omegaConfig.crossGap=v;omegaSave()},' px');
      slider('Crosshair length',5,45,1,Number(omegaConfig.crossWidth),v=>{omegaConfig.crossWidth=v;omegaSave()},' px');
      const color=document.createElement('input');color.type='color';color.value=omegaConfig.crossColor;color.style.cssText='width:100%;height:36px;margin:8px 0 12px';color.onchange=()=>{omegaConfig.crossColor=color.value;omegaSave()};content.append(color);
    }
    const buttons=grid();tile(buttons,'⌨ Assign Hotkeys','Bind powers in the Hotkeys tab.',()=>{bindingFilter=omegaById.get(chosen).name;showMenu('hotkeys')});
    tile(buttons,'⛔ Disable Omega','Turn off all Omega toggles and reset the visuals.',()=>{omegaOffAll();renderTab()});
    const hint=document.createElement('p');hint.className='dw-desc dw-section';hint.textContent='Some modes are engine approximations: cinematic bullet and kill cameras use on-screen animation, and the model viewer is a local stylized preview. No external scripts or assets are loaded.';content.append(hint);
  }

  for(const p of omegaPowers){if(p.mode==='a'){const name=p.icon+' '+p.name;actions.set(actionId(name),{title:name,tab:'omega:'+p.group,handler:()=>omegaAction(p.id)});}}
  // Keep the standard hotkey toggle path in sync with Reality power side effects.


  // ====================== VOIDWARE V13 | SINGLE PARADOX TAB ======================
  // These are local client-side bot-lobby effects. Instant-hit bullets cannot truly be
  // steered in flight, and destruction overlays do not modify the map geometry.
  const paradoxPowers=[["portal_bullets","Portal Bullets","toggle","Shots passing through an entrance reappear at the exit. Set both anchors."],["time_bubble","Time Bubble","action","Freeze bots in a 12-meter sphere, then release them."],["echo_clone","Echo Clone","action","Record and replay a glowing trail of your last 10 seconds."],["gravity_punch","Gravity Punch","action","Launch nearby enemies with an expanding shockwave."],["bullet_steering","Bullet Steering","toggle","Guide hitscan shots toward nearby targets in your aim cone."],["weapon_fusion","Weapon Fusion","toggle","Combine a receiver gun and donor fire properties."],["reverse_gravity","Reverse Gravity Gun","toggle","Hits make enemy bots float upward."],["dimension_dash","Dimension Dash","action","Blink through a nearby obstacle to a safe destination."],["chain_lightning","Chain Lightning","toggle","Your eliminations damage the next closest enemy."],["boss_creator","Boss Creator","action","Give one nearby bot huge HP and an upgraded weapon."],["bot_possession","Bot Possession","toggle","Synchronize your view with a bot and control its movement."],["weapon_roulette","Weapon Roulette","toggle","Every elimination equips a random weapon."],["replay_ghost","Replay Ghost","toggle","See a delayed holographic trail of your path."],["destruction_illusion","Destruction Illusion","toggle","Animated impact cracks and sparks on wall hits."],["ability_builder","Ultimate Ability Builder","action","Fire off a custom combo of three abilities at once."]];
  const paradoxStore='dw_v13_paradox';
  let paradoxCfg={receiver:'awp',donor:'negev',damage:1,rate:1,clip:1,spread:1,penetration:1,
    steer:13,punch:48,bossHP:650,portalRadius:2.5,
    a1:'gravity_punch',a2:'dimension_dash',a3:'time_bubble'};
  try {const saved=JSON.parse(localStorage.getItem(paradoxStore)||'{}');if(saved&&typeof saved==='object')Object.assign(paradoxCfg,saved);}catch{}
  const paradoxSave=()=>{try{localStorage.setItem(paradoxStore,JSON.stringify(paradoxCfg))}catch{}};
  const paradoxToggle=k=>'paradox_'+k;
  for(const p of paradoxPowers)if(p[2]==='toggle')flags[paradoxToggle(p[0])]=false;
  const paradoxOn=k=>!!flags[paradoxToggle(k)];
  const paradoxOldDef=g.weapons.def;
  const paradoxOldCycle=g.weapons.cycleTime;
  const paradoxBaseBullet=g.fireBullet;
  const paradoxBaseKill=g.killEntity;
  let paradoxPortals=[null,null],paradoxBubble=null,paradoxEcho=null,paradoxPossessed=null,
      paradoxPossessOrigin=null,paradoxHistory=[],paradoxShotHistory=[],paradoxMarks=[],paradoxFx=[],paradoxBosses=new Map();
  let paradoxFusionDonor=null,paradoxLastRoulette=0,paradoxTime=performance.now();
  const paradoxWeapons=['ak47','m4a4','awp','ssg08','negev','deagle','m249','p90','mp9','xm1014','aug','galil','scar20','g3sg1','bizon'];
  const paradoxClamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
  const paradoxEye=()=>({x:g.player.x,y:g.player.y+(g.player.eyeH||1.6),z:g.player.z});
  const paradoxDir=()=>{const p=g.player,c=Math.cos(p.pitch||0);return{x:-Math.sin(p.yaw||0)*c,y:Math.sin(p.pitch||0),z:-Math.cos(p.yaw||0)*c}};
  const paradoxEnemy=()=>enemyBots().sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];
  const paradoxMark=(type,x,y,z,color='#b08cff',life=1100)=>{paradoxMarks.push({type,x,y,z,color,at:performance.now(),life});if(paradoxMarks.length>70)paradoxMarks.shift()};
  const paradoxNotice=s=>notice('PARADOX · '+s);
  function paradoxGetDef(id){
    if(!id||typeof paradoxOldDef!=='function')return null;
    const old=g.weapons.current;
    try {g.weapons.current=id;return paradoxOldDef.call(g.weapons)}
    catch{return null}
    finally {g.weapons.current=old}
  }
  function paradoxRefreshDonor(){paradoxFusionDonor=paradoxGetDef(paradoxCfg.donor);return paradoxFusionDonor}
  function paradoxFusion(){return paradoxOn('weapon_fusion')&&g.weapons.current===paradoxCfg.receiver&&!!paradoxFusionDonor}
  if(typeof paradoxOldDef==='function')g.weapons.def=function(...args){
    const base=paradoxOldDef.apply(this,args);
    if(!active||!paradoxFusion()||!base)return base;
    const donor=paradoxFusionDonor;
    const baseCycle=base.cycleTime??(base.rpm?60/base.rpm:.1);
    const donorCycle=donor.cycleTime??(donor.rpm?60/donor.rpm:.1);
    return {...base,
      // Keep the RECEIVER's weapon id, viewmodel, sounds, animations and class.
      dmg:Math.max(1,(Number(donor.dmg)||Number(base.dmg)||20)*paradoxCfg.damage),
      penetration:Math.max(0,(Number(donor.penetration)||Number(base.penetration)||1)*paradoxCfg.penetration),
      rangeMod:donor.rangeMod??base.rangeMod,
      maxRange:Math.max(Number(donor.maxRange)||0,Number(base.maxRange)||0),
      mag:Math.max(1,Math.min(500,Math.floor((Number(donor.mag)||Number(base.mag)||30)*paradoxCfg.clip))),
      cycleTime:paradoxClamp(Math.min(baseCycle,donorCycle)/paradoxCfg.rate,.024,3),
      boltTime:0, // Do not retain sniper bolt lockout on a rapid-fire fusion.
      auto:donor.auto??base.auto,
      rpm:Math.max(1,Math.round(60/(paradoxClamp(Math.min(baseCycle,donorCycle)/paradoxCfg.rate,.024,3)))),
      // Transform both weapon-system and animation recoil/spread metadata.
      inacc:Math.max(0,(base.inacc||0)*paradoxCfg.spread),
      sBase:Math.max(0,(Number(donor.sBase)||Number(base.sBase)||0)*paradoxCfg.spread),
      sMove:Math.max(0,(Number(donor.sMove)||Number(base.sMove)||0)*paradoxCfg.spread),
      sJump:Math.max(0,(Number(donor.sJump)||Number(base.sJump)||0)*paradoxCfg.spread),
      sFire:Math.max(0,(Number(donor.sFire)||Number(base.sFire)||0)*paradoxCfg.spread),
      cs2:base.cs2?{...base.cs2,spread:Array.isArray(donor.cs2?.spread)?donor.cs2.spread.map(n=>typeof n==='number'?n*paradoxCfg.spread:n):base.cs2.spread}:base.cs2
    };
  };
  if(typeof paradoxOldCycle==='function')g.weapons.cycleTime=function(...args){
    if(active&&paradoxFusion())return this.def()?.cycleTime??paradoxOldCycle.apply(this,args);
    return paradoxOldCycle.apply(this,args);
  };
  function paradoxEquipFusion(){
    paradoxRefreshDonor();
    const def=paradoxGetDef(paradoxCfg.receiver);
    if(!def||!paradoxFusionDonor)return paradoxNotice('Choose two supported guns');
    g.weapons.give(paradoxCfg.receiver);
    const st=g.weapons.state?.();
    if(st){st.ammo=Math.max(st.ammo||0,Math.min(500,Math.floor((paradoxFusionDonor.mag||def.mag||30)*paradoxCfg.clip)));
      st.reserve=Math.max(st.reserve||0,180);}
    flags.paradox_weapon_fusion=true;
    g.hud?.updateWeapon?.();
    paradoxNotice(paradoxCfg.receiver.toUpperCase()+' + '+paradoxCfg.donor.toUpperCase()+' FUSED');
  }
  function paradoxTargetAlong(dx,dy,dz,x,y,z,maxAngle=13){
    let best=null,score=Infinity;
    for(const b of enemyBots()){
      if(b.spawnProt>0)continue;
      const bx=b.x-x,by=(b._visY??b.y)+1.35-y,bz=b.z-z;
      const dist=Math.hypot(bx,by,bz)||1;
      const dot=paradoxClamp((bx*dx+by*dy+bz*dz)/dist,-1,1);
      const angle=Math.acos(dot)*180/Math.PI;
      if(angle>maxAngle||angle+dist*.015>=score)continue;
      if(typeof behindWall==='function'&&behindWall(b))continue;
      score=angle+dist*.015;best={bot:b,dx:bx/dist,dy:by/dist,dz:bz/dist};
    }
    return best;
  }
  function paradoxAnchor(slot){
    const ray=paradoxDir(),eye=paradoxEye();
    let distance=11;
    try{const hit=paradoxBaseRaycast(eye.x,eye.y,eye.z,ray.x,ray.y,ray.z,40,2);if(hit?.t>0)distance=Math.max(1,hit.t-.35)}catch{}
    paradoxPortals[slot]={x:eye.x+ray.x*distance,y:eye.y+ray.y*distance,z:eye.z+ray.z*distance};
    paradoxMark(slot?'exit':'entrance',paradoxPortals[slot].x,paradoxPortals[slot].y,paradoxPortals[slot].z,slot?'#ffb75b':'#5db7ff',30000);
    paradoxNotice('Portal '+(slot?'EXIT':'ENTRANCE')+' set');
  }
  const paradoxBaseRaycast=(...args)=>originalRaycast?.apply(g.physics,args);
  // Wrapper runs after V12.1's ray/aim hooks. No random server calls or eval.
  g.fireBullet=function(shooter,x,y,z,dx,dy,dz,def){
    if(!active||shooter!==g.player)return paradoxBaseBullet.apply(this,arguments);
    // Snapshot player-fired shots for Echo Clone's real bot-lobby replay.
    paradoxShotHistory.push({at:performance.now(),x,y,z,dx,dy,dz,def:def?{...def}:null});
    if(paradoxShotHistory.length>200)paradoxShotHistory.shift();
    let weapon=def;
    if(paradoxFusion()&&def){weapon={...def,...this.weapons?.def?.(),id:def.id,vm:def.vm};}
    if(paradoxOn('bullet_steering')){
      const aim=paradoxTargetAlong(dx,dy,dz,x,y,z,paradoxCfg.steer);
      if(aim){dx=aim.dx;dy=aim.dy;dz=aim.dz;}
    }
    if(paradoxOn('portal_bullets')&&paradoxPortals[0]&&paradoxPortals[1]){
      const p=paradoxPortals[0],q=paradoxPortals[1];
      const t=(p.x-x)*dx+(p.y-y)*dy+(p.z-z)*dz;
      const gap=Math.hypot(x+dx*t-p.x,y+dy*t-p.y,z+dz*t-p.z);
      let hitBeforePortal=false;
      if(t>0&&t<200&&gap<paradoxCfg.portalRadius){
        try{const wall=paradoxBaseRaycast(x,y,z,dx,dy,dz,t,2);hitBeforePortal=!!wall&&wall.t<t-.3}catch{}
        if(!hitBeforePortal){paradoxMark('portal',p.x,p.y,p.z,'#56bfff',850);
          paradoxMark('portal',q.x,q.y,q.z,'#ffc46d',850);
          return paradoxBaseBullet.call(this,shooter,q.x+dx*.8,q.y+dy*.8,q.z+dz*.8,dx,dy,dz,weapon);
        }
      }
    }
    if(paradoxOn('destruction_illusion')){
      const hit=paradoxBaseRaycast(x,y,z,dx,dy,dz,250,2);
      if(hit){paradoxMark('crack',hit.x??x+dx*hit.t,hit.y??y+dy*hit.t,hit.z??z+dz*hit.t,'#eea7ff',1400)}
    }
    return paradoxBaseBullet.call(this,shooter,x,y,z,dx,dy,dz,weapon);
  };
  g.killEntity=function(victim,killer,...rest){
    const wasAlive=!!victim?.alive;
    const result=paradoxBaseKill.call(this,victim,killer,...rest);
    if(active&&wasAlive&&killer===g.player&&victim?.team!==g.player.team){
      if(paradoxOn('chain_lightning')){
        const next=enemyBots().filter(b=>b!==victim).sort((a,b)=>Math.hypot(a.x-victim.x,a.z-victim.z)-Math.hypot(b.x-victim.x,b.z-victim.z))[0];
        if(next&&Math.hypot(next.x-victim.x,next.z-victim.z)<23){
          paradoxMark('zap',next.x,(next._visY??next.y)+1.2,next.z,'#70d9ff',900);
          next.health=Math.max(0,(next.health||100)-68);
          if(next.health<=0&&next.alive)paradoxBaseKill.call(g,next,g.player,null,false);
        }
      }
      if(paradoxOn('weapon_roulette')&&performance.now()-paradoxLastRoulette>150){
        paradoxLastRoulette=performance.now();const choice=paradoxWeapons[Math.floor(Math.random()*paradoxWeapons.length)];
        g.weapons.give(choice);g.hud?.updateWeapon?.();paradoxNotice('Roulette → '+choice.toUpperCase());
      }
    }
    return result;
  };
  function paradoxShotBoost(){
    if(paradoxOn('reverse_gravity')){
      const b=paradoxTargetAlong(paradoxDir().x,paradoxDir().y,paradoxDir().z,g.player.x,g.player.y+1.6,g.player.z,11)?.bot;
      if(b){b.vy=Math.max(b.vy||0,35);b.onGround=false;paradoxMark('up',b.x,b.y+1,b.z,'#7dd5ff',800);}
    }
  }
  function paradoxAction(id){
    if(!active||g.state!=='playing')return paradoxNotice('Enter a bot match');
    const p=g.player,enemy=paradoxEnemy();
    if(id==='portal_entrance')return paradoxAnchor(0);
    if(id==='portal_exit')return paradoxAnchor(1);
    if(id==='equip_fusion')return paradoxEquipFusion();
    if(id==='time_bubble'){
      const d=paradoxDir();paradoxBubble={x:p.x-d.x*-8,y:p.y+1,z:p.z-d.z*-8,until:performance.now()+5000,caught:new Map()};
      paradoxMark('bubble',paradoxBubble.x,paradoxBubble.y,paradoxBubble.z,'#8b8bff',5000);return paradoxNotice('5s TIME BUBBLE');
    }
    if(id==='echo_clone'){
      const last=paradoxHistory.slice(-110);if(last.length<10)return paradoxNotice('Move around for two seconds first');
      paradoxEcho={points:last,shots:paradoxShotHistory.filter(s=>s.at>=last[0].at),nextShot:0,started:performance.now(),duration:last[last.length-1].at-last[0].at};
      return paradoxNotice('ECHO CLONE replaying your previous route');
    }
    if(id==='gravity_punch'){
      const o=paradoxEye();const dir=paradoxDir();paradoxMark('ring',o.x+dir.x*3,p.y+1,o.z+dir.z*3,'#ff8dbf',900);
      for(const b of enemyBots()){
        const dx=b.x-p.x,dz=b.z-p.z,dist=Math.hypot(dx,dz)||1;
        if(dist<14){b.vx=(b.vx||0)+dx/dist*paradoxCfg.punch;b.vz=(b.vz||0)+dz/dist*paradoxCfg.punch;b.vy=Math.max(b.vy||0,paradoxCfg.punch*.55);b.onGround=false;}
      }
      return paradoxNotice('GRAVITY PUNCH!');
    }
    if(id==='dimension_dash'){
      const d=paradoxDir();let spot=null;
      for(let dist=16;dist>3;dist-=1){const px=p.x+d.x*dist,pz=p.z+d.z*dist;
        try{spot=odToGround(px,pz,p,p.y)}catch{};if(spot)break;
      }
      if(spot){blinkUndo={x:p.x,y:p.y,z:p.z};p.x=spot.x;p.y=spot.y;p.z=spot.z;p.vx=p.vy=p.vz=0;
        paradoxMark('portal',p.x,p.y+1,p.z,'#72bfff',1000);return paradoxNotice('DIMENSION DASH!');}
      return paradoxNotice('No safe landing found');
    }
    if(id==='boss_creator'){
      if(!enemy)return paradoxNotice('No enemy available');
      if(!paradoxBosses.has(enemy))paradoxBosses.set(enemy,{health:enemy.health,armor:enemy.armor,weapon:enemy.weapon});
      enemy.health=paradoxCfg.bossHP;enemy.armor=300;enemy.weapon='negev';enemy.nextFire=g.time;
      paradoxMark('boss',enemy.x,enemy.y+1,enemy.z,'#ffba43',3500);return paradoxNotice('BOSS CREATED · '+paradoxCfg.bossHP+' HP');
    }
    if(id==='possess_nearest'){
      if(!enemy)return paradoxNotice('No enemy available');
      paradoxPossessed=enemy;flags.paradox_bot_possession=true;
      paradoxPossessOrigin={x:p.x,y:p.y,z:p.z};return paradoxNotice('POSSESSING BOT — WASD to drive · disable to exit');
    }
    if(id==='ultimate_combo'||id==='ability_builder'){
      for(const skill of new Set([paradoxCfg.a1,paradoxCfg.a2,paradoxCfg.a3])){
        if(skill==='ultimate_combo'||skill==='ability_builder')continue;
        try{paradoxAction(skill)}catch(e){console.warn('[PARADOX] combo',e)}
      }
      return paradoxNotice('ULTIMATE COMBO ACTIVATED');
    }
  }
  function paradoxTick(dt,now){
    if(!active)return;
    const p=g.player;
    if(!p?.alive)return;
    if(!paradoxHistory.length||now-paradoxHistory[paradoxHistory.length-1].at>85){
      paradoxHistory.push({at:now,x:p.x,y:p.y,z:p.z,yaw:p.yaw,pitch:p.pitch});
      while(paradoxHistory.length>120||now-paradoxHistory[0].at>10300)paradoxHistory.shift();
    }
    paradoxMarks=paradoxMarks.filter(x=>now-x.at<x.life);
    if(paradoxBubble){
      if(now>paradoxBubble.until){for(const [b,v] of paradoxBubble.caught){if(b.alive){b.vx=v.x*1.5;b.vy=v.y+12;b.vz=v.z*1.5;}}paradoxBubble=null;}
      else for(const b of enemyBots()){
        if(Math.hypot(b.x-paradoxBubble.x,b.z-paradoxBubble.z)<12){
          if(!paradoxBubble.caught.has(b))paradoxBubble.caught.set(b,{x:b.vx||0,y:b.vy||0,z:b.vz||0});
          b.vx=b.vy=b.vz=0;b.nextFire=Math.max(b.nextFire||0,g.time+.12);
        }
      }
    }
    if(paradoxEcho){
      const elapsed=now-paradoxEcho.started;
      while(paradoxEcho.nextShot<paradoxEcho.shots.length){
        const shot=paradoxEcho.shots[paradoxEcho.nextShot];
        if(shot.at-paradoxEcho.points[0].at>elapsed)break;
        paradoxEcho.nextShot++;
        // Replay uses the original wall-aware hit detection; it does not equip
        // another player's inventory or create new network participants.
        try{originalFireBullet.call(g,g.player,shot.x,shot.y,shot.z,shot.dx,shot.dy,shot.dz,shot.def||paradoxOldDef.call(g.weapons))}catch{}
        paradoxMark('echo',shot.x+shot.dx*3,shot.y+shot.dy*3,shot.z+shot.dz*3,'#61fff0',350);
      }
      if(now>paradoxEcho.started+paradoxEcho.duration+400)paradoxEcho=null;
    }
    if(paradoxOn('weapon_fusion')&&!flags.v131_fusion_reactor&&g.weapons.current===paradoxCfg.receiver){
      const st=g.weapons.state?.(),donor=paradoxFusionDonor;
      if(st&&donor&&Number.isFinite(donor.mag)){const max=Math.min(500,Math.floor(donor.mag*paradoxCfg.clip));
        if(st.ammo>max)st.ammo=max;
      }
    }
    if(paradoxOn('bot_possession')&&paradoxPossessed?.alive){
      const b=paradoxPossessed,i=g.input,yaw=p.yaw||0;
      let f=Number(i?.keys?.has?.('KeyW'))-Number(i?.keys?.has?.('KeyS'));
      let s=Number(i?.keys?.has?.('KeyD'))-Number(i?.keys?.has?.('KeyA'));
      const z=-Math.cos(yaw)*f-Math.sin(yaw)*s,x=-Math.sin(yaw)*f+Math.cos(yaw)*s;
      b.vx=x*17;b.vz=z*17;b.yaw=yaw;
      // Local viewpoint follows the bot while it is possessed.
      p.x=b.x;p.y=b.y;p.z=b.z;
    }else if(paradoxPossessed){
      if(paradoxPossessOrigin&&p.alive){p.x=paradoxPossessOrigin.x;p.y=paradoxPossessOrigin.y;p.z=paradoxPossessOrigin.z;}
      paradoxPossessed=null;paradoxPossessOrigin=null;
    }
  }
  function paradoxVisualActive(){return !!(paradoxMarks.length||paradoxBubble||paradoxEcho||paradoxOn('replay_ghost')||paradoxOn('weapon_fusion'));}
  function paradoxDraw(context,w,h,project){
    if(!active)return;
    const now=performance.now();context.save();
    const marker=(x,y,z,color,r=10)=>{const q=project(x,y,z);if(!q)return;context.strokeStyle=color;context.shadowColor=color;context.shadowBlur=11;
      context.lineWidth=2;context.beginPath();context.arc(q.x,q.y,r,0,Math.PI*2);context.stroke();};
    for(const item of paradoxMarks.slice(-28)){
      const q=project(item.x,item.y,item.z);if(!q)continue;
      const f=paradoxClamp(1-(now-item.at)/item.life,0,1);
      context.globalAlpha=f;marker(item.x,item.y,item.z,item.color,item.type==='bubble'?40:item.type==='crack'?17:12);
      if(item.type==='crack'){
        context.strokeStyle=item.color;context.beginPath();for(let a=0;a<6;a++){
          let r=(a*Math.PI/3);context.moveTo(q.x,q.y);context.lineTo(q.x+Math.cos(r)*25,q.y+Math.sin(r)*23)}context.stroke();
      }
      if(item.type==='boss'){context.fillStyle='#ffc66b';context.font='bold 12px sans-serif';context.fillText('BOSS',q.x-18,q.y-22)}
    }
    context.globalAlpha=1;
    if(paradoxBubble){marker(paradoxBubble.x,paradoxBubble.y,paradoxBubble.z,'#aca0ff',52);}
    if(paradoxPortals[0])marker(paradoxPortals[0].x,paradoxPortals[0].y,paradoxPortals[0].z,'#65bbff',20);
    if(paradoxPortals[1])marker(paradoxPortals[1].x,paradoxPortals[1].y,paradoxPortals[1].z,'#ffbd73',20);
    let ghost=null;
    if(paradoxEcho){const t=now-paradoxEcho.started;
      ghost=paradoxEcho.points.find(p=>p.at-paradoxEcho.points[0].at>=t)||paradoxEcho.points[paradoxEcho.points.length-1];}
    else if(paradoxOn('replay_ghost'))ghost=paradoxHistory[Math.max(0,paradoxHistory.length-48)];
    if(ghost){marker(ghost.x,ghost.y+1.15,ghost.z,'#80ffeb',15);
      const q=project(ghost.x,ghost.y+2.1,ghost.z);if(q){context.fillStyle='#78f4ee';context.font='bold 11px sans-serif';context.fillText('ECHO',q.x-14,q.y)}}
    if(paradoxFusion()){
      context.fillStyle='#bd9bff';context.font='700 12px system-ui';context.textAlign='center';
      context.fillText('✦ FUSION '+paradoxCfg.receiver.toUpperCase()+' × '+paradoxCfg.donor.toUpperCase(),w/2,h-66);
    }
    context.restore();
  }
  // V13.1: Local-bot-only win actions. Never contacts a server or changes online results.
  function paradoxAutoWin(match=false){
    if(!active || g.state!=='playing' || !g.player?.team || !g.botMgr?.bots)
      return notice('AUTO WIN · Start a local bot match first');
    // These exposed game modes are offline/local. Do not promise a networked victory.
    const team=g.player.team,controller=g.modeCtl;
    if(controller && typeof controller.roundEnd==='function'){
      if(controller.state==='end'||controller.state==='match_end')
        return notice('AUTO WIN · Round has already ended');
      if(controller.score && (team==='CT'||team==='T') && match){
        // Engine match threshold: floor(maxRounds/2)+1. One round-end increments the score.
        const limit=Math.floor((Number(controller.maxRounds)||15)/2)+1;
        controller.score[team]=Math.max(Number(controller.score[team])||0,limit-1);
      }
      try {controller.roundEnd(team,match?'Bot match completed':'Bots eliminated');
        notice(match?'AUTO WIN · MATCH WON (local)':'AUTO WIN · ROUND WON (local)');return true;}
      catch(err){console.warn('[VOIDWARE] local win callback',err)}
    }
    if(!controller && typeof g.endRound==='function'){
      // Deathmatch checks teams' kill totals when ending a round.
      const all=[g.player,...g.botMgr.bots];
      let opponentKills=0,allyKills=0;
      for(const entity of all){
        const n=Number(entity.kills)||0;
        if(entity.team===team)allyKills+=n;else opponentKills+=n;
      }
      if(allyKills<=opponentKills)g.player.kills=(Number(g.player.kills)||0)+opponentKills-allyKills+1;
      try{g.endRound();notice('AUTO WIN · LOCAL DEATHMATCH ROUND');return true}
      catch(err){console.warn('[VOIDWARE] local DM win callback',err)}
    }
    notice('AUTO WIN · This match type has no supported local win function');return false;
  }

  // ================== V13.1 PARADOX EXTENSION: ONE EXTRA TAB ==================
  // Additional powers are entirely opt-in. Existing PARADOX V13 remains usable.
  const v131Powers=[
    ['quantum_barrage','Quantum Barrage','toggle','Each real shot delivers an extra small visible-target energy pulse.'],
    ['stasis_field','Stasis Field','toggle','Dampen movement of nearby enemy bots.'],
    ['gravity_well','Gravity Well','toggle','Draw nearby enemies gently toward your position.'],
    ['magnetic_repulsion','Magnetic Repulsion','toggle','Push nearby enemies away with a magnetic field.'],
    ['phase_stride','Phase Stride','toggle','Build extra horizontal speed while airborne.'],
    ['health_siphon','Health Siphon','toggle','Recover health for each enemy bot elimination.'],
    ['explosive_eliminations','Explosive Eliminations','toggle','Each elimination launches nearby bots with a shockwave.'],
    ['shield_orbit','Shield Orbit','toggle','Three orbiting energy shields delay close-range bot attacks.'],
    ['neon_footsteps','Neon Footsteps','toggle','Paint a fading purple trail along your path.'],
    ['fusion_reactor','Fusion Reactor 2.0','toggle','Enable advanced independently sourced fusion stats and presets.'],
    ['warp_anchor','Warp Anchor','action','Save a safe return position in the arena.'],
    ['warp_recall','Warp Recall','action','Teleport back to your saved anchor when landing space is safe.'],
    ['singularity','Singularity','action','Open a temporary gravity vortex pulling nearby enemies inward.'],
    ['nova_blast','Nova Blast','action','Release an area shockwave that damages and launches enemies.'],
    ['echo_squad','Echo Squad','action','Project four moving hologram decoys around your character.']
  ];
  for(const p of v131Powers)if(p[2]==='toggle')flags['v131_'+p[0]]=false;
  const v131Active=id=>!!flags['v131_'+id];
  const v131Store='deathWonV13_1ParadoxAddons';
  const v131Defaults={fireDonor:'negev',damageDonor:'awp',magDonor:'negev',accuracyDonor:'ssg08',
    damageScale:1,rateScale:1,magScale:1,spreadScale:1,penetrationScale:1,
    damageSource:'donor',rateSource:'donor',magSource:'donor',autoSource:'donor',
    power:30,radius:13,stasis:3,heal:25};
  let v131Cfg={...v131Defaults},v131Profiles={};
  try{
    const saved=JSON.parse(localStorage.getItem(v131Store)||'{}');
    if(saved&&typeof saved==='object'){
      if(saved.cfg&&typeof saved.cfg==='object')v131Cfg={...v131Defaults,...saved.cfg};
      if(saved.profiles&&typeof saved.profiles==='object'&&!Array.isArray(saved.profiles))v131Profiles=saved.profiles;
    }
  }catch(e){console.warn('[VOIDWARE] V13.1 config reset (invalid storage)',e)}
  const v131Allowed=['donor','receiver','blend'];
  function v131Sanitize(){
    for(const key of ['fireDonor','damageDonor','magDonor','accuracyDonor'])
      if(!paradoxWeapons.includes(v131Cfg[key]))v131Cfg[key]=v131Defaults[key];
    for(const key of ['damageSource','rateSource','magSource'])
      if(!v131Allowed.includes(v131Cfg[key]))v131Cfg[key]='donor';
    if(!['donor','receiver'].includes(v131Cfg.autoSource))v131Cfg.autoSource='donor';
    for(const [key,lo,hi] of [
      ['damageScale',.1,8],['rateScale',.2,8],['magScale',.25,8],['spreadScale',0,3],
      ['penetrationScale',0,6],['power',5,100],['radius',4,30],['stasis',1,8],['heal',1,100]]){
        v131Cfg[key]=Number.isFinite(Number(v131Cfg[key]))?paradoxClamp(Number(v131Cfg[key]),lo,hi):v131Defaults[key];
    }
  }
  v131Sanitize();
  const v131Save=()=>{try{localStorage.setItem(v131Store,JSON.stringify({cfg:v131Cfg,profiles:v131Profiles}))}catch(e){console.warn('[VOIDWARE] Could not save PARADOX 13.1',e)}};
  let v131Anchor=null,v131Singularity=null,v131SquadUntil=0,v131StepAt=0,v131ShieldAt=0,v131LastShotAt=0,v131WasGround=!!g.player?.onGround;
  const v131Notice=s=>notice('PARADOX 13.1 · '+s);
  const v131RawDef=id=>paradoxGetDef(id);
  const v131Value=(x,fallback=0)=>Number.isFinite(Number(x))?Number(x):fallback;
  const v131Mix=(mode,r,d)=>mode==='receiver'?r:mode==='blend'?(r+d)/2:d;
  const v131Cycle=d=>{
    const n=v131Value(d?.cycleTime,0);
    return n>0?n:(v131Value(d?.rpm,0)>0?60/d.rpm:.12);
  };
  function v131Stats(){
    if(!paradoxWeapons.includes(paradoxCfg.receiver))return null;
    const body=v131RawDef(paradoxCfg.receiver),fire=v131RawDef(v131Cfg.fireDonor),
      damage=v131RawDef(v131Cfg.damageDonor),magazine=v131RawDef(v131Cfg.magDonor),
      accuracy=v131RawDef(v131Cfg.accuracyDonor);
    if(!body||!fire||!damage||!magazine||!accuracy)return null;
    const amount=Math.max(1,Math.min(500,Math.round(v131Mix(v131Cfg.magSource,v131Value(body.mag,30),v131Value(magazine.mag,30))*v131Cfg.magScale)));
    const cycle=paradoxClamp(v131Mix(v131Cfg.rateSource,v131Cycle(body),v131Cycle(fire))/v131Cfg.rateScale,.024,3);
    const dmg=paradoxClamp(v131Mix(v131Cfg.damageSource,v131Value(body.dmg,20),v131Value(damage.dmg,20))*v131Cfg.damageScale,1,1200);
    const sp=paradoxClamp(v131Cfg.spreadScale,0,3),pe=paradoxClamp(v131Cfg.penetrationScale,0,6);
    const spreadFields={};
    for(const key of ['sBase','sMove','sJump','sFire','inacc'])
      spreadFields[key]=Math.max(0,v131Value(accuracy[key],v131Value(body[key],0))*sp);
    return {...body,...spreadFields,dmg,mag:amount,cycleTime:cycle,rpm:Math.round(60/cycle),
      penetration:Math.max(0,v131Value(damage.penetration,v131Value(body.penetration,1))*pe),
      maxRange:(Number.isFinite(fire.maxRange)||Number.isFinite(body.maxRange))
        ?Math.max(v131Value(fire.maxRange,0),v131Value(body.maxRange,0)):body.maxRange,
      rangeMod:fire.rangeMod??body.rangeMod,
      auto:v131Cfg.autoSource==='receiver'?body.auto:fire.auto,
      boltTime:0,
      cs2:body.cs2?{...body.cs2,
        spread:Array.isArray(accuracy.cs2?.spread)?accuracy.cs2.spread.map(n=>typeof n==='number'?n*sp:n):body.cs2.spread}:body.cs2};
  }
  // Wrap the V13 definition. When Fusion Reactor is OFF, this returns the unchanged V13 behavior.
  const v131BeforeDef=g.weapons.def;
  if(typeof v131BeforeDef==='function')g.weapons.def=function(...args){
    const previous=v131BeforeDef.apply(this,args);
    if(!active||!v131Active('fusion_reactor')||!paradoxFusion())return previous;
    return v131Stats()||previous;
  };
  function v131EquipFusion(){
    if(!active||g.state!=='playing')return v131Notice('Enter a local bot match');
    v131Sanitize();paradoxRefreshDonor();
    if(!v131Stats())return v131Notice('Choose supported donor guns first');
    // Keep all original receiver/audio/animation and equipment logic.
    paradoxEquipFusion();
    flags.v131_fusion_reactor=true;
    const fused=v131Stats(),st=g.weapons.state?.();
    if(fused&&st){st.ammo=fused.mag;st.reserve=Math.max(v131Value(st.reserve),fused.mag*4);}
    g.hud?.updateWeapon?.();v131Save();
    return v131Notice(fused?'ADVANCED FUSION EQUIPPED':'Unsupported donor gun');
  }
  const v131PreviousFire=g.fireBullet;
  g.fireBullet=function(shooter,x,y,z,dx,dy,dz,def){
    const ret=v131PreviousFire.apply(this,arguments);
    if(!active||g.state!=='playing'||shooter!==g.player||!v131Active('quantum_barrage'))return ret;
    const now=performance.now();if(now-v131LastShotAt<115)return ret;
    v131LastShotAt=now;
    const aim=paradoxTargetAlong(dx,dy,dz,x,y,z,9);
    if(aim?.bot?.alive){
      const b=aim.bot; b.health=Math.max(0,v131Value(b.health,100)-Math.max(3,v131Value(def?.dmg,30)*.22));
      paradoxMark('quantum',b.x,(b._visY??b.y)+1.3,b.z,'#a3fbff',520);
      if(b.health<=0&&b.alive)try{g.killEntity(b,g.player,null,false)}catch(e){console.warn('[VOIDWARE] quantum elimination',e)}
    }
    return ret;
  };
  const v131PreviousKill=g.killEntity;
  g.killEntity=function(victim,killer,...rest){
    const alive=!!victim?.alive;
    const result=v131PreviousKill.call(this,victim,killer,...rest);
    if(!active||!alive||victim?.alive||killer!==g.player||victim?.team===g.player.team)return result;
    if(v131Active('health_siphon')){
      const p=g.player;p.health=Math.min(v131Value(p.maxHealth,100),v131Value(p.health,0)+v131Cfg.heal);
      g.hud?.updateHealth?.();
    }
    if(v131Active('explosive_eliminations')){
      for(const b of enemyBots()){
        const dx=b.x-victim.x,dz=b.z-victim.z,dist=Math.hypot(dx,dz)||1;
        if(dist<13){b.vx=(b.vx||0)+dx/dist*v131Cfg.power;b.vz=(b.vz||0)+dz/dist*v131Cfg.power;
          b.vy=Math.max(b.vy||0,v131Cfg.power*.3);b.onGround=false;}
      }
      paradoxMark('boom',victim.x,victim.y+1,victim.z,'#ff7ce2',800);
    }
    return result;
  };
  function v131Action(id){
    if(!active||g.state!=='playing'||!g.player?.alive)return v131Notice('Enter a live local bot round');
    const p=g.player,now=performance.now(),dir=paradoxDir();
    if(id==='warp_anchor'){
      const gy=findGround(p.x,p.y,p.z);
      if(gy===null||Math.abs(gy-p.y)>1.7)return v131Notice('Stand on safe ground to save an anchor');
      v131Anchor={x:p.x,y:gy+.07,z:p.z};paradoxMark('anchor',p.x,p.y+1,p.z,'#caaaff',2600);
      return v131Notice('WARP ANCHOR SAVED');
    }
    if(id==='warp_recall'){
      if(!v131Anchor)return v131Notice('Set a Warp Anchor first');
      const spot=safeMoveSpot(v131Anchor.x,v131Anchor.y,v131Anchor.z,p);
      if(!spot)return v131Notice('Anchor area is blocked or unsafe');
      blinkUndo={x:p.x,y:p.y,z:p.z};Object.assign(p,spot);
      p.vx=p.vy=p.vz=0;p.onGround=true;paradoxMark('warp',p.x,p.y+1,p.z,'#5deeff',1200);
      return v131Notice('RECALLED TO ANCHOR');
    }
    if(id==='singularity'){
      v131Singularity={x:p.x+dir.x*9,y:p.y+1,z:p.z+dir.z*9,until:now+4800};
      paradoxMark('singularity',v131Singularity.x,v131Singularity.y,v131Singularity.z,'#a86bff',4800);
      return v131Notice('SINGULARITY · 4.8 SECONDS');
    }
    if(id==='nova_blast'){
      let hit=0;for(const b of enemyBots()){
        const dx=b.x-p.x,dz=b.z-p.z,dist=Math.hypot(dx,dz)||1;
        if(dist>v131Cfg.radius||b.spawnProt>0)continue;
        const force=v131Cfg.power*(1-dist/(v131Cfg.radius*1.3));
        b.vx=(b.vx||0)+dx/dist*force;b.vz=(b.vz||0)+dz/dist*force;
        b.vy=Math.max(b.vy||0,force*.4);b.onGround=false;
        b.health=Math.max(0,v131Value(b.health,100)-Math.round(force*.8));
        if(b.health<=0&&b.alive)try{g.killEntity(b,p,null,false)}catch(e){}
        hit++;
      }
      paradoxMark('nova',p.x,p.y+1,p.z,'#ff70e4',1100);
      return v131Notice('NOVA BLAST · '+hit+' enemies hit');
    }
    if(id==='echo_squad'){
      v131SquadUntil=now+15000;return v131Notice('ECHO SQUAD · 4 holograms for 15s');
    }
    return v131Notice('Unknown ability');
  }
  function v131Tick(dt,now){
    if(!active||g.state!=='playing'||!g.player?.alive)return;
    const p=g.player;const radius=v131Cfg.radius;
    if(v131Active('stasis_field')||v131Active('gravity_well')||v131Active('magnetic_repulsion')||v131Active('shield_orbit')||v131Singularity){
      for(const b of enemyBots()){
        const dx=p.x-b.x,dz=p.z-b.z,dist=Math.hypot(dx,dz)||.01;
        if(dist<radius&&!(b.spawnProt>0)){
          if(v131Active('stasis_field')){
            const damping=Math.exp(-Math.max(0,dt)*v131Cfg.stasis);
            b.vx=(b.vx||0)*damping;b.vz=(b.vz||0)*damping;
          }
          if(v131Active('gravity_well')){
            b.vx=(b.vx||0)+dx/dist*v131Cfg.power*dt;
            b.vz=(b.vz||0)+dz/dist*v131Cfg.power*dt;
          }
          if(v131Active('magnetic_repulsion')){
            b.vx=(b.vx||0)-dx/dist*v131Cfg.power*dt;
            b.vz=(b.vz||0)-dz/dist*v131Cfg.power*dt;
          }
          if(v131Active('shield_orbit')&&dist<8)b.nextFire=Math.max(v131Value(b.nextFire),v131Value(g.time)+.13);
        }
        if(v131Singularity&&now<v131Singularity.until){
          const ax=v131Singularity.x-b.x,az=v131Singularity.z-b.z,dr=Math.hypot(ax,az)||.01;
          if(dr<24){b.vx=(b.vx||0)+ax/dr*v131Cfg.power*1.7*dt;
            b.vz=(b.vz||0)+az/dr*v131Cfg.power*1.7*dt;
            b.vy=Math.max(b.vy||0,2);}
        }
      }
    }
    if(v131Singularity&&now>=v131Singularity.until)v131Singularity=null;
    if(v131Active('phase_stride')&&!p.onGround){
      const vx=v131Value(p.vx),vz=v131Value(p.vz),spd=Math.hypot(vx,vz);
      if(spd>1&&spd<55){const next=Math.min(55,spd+dt*v131Cfg.power);
        p.vx=vx/spd*next;p.vz=vz/spd*next;}
    }
    if(v131Active('neon_footsteps')&&now-v131StepAt>150){
      v131StepAt=now;paradoxMark('footstep',p.x,p.y+.09,p.z,'#ad79ff',950);
    }
    if(v131Active('shield_orbit')&&now-v131ShieldAt>380){
      v131ShieldAt=now;paradoxMark('shield',p.x,p.y+1,p.z,'#54f6ed',500);
    }
    // Clamp only advanced fusion ammo. Do not mutate inventory when it is OFF.
    if(v131Active('fusion_reactor')&&paradoxFusion()){
      const stats=v131Stats(),st=g.weapons.state?.();
      if(stats&&st&&Number.isFinite(st.ammo)&&st.ammo>stats.mag)st.ammo=stats.mag;
    }
    v131WasGround=!!p.onGround;
  }
  function v131VisualActive(){return !!(v131Active('shield_orbit')||v131Singularity||performance.now()<v131SquadUntil)}
  function v131Draw(ctx,w,h,project){
    if(!active||g.state!=='playing')return;
    const p=g.player,now=performance.now();
    ctx.save();ctx.lineWidth=2;
    if(v131Singularity){
      const q=project(v131Singularity.x,v131Singularity.y,v131Singularity.z);
      if(q){ctx.strokeStyle='#ab68ff';ctx.shadowColor='#a66dff';ctx.shadowBlur=16;
        for(let j=0;j<3;j++){const r=12+j*13+Math.sin(now*.004+j)*4;
          ctx.beginPath();ctx.ellipse(q.x,q.y,r,r*.65,now*.001+j,0,Math.PI*2);ctx.stroke();}}
    }
    if(v131Active('shield_orbit')||now<v131SquadUntil){
      const squad=now<v131SquadUntil;
      for(let j=0;j<(squad?4:3);j++){
        const angle=now*(squad ? .0012 : .002)+j*Math.PI*2/(squad?4:3),r=squad?3.5:1.6;
        const q=project(p.x+Math.cos(angle)*r,p.y+1.2,p.z+Math.sin(angle)*r);
        if(!q)continue;
        ctx.strokeStyle=squad?'#be8aff':'#73ffe4';ctx.fillStyle='#a893ff33';
        ctx.beginPath();ctx.arc(q.x,q.y,squad?14:9,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(squad){ctx.fillStyle='#dec8ff';ctx.font='11px system-ui';ctx.fillText('ECHO',q.x-16,q.y-21);}
      }
    }
    if(v131Active('fusion_reactor')&&paradoxFusion()){
      ctx.fillStyle='#bffdf6';ctx.font='bold 12px system-ui';ctx.textAlign='center';
      ctx.fillText('✧ FUSION REACTOR 2.0  '+paradoxCfg.receiver.toUpperCase()+' + '+v131Cfg.fireDonor.toUpperCase(),w/2,h-88);
    }
    ctx.restore();
  }
  function v131Off(){
    for(const [id,,mode] of v131Powers)if(mode==='toggle')flags['v131_'+id]=false;
    v131Anchor=null;v131Singularity=null;v131SquadUntil=0;
  }
  function v131ApplyPreset(recv,fire,damage,mag,accuracy){
    paradoxCfg.receiver=recv;paradoxCfg.donor=fire;paradoxSave();
    Object.assign(v131Cfg,{fireDonor:fire,damageDonor:damage,magDonor:mag,accuracyDonor:accuracy});
    v131Sanitize();v131Save();v131EquipFusion();renderTab();
  }
  function v131RenderTab(){
    section('✧ PARADOX 13.1 · 15 NEW POWERS','A new standalone tab. Every older tab, setting and hotkey is preserved. These effects operate in the local bot lobby.');
    const powers=grid();for(const [id,name,mode,desc] of v131Powers){
      if(mode==='toggle')tile(powers,'✧ '+name,desc,null,'v131_'+id);
      else tile(powers,'✧ '+name,desc,()=>v131Action(id));
    }
    section('🔧 FUSION REACTOR 2.0 · WEAPON FORGE','Receiver keeps its 3D model, sound and animation. Pick INDEPENDENT donor guns for firing, damage, magazine and accuracy. Turn on Fusion Reactor and click Equip.');
    const guns=paradoxWeapons.map(id=>[id,id.toUpperCase()]);
    selector('RECEIVER · weapon you hold',guns,paradoxCfg.receiver,v=>{paradoxCfg.receiver=v;paradoxSave()});
    selector('FIRE DONOR · rate / automatic mode',guns,v131Cfg.fireDonor,v=>{v131Cfg.fireDonor=v;paradoxCfg.donor=v;paradoxSave();v131Save();paradoxRefreshDonor()});
    selector('DAMAGE DONOR · impact damage / penetration',guns,v131Cfg.damageDonor,v=>{v131Cfg.damageDonor=v;v131Save()});
    selector('MAG DONOR · ammo per magazine',guns,v131Cfg.magDonor,v=>{v131Cfg.magDonor=v;v131Save()});
    selector('ACCURACY DONOR · spread pattern',guns,v131Cfg.accuracyDonor,v=>{v131Cfg.accuracyDonor=v;v131Save()});
    selector('Damage source',[['donor','Donor'],['receiver','Receiver'],['blend','50/50 Blend']],v131Cfg.damageSource,v=>{v131Cfg.damageSource=v;v131Save()});
    selector('Fire-rate source',[['donor','Fire donor'],['receiver','Receiver'],['blend','50/50 Blend']],v131Cfg.rateSource,v=>{v131Cfg.rateSource=v;v131Save()});
    selector('Magazine source',[['donor','Magazine donor'],['receiver','Receiver'],['blend','50/50 Blend']],v131Cfg.magSource,v=>{v131Cfg.magSource=v;v131Save()});
    selector('Automatic trigger',[['donor','Fire donor'],['receiver','Receiver']],v131Cfg.autoSource,v=>{v131Cfg.autoSource=v;v131Save()});
    for(const [key,title,lo,hi,step] of [
      ['damageScale','Damage multiplier',.1,8,.1],['rateScale','Rate multiplier',.2,8,.1],
      ['magScale','Magazine multiplier',.25,8,.25],['spreadScale','Spread multiplier (0 = laser)',0,3,.05],
      ['penetrationScale','Penetration multiplier',0,6,.25]])
      slider(title,lo,hi,step,v131Cfg[key],v=>{v131Cfg[key]=v;v131Save()},'×');
    const eq=grid();tile(eq,'🔧 EQUIP ADVANCED FUSION','Equip your receiver and populate the computed magazine; applies live changes.',v131EquipFusion);
    tile(eq,'↺ RESET FUSION SETTINGS','Reset only the V13.1 fusion donors and multipliers, not old features.',()=>{v131Cfg={...v131Defaults};v131Save();renderTab()});
    section('⚡ FUSION BLUEPRINTS','One-click setups for combinations with different donors.');
    const pg=grid();for(const [name,recv,fire,damage,mag,accuracy] of [
      ['HYPER SNIPER · AWP/Negev','awp','negev','awp','negev','ssg08'],
      ['PHANTOM DEAGLE · Deagle/P90','deagle','p90','deagle','p90','aug'],
      ['LASER SCOUT · Scout/AK','ssg08','ak47','awp','m249','ssg08'],
      ['TURBO SHOTGUN · XM/MP9','xm1014','mp9','xm1014','negev','mp9']])
      tile(pg,'✧ '+name,'Apply donors, enable Advanced Fusion, and equip the receiver.',()=>v131ApplyPreset(recv,fire,damage,mag,accuracy));
    section('💾 SAVE YOUR OWN FUSION BLUEPRINTS','Four browser-local slots. Each records both the weapon setup and all advanced multipliers.');
    for(let slot=1;slot<=4;slot++){
      const row=grid();const key='slot'+slot;
      tile(row,'SAVE FUSION '+slot,'Overwrite this slot with the current receiver, donor and settings.',()=>{
        v131Profiles[key]={receiver:paradoxCfg.receiver,donor:paradoxCfg.donor,cfg:{...v131Cfg}};
        v131Save();v131Notice('Saved fusion blueprint '+slot);
      });
      tile(row,'LOAD FUSION '+slot,v131Profiles[key]?'Restore saved blueprint and equip it.':'Empty slot · save one first.',()=>{
        const preset=v131Profiles[key];if(!preset?.cfg)return v131Notice('Slot '+slot+' is empty');
        if(paradoxWeapons.includes(preset.receiver))paradoxCfg.receiver=preset.receiver;
        if(paradoxWeapons.includes(preset.donor))paradoxCfg.donor=preset.donor;
        v131Cfg={...v131Defaults,...preset.cfg};v131Sanitize();paradoxSave();v131Save();v131EquipFusion();renderTab();
      });
    }
    section('🌌 PARADOX FIELD TUNING','Customize the new 15 abilities independently of older power sliders.');
    slider('Field radius',4,30,1,v131Cfg.radius,v=>{v131Cfg.radius=v;v131Save()},' m');
    slider('Gravity & blast force',5,100,5,v131Cfg.power,v=>{v131Cfg.power=v;v131Save()},' u');
    slider('Stasis strength',1,8,.5,v131Cfg.stasis,v=>{v131Cfg.stasis=v;v131Save()},'×');
    slider('Health from each kill',1,100,1,v131Cfg.heal,v=>{v131Cfg.heal=v;v131Save()},' HP');
    const tools=grid();tile(tools,'⌨ HOTKEY SETTINGS','Configure new and old hotkeys in the existing Hotkeys tab.',()=>{bindingFilter='';showMenu('hotkeys')});
    tile(tools,'⛔ DISABLE ONLY V13.1','Switch off only the new powers; keep your original PARADOX and older settings.',()=>{v131Off();renderTab()});
    const note=document.createElement('p');note.className='dw-desc dw-section';note.textContent='Realism: shots and bullets are the game\'s local hitscan simulation. Echo Squad projects visible decoys but does not spawn server-side players. Fusion modifies bot-match weapon definitions only; it does not change your account inventory.';content.append(note);
  }
  // Register all 15 actions/toggles through standard tile registration.

  function paradoxRenderTab(){
    section('✦ PARADOX · 15 ABILITIES','One experimental bot-lobby lab. Instant-hit bullet effects are approximations; your old tabs stay exactly as before.');
    const pg=grid();
    for(const [id,title,mode,desc] of paradoxPowers){
      if(mode==='toggle')tile(pg,'✦ '+title,desc,()=>{if(id==='weapon_fusion'&&paradoxOn(id))paradoxEquipFusion();},paradoxToggle(id));
      else tile(pg,'✦ '+title,desc,()=>paradoxAction(id));
    }
    section('WEAPON FUSION WORKSHOP','The first gun keeps its actual model, audio and animations. The donor supplies ballistics, magazine and shot timing. Activate Fusion and click EQUIP.');
    const options=paradoxWeapons.map(id=>[id,id.toUpperCase()]);
    selector('Receiver · visible gun',options,paradoxCfg.receiver,v=>{paradoxCfg.receiver=v;paradoxSave();paradoxRefreshDonor()});
    selector('Donor · firing characteristics',options,paradoxCfg.donor,v=>{paradoxCfg.donor=v;paradoxSave();paradoxRefreshDonor()});
    const presets=grid();
    for(const [label,recv,don] of [['AWP × Negev · rapid sniper','awp','negev'],['Deagle × P90 · fast hand cannon','deagle','p90'],['Scout × AK-47 · assault scout','ssg08','ak47']]){
      tile(presets,'✦ '+label,'Apply a popular fusion combination and equip it.',()=>{paradoxCfg.receiver=recv;paradoxCfg.donor=don;paradoxSave();paradoxEquipFusion();renderTab()});
    }
    const fg=grid();tile(fg,'🔧 EQUIP FUSED WEAPON','Equip receiver, initialize donor magazine, and enable hybrid ballistics.',()=>paradoxAction('equip_fusion'));
    slider('Damage multiplier',.5,4,.25,paradoxCfg.damage,v=>{paradoxCfg.damage=v;paradoxSave()},'×');
    slider('Fire-rate multiplier',.5,5,.25,paradoxCfg.rate,v=>{paradoxCfg.rate=v;paradoxSave()},'×');
    slider('Donor magazine multiplier',.5,5,.5,paradoxCfg.clip,v=>{paradoxCfg.clip=v;paradoxSave()},'×');
    slider('Accuracy / spread scale',.1,2,.1,paradoxCfg.spread,v=>{paradoxCfg.spread=v;paradoxSave()},'×');
    slider('Penetration multiplier',.5,4,.25,paradoxCfg.penetration,v=>{paradoxCfg.penetration=v;paradoxSave()},'×');
    section('PORTAL BULLETS','Enable Portal Bullets above, then place two portals by looking at a nearby surface. The bullet must actually pass through the entrance.');
    const por=grid();tile(por,'🔵 SET PORTAL ENTRANCE','Aim at a surface and place the blue entrance.',()=>paradoxAction('portal_entrance'));
    tile(por,'🟠 SET PORTAL EXIT','Aim at another surface and place the orange exit.',()=>paradoxAction('portal_exit'));
    slider('Portal hit radius',1,6,.5,paradoxCfg.portalRadius,v=>{paradoxCfg.portalRadius=v;paradoxSave()},' m');
    section('COMBAT & BOSS TUNING','Adjust these before activating the corresponding powers.');
    slider('Bullet Steering cone',1,35,1,paradoxCfg.steer,v=>{paradoxCfg.steer=v;paradoxSave()},'°');
    slider('Gravity Punch force',12,100,4,paradoxCfg.punch,v=>{paradoxCfg.punch=v;paradoxSave()},' u');
    slider('Boss maximum HP',150,2000,50,paradoxCfg.bossHP,v=>{paradoxCfg.bossHP=v;paradoxSave()},' HP');
    const bp=grid();tile(bp,'🧠 POSSESS NEAREST BOT','Follow and steer the nearest bot until you disable Bot Possession.',()=>paradoxAction('possess_nearest'));
    section('ULTIMATE ABILITY BUILDER','Pick three actions, then activate the Ultimate Ability Builder card above to fire your combo.');
    const choices=['gravity_punch','dimension_dash','time_bubble','boss_creator','echo_clone'].map(id=>[id,paradoxPowers.find(p=>p[0]===id)[1]]);
    for(const key of ['a1','a2','a3'])selector('Ability '+key.slice(1),choices,paradoxCfg[key],v=>{paradoxCfg[key]=v;paradoxSave()});
    const r=grid();tile(r,'⌨ Paradox Hotkeys','Bind toggles and actions in your original Hotkeys tab.',()=>{bindingFilter='Paradox';showMenu('hotkeys')});
    tile(r,'⛔ DISABLE PARADOX','Turn off all persistent Paradox effects and stop possession.',()=>{paradoxOff();renderTab()});
    const note=document.createElement('p');note.className='dw-desc dw-section';note.textContent='Physics simulation note: portals and guided hitscan shots are approximations; Echo Clone and Replay Ghost are holographic trails rather than independent network players. Destruction Illusion changes visuals, not map collision.';content.append(note);
  }
  function paradoxOff(){
    for(const [id,,mode] of paradoxPowers)if(mode==='toggle')flags[paradoxToggle(id)]=false;
    paradoxBubble=null;paradoxEcho=null;paradoxMarks=[];
    if(paradoxPossessed&&paradoxPossessOrigin){const p=g.player;Object.assign(p,paradoxPossessOrigin)}
    paradoxPossessed=null;paradoxPossessOrigin=null;
    for(const [b,old] of paradoxBosses)if(b.alive){b.health=old.health;b.armor=old.armor;b.weapon=old.weapon;}
    paradoxBosses.clear();
  }
  paradoxRefreshDonor();


  // V14 TACTICAL DARK: original layout and elements remain; only presentation is upgraded.
  style.textContent += `
    #death-won-panel{--dw-accent:#bd8eff;--v14-bg:#080a10;--v14-line:#2c3041;width:min(1180px,97vw)!important;
      height:min(790px,95vh)!important;border:1px solid #51546b!important;border-radius:13px!important;
      background:#080a10!important;box-shadow:0 35px 110px #000f,0 0 0 1px #6b5b9455,0 0 90px #8c5bff12!important}
    #death-won-panel .dw-top{height:72px!important;background:linear-gradient(105deg,#151524,#080b13 70%,#151025)!important;
      border-bottom:1px solid #3c3650!important;padding:13px 23px!important}
    #death-won-panel .dw-mark{background:linear-gradient(135deg,#a061ff,#5122ac)!important;
      box-shadow:0 0 0 1px #bd9afa77,0 0 24px #9a64ff33!important}
    #death-won-panel .dw-title{font-size:21px!important;letter-spacing:3.2px!important}
    #death-won-panel .dw-title b{color:#cba6ff!important}
    #death-won-panel .dw-version{background:#161324!important;color:#d4b7ff!important;
      border:1px solid #665186!important;border-radius:6px!important;letter-spacing:.7px}
    #death-won-panel .dw-online{background:#10231d!important;color:#7cf8c0!important;border:1px solid #296344!important;
      border-radius:6px!important;box-shadow:inset 3px 0 #2eea98}
    #death-won-panel .dw-nav{background:#080a12!important;width:249px!important;flex-basis:249px!important;
      border-right:1px solid #252b3d!important}
    #death-won-panel .dw-nav-group{border-color:#1b2030!important}
    #death-won-panel .dw-tab{border-radius:6px!important;font-weight:650!important}
    #death-won-panel .dw-tab.active{background:#231a38!important;border-color:#674e9c!important;
      box-shadow:inset 3px 0 #b47dff!important;color:#f5eaff!important}
    #death-won-panel .dw-navsearch-wrap{border-radius:6px!important;background:#10131f!important}
    #death-won-panel .dw-content{background:linear-gradient(150deg,#0a0e18,#090a12)!important;padding:24px 25px 38px!important}
    #death-won-panel .dw-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}
    #death-won-panel .dw-toggle,#death-won-panel .dw-action{position:relative;min-height:77px!important;
      border-radius:7px!important;padding:14px 94px 17px 15px!important;background:#111624!important;
      border:1px solid #293146!important;transition:border-color .13s,background .13s!important}
    #death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{border-color:#8666bd!important;background:#191b2f!important}
    #death-won-panel .dw-toggle.on{background:#1c1732!important;border-color:#8061b3!important;
      box-shadow:inset 3px 0 #c18dff!important}
    #death-won-panel .dw-name{font:750 12px/1.4 system-ui!important;color:#f2f1fc!important;margin-bottom:4px!important}
    #death-won-panel .dw-hint{font:450 10px/1.35 system-ui!important;color:#9ca8c1!important}
    #death-won-panel .dw-indicator{position:absolute!important;top:12px!important;right:12px!important;
      font-size:10px!important;color:#8f9aae!important;background:#191f30!important;border:1px solid #364057!important;
      padding:5px 7px!important;border-radius:4px!important}
    #death-won-panel .dw-toggle.on .dw-indicator{background:#41305e!important;border-color:#8963b7!important;color:#ecd8ff!important}
    #death-won-panel .dw-shortcut{position:absolute!important;right:12px!important;bottom:11px!important;
      font-size:9px!important;color:#8fa0b8!important;background:#111624!important;border:1px solid #354058!important;
      border-radius:4px!important;padding:3px 5px!important}
    #death-won-panel .dw-heading{font-weight:850!important;letter-spacing:-.5px!important}
    #death-won-panel .dw-range{border-radius:6px!important;background:#111627!important}
    #death-won-panel .dw-bottom{background:#080a10!important}
    #death-won-panel .dw-v14-status{margin:0 0 17px;padding:11px 13px;letter-spacing:1.3px;
      color:#c1a7fa;background:#1b1730;border:1px solid #493868;border-radius:6px;
      font:bold 10px/1.6 ui-monospace,SFMono-Regular,monospace}
    #death-won-panel .dw-v14-grid{margin:6px 0 17px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}
    #death-won-panel .dw-v14-grid .dw-toggle .dw-name:before{content:'▰ ';color:#a077ec}
    #death-won-panel .dw-v14-grid .dw-action .dw-name:before{content:'⚡ ';color:#f6ca8d}
    #death-won-panel .dw-home-hero{border-radius:8px!important;background:linear-gradient(125deg,#1a162d,#111526)!important}
    @media(max-width:750px){#death-won-panel .dw-nav{width:155px!important;flex-basis:155px!important}
      #death-won-panel .dw-grid{grid-template-columns:1fr!important}
      #death-won-panel .dw-content{padding:14px 11px!important}
      #death-won-panel .dw-topright .dw-online{display:none!important}}
    @media(max-height:540px){#death-won-panel{height:95vh!important}}
    @media(prefers-reduced-motion:reduce){#death-won-panel *{animation:none!important;transition:none!important}}
  `;

  // V14.3 final layout rules: old sidebar is removed entirely, no old style can bring it back.
  style.textContent += `
  #death-won-panel{width:min(1200px,98vw)!important;height:min(770px,95vh)!important;overflow:hidden!important;border-radius:7px!important}
  #death-won-panel .dw-top{height:58px!important;min-height:58px!important;padding:8px 17px!important;gap:12px!important}
  #death-won-panel .dw-mark{width:28px!important;height:28px!important;border-radius:5px!important;font-size:15px!important}
  #death-won-panel .dw-title{font-size:17px!important;letter-spacing:1.5px!important}
  #death-won-panel .dw-superbar{height:38px!important;display:flex!important;padding:0 14px!important;background:#0c0e16!important;border-bottom:1px solid #272237!important}
  #death-won-panel .dw-topcats{gap:6px!important;display:flex!important;align-items:center!important}
  #death-won-panel .dw-topcat{height:27px!important;padding:0 13px!important;line-height:25px!important}
  #death-won-panel .dw-topcat.active{border-color:#765184!important;box-shadow:inset 0 -2px #db478e!important}
  #death-won-panel .dw-subbar{height:48px!important;width:100%!important;display:flex!important;align-items:center!important;gap:8px!important;padding:0 12px!important;background:#0a0d15!important;border-bottom:1px solid #292739!important;position:relative!important;z-index:4!important;overflow:visible!important}
  #death-won-panel .dw-subnav{display:flex!important;flex:1!important;min-width:0!important;max-width:100%!important;width:auto!important;height:45px!important;align-items:center!important;gap:5px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin!important;scrollbar-color:#48405e transparent!important;padding:0 2px!important;background:transparent!important;border:0!important;white-space:nowrap!important}
  #death-won-panel .dw-subnav::-webkit-scrollbar{height:3px!important}
  #death-won-panel .dw-subnav::-webkit-scrollbar-thumb{background:#443854!important}
  #death-won-panel .dw-subtab{flex:0 0 auto!important;display:flex;align-items:center!important;min-height:29px!important;height:30px!important;width:auto!important;margin:0!important;padding:5px 11px!important;white-space:nowrap!important;gap:7px!important;border:1px solid #24293b!important;border-radius:4px!important;background:#111522!important;color:#9fa6bb!important;font-size:11px!important;letter-spacing:0!important}
  #death-won-panel .dw-subtab:hover{background:#1c1a2e!important;border-color:#514366!important}
  #death-won-panel .dw-subtab.active{background:#2d1d3f!important;border:1px solid #71538a!important;box-shadow:inset 0 -2px #d94e95!important;color:white!important}
  #death-won-panel .dw-subtab .dw-tabicon{font-size:12px!important;width:auto!important}
  #death-won-panel .dw-subtab[hidden]{display:none!important}
  #death-won-panel .dw-sub-arrow{flex:none;width:23px;height:28px;border:1px solid #343044;border-radius:4px;background:#141524;color:#c2abc9;cursor:pointer;font:bold 18px system-ui;line-height:19px;padding:0}
  #death-won-panel .dw-sub-arrow:hover{background:#30213d;color:white}
  #death-won-panel .dw-navsearch-wrap{position:relative!important;top:auto!important;flex:0 0 174px!important;width:174px!important;min-width:0!important;min-height:30px!important;height:30px!important;margin:0!important;padding:0 8px!important;border-radius:4px!important;box-shadow:none!important;display:flex!important;align-items:center!important;gap:5px!important;border:1px solid #343143!important;background:#11131f!important;z-index:5!important}
  #death-won-panel #dw-nav-search{height:25px!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important;padding:1px 0!important;outline:none!important;border:0!important;background:transparent!important;box-shadow:none!important;font-size:11px!important;color:#e0dcef!important}
  #death-won-panel .dw-global-results{position:absolute!important;right:12px!important;top:45px!important;z-index:30!important;max-height:min(390px,60vh)!important;width:min(340px,calc(100% - 24px))!important;box-shadow:0 18px 35px #000b!important;margin:0!important;background:#12131f!important;overflow:auto!important}
  #death-won-panel .dw-global-results[hidden]{display:none!important}
  #death-won-panel .dw-main{display:block!important;flex:none!important;width:100%!important;height:calc(100% - 182px)!important;overflow:hidden!important;background:#090b13!important}
  #death-won-panel .dw-content{display:block!important;min-width:0!important;width:100%!important;max-width:none!important;height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;padding:18px 20px 28px!important;background:linear-gradient(155deg,#0b0e17,#090b12)!important}
  #death-won-panel .dw-bottom{height:38px!important;padding:0 16px!important;background:#0b0c13!important}
  #death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}
  #death-won-panel .dw-toggle,#death-won-panel .dw-action{min-width:0!important}
  @media(max-width:1000px){#death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}#death-won-panel .dw-supermeta{display:none!important}}
  @media(max-width:700px){#death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#death-won-panel .dw-navsearch-wrap{flex-basis:125px!important;width:125px!important}#death-won-panel .dw-topcat{padding:0 7px!important;font-size:9px!important}#death-won-panel .dw-content{padding:12px!important}}
  @media(max-width:510px){#death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{grid-template-columns:1fr!important}#death-won-panel .dw-online,#death-won-panel .dw-supermeta{display:none!important}}
  `;

  // ================= VOIDWARE V14: ABSOLUTE CHAOS =================
  // 200 additional opt-in powers in 10 entirely separate pages.
  // Existing V13.1 pages and game wrappers are preserved below this layer.
  const v14Groups = {
    aim:['🎯','AIM ENGINE'], arsenal:['🔫','ARSENAL'], movement:['🚀','MOVEMENT'],
    survival:['🛡','SURVIVAL'], bots:['🤖','BOT DIRECTOR'], physics:['🪐','PHYSICS'],
    combat:['💥','COMBAT EVENTS'], visuals:['👁','VISUAL ENGINE'],
    arena:['🏟','ARENA CONTROL'], chaos:['☠','CHAOS COMBOS']
  };
  const v14Names = {
    aim:`Precision Headlock|Chest Center Lock|Smooth Aim Assist|Fast Aim Assist|360 Target Scanner|Visible-Only Hunter|Low-HP Finisher|Nearest Hunter|Farthest Hunter|Speedster Hunter|Target Predictor|Sticky Crosshair|Scoped Aim Assist|Hold Mouse2 Assist|Hold Shift Assist|Triggerfire Assist|Instant Head Snap|Instant Chest Snap|Lead Snap|Closest Threat Snap`,
    arsenal:`Double Impact|Triple Impact|Heavy Bullet|Hyper Damage|Rapid Trigger|Turbo Trigger|Hyper Trigger|Low Spread|Perfect Accuracy|Extended Magazine|Bottomless Magazine|Armor Piercer|Deep Penetration|Long Range|Extreme Range|Full Auto Retrofit|Silent Recoil|Refill Current Magazine|Force Reload|Equip Fusion Reactor`,
    movement:`Turbo Walk|Hypersonic Sprint|Air Glide|Air Boost|Moon Gravity|Feather Fall|Burst Jump|Mega Jump|Side Dash Auto|Backward Dash Auto|Strafe Accelerator|Velocity Keeper|Brake Assist|Ground Magnet|Hover Assist|Instant Forward Dash|Instant Backstep|Instant Superjump|Safe Blink Forward|Safe Recall Blink`,
    survival:`Health Regen|Fast Health Regen|Critical Regen|Armor Regen Plus|Armor Regen Max|Health Shield|Critical Shield|Medic Field|Damage Recovery|Adrenaline Surge|Auto Armor Fill|Combat Healer|Low HP Boost|Last Stand|Safe Landing|Full Health Now|Full Armor Now|Health & Armor Reset|Battle Medkit|Shield Burst`,
    bots:`Bot Chill|Bot Snare|Bot Stasis|Bot Speed Drain|Bot Aim Confusion|Bot Turntable|Bot Spin Fever|Bot Peace Zone|Bot Pacifier|Bot Disarm Pulse|Bot Low Gravity|Bot Hopping|Bot Flinch|Bot Retreat|Bot March|Freeze All Bots|Scatter All Bots|Disarm All Bots|Group Bots Nearby|Restore Bot Motion`,
    physics:`Gravity Pull|Deep Pull|Magnetic Drag|Gravity Repulse|Force Blast|Wind Gust|Vertical Lift|Anti-Gravity Field|Orbit Small|Orbit Large|Whirlpool|Sidewind|Stomp Field|Anti-Momentum|Swirl Reverse|Gravity Burst|Super Nova Push|Bot Sky Launch|Shockwave Lift|Vacuum Collapse`,
    combat:`Shot Healing|Shot Armor Charge|Shot Speed Burst|Shot Air Kick|Shot Shockwave|Shot Slow Field|Shot Target Shove|Shot Target Pull|Shot Reload Bonus|Shot Energy Charge|Kill Health Burst|Kill Armor Burst|Kill Speed Burst|Kill Shockwave|Kill Vortex|Kill Reload|Kill Ammo Resupply|Kill Health Link|Kill Superjump|Kill Fear Wave`,
    visuals:`Minimal Crosshair|Dot Crosshair|Circle Crosshair|Dynamic Crosshair|Long Crosshair|Rotating Crosshair|Crosshair Halo|Aimbot FOV Ring|Enemy Target Line|Nearest Target Marker|Bot Count HUD|Speed HUD|Health HUD|Armor HUD|Ammo HUD|Power Count HUD|Pulse Screen Corners|Horizon Marker|Mini Threat Arrows|Neon Scanline`,
    arena:`Slowdown Clock|Bot Spawn Guard|Bot Pacifist Mode|Arena Damping|High Speed Arena|Low Gravity Bots|Arena Dance|Arena Confetti|Arena Threat Radar|Arena Health Zone|Arena Ammo Zone|Arena Random Spins|Arena Chill Aura|Arena Air Force|Arena Push Field|Save Safe Checkpoint|Restore Checkpoint|Clear Bot Protection|Randomize Bot Yaw|Rearm Bot Army`,
    chaos:`Chaos Healer|Chaos Dash|Chaos Magnet|Chaos Repulsor|Chaos Singularity|Chaos Sniper|Chaos Gunner|Chaos Acrobat|Chaos Lifeline|Chaos Revival|Chaos Teleport|Chaos Meteor|Chaos Cyclone|Chaos Shockwave|Chaos Overflow|Chaos Hyperjump|Chaos Spin Storm|Chaos Siphon|Chaos Freeze|Chaos Finale`
  };
  const v14Catalog=[];
  for(const [group,str] of Object.entries(v14Names)){
    str.split('|').forEach((name,index)=>{
      const action = group==='chaos'||(group==='aim'&&index>=16)||(group==='arsenal'&&index>=17)||
        (['movement','survival','bots','physics','arena'].includes(group)&&index>=15);
      const id='v14_'+group+'_'+String(index+1).padStart(2,'0');
      const p={id,group,index,name,mode:action?'action':'toggle',flag:id,tab:'v14:'+group};
      v14Catalog.push(p);if(!action)flags[id]=false;
    });
  }
  const v14ById=new Map(v14Catalog.map(p=>[p.id,p]));
  const v14Store='deathWonV14Settings';
  const v14Default={aimFov:75,aimSmooth:.32,aimRange:165,aimHead:true,aimVisible:true,
    aimActivation:'always',weaponForce:1.7,powerStrength:1,botRadius:18,visualScale:1};
  let v14Cfg={...v14Default};
  try{let stored=JSON.parse(localStorage.getItem(v14Store)||'{}');
    if(stored&&typeof stored==='object'&&!Array.isArray(stored))v14Cfg={...v14Cfg,...stored};}catch{}
  function v14CleanConfig(){
    for(const [k,lo,hi] of [['aimFov',3,360],['aimSmooth',.02,1],['aimRange',5,400],
      ['weaponForce',.25,6],['powerStrength',.2,5],['botRadius',4,55],['visualScale',.5,2.5]]){
      const n=Number(v14Cfg[k]);v14Cfg[k]=Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):v14Default[k];
    }
    if(!['always','mouse1','mouse2','shift'].includes(v14Cfg.aimActivation))v14Cfg.aimActivation='always';
    v14Cfg.aimHead=!!v14Cfg.aimHead;v14Cfg.aimVisible=!!v14Cfg.aimVisible;
  }
  v14CleanConfig();
  function v14Save(){try{v14CleanConfig();localStorage.setItem(v14Store,JSON.stringify(v14Cfg));}catch{}}
  const v14Enabled=(group,index)=>!!flags['v14_'+group+'_'+String(index+1).padStart(2,'0')];
  let v14LastPulse=0,v14LastBotTick=0,v14LastUI=0,v14AimTarget=null,v14MarkUntil=0;
  let v14Checkpoint=null,v14Energy=0,v14LastShot=0,v14KillAt=0;
  const v14Clamp=(x,l,h)=>Math.max(l,Math.min(h,Number.isFinite(x)?x:l));
  const v14Norm=(x,z)=>{const d=Math.hypot(x,z)||1;return{x:x/d,z:z/d,d}};
  const v14E=()=>enemyBots().filter(b=>b&&b.alive&&!(b.spawnProt>0));
  const v14Msg=s=>notice('V14 · '+s);
  function v14Teleport(x,y,z){
    const p=g.player,spot=safeMoveSpot(x,y,z,p);
    if(!spot)return false;
    blinkUndo={x:p.x,y:p.y,z:p.z};Object.assign(p,spot);p.vx=p.vy=p.vz=0;p.onGround=true;
    return true;
  }
  function v14Heal(h=0,a=0){const p=g.player;if(!p?.alive)return;
    if(h)p.health=v14Clamp((p.health||0)+h,0,Math.max(100,p.maxHealth||100));
    if(a)p.armor=v14Clamp((p.armor||0)+a,0,100);
    const now=performance.now();if(now-v14LastUI>110){v14LastUI=now;g.hud?.updateHealth?.();}}
  function v14Force(x,z,magnitude,up=0,mode='push',radius=v14Cfg.botRadius){
    let count=0;
    for(const b of v14E()){
      const d=v14Norm(b.x-x,b.z-z);if(d.d>radius)continue;
      const scale=magnitude*(1-.5*d.d/radius);
      b.vx=(b.vx||0)+(mode==='pull'?-d.x:d.x)*scale;
      b.vz=(b.vz||0)+(mode==='pull'?-d.z:d.z)*scale;
      if(up){b.vy=(b.vy||0)+up;b.onGround=false;}
      count++;
    }return count;
  }
  function v14Nearest(variant=0){
    const p=g.player,available=v14E(),view=aimVector(),eye=p.y+(p.eyeH||1.6);
    let picked=null,best=Infinity;
    for(const b of available){
      const y=(b._visY??b.y)+(v14Cfg.aimHead?Math.min(b.height||1.8,1.62):1.1);
      const dx=b.x-p.x,dy=y-eye,dz=b.z-p.z,dist=Math.hypot(dx,dy,dz)||1;
      if(dist>v14Cfg.aimRange)continue;
      const angle=Math.acos(v14Clamp((dx*view.x+dy*view.y+dz*view.z)/dist,-1,1))*180/Math.PI;
      if(angle>v14Cfg.aimFov*.5 && ![4,16,17,18,19].includes(variant))continue;
      if((v14Cfg.aimVisible||variant===5)&&!([4].includes(variant))&&behindWall(b))continue;
      const hp=Number(b.health)||100;
      const motion=Math.hypot(b.vx||0,b.vz||0);
      let score=angle+.02*dist;
      if(variant===6)score=hp+.02*angle;
      if(variant===7||variant===19)score=dist;
      if(variant===8)score=-dist;
      if(variant===9)score=-motion*6+angle;
      if(variant===11&&v14AimTarget===b)score-=40;
      if(variant===12&&g.weapons.scopeLevel<=0)continue;
      if(score<best){best=score;picked=b;}
    }return picked;
  }
  function v14ApplyAim(variant,dt,instant=false){
    if((panel.style.display!=='none'&&!instant)||!g.player?.alive)return false;
    const keys=g.input?.keys;
    const act=v14Cfg.aimActivation;
    if(!instant && ((act==='mouse1'&&!g.input?.mouse1)||(act==='mouse2'&&!g.input?.mouse2)||
      (act==='shift'&&!keys?.has?.('ShiftLeft')&&!keys?.has?.('ShiftRight'))))return false;
    if(variant===13&&!g.input?.mouse2&&!instant)return false;
    if(variant===14&&!keys?.has?.('ShiftLeft')&&!keys?.has?.('ShiftRight')&&!instant)return false;
    const b=v14Nearest(variant);if(!b)return false;
    const p=g.player,eye=p.y+(p.eyeH||1.6),head=variant===1||variant===17?1.12:Math.min((b.height||1.8)-.1,1.62);
    const lead=(variant===10||variant===18)?Math.min(.22,Math.hypot(b.x-p.x,b.z-p.z)/500):0;
    const tx=b.x+(b.vx||0)*lead,ty=(b._visY??b.y)+(v14Cfg.aimHead?head:1.15),tz=b.z+(b.vz||0)*lead;
    const yaw=Math.atan2(-(tx-p.x),-(tz-p.z));const pitch=Math.atan2(ty-eye,Math.hypot(tx-p.x,tz-p.z));
    let strength=instant?1:1-Math.exp(-Math.max(1,dt*60)*v14Cfg.aimSmooth*.8);
    if(variant===2)strength*=.36;if(variant===3||variant===4)strength=Math.min(1,strength*3);
    if(variant===11&&v14AimTarget!==b)strength*=.65;
    p.yaw=(p.yaw||0)+angleDiff(yaw,p.yaw||0)*strength;
    p.pitch=v14Clamp((p.pitch||0)+(pitch-(p.pitch||0))*strength,-1.55,1.55);
    v14AimTarget=b;v14MarkUntil=performance.now()+200;
    if(variant===15&&angularError(b)<3)fireNow(b,true);
    return true;
  }
  const v14WeaponMods=[
    {dmg:2},{dmg:3},{dmg:1.5},{dmg:4},{rate:1.4},{rate:2},{rate:3.5},
    {spread:.4},{spread:0},{mag:2},{mag:8},{penetration:2},{penetration:4},
    {range:2},{range:5},{auto:true},{spread:.1,recoil:0}
  ];
  // Modifies only the returned definition (never mutates original game assets).
  const v14BaseWeaponDef=g.weapons.def;
  if(typeof v14BaseWeaponDef==='function')g.weapons.def=function(...args){
    const orig=v14BaseWeaponDef.apply(this,args);
    if(!active||!orig||!v14Catalog.some(p=>p.group==='arsenal'&&p.mode==='toggle'&&flags[p.flag]))return orig;
    const def={...orig};let dmg=1,rate=1,mag=1,spread=1,penetration=1,range=1;
    for(let i=0;i<17;i++)if(v14Enabled('arsenal',i)){
      const m=v14WeaponMods[i];if(m.dmg)dmg*=m.dmg;
      if(m.rate)rate*=m.rate;if(m.mag)mag*=m.mag;
      if(m.spread!==undefined)spread*=m.spread;
      if(m.penetration)penetration*=m.penetration;
      if(m.range)range*=m.range;
      if(m.auto)def.auto=true;
    }
    const n=v14Cfg.weaponForce;
    if(dmg!==1)def.dmg=v14Clamp((Number(def.dmg)||20)*dmg*Math.min(n,3),1,1500);
    if(mag!==1)def.mag=Math.round(v14Clamp((Number(def.mag)||30)*mag,1,500));
    const cycle=Number(def.cycleTime)>0?def.cycleTime:(Number(def.rpm)>0?60/def.rpm:.12);
    if(rate!==1){def.cycleTime=v14Clamp(cycle/(rate*Math.min(n,3)),.022,5);def.rpm=Math.round(60/def.cycleTime);}
    for(const f of ['sBase','sMove','sJump','sFire','inacc'])
      if(Number.isFinite(Number(def[f])))def[f]=Math.max(0,def[f]*spread);
    if(penetration!==1)def.penetration=v14Clamp((Number(def.penetration)||1)*penetration,0,50);
    if(Number.isFinite(def.maxRange))def.maxRange=v14Clamp(def.maxRange*range,10,5000);
    if(def.cs2&&Array.isArray(def.cs2.spread))def.cs2={...def.cs2,spread:def.cs2.spread.map(x=>typeof x==='number'?Math.max(0,x*spread):x)};
    return def;
  };
  function v14Movement(dt){
    const p=g.player,s=v14Cfg.powerStrength;
    if(v14Enabled('movement',0)) {p.vx*=1+dt*.26*s;p.vz*=1+dt*.26*s;}
    if(v14Enabled('movement',1)){p.vx*=1+dt*.55*s;p.vz*=1+dt*.55*s;}
    if(v14Enabled('movement',2)&&!p.onGround){p.vx*=1+dt*.4*s;p.vz*=1+dt*.4*s;}
    if(v14Enabled('movement',3)&&!p.onGround){p.vx*=1+dt*.85*s;p.vz*=1+dt*.85*s;}
    if(v14Enabled('movement',4)&&!p.onGround)p.vy=(p.vy||0)+14*dt*s;
    if(v14Enabled('movement',5)&&p.vy<0)p.vy*=1-dt*2*s;
    if(v14Enabled('movement',6)&&p.onGround&&g.input?.keys?.has?.('Space'))p.vy=8*s;
    if(v14Enabled('movement',7)&&p.onGround&&g.input?.keys?.has?.('Space'))p.vy=13*s;
    const v=aimVector();
    if(v14Enabled('movement',8)&&g.input?.keys?.has?.('KeyD')){p.vx+=v.z*14*dt*s;p.vz-=v.x*14*dt*s;}
    if(v14Enabled('movement',9)&&g.input?.keys?.has?.('KeyS')){p.vx-=v.x*16*dt*s;p.vz-=v.z*16*dt*s;}
    if(v14Enabled('movement',10)&&!p.onGround){p.vx*=1+dt*.14*s;p.vz*=1+dt*.14*s;}
    if(v14Enabled('movement',11)&&!p.onGround&&Math.abs(p.vx)+Math.abs(p.vz)<5){p.vx+=v.x*7*dt*s;p.vz+=v.z*7*dt*s;}
    if(v14Enabled('movement',12)&&g.input?.keys?.has?.('ControlLeft')){p.vx*=Math.max(0,1-dt*9);p.vz*=Math.max(0,1-dt*9);}
    if(v14Enabled('movement',13)&&!p.onGround&&p.vy<0)p.vy=Math.max(p.vy,-3*s);
    if(v14Enabled('movement',14)&&!p.onGround){p.vy=v14Clamp(p.vy,-2*s,3*s);}
    const horiz=Math.hypot(p.vx||0,p.vz||0);if(horiz>145){p.vx*=145/horiz;p.vz*=145/horiz;}
    p.vy=v14Clamp(p.vy||0,-120,120);
  }
  function v14Survival(dt){
    const p=g.player,s=v14Cfg.powerStrength,near=v14E().some(b=>Math.hypot(b.x-p.x,b.z-p.z)<v14Cfg.botRadius);
    if(v14Enabled('survival',0))v14Heal(dt*4*s,0);
    if(v14Enabled('survival',1))v14Heal(dt*9*s,0);
    if(v14Enabled('survival',2)&&p.health<40)v14Heal(dt*18*s,0);
    if(v14Enabled('survival',3))v14Heal(0,dt*6*s);
    if(v14Enabled('survival',4))v14Heal(0,dt*12*s);
    if(v14Enabled('survival',5)&&p.health<25)v14Heal(dt*14*s,dt*5*s);
    if(v14Enabled('survival',6)&&p.health<50)v14Heal(dt*12*s,dt*12*s);
    if(v14Enabled('survival',7)&&near)v14Heal(dt*3*s,0);
    if(v14Enabled('survival',8)&&near)v14Heal(dt*5*s,dt*2*s);
    if(v14Enabled('survival',9)&&near)v14Heal(dt*7*s,0);
    if(v14Enabled('survival',10)&&p.armor<40)v14Heal(0,dt*22*s);
    if(v14Enabled('survival',11)&&v14E().length>3)v14Heal(dt*10*s,dt*4*s);
    if(v14Enabled('survival',12)&&p.health<30){p.vx*=1+dt*.3;p.vz*=1+dt*.3;}
    if(v14Enabled('survival',13)&&p.health<15)v14Heal(dt*34*s,dt*12*s);
    if(v14Enabled('survival',14)&&p.vy< -15)p.vy=-15;
  }
  function v14BotEffects(dt,now){
    const p=g.player,s=v14Cfg.powerStrength,r=v14Cfg.botRadius;
    for(const b of v14E()){
      const dd=Math.hypot(b.x-p.x,b.z-p.z);if(dd>r)continue;
      if(v14Enabled('bots',0)){b.vx*=.96;b.vz*=.96;}
      if(v14Enabled('bots',1)){b.vx*=.82;b.vz*=.82;}
      if(v14Enabled('bots',2)){b.vx*=.58;b.vz*=.58;}
      if(v14Enabled('bots',3)){b.vx*=.75;b.vz*=.75;}
      if(v14Enabled('bots',4))b.yaw=(b.yaw||0)+dt*2.3*s;
      if(v14Enabled('bots',5))b.yaw=(b.yaw||0)+dt*4*s;
      if(v14Enabled('bots',6))b.yaw=(b.yaw||0)+dt*8*s;
      if(v14Enabled('bots',7))b.nextFire=Math.max(b.nextFire||0,(g.time||0)+.15);
      if(v14Enabled('bots',8))b.nextFire=Math.max(b.nextFire||0,(g.time||0)+.6);
      if(v14Enabled('bots',9))b.nextFire=Math.max(b.nextFire||0,(g.time||0)+1.4);
      if(v14Enabled('bots',10))b.vy=(b.vy||0)+2.2*dt*s;
      if(v14Enabled('bots',11)&&b.onGround&&Math.sin(now*.002+b.x)>0.96){b.vy=4*s;b.onGround=false;}
      if(v14Enabled('bots',12))b.nextFire=Math.max(b.nextFire||0,(g.time||0)+.1);
      if(v14Enabled('bots',13)){b.vx+=(b.x-p.x)/(dd||1)*dt*14*s;b.vz+=(b.z-p.z)/(dd||1)*dt*14*s;}
      if(v14Enabled('bots',14)){b.vx-=(b.x-p.x)/(dd||1)*dt*7*s;b.vz-=(b.z-p.z)/(dd||1)*dt*7*s;}
    }
  }
  function v14Physics(dt){
    const p=g.player,s=v14Cfg.powerStrength,r=v14Cfg.botRadius;
    for(const b of v14E()){
      const nx=b.x-p.x,nz=b.z-p.z,dd=Math.hypot(nx,nz)||1;if(dd>r)continue;
      const x=nx/dd,z=nz/dd,fac=(1-dd/(2*r))*dt*s;
      if(v14Enabled('physics',0)) {b.vx-=x*12*fac;b.vz-=z*12*fac;}
      if(v14Enabled('physics',1)) {b.vx-=x*27*fac;b.vz-=z*27*fac;}
      if(v14Enabled('physics',2)) {b.vx-=x*44*fac;b.vz-=z*44*fac;}
      if(v14Enabled('physics',3)) {b.vx+=x*14*fac;b.vz+=z*14*fac;}
      if(v14Enabled('physics',4)) {b.vx+=x*31*fac;b.vz+=z*31*fac;}
      if(v14Enabled('physics',5)) {b.vx+=18*fac;b.vz+=5*fac;}
      if(v14Enabled('physics',6)) {b.vy=(b.vy||0)+12*fac;b.onGround=false;}
      if(v14Enabled('physics',7)) {b.vy=(b.vy||0)+35*fac;b.onGround=false;}
      if(v14Enabled('physics',8)) {b.vx+=-z*25*fac;b.vz+=x*25*fac;}
      if(v14Enabled('physics',9)) {b.vx+=-z*45*fac;b.vz+=x*45*fac;}
      if(v14Enabled('physics',10)){b.vx+=(-x-z)*21*fac;b.vz+=(-z+x)*21*fac;}
      if(v14Enabled('physics',11)){b.vx+=z*22*fac;b.vz-=x*22*fac;}
      if(v14Enabled('physics',12)){b.vy=(b.vy||0)-22*fac;}
      if(v14Enabled('physics',13)){b.vx*=.9;b.vz*=.9;}
      if(v14Enabled('physics',14)){b.vx+=z*35*fac;b.vz-=x*35*fac;}
      const h=Math.hypot(b.vx||0,b.vz||0);if(h>85){b.vx*=85/h;b.vz*=85/h;}
      b.vy=v14Clamp(b.vy||0,-70,65);
    }
  }
  function v14Arena(dt,now){
    const p=g.player,r=v14Cfg.botRadius,s=v14Cfg.powerStrength;
    const near=v14E().filter(b=>Math.hypot(b.x-p.x,b.z-p.z)<=r);
    if(near.length&&v14Enabled('arena',9))v14Heal(dt*1.5*s,0);
    if(near.length&&v14Enabled('arena',10)){const st=g.weapons.state?.();if(st&&Number.isFinite(st.reserve))st.reserve=Math.min(999,st.reserve+.5*dt*s);}
    for(const b of near){
      const d=Math.hypot(b.x-p.x,b.z-p.z);if(d>r)continue;
      if(v14Enabled('arena',0)){b.vx*=.9;b.vz*=.9;}
      if(v14Enabled('arena',1))b.spawnProt=0;
      if(v14Enabled('arena',2))b.nextFire=Math.max(b.nextFire||0,(g.time||0)+.8);
      if(v14Enabled('arena',3)){b.vx*=.78;b.vz*=.78;}
      if(v14Enabled('arena',4)){b.vx*=1+dt*.5;b.vz*=1+dt*.5;}
      if(v14Enabled('arena',5))b.vy=(b.vy||0)+dt*4*s;
      if(v14Enabled('arena',6))b.yaw=(b.yaw||0)+dt*4;
      if(v14Enabled('arena',7))b.yaw=(b.yaw||0)+dt*1;
      if(v14Enabled('arena',8))v14MarkUntil=Math.max(v14MarkUntil,now+120);
      if(v14Enabled('arena',11))b.yaw=(b.yaw||0)+dt*Math.sin(now*.003+b.x)*9;
      if(v14Enabled('arena',12))b.vx*=.97;
      if(v14Enabled('arena',13))b.vy=(b.vy||0)+dt*5*s;
      if(v14Enabled('arena',14)){const dv=v14Norm(b.x-p.x,b.z-p.z);b.vx+=dv.x*12*dt*s;b.vz+=dv.z*12*dt*s;}
    }
  }
  function v14Tick(dt,now){
    if(panel.style.display==='none'){
      // Exclusive aim modes avoid different powers fighting for the same camera angle.
      for(let i=0;i<16;i++)if(v14Enabled('aim',i)){v14ApplyAim(i,dt);break;}
    }
    const p=g.player;
    if(v14Catalog.some(q=>q.group==='movement'&&q.mode==='toggle'&&flags[q.flag]))v14Movement(dt);
    if(v14Catalog.some(q=>q.group==='survival'&&q.mode==='toggle'&&flags[q.flag]))v14Survival(dt);
    if(now-v14LastBotTick>=50){const delta=Math.min(.15,(now-v14LastBotTick)/1000||dt);v14LastBotTick=now;
      if(v14Catalog.some(q=>['bots','physics','arena'].includes(q.group)&&q.mode==='toggle'&&flags[q.flag])){
        v14BotEffects(delta,now);v14Physics(delta);v14Arena(delta,now);
      }
    }
    if(v14Enabled('arsenal',16))clearWeaponRecoil();
    if(v14Enabled('arsenal',10)){const st=g.weapons.state?.();if(st&&Number.isFinite(st.ammo))st.ammo=500;}
    if(v14Enabled('arsenal',9)){const st=g.weapons.state?.(),def=g.weapons.def?.();if(st&&def&&Number.isFinite(st.ammo))st.ammo=Math.max(st.ammo||0,Math.min(def.mag||30,500));}
  }
  const v14PrevFire=g.fireBullet;
  g.fireBullet=function(shooter,x,y,z,dx,dy,dz,def){
    const ret=v14PrevFire.apply(this,arguments);
    if(!active||g.state!=='playing'||shooter!==g.player)return ret;
    const now=performance.now();if(now-v14LastShot<90)return ret;v14LastShot=now;
    const p=g.player,s=v14Cfg.powerStrength;
    for(let i=0;i<10;i++)if(v14Enabled('combat',i)){
      if(i===0)v14Heal(2*s,0);
      else if(i===1)v14Heal(0,2*s);
      else if(i===2){p.vx+=dx*1.3*s;p.vz+=dz*1.3*s;}
      else if(i===3)p.vy+=2*s;
      else if(i===4)v14Force(x+dx*4,z+dz*4,4*s,1*s,'push',7);
      else if(i===5)for(const b of v14E())if(Math.hypot(b.x-x,b.z-z)<8){b.vx*=.6;b.vz*=.6;}
      else if(i===6)v14Force(x+dx*6,z+dz*6,8*s,1,'push',6);
      else if(i===7)v14Force(x+dx*6,z+dz*6,6*s,0,'pull',6);
      else if(i===8){const st=g.weapons.state?.();if(st&&Number.isFinite(st.reserve))st.reserve=Math.min(999,st.reserve+1);}
      else if(i===9)v14Energy=Math.min(100,v14Energy+5);
    }
    return ret;
  };
  const v14PrevKill=g.killEntity;
  g.killEntity=function(victim,killer,...rest){
    const wasAlive=!!victim?.alive;const ret=v14PrevKill.call(this,victim,killer,...rest);
    if(!active||!wasAlive||victim?.alive||killer!==g.player||victim?.team===g.player.team)return ret;
    const p=g.player,s=v14Cfg.powerStrength;
    for(let i=10;i<20;i++)if(v14Enabled('combat',i)){
      if(i===10)v14Heal(17*s,0);
      if(i===11)v14Heal(0,22*s);
      if(i===12){const a=aimVector();p.vx+=a.x*12*s;p.vz+=a.z*12*s;}
      if(i===13)v14Force(victim.x,victim.z,22*s,6*s,'push',13);
      if(i===14)v14Force(victim.x,victim.z,17*s,3*s,'pull',14);
      if(i===15){const st=g.weapons.state?.();if(st)st.ammo=Math.min(500,(st.ammo||0)+4);}
      if(i===16){const st=g.weapons.state?.();if(st)st.reserve=Math.min(999,(st.reserve||0)+36);}
      if(i===17)v14Heal(9*s,9*s);
      if(i===18)p.vy=Math.max(p.vy||0,16*s);
      if(i===19)for(const b of v14E())if(Math.hypot(b.x-victim.x,b.z-victim.z)<14)b.nextFire=Math.max(b.nextFire||0,(g.time||0)+2);
    }
    v14KillAt=performance.now();return ret;
  };
  function v14Draw(ctx,w,h,project){
    const show=v14Catalog.some(p=>p.group==='visuals'&&flags[p.flag]);
    if(!show&&!v14Enabled('arena',7)&&!v14Enabled('arena',8)&&performance.now()>v14MarkUntil)return;
    const mid=w/2,cy=h/2,z=v14Cfg.visualScale;
    ctx.save();ctx.lineWidth=1.6;ctx.strokeStyle='#c689ff';ctx.fillStyle='#b990ff';ctx.font='12px monospace';
    const line=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke()};
    const circle=r=>{ctx.beginPath();ctx.arc(mid,cy,r*z,0,Math.PI*2);ctx.stroke();};
    if(v14Enabled('visuals',0))for(const d of [-9,9]){line(mid+d,cy,mid+d*.5,cy);line(mid,cy+d,mid,cy+d*.5);}
    if(v14Enabled('visuals',1)){ctx.beginPath();ctx.arc(mid,cy,2.5*z,0,Math.PI*2);ctx.fill();}
    if(v14Enabled('visuals',2))circle(14);
    if(v14Enabled('visuals',3))circle(8+3*Math.sin(performance.now()*.01));
    if(v14Enabled('visuals',4)){line(mid-28*z,cy,mid-8*z,cy);line(mid+8*z,cy,mid+28*z,cy);line(mid,cy-28*z,mid,cy-8*z);line(mid,cy+8*z,mid,cy+28*z);}
    if(v14Enabled('visuals',5)){const a=performance.now()*.001;ctx.save();ctx.translate(mid,cy);ctx.rotate(a);ctx.strokeRect(-13*z,-13*z,26*z,26*z);ctx.restore();}
    if(v14Enabled('visuals',6))circle(23);
    if(v14Enabled('visuals',7)){const rad=Math.min(h*.46,Math.tan(v14Cfg.aimFov*Math.PI/360)/Math.tan((g.camera?.fov||75)*Math.PI/360)*h/2);circle(rad/z);}
    if(v14Enabled('visuals',8)&&v14AimTarget?.alive){const pt=project?.(v14AimTarget.x,(v14AimTarget._visY??v14AimTarget.y)+1.2,v14AimTarget.z);if(pt)line(mid,cy,pt.x,pt.y);}
    if(v14Enabled('visuals',9)||performance.now()<v14MarkUntil){const b=v14AimTarget;if(b?.alive){const pt=project?.(b.x,(b._visY??b.y)+1.1,b.z);if(pt){ctx.strokeRect(pt.x-10,pt.y-10,20,20);}}}
    let y=100;
    const hud=(index,msg)=>{if(v14Enabled('visuals',index)){ctx.fillText('VW V15  /  '+msg,24,y);y+=19;}};
    hud(10,'BOTS '+v14E().length);hud(11,'SPD '+Math.hypot(g.player.vx||0,g.player.vz||0).toFixed(1));
    hud(12,'HP '+Math.floor(g.player.health||0));hud(13,'ARMOR '+Math.floor(g.player.armor||0));
    hud(14,'AMMO '+Math.floor(g.weapons.state?.()?.ammo||0));
    hud(15,'MODS '+v14Catalog.filter(p=>p.mode==='toggle'&&flags[p.flag]).length);
    if(v14Enabled('visuals',16)){for(const x of [26,w-26])for(const vy of [26,h-26]){const sx=x===26?1:-1,sy=vy===26?1:-1;line(x,vy,x+20*sx,vy);line(x,vy,x,vy+20*sy);}}
    if(v14Enabled('visuals',17)){line(mid-38,cy+45,mid+38,cy+45);}
    if(v14Enabled('visuals',18))for(const b of v14E().slice(0,12)){
      const angle=angleDiff(Math.atan2(-(b.x-g.player.x),-(b.z-g.player.z)),g.player.yaw||0);
      const radius=Math.min(w,h)*.34;ctx.fillText('▴',mid+Math.sin(angle)*radius,cy-Math.cos(angle)*radius);
    }
    if(v14Enabled('visuals',19)){ctx.strokeStyle='#af6dff18';for(let yy=0;yy<h;yy+=9)line(0,yy,w,yy);}
    if(v14Enabled('arena',7))for(let j=0;j<24;j++){const t=performance.now()*.04;ctx.fillStyle=j%2?'#ac81ff88':'#6be0ff88';ctx.fillRect(((j*113.7+t*(j%3+1))%w),((j*97.4+t*(j%4+1))%h),2+j%3,2+j%2);}
    if(v14Enabled('arena',8))for(const b of v14E().slice(0,20)){const pt=project?.(b.x,(b._visY??b.y)+1.25,b.z);if(pt){ctx.strokeStyle='#fa8fc1aa';ctx.beginPath();ctx.arc(pt.x,pt.y,9,0,Math.PI*2);ctx.stroke();}}
    ctx.restore();
  }
  function v14RunPower(p){
    if(!active||g.state!=='playing'||!g.player?.alive)return v14Msg('Enter an active bot match');
    const s=v14Cfg.powerStrength,x=p.index,player=g.player,dir=aimVector();let msg=p.name;
    if(p.group==='aim'){v14ApplyAim(x,.016,true);}
    else if(p.group==='arsenal'){
      if(x===17){const st=g.weapons.state?.(),df=g.weapons.def?.();if(st)st.ammo=Math.min(500,df?.mag||30);}
      if(x===18){g.weapons.reloading=false;g.weapons.startReload?.();}
      if(x===19){v131EquipFusion();}
    }else if(p.group==='movement'){
      if(x===15){player.vx+=dir.x*42*s;player.vz+=dir.z*42*s;}
      if(x===16){player.vx-=dir.x*32*s;player.vz-=dir.z*32*s;}
      if(x===17){player.vy=Math.max(player.vy||0,19*s);player.onGround=false;}
      if(x===18){let ok=false;for(let d=13;d>=1;d-=1)if(v14Teleport(player.x+dir.x*d,player.y,player.z+dir.z*d)){ok=true;break;}if(!ok)msg+=' (blocked)';}
      if(x===19){if(blinkUndo){const v=blinkUndo;if(!v14Teleport(v.x,v.y,v.z))msg+=' (blocked)';}else msg+=' (no recall)';}
    }else if(p.group==='survival'){
      if(x===15)v14Heal(100,0);if(x===16)v14Heal(0,100);if(x===17)v14Heal(100,100);
      if(x===18)v14Heal(65*s,20*s);if(x===19)v14Heal(35*s,65*s);
    }else if(p.group==='bots'){
      const bots=v14E();
      if(x===15)for(const b of bots)b.nextFire=Math.max(b.nextFire||0,(g.time||0)+4);
      if(x===16)v14Force(player.x,player.z,40*s,5*s,'push',55);
      if(x===17)for(const b of bots)b.nextFire=Math.max(b.nextFire||0,(g.time||0)+8);
      if(x===18)v14Force(player.x,player.z,20*s,0,'pull',55);
      if(x===19)for(const b of bots){b.vx=0;b.vz=0;b.vy=0;}
    }else if(p.group==='physics'){
      if(x===15)v14Force(player.x,player.z,23*s,3*s,'pull',35);
      if(x===16)v14Force(player.x,player.z,48*s,8*s,'push',42);
      if(x===17)v14Force(player.x,player.z,12*s,40*s,'push',35);
      if(x===18)v14Force(player.x,player.z,20*s,25*s,'push',25);
      if(x===19)v14Force(player.x,player.z,48*s,0,'pull',45);
    }else if(p.group==='arena'){
      if(x===15){v14Checkpoint={x:player.x,y:player.y,z:player.z};}
      if(x===16){if(!v14Checkpoint||!v14Teleport(v14Checkpoint.x,v14Checkpoint.y,v14Checkpoint.z))msg+=' (no safe checkpoint)';}
      if(x===17)for(const b of v14E())b.spawnProt=0;
      if(x===18)for(const b of v14E())b.yaw=(Math.sin(b.x*12.9898+b.z*78.233)*43758.54)%(Math.PI*2);
      if(x===19)for(const b of v14E())b.nextFire=0;
    }else if(p.group==='chaos'){
      const combos=[
        ()=>v14Heal(100,100),()=>{player.vx+=dir.x*42*s;player.vz+=dir.z*42*s;},
        ()=>v14Force(player.x,player.z,35*s,0,'pull',38),()=>v14Force(player.x,player.z,40*s,2*s,'push',38),
        ()=>{v14Force(player.x,player.z,45*s,10*s,'pull',38);v14MarkUntil=performance.now()+900;},
        ()=>{flags.v14_aim_04=true;v14ApplyAim(3,.016,true);flags.v14_aim_04=false;},
        ()=>{const st=g.weapons.state?.();if(st)st.ammo=300;},
        ()=>{player.vy=Math.max(30,player.vy||0);player.vx+=dir.x*15*s;},
        ()=>v14Heal(60*s,30*s),()=>revive(),()=>{const b=v14Nearest(7);if(b){if(!v14Teleport(b.x+1.5,b.y,b.z))msg+=' (blocked)';}},
        ()=>{v14Force(player.x,player.z,70*s,20*s,'push',36);},
        ()=>{v14Force(player.x,player.z,24*s,16*s,'pull',33);},
        ()=>{v14Force(player.x,player.z,45*s,8*s,'push',25);v14Heal(15*s,0);},
        ()=>{v14Heal(100,100);const st=g.weapons.state?.();if(st){st.ammo=300;st.reserve=800;}},
        ()=>{player.vy=30*s;player.vx+=dir.x*35*s;player.vz+=dir.z*35*s;},
        ()=>{for(const b of v14E()){b.yaw+=8;b.vy+=15*s;}},
        ()=>{v14Heal(20*s,20*s);v14Force(player.x,player.z,14*s,0,'pull',35);},
        ()=>{for(const b of v14E())b.nextFire=Math.max(b.nextFire||0,(g.time||0)+8);},
        ()=>{v14Heal(100,100);v14Force(player.x,player.z,80*s,20*s,'push',55);}
      ];combos[x]?.();
    }
    return v14Msg(msg);
  }
  // Register instant actions in hotkeys before their pages are ever opened.
  for(const p of v14Catalog)if(p.mode==='action'){
    const title=p.name;
    actions.set(actionId(title),{title,handler:()=>v14RunPower(p),tab:p.tab});
  }
  function v14SetFlag(p){
    toggleFlag(p.flag);
    if(flags[p.flag]&&p.group==='aim')for(const q of v14Catalog){
      if(q!==p&&q.group==='aim'&&q.mode==='toggle')flags[q.flag]=false;
    }
  }
  function v14Disable(){for(const p of v14Catalog)if(p.mode==='toggle')flags[p.flag]=false;v14AimTarget=null;}
  function v14Render(){
    const key=activeTab.slice(4),grp=v14Groups[key];if(!grp)return;
    section('V14 // '+grp[1],'ABSOLUTE CHAOS • 20 unique additions • dedicated controls, individual keybinds, reversible toggles • bot lobby');
    const tag=document.createElement('div');tag.className='dw-v14-status';tag.textContent='SYSTEM / V14   ◈   '+key.toUpperCase()+'   /   20 MODULES   /   OFF BY DEFAULT';content.append(tag);
    const holder=grid();holder.classList.add('dw-v14-grid');
    for(const p of v14Catalog.filter(q=>q.group===key)){
      const hint=p.mode==='action'?'ONE-SHOT · '+p.name:'LIVE MODULE · '+p.name;
      if(p.mode==='action')tile(holder,p.name,hint,()=>v14RunPower(p));
      else{const b=tile(holder,p.name,hint,null,p.flag);
        // Preserve all existing tiles; only the new lab's aim modules are exclusive.
        if(key==='aim')b.addEventListener('click',()=>{for(const q of v14Catalog.filter(q=>q.group==='aim')){
          if(q!==p&&q.mode==='toggle')flags[q.flag]=false;}
          for(const el of holder.querySelectorAll('.dw-toggle'))if(el!==b&&el.classList.contains('on')){
            el.classList.remove('on');const ind=el.querySelector('.dw-indicator');if(ind)ind.textContent='○ OFF';}
        });
      }
    }
    section('TUNE YOUR V14 LOADOUT','These values change V14 effects only. Original V13.1 Fusion and other settings stay intact.');
    slider('Effect intensity',.2,5,.1,v14Cfg.powerStrength,n=>{v14Cfg.powerStrength=n;v14Save()},'×');
    slider('Bot interaction radius',4,55,1,v14Cfg.botRadius,n=>{v14Cfg.botRadius=n;v14Save()},'m');
    if(key==='aim'){
      slider('Aim FOV',3,360,1,v14Cfg.aimFov,n=>{v14Cfg.aimFov=n;v14Save()},'°');
      slider('Aim smoothing (0.02 = slow, 1 = strong)',.02,1,.02,v14Cfg.aimSmooth,n=>{v14Cfg.aimSmooth=n;v14Save()},'×');
      slider('Maximum target range',5,400,5,v14Cfg.aimRange,n=>{v14Cfg.aimRange=n;v14Save()},'m');
      selector('Activation',[['always','Always in round'],['mouse1','While left mouse held'],['mouse2','While right mouse held'],['shift','While Shift held']],v14Cfg.aimActivation,n=>{v14Cfg.aimActivation=n;v14Save()});
      selector('Visibility',[['yes','Visible targets only'],['no','Through walls in local bots']],v14Cfg.aimVisible?'yes':'no',n=>{v14Cfg.aimVisible=n==='yes';v14Save()});
      selector('Aim position',[['head','Head'],['chest','Chest']],v14Cfg.aimHead?'head':'chest',n=>{v14Cfg.aimHead=n==='head';v14Save()});
    }
    if(key==='arsenal')slider('New weapon module multiplier',.25,6,.05,v14Cfg.weaponForce,n=>{v14Cfg.weaponForce=n;v14Save()},'×');
    if(key==='visuals')slider('Overlay size',.5,2.5,.1,v14Cfg.visualScale,n=>{v14Cfg.visualScale=n;v14Save()},'×');
    const actionsRow=grid();tile(actionsRow,'⛔ DISABLE V14','Turn off ONLY new V14 modules; legacy V13.1 settings are not touched.',()=>{v14Disable();renderTab();});
    tile(actionsRow,'⌨ V14 HOTKEY EDITOR','Every V14 toggle and one-shot action has a separate keybind.',()=>{bindingFilter='v14';showMenu('hotkeys')});
    if(key==='arsenal')tile(grid(),'🔧 V13.1 FUSION WORKSHOP','Go to the original four-donor fusion editor without losing settings.',()=>showMenu('paradox131'));
    const info=document.createElement('p');info.className='dw-feature-note';info.textContent='Local bot sandbox only. Automatic targeting affects actual yaw/pitch, not networked players. Actions are instant; toggles run each frame. Use End for emergency reset. Bundling many velocity/gravity powers may oppose one another.';content.append(info);
  }

  // V14.4 PRACTICAL CHEATS: 50 independent local bot-lobby toggles.
  // AIM and TRIGGER modules select one mode at a time to avoid conflicting corrections.
  const v15Catalog = {
    aim: [
      ['Visible Aimbot','Aim at a visible enemy when activating aim assist.'],
      ['Head Lock','Prioritize the head of the visible enemy in your FOV.'],
      ['Chest Lock','Aim consistently at the chest of visible enemies.'],
      ['Smooth Aim','Ease the crosshair gradually toward the selected bot.'],
      ['Snap Aim','Immediately turn your crosshair toward a visible bot.'],
      ['Low HP Priority','Target the visible enemy with the lowest health.'],
      ['Nearest Priority','Target the closest visible enemy in your FOV.'],
      ['Crosshair Priority','Choose the target closest to your current crosshair.'],
      ['Velocity Prediction','Lead targets based on their current velocity.'],
      ['Sticky Aim Lock','Maintain your current target until it leaves the FOV.']
    ],
    trigger: [
      ['Crosshair Triggerbot','Shoot only when a visible bot is under your crosshair.'],
      ['Head Triggerbot','Fire only with the crosshair near a visible head.'],
      ['Chest Triggerbot','Fire only with the crosshair over a visible torso.'],
      ['Burst Triggerbot','Shoot controlled three-round bursts at valid targets.'],
      ['Single Tap Triggerbot','One shot per newly acquired target.'],
      ['Instant Triggerbot','Fire with zero activation delay on valid targets.'],
      ['Delayed Triggerbot','Wait 160ms before shooting a stable target.'],
      ['ADS Triggerbot','Trigger only while holding right mouse button.'],
      ['Scoped Triggerbot','Shoot only while a sniper scope is active.'],
      ['Finisher Triggerbot','Trigger only on visible bots below 40 HP.']
    ],
    weapons: [
      ['Recoil Elimination','Clear view and weapon recoil while shooting.'],
      ['Spread Elimination','Remove random local-player bullet spread.'],
      ['Rapid Cycle','Reduce the time between weapon shots.'],
      ['Empty-Clip Reload','Reload automatically when the magazine runs out.'],
      ['Bottomless Magazine','Keep your local magazine topped up while equipped.'],
      ['Bottomless Reserve','Keep a large supply of reserve ammunition.'],
      ['Automatic Scoping','Scope automatically when aiming with a sniper.'],
      ['Instant Draw','Remove the equipped weapon draw delay.'],
      ['Quick Rechamber','Speed up manual chamber/cooldown recovery.'],
      ['Damage Multiplier','Double local weapon definition damage (bot lobby).']
    ],
    visuals: [
      ['ESP Boxes','Draw 2D outlines around enemy bots.'],
      ['ESP Skeleton','Draw simple arm, torso, and leg lines for visible models.'],
      ['Head Markers','Draw a small circle around each enemy head.'],
      ['Health Labels','Display current enemy HP above the model.'],
      ['Distance Labels','Display range to each bot.'],
      ['ESP Snaplines','Draw lines from your screen bottom to enemy positions.'],
      ['Aim FOV Circle','Show the exact selected aimbot FOV.'],
      ['Enemy Counter','Display how many enemy bots remain alive.'],
      ['Velocity Vectors','Indicate the direction each bot is moving.'],
      ['Active Target Marker','Highlight the bot currently selected by aim assist.']
    ],
    movement: [
      ['Automatic Bunnyhop','Jump on ground while Space is held.'],
      ['Jump Booster','Add an extra impulse on a new Space press.'],
      ['Quick Stop','Quickly stop after releasing WASD.'],
      ['Air Acceleration','Build controlled momentum while holding W in the air.'],
      ['Strafe Booster','Accelerate sideways while pressing A or D.'],
      ['Sprint Booster','Accelerate forward while holding Shift and W.'],
      ['Crouch Speed','Move faster while holding Ctrl and W.'],
      ['Fall Brake','Limit dangerous downward velocity.'],
      ['Low Gravity Movement','Soften downward acceleration while airborne.'],
      ['Counter-Strafe Assist','Reduce opposing horizontal velocity on direction change.']
    ]
  };
  const v15Names={aim:'AIMBOT',trigger:'TRIGGERBOT',weapons:'WEAPON MODS',visuals:'ESP & VISUALS',movement:'MOVEMENT'};
  const v15Powers=[];
  for(const [group,entries] of Object.entries(v15Catalog))for(let i=0;i<entries.length;i++){
    const id=`v15_${group}_${String(i+1).padStart(2,'0')}`;
    v15Powers.push({id,group,index:i,name:entries[i][0],desc:entries[i][1],tab:'v15:'+group});
    flags[id]=false;
  }
  let v15Fov=95,v15Smooth=9,v15AimActivation='mouse2',v15TriggerAngle=2.2,v15HeldBot=null;
  let v15PreviousTrigger=null,v15TargetOnset=0,v15LastShot=0,v15BurstLeft=0,v15HeldSpace=false,v15TapDone=false;
  let v15LastAimTarget=null;
  const v15OptionsKey='deathWonV144Practical';
  try {const saved=JSON.parse(localStorage.getItem(v15OptionsKey)||'{}');
    if(Number.isFinite(saved.fov))v15Fov=Math.max(5,Math.min(180,saved.fov));
    if(Number.isFinite(saved.smooth))v15Smooth=Math.max(1,Math.min(28,saved.smooth));
    if(Number.isFinite(saved.angle))v15TriggerAngle=Math.max(.2,Math.min(6,saved.angle));
    if(['always','mouse1','mouse2','shift'].includes(saved.activation))v15AimActivation=saved.activation;
  }catch{}
  const v15Save=()=>{try{localStorage.setItem(v15OptionsKey,JSON.stringify({fov:v15Fov,smooth:v15Smooth,angle:v15TriggerAngle,activation:v15AimActivation}))}catch{}};
  const v15Flag=(group,index)=>!!flags[`v15_${group}_${String(index+1).padStart(2,'0')}`];
  const v15SavedLegacy={noRecoil:null,noSpread:null};
  function v15WeaponSwitch(enabled,name){
    if(enabled){if(v15SavedLegacy[name]===null)v15SavedLegacy[name]=!!flags[name];flags[name]=true;}
    else if(v15SavedLegacy[name]!==null){flags[name]=v15SavedLegacy[name];v15SavedLegacy[name]=null;}
  }
  const v15GroupOn=group=>v15Powers.some(p=>p.group===group&&flags[p.id]);
  function v15Off(){for(const p of v15Powers)flags[p.id]=false;
    v15WeaponSwitch(false,'noRecoil');v15WeaponSwitch(false,'noSpread');v15HeldBot=null;v15LastAimTarget=null;v15PreviousTrigger=null;v15BurstLeft=0;
  }
  function v15Select(p){
    const next=!flags[p.id];
    if(['aim','trigger'].includes(p.group))for(const q of v15Powers)if(q.group===p.group)flags[q.id]=false;
    flags[p.id]=next;
    // Shares the already tested recoil/spread hooks; doesn't replace their implementations.
    if(p.group==='weapons'&&p.index===0)v15WeaponSwitch(next,'noRecoil');
    if(p.group==='weapons'&&p.index===1)v15WeaponSwitch(next,'noSpread');
    if(p.group==='aim'){v15HeldBot=null;v15LastAimTarget=null;}
    if(p.group==='trigger'){v15PreviousTrigger=null;v15BurstLeft=0;v15TargetOnset=0;v15TapDone=false;}
  }
  function v15Render(){
    const group=activeTab.slice(4);
    const entries=v15Powers.filter(p=>p.group===group);
    section('V14.4 // '+v15Names[group], '10 practical FPS controls • local bot lobbies • independent settings, real in-game behavior');
    const tag=document.createElement('div');tag.className='dw-v14-status';tag.textContent='PRACTICAL LAB / '+group.toUpperCase()+' / 10 CONTROLS / TOP-NAV LAYOUT';content.append(tag);
    const list=grid();list.classList.add('dw-v14-grid');
    for(const p of entries){
      const btn=tile(list,p.name,p.desc,null,p.id);
      // Each switch triggers side-effects, while tile keeps the existing status/hotkey UI.
      btn.addEventListener('click',()=>{
        if(['aim','trigger'].includes(p.group)){
          for(const q of entries)if(q!==p)flags[q.id]=false;
          for(const other of list.querySelectorAll('.dw-toggle'))if(other!==btn){other.classList.remove('on');const e=other.querySelector('.dw-indicator');if(e)e.textContent='○ OFF';}
        }
        v15PreviousTrigger=null;v15HeldBot=null;
      });
    }
    if(group==='aim'){
      section('AIM CONFIGURATION','Aim modes only act on bot enemies in your local match.');
      slider('Aim FOV',5,180,1,v15Fov,n=>{v15Fov=n;v15Save()},'°');
      slider('Aim smoothing',1,28,1,v15Smooth,n=>{v15Smooth=n;v15Save()},'×');
      selector('Aim activation',[['mouse2','Hold right mouse'],['mouse1','Hold left mouse'],['shift','Hold Shift'],['always','Always while menu closed']],v15AimActivation,v=>{v15AimActivation=v;v15Save()});
    }else if(group==='trigger'){
      section('TRIGGER CONFIGURATION','Bot target must be visible and inside the aiming tolerance.');
      slider('Trigger tolerance',.2,6,.2,v15TriggerAngle,n=>{v15TriggerAngle=n;v15Save()},'°');
    }
    const actionsRow=grid();
    tile(actionsRow,'RESET V14.4','Disable all 50 practical modules only.',()=>{v15Off();renderTab()});
    tile(actionsRow,'EDIT HOTKEYS','Configure a hotkey for each practical switch.',()=>{bindingFilter='v15_';showMenu('hotkeys')});
  }
  function v15Activated(){const k=g.input?.keys;
    if(v15AimActivation==='always')return true;
    if(v15AimActivation==='mouse1')return !!g.input?.mouse1;
    if(v15AimActivation==='shift')return !!(k?.has?.('ShiftLeft')||k?.has?.('ShiftRight'));
    return !!g.input?.mouse2;
  }
  function v15PickAim(mode){
    const p=g.player, eye=p.y+(p.eyeH||1.6);
    const direction=aimVector();let result=null,best=Infinity;
    const sticky=mode===9&&v15HeldBot?.alive&&v15HeldBot.team!==p.team&&!behindWall(v15HeldBot)&&angularError(v15HeldBot)<v15Fov/2;
    if(sticky)return v15HeldBot;
    for(const b of enemyBots()){
      if((b.spawnProt||0)>0||behindWall(b))continue;
      const spot=aimSpot(b,false),dx=spot.x-p.x,dy=spot.y-eye,dz=spot.z-p.z;
      const dist=Math.hypot(dx,dy,dz)||.001;
      const dot=Math.max(-1,Math.min(1,(dx*direction.x+dy*direction.y+dz*direction.z)/dist));
      const angle=Math.acos(dot)*180/Math.PI;
      if(angle>v15Fov/2)continue;
      let score=angle+.008*dist;
      if(mode===5)score=(Number(b.health)||100)+angle*.05;
      if(mode===6)score=dist;
      if(mode===7)score=angle;
      if(score<best){best=score;result=b;}
    }
    return result;
  }
  function v15ApplyAim(mode,dt){
    if(!v15Activated())return;
    const b=v15PickAim(mode);v15HeldBot=b;v15LastAimTarget=b;
    if(!b)return;
    const p=g.player,eye=p.y+(p.eyeH||1.6),base=b._visY??b.y;
    const lead=mode===8?Math.min(.26,Math.hypot(b.x-p.x,b.z-p.z)/420):0;
    const x=b.x+(b.vx||0)*lead,z=b.z+(b.vz||0)*lead;
    const y=base+(mode===2?1.08:Math.min((b.height||1.8)-.1,1.62))+(b.vy||0)*lead;
    const yaw=Math.atan2(-(x-p.x),-(z-p.z)),pitch=Math.atan2(y-eye,Math.hypot(x-p.x,z-p.z));
    let factor=1-Math.exp(-dt*v15Smooth);
    if(mode===3)factor*=.4;
    if(mode===4)factor=1;
    p.yaw=(p.yaw||0)+angleDiff(yaw,p.yaw||0)*factor;
    p.pitch=Math.max(-1.55,Math.min(1.55,(p.pitch||0)+(pitch-(p.pitch||0))*factor));
  }
  function v15TriggerTarget(mode){
    const p=g.player,eye=p.y+(p.eyeH||1.6),dir=aimVector();let picked=null,best=Infinity;
    for(const b of enemyBots()){
      if((b.spawnProt||0)>0||behindWall(b))continue;
      if(mode===9&&(Number(b.health)||100)>=40)continue;
      const by=b._visY??b.y;
      const points=v16Flag('trigger',9)?[by+1.58]:(mode===1?[by+1.58]:mode===2?[by+1.03]:[by+1.03,by+1.58]);
      for(const y of points){const dx=b.x-p.x,dy=y-eye,dz=b.z-p.z;
        const dist=Math.hypot(dx,dy,dz)||1;
        const cosine=Math.max(-1,Math.min(1,(dx*dir.x+dy*dir.y+dz*dir.z)/dist));
        const angle=Math.acos(cosine)*180/Math.PI;
        const limit=mode===1?Math.min(.9,v15TriggerAngle):v15TriggerAngle;
        if(angle<limit&&angle<best){picked=b;best=angle;}
      }
    }
    return picked;
  }
  function v15ApplyTrigger(mode,now){
    if(mode===7&&!g.input?.mouse2)return;
    if(mode===8&&(g.weapons.scopeLevel||0)<=0)return;
    const target=v15TriggerTarget(mode);
    if(target!==v15PreviousTrigger){v15PreviousTrigger=target;v15TargetOnset=now;v15BurstLeft=mode===3?3:0;v15TapDone=false;v16TapDone=false;}
    if(!target)return;
    if(!v16TriggerAllowed(target,now))return;
    if(mode===4&&v15TapDone)return;
    if(mode===6&&now-v15TargetOnset<160)return;
    if(mode===3&&v15BurstLeft<=0)return;
    if(now-v15LastShot<(mode===5?0:mode===3?70:mode===4?350:85))return;
    if(!validGun())return;
    fireNow(null,true);v15LastShot=now;v16TapDone=true;
    if(mode===3)v15BurstLeft--;
    if(mode===4)v15TapDone=true; // one tap until crosshair leaves the target
  }
  const v15DefBefore=g.weapons.def;
  // Wrap the current definition provider rather than mutating the game's shared weapon table.
  if(typeof v15DefBefore==='function')g.weapons.def=function(...args){
    const original=v15DefBefore.apply(this,args);
    return active&&v15Flag('weapons',9)&&original&&original.class!=='knife'
      ?{...original,dmg:Math.max(1,Math.min(600,(Number(original.dmg)||20)*2))}:original;
  };
  function v15ApplyWeapons(){
    const w=g.weapons,st=w.state?.(),def=w.def?.(),now=Number(g.time)||0;
    if(!def)return;
    if(v15Flag('weapons',0))clearWeaponRecoil();
    if(v15Flag('weapons',2))w.nextFire=Math.min(Number(w.nextFire)||now,now+.06);
    if(v15Flag('weapons',3)&&st?.ammo===0&&st?.reserve>0&&!w.reloading)try{w.startReload?.()}catch{}
    if(v15Flag('weapons',4)&&st&&Number.isFinite(st.ammo)&&def.class!=='knife')st.ammo=Math.max(st.ammo,Math.min(90,Math.max(10,Number(def.mag)||30)));
    if(v15Flag('weapons',5)&&st&&Number.isFinite(st.reserve))st.reserve=Math.max(st.reserve,500);
    if(v15Flag('weapons',6)&&g.input?.mouse2&&def.zoom&&(w.scopeLevel||0)<=0)try{w.setScope?.(1)}catch{}
    if(v15Flag('weapons',7))w.drawT=0;
    if(v15Flag('weapons',8))w.nextFire=Math.min(Number(w.nextFire)||now,now+.11);
  }
  function v15Accel(dx,dz,dt,power=18,max=34){const p=g.player;
    const vx=Number(p.vx)||0,vz=Number(p.vz)||0;
    if(Math.hypot(vx,vz)>max)return;
    p.vx=vx+dx*dt*power;p.vz=vz+dz*dt*power;
  }
  function v15ApplyMovement(dt){
    const p=g.player,keys=g.input?.keys;
    if(!keys)return;
    const held=code=>keys.has(code);
    const left=held('KeyA'),right=held('KeyD'),forward=held('KeyW');
    const shift=held('ShiftLeft')||held('ShiftRight');
    const crouch=held('ControlLeft')||held('ControlRight');
    const space=held('Space');
    const ground=!!p.onGround;
    const yaw=Number(p.yaw)||0,fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    if(v15Flag('movement',0)&&ground&&space){p.vy=Math.max(Number(p.vy)||0,7.8);p.onGround=false;}
    if(v15Flag('movement',1)&&space&&!v15HeldSpace&&ground){p.vy=Math.max(Number(p.vy)||0,13.5);p.onGround=false;}
    if(v15Flag('movement',2)&&!left&&!right&&!forward&&!held('KeyS')){p.vx=(p.vx||0)*Math.max(0,1-16*dt);p.vz=(p.vz||0)*Math.max(0,1-16*dt);}
    if(v15Flag('movement',3)&&!ground&&forward)v15Accel(fx,fz,dt,25);
    if(v15Flag('movement',4)&&left!==right)v15Accel(left?-rx:rx,left?-rz:rz,dt,21);
    if(v15Flag('movement',5)&&shift&&forward)v15Accel(fx,fz,dt,28,42);
    if(v15Flag('movement',6)&&crouch&&forward)v15Accel(fx,fz,dt,19);
    if(v15Flag('movement',7)&&p.vy<-10)p.vy=-10;
    if(v15Flag('movement',8)&&!ground&&p.vy<1)p.vy=(p.vy||0)+dt*8;
    if(v15Flag('movement',9)&&left!==right){const toward=left?-1:1;const lateral=(p.vx||0)*rx+(p.vz||0)*rz;
      if(lateral*toward<0){p.vx=(p.vx||0)*Math.max(0,1-13*dt);p.vz=(p.vz||0)*Math.max(0,1-13*dt);}}
    v15HeldSpace=space;
  }
  function v15Tick(dt,now){
    if(!active||g.state!=='playing'||!g.player?.alive)return;
    if(v15GroupOn('weapons'))v15ApplyWeapons();
    if(v15GroupOn('movement'))v15ApplyMovement(dt);
    // Real camera aim and automatic trigger are disabled while the menu is visible.
    if(panel.style.display!=='none')return;
    const aimIndex=v15Powers.find(p=>p.group==='aim'&&flags[p.id])?.index;
    if(aimIndex!==undefined)v15ApplyAim(aimIndex,dt);
    const triggerIndex=v15Powers.find(p=>p.group==='trigger'&&flags[p.id])?.index;
    if(triggerIndex!==undefined)v15ApplyTrigger(triggerIndex,now);
  }
  const v15AnyVisual=()=>v15GroupOn('visuals');
  function v15Draw(ctx,w,h,project){
    if(!v15AnyVisual())return;
    const cx=w/2,cy=h/2;
    ctx.save();ctx.lineWidth=1.4;ctx.font='11px system-ui,Arial';
    if(v15Flag('visuals',6)){
      const fov=((g.camera?.fov||75)*Math.PI)/180;
      const radius=Math.max(9,Math.min(w,h)*.5*Math.tan(v15Fov*Math.PI/360)/Math.tan(fov/2));
      ctx.strokeStyle='#dc91ffbb';ctx.beginPath();ctx.arc(cx,cy,radius,0,2*Math.PI);ctx.stroke();
    }
    if(v15Flag('visuals',7)){
      ctx.textAlign='right';ctx.fillStyle='#e4c7ff';ctx.fillText('ENEMIES '+enemyBots().length,w-22,55);
    }
    for(const b of enemyBots()){
      const by=b._visY??b.y;
      const head=project(b.x,by+Math.min((b.height||1.8)-.1,1.62),b.z);
      const feet=project(b.x,by-.04,b.z);
      if(!head||!feet)continue;
      const boxH=Math.max(9,Math.abs(feet.y-head.y)),boxW=boxH*.42;
      const bx=head.x-boxW/2,top=Math.min(head.y,feet.y);
      if(v15Flag('visuals',0)){ctx.strokeStyle='#bd96ff';ctx.strokeRect(bx,top,boxW,boxH);}
      if(v15Flag('visuals',1)){
        const middle=project(b.x,by+.9,b.z);
        if(middle){ctx.strokeStyle='#61dfff';ctx.beginPath();ctx.moveTo(head.x,head.y);ctx.lineTo(middle.x,middle.y);
          ctx.moveTo(middle.x,middle.y);ctx.lineTo(feet.x,feet.y);
          ctx.moveTo(middle.x,middle.y);ctx.lineTo(middle.x-boxW*.55,middle.y+boxH*.06);
          ctx.moveTo(middle.x,middle.y);ctx.lineTo(middle.x+boxW*.55,middle.y+boxH*.06);
          ctx.moveTo(feet.x,feet.y);ctx.lineTo(feet.x-boxW*.28,feet.y+boxH*.08);
          ctx.moveTo(feet.x,feet.y);ctx.lineTo(feet.x+boxW*.28,feet.y+boxH*.08);ctx.stroke();}
      }
      if(v15Flag('visuals',2)){ctx.strokeStyle='#ffdcb4';ctx.beginPath();ctx.arc(head.x,head.y,Math.max(3,boxW*.18),0,2*Math.PI);ctx.stroke();}
      ctx.textAlign='center';ctx.fillStyle='#e7dbff';
      if(v15Flag('visuals',3))ctx.fillText(Math.round(b.health||0)+' HP',head.x,top-9);
      if(v15Flag('visuals',4))ctx.fillText(Math.hypot(b.x-g.player.x,b.z-g.player.z).toFixed(0)+'m',head.x,feet.y+14);
      if(v15Flag('visuals',5)){ctx.strokeStyle='#7b9eff99';ctx.beginPath();ctx.moveTo(cx,h-8);ctx.lineTo(feet.x,feet.y);ctx.stroke();}
      if(v15Flag('visuals',8)){
        const future=project(b.x+(b.vx||0)*.22,by+1,b.z+(b.vz||0)*.22),origin=project(b.x,by+1,b.z);
        if(future&&origin){ctx.strokeStyle='#ffa65e';ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(future.x,future.y);ctx.stroke();}
      }
      if(v15Flag('visuals',9)&&b===v15LastAimTarget){ctx.strokeStyle='#fc83d2';ctx.lineWidth=2.5;
        ctx.strokeRect(bx-4,top-4,boxW+8,boxH+8);}
    }
    ctx.restore();
  }

  // VOIDWARE V16 SUBTLE LAB: thirty opt-in, bot-lobby controls.
  // No anti-cheat interaction, packet tampering, stealth claims, or external dependencies.
  const v16Defs={
    aim:[
      ['Micro FOV Gate','Limit the original Legit Aim capture cone to a small adjustable angle.'],
      ['ADS Only','Only use legit aim while holding right mouse.'],
      ['Grounded Only','Pause legit aim until the player is on the ground.'],
      ['Stationary Only','Pause legit aim above the chosen walking speed.'],
      ['Crouch Only','Require crouch to activate legit aim.'],
      ['Rifles Only','Allow legit aim only with rifle-class weapons.'],
      ['Pistols Only','Allow legit aim only with pistol-class weapons.'],
      ['Flash Pause','Pause legit aim while the player is blinded.'],
      ['Soft Pull','Reduce the original legit-aim correction strength.'],
      ['Chest Bias','Track the upper torso instead of the head.']
    ],
    trigger:[
      ['Hold Fire','Require left mouse to be held for practical triggerbot.'],
      ['Hold ADS','Require right mouse to be held for practical triggerbot.'],
      ['Crouched Only','Only allow a trigger shot while crouching.'],
      ['Grounded Shot','Block trigger shots in mid-air.'],
      ['Slow Movement','Only shoot when horizontal speed is below the chosen cap.'],
      ['Stable Target Delay','Require the same target for an extra configurable delay.'],
      ['Shot Cooldown','Keep a minimum time between assisted shots.'],
      ['Sniper Scope Required','When holding a sniper, require scope before triggering.'],
      ['One Tap Per Target','Limit triggerbot to one shot until aim leaves target.'],
      ['Head-Only Tolerance','Check only the head aiming point for trigger activation.']
    ],
    weapon:[
      ['Mild Recoil Reduction','Reduce camera recoil by roughly 30%, preserving visible kick.'],
      ['Moderate Recoil Reduction','Reduce camera recoil by roughly 50%, preserving visible kick.'],
      ['View Punch Cap','Cap unusually large view punch without disabling recoil.'],
      ['Recoil Recovery','Fade kick faster when the trigger is released.'],
      ['Mild Spread Reduction','Decrease selected local weapon spread values by 10%.'],
      ['Moderate Spread Reduction','Decrease selected local weapon spread values by 25%.'],
      ['Controlled Fire Pace','Set a modest minimum interval between local shots.'],
      ['Low-Clip Reload','Request reload when only two rounds remain.'],
      ['Scope on ADS','When right mouse is held, scope an eligible sniper.'],
      ['Draw Time Assist','Shorten long draw delays slightly, without instant switching.']
    ]
  };
  const v16Opts=[];
  for(const [group,defs] of Object.entries(v16Defs))for(let index=0;index<defs.length;index++){
    const flag='v16_'+group+'_'+String(index+1).padStart(2,'0');
    const [name,desc]=defs[index];v16Opts.push({group,index,flag,name,desc,tab:'v16:'+group});flags[flag]=false;
  }
  const v16Flag=(group,index)=>!!flags['v16_'+group+'_'+String(index+1).padStart(2,'0')];
  const v16Store='voidwareV16SubtleCfg';
  const v16Defaults={microFov:7,stationarySpeed:1.8,softFactor:.4,triggerSpeed:1.8,triggerDelay:180,triggerCooldown:300};
  let v16Cfg={...v16Defaults};
  try{const stored=JSON.parse(localStorage.getItem(v16Store)||'{}');
    for(const key of Object.keys(v16Defaults)){
      const number=Number(stored[key]);if(Number.isFinite(number))v16Cfg[key]=Math.max(0,Math.min(1000,number));
    }
  }catch{}
  const v16Save=()=>{try{localStorage.setItem(v16Store,JSON.stringify(v16Cfg))}catch{}};
  const v16Held=code=>!!g.input?.keys?.has?.(code);
  const v16Crouch=()=>v16Held('ControlLeft')||v16Held('ControlRight');
  const v16Speed=()=>Math.hypot(Number(g.player.vx)||0,Number(g.player.vz)||0);
  const v16Sniper=()=>/^(awp|ssg08|scar20|g3sg1)$/i.test(g.weapons.current||'')||!!g.weapons.def?.()?.zoom;
  let v16TapDone=false;
  function v16AimAllowed(){
    if(v16Flag('aim',1)&&!g.input?.mouse2)return false;
    if(v16Flag('aim',2)&&!g.player.onGround)return false;
    if(v16Flag('aim',3)&&v16Speed()>v16Cfg.stationarySpeed)return false;
    if(v16Flag('aim',4)&&!v16Crouch())return false;
    const def=g.weapons.def?.();
    if(v16Flag('aim',5)&&!(def?.class==='rifle'||/^(ak47|m4a4|m4a1|aug|galil|famas|sg553)$/i.test(g.weapons.current||'')))return false;
    if(v16Flag('aim',6)&&!(def?.class==='pistol'||/^(deagle|glock|usp|p250|tec9|fiveseven|revolver)$/i.test(g.weapons.current||'')))return false;
    if(v16Flag('aim',7)&&Math.max(Number(g.player.flash)||0,Number(g.player.flashTime)||0,Number(g.player.blind)||0)>.2)return false;
    return true;
  }
  function v16TriggerAllowed(target,now){
    if(!target?.alive)return false;
    if(v16Flag('trigger',0)&&!g.input?.mouse1)return false;
    if(v16Flag('trigger',1)&&!g.input?.mouse2)return false;
    if(v16Flag('trigger',2)&&!v16Crouch())return false;
    if(v16Flag('trigger',3)&&!g.player.onGround)return false;
    if(v16Flag('trigger',4)&&v16Speed()>v16Cfg.triggerSpeed)return false;
    if(v16Flag('trigger',5)&&now-v15TargetOnset<v16Cfg.triggerDelay)return false;
    if(v16Flag('trigger',6)&&now-v15LastShot<v16Cfg.triggerCooldown)return false;
    if(v16Flag('trigger',7)&&v16Sniper()&&(g.weapons.scopeLevel||0)<=0)return false;
    if(v16Flag('trigger',8)&&v16TapDone)return false;
    return true;
  }
  const v16SpreadValue=(value,scale)=>typeof value==='number'?value*scale:value;
  const v16PrevDef=g.weapons.def;
  if(typeof v16PrevDef==='function')g.weapons.def=function(...args){
    const def=v16PrevDef.apply(this,args);
    if(!active||!def||(!v16Flag('weapon',4)&&!v16Flag('weapon',5)))return def;
    const scale=v16Flag('weapon',5)?.75:.90;
    const result={...def};
    for(const key of ['sBase','sMove','sJump','sFire','spread','inaccuracy']){
      if(typeof result[key]==='number')result[key]=v16SpreadValue(result[key],scale);
    }
    if(def.cs2&&typeof def.cs2==='object'){
      const cs={...def.cs2};
      if(Array.isArray(def.cs2.spread))cs.spread=def.cs2.spread.map(x=>v16SpreadValue(x,scale));
      result.cs2=cs;
    }
    return result;
  };
  const v16BeforeCycle=g.weapons.cycleTime;
  if(typeof v16BeforeCycle==='function')g.weapons.cycleTime=function(...args){
    const n=v16BeforeCycle.apply(this,args);
    return active&&v16Flag('weapon',6)&&Number.isFinite(n)?Math.max(.18,n):n;
  };
  function v16WeaponsTick(dt){
    if(!v16Opts.some(o=>o.group==='weapon'&&flags[o.flag]))return;
    const w=g.weapons,st=w.state?.(),def=w.def?.();if(!def)return;
    const mild=v16Flag('weapon',0),moderate=v16Flag('weapon',1),scale=moderate?.50:(mild?.70:1);
    if(scale!==1)for(const key of ['punchP','punchY'])if(Number.isFinite(w[key]))w[key]*=Math.pow(scale,dt*60);
    if(v16Flag('weapon',2))for(const key of ['punchP','punchY'])if(Number.isFinite(w[key]))w[key]=Math.max(-.07,Math.min(.07,w[key]));
    if(v16Flag('weapon',3)&&!g.input?.mouse1){
      const decay=Math.pow(.75,Math.max(.05,dt*60));
      for(const key of ['punchP','punchY'])if(Number.isFinite(w[key]))w[key]*=decay;
    }
    if(v16Flag('weapon',7)&&st&&st.ammo<=2&&st.reserve>0&&!w.reloading&&def.class!=='knife')try{w.startReload?.()}catch{}
    if(v16Flag('weapon',8)&&g.input?.mouse2&&v16Sniper()&&(w.scopeLevel||0)<=0)try{w.setScope?.(1)}catch{}
    if(v16Flag('weapon',9)&&Number.isFinite(w.drawT)&&w.drawT>0)w.drawT=Math.max(0,w.drawT-dt*.4);
  }
  function v16Off(){for(const o of v16Opts)flags[o.flag]=false;v16TapDone=false;}
  function v16Render(){
    const group=activeTab.slice(4),options=v16Opts.filter(o=>o.group===group);
    section('VOIDWARE V16 // '+({aim:'SUBTLE AIM',trigger:'TRIGGER DISCIPLINE',weapon:'WEAPON HANDLING'}[group]||'LEGIT'),
      '10 genuine bot-lobby modifiers. No flashy powers. Enable your existing Legit Aim or Practical Triggerbot where applicable.');
    const status=document.createElement('div');status.className='dw-v14-status';
    status.textContent=options.filter(o=>flags[o.flag]).length+' / 10 ENABLED • '+(group==='aim'?'ORIGINAL LEGIT AIM':group==='trigger'?'PRACTICAL TRIGGERBOT':'LOCAL WEAPON ENGINE');content.append(status);
    const holder=grid();holder.classList.add('dw-v14-grid');
    for(const opt of options){const b=tile(holder,opt.name,opt.desc,null,opt.flag);
      b.addEventListener('click',()=>{
        // Mutually exclusive recoil / spread intensities.
        const counterpart=group==='weapon'&&[0,1,4,5].includes(opt.index)?({0:1,1:0,4:5,5:4}[opt.index]):-1;
        if(counterpart>=0&&flags[opt.flag]){
          const other=options[counterpart];flags[other.flag]=false;
          const tileNode=holder.querySelector('[data-bind-id="flag:'+other.flag+'"]');
          if(tileNode){tileNode.classList.remove('on');tileNode.querySelector('.dw-indicator').textContent='○ OFF';}
        }
      });
    }
    section('ADJUSTMENTS','Settings are stored locally; no external services or game-detection claims.');
    if(group==='aim'){
      slider('Micro acquisition cone',1,25,.5,v16Cfg.microFov,v=>{v16Cfg.microFov=v;v16Save()},'°');
      slider('Stationary movement cap',.25,10,.25,v16Cfg.stationarySpeed,v=>{v16Cfg.stationarySpeed=v;v16Save()},' u/s');
      slider('Soft pull strength',.1,.9,.05,v16Cfg.softFactor,v=>{v16Cfg.softFactor=v;v16Save()},'×');
      tile(grid(),'◎ OPEN LEGIT AIM','Enable the original Legit Aimbot master switch.',()=>showMenu('legit'));
    }else if(group==='trigger'){
      slider('Maximum shooting speed',.25,10,.25,v16Cfg.triggerSpeed,v=>{v16Cfg.triggerSpeed=v;v16Save()},' u/s');
      slider('Additional stable-target delay',50,800,10,v16Cfg.triggerDelay,v=>{v16Cfg.triggerDelay=v;v16Save()},' ms');
      slider('Minimum shot cooldown',100,700,10,v16Cfg.triggerCooldown,v=>{v16Cfg.triggerCooldown=v;v16Save()},' ms');
      tile(grid(),'◎ OPEN PRACTICAL TRIGGER','Choose a Practical Triggerbot mode first.',()=>showMenu('v15:trigger'));
    }else{
      const note=document.createElement('p');note.className='dw-feature-note';note.textContent='Spread changes use cloned weapon definitions, leaving original weapon data untouched. Mild handling changes are intended for local bot tests only.';content.append(note);
    }
    tile(grid(),'↺ DISABLE V16 +30','Switch off only the new 30 controls; retain all previous features.',()=>{v16Off();renderTab()});
  }

  // VOIDWARE V17: 15 real training, configuration and analysis tools.
  // Non-network local practice utilities. Existing features remain untouched unless explicitly enabled.
  const v17Key='voidwareV17Studio';
  const v17Defaults=()=>({aimProfiles:{},autoAimProfiles:false,hitbox:'upper',aimProfile:'rifle',
    cueMs:2000,burstMs:280,adaptiveFPS:false,fpsFloor:52,autoFPSWasOn:false,
    favorites:['legit','rage','paradox131','performance'],loadouts:{},recoilWeapon:'awp',
    replayWindow:180,logger:true,fusionSlot:'Hybrid A'});
  const v17={...v17Defaults()};
  try{const saved=JSON.parse(localStorage.getItem(v17Key)||'{}');
    if(saved&&typeof saved==='object')for(const k of Object.keys(v17))if(k in saved)v17[k]=saved[k];
  }catch{}
  const v17Save=()=>{try{localStorage.setItem(v17Key,JSON.stringify(v17))}catch(e){console.warn('[VOIDWARE V17] Save:',e)}};
  const v17Clamp=(n,min,max,def=min)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):def;
  const v17AimGroups=['rifle','sniper','pistol','smg','heavy'];
  const v17WeaponGroup=(id=g.weapons.current)=>/^(awp|ssg08|scar20|g3sg1)$/.test(id)?'sniper':/^(ak47|m4a4|m4a1|aug|galil|famas|sg553)$/.test(id)?'rifle':/^(deagle|glock|usp|p250|tec9|fiveseven|revolver)$/.test(id)?'pistol':/^(negev|m249|xm1014|nova|mag7)$/.test(id)?'heavy':'smg';
  const v17State={events:[],aimPath:[],recoil:[],frames:[],lastSample:0,lastCanvas:0,
    lastWeapon:g.weapons.current,lastCue:0,cueBot:null,aligned:0,cues:0,shots:0,hits:0,headHits:0,
    lastShot:0,lastShotHit:false,lastBurst:0,burstSamples:[],lastAdaptive:0,autoFPS:false,
    autoEnabledByUs:false,lastExportError:'',drawn:0,lastAimProfile:null,sessionStart:performance.now()};
  const v17Log=(type,data={})=>{
    if(v17.logger!==false){v17State.events.push({t:Math.round(performance.now()-v17State.sessionStart),type,gun:g.weapons.current,...data});
      if(v17State.events.length>1200)v17State.events.shift();}
  };
  const v17Ping=[];
  const v17CueHud=document.createElement('div');v17CueHud.id='voidware-v17-cue';v17CueHud.style.cssText='position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:2147483601;background:#161126e9;border:1px solid #a87eff;color:#eee1ff;border-radius:6px;padding:7px 13px;font:bold 12px/1.35 system-ui;pointer-events:none;display:none';document.body.append(v17CueHud);
  const v17Gear=['ak47','m4a4','awp','ssg08','deagle','p90','negev','m249','mp9','xm1014','aug','galil','scar20','g3sg1','bizon'];
  const v17Tag=(textValue)=>{const p=document.createElement('div');p.className='dw-feature-note';p.textContent=textValue;content.append(p);return p};
  const v17Card=(title,subtitle)=>{const box=document.createElement('div');box.className='v17-box';const h=document.createElement('div');h.className='v17-title';h.textContent=title;box.append(h);if(subtitle){const t=document.createElement('p');t.className='v17-sub';t.textContent=subtitle;box.append(t);}content.append(box);return box};
  const v17Button=(parent,label,fn)=>{const b=document.createElement('button');b.type='button';b.className='v17-button';b.textContent=label;
    b.addEventListener('click',()=>safe(()=>{fn();v17Save()}));parent.append(b);return b};
  const v17Select=(parent,label,options,value,fn)=>{const wrap=document.createElement('label');wrap.className='v17-field';wrap.textContent=label;
    const el=document.createElement('select');el.className='v17-select';for(const [id,title] of options){const op=document.createElement('option');op.value=id;op.textContent=title;el.append(op);}el.value=String(value);
    el.addEventListener('change',()=>safe(()=>{fn(el.value);v17Save()}));wrap.append(el);parent.append(wrap);return el};
  const v17Range=(parent,label,min,max,step,value,onChange)=>{const wrap=document.createElement('label');wrap.className='v17-field';const head=document.createElement('div');head.className='v17-range-title';
    const title=document.createElement('span');title.textContent=label;const counter=document.createElement('b');counter.textContent=String(value);head.append(title,counter);
    const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;
    input.addEventListener('input',()=>{counter.textContent=input.value;safe(()=>{onChange(Number(input.value));v17Save()})});wrap.append(head,input);parent.append(wrap);return input};
  const v17Msg=(target,txt)=>{target.textContent=txt;notice('V17 · '+txt)};
  const v17Canvas=(parent,kind,height=165)=>{const cv=document.createElement('canvas');cv.className='v17-graph';cv.height=height;cv.dataset.v17Graph=kind;parent.append(cv);return cv};
  function v17Paint(cv,values,axis){
    if(!cv?.isConnected)return;
    const width=Math.max(250,cv.clientWidth||700),height=cv.height,dpr=Math.min(2,devicePixelRatio||1);
    if(cv.width!==Math.round(width*dpr)){cv.width=Math.round(width*dpr);cv.height=Math.round(height*dpr);}
    const c=cv.getContext('2d');if(!c)return;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);
    c.fillStyle='#0b0c16';c.fillRect(0,0,width,height);
    c.strokeStyle='#29223b';c.lineWidth=1;
    for(let i=1;i<5;i++){c.beginPath();c.moveTo(0,i*height/5);c.lineTo(width,i*height/5);c.stroke();}
    const points=values.slice(-200).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(points.length<2){c.fillStyle='#aaa0c8';c.font='11px system-ui';c.fillText('Record shots or movement to populate this chart',15,30);return;}
    const xmin=Math.min(...points.map(v=>v.x)),xmax=Math.max(...points.map(v=>v.x));
    const ymin=axis==='fps'?0:Math.min(...points.map(v=>v.y)),ymax=Math.max(1,...points.map(v=>v.y));
    c.beginPath();for(let i=0;i<points.length;i++){const p=points[i],x=9+(p.x-xmin)/Math.max(.001,xmax-xmin)*(width-18),y=height-9-(p.y-ymin)/Math.max(.001,ymax-ymin)*(height-18);
      i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#c59aff';c.lineWidth=2;c.stroke();
    c.fillStyle='#a9a0b9';c.font='10px system-ui';c.fillText(axis+'  '+(points[points.length-1]?.y??0).toFixed(1),9,15);
  }
  function v17AimSnapshot(){return {fov:legitFov,strength:legitStrength,bone:aimBone,activation:aimActivation,
    delay:legitProCfg.reactionMs, maxStep:legitProCfg.maxStepDeg};}
  function v17ApplyAim(profile){if(!profile)return false;
    legitFov=v17Clamp(profile.fov,2,140,38);legitStrength=v17Clamp(profile.strength,1,100,22);
    aimBone=['head','chest','upper'].includes(profile.bone)?profile.bone:'upper';
    aimActivation=['mouse1','mouse2','shift','always'].includes(profile.activation)?profile.activation:'mouse2';
    legitProCfg.reactionMs=v17Clamp(profile.delay,0,500,120);legitProCfg.maxStepDeg=v17Clamp(profile.maxStep,.2,15,2);
    legitProSave();legitProReset();return true;
  }
  function v17AimCurrent(){return v17.aimProfiles?.[v17.aimProfile]||null;}
  function v17SaveAim(){v17.aimProfiles[v17.aimProfile]=v17AimSnapshot();v17Save();notice('V17 · Saved '+v17.aimProfile+' aiming profile');}
  function v17Cue(now){const bots=enemyBots().filter(b=>b.alive);if(!bots.length){v17State.cueBot=null;return;}
    const other=bots.filter(b=>b!==v17State.cueBot),pool=other.length?other:bots;
    v17State.cueBot=pool[Math.floor(Math.random()*pool.length)];v17State.cues++;v17State.lastCue=now;
    v17Log('cue',{target:v17State.cueBot.name||'bot'});
  }
  function v17FpsWatch(now){if(!v17.adaptiveFPS||now-v17State.lastAdaptive<1500)return;v17State.lastAdaptive=now;
    const subset=v17State.frames.slice(-36),avg=subset.reduce((s,v)=>s+v.y,0)/Math.max(1,subset.length);
    if(subset.length<15)return;
    if(avg<v17.fpsFloor&&!flags.fpsBoost&&!flags.fpsBooster){flags.fpsBooster=true;fpsBoosterEnable(true);v17State.autoEnabledByUs=true;v17State.autoFPS=true;v17Log('full_quality_fps_boost',{fps:Math.round(avg)});}
    else if(avg>v17.fpsFloor+15&&v17State.autoEnabledByUs&&flags.fpsBooster){flags.fpsBooster=false;fpsBoosterEnable(false);v17State.autoEnabledByUs=false;v17State.autoFPS=false;}
  }
  function v17Tick(now,dt){
    if(!active)return;
    if(now-v17State.lastSample>110){v17State.lastSample=now;
      const p=g.player;v17State.aimPath.push({x:now/1000,y:(Number(p.yaw)||0)*180/Math.PI});if(v17State.aimPath.length>450)v17State.aimPath.shift();
      v17State.frames.push({x:now/1000,y:dt>0?Math.min(240,1/dt):60});if(v17State.frames.length>450)v17State.frames.shift();
      const ping=Number(g.ping??g.net?.ping);if(Number.isFinite(ping)&&ping>=0){v17Ping.push({x:now/1000,y:ping});if(v17Ping.length>450)v17Ping.shift();}
      if(v17State.recoil.length>200)v17State.recoil.splice(0,v17State.recoil.length-200);
    }
    if(v17State.cueBot&&(!v17State.cueBot.alive||now-v17State.lastCue>v17.cueMs))v17Cue(now);
    const cueDisplay=v17State.cueBot&&panel.style.display==='none'?'block':'none';
    if(!flags.fpsBooster||!fpsBoosterCfg.lightweightMenu||v17CueHud.style.display!==cueDisplay)v17CueHud.style.display=cueDisplay;
    if(cueDisplay!=='none')v17CueHud.textContent='🎯 SWITCH TRAINER: '+(v17State.cueBot.name||('BOT '+(g.botMgr.bots.indexOf(v17State.cueBot)+1)))+' · error '+angularError(v17State.cueBot).toFixed(1)+'°';
    if(v17.autoAimProfiles){const gun=g.weapons.current,group=v17WeaponGroup(gun);
      if(v17State.lastAimProfile!==group&&v17.aimProfiles?.[group]){v17ApplyAim(v17.aimProfiles[group]);v17State.lastAimProfile=group;v17Log('auto_profile',{group});}}
    if(g.weapons.current!==v17State.lastWeapon){v17Log('weapon_change',{from:v17State.lastWeapon,to:g.weapons.current});v17State.lastWeapon=g.weapons.current;}
    v17FpsWatch(now);
    if(now-v17State.lastCanvas>350){v17State.lastCanvas=now;
      // Don't query and redraw hidden analytics canvases every 350ms in live matches.
      if(!flags.fpsBooster||!fpsBoosterCfg.lightweightMenu||(panel.style.display!=='none'&&activeTab.startsWith('v17:')))
      for(const chart of content.querySelectorAll('[data-v17-graph]')){const kind=chart.dataset.v17Graph;
        v17Paint(chart,kind==='fps'?v17State.frames:kind==='ping'?v17Ping:kind==='recoil'?v17State.recoil:v17State.aimPath,kind);}}
    const stats=(!flags.fpsBooster||!fpsBoosterCfg.lightweightMenu||panel.style.display!=='none')?content.querySelector('#v17-live-stats'):null;
    if(stats&&now%1000<120)stats.textContent=v17LiveStats();
  }
  function v17OnShot(now){
    v17State.shots++;v17State.lastShot=now;v17State.lastShotHit=false;
    const w=g.weapons;v17State.recoil.push({x:v17State.shots,y:Math.hypot(Number(w.punchP)||0,Number(w.punchY)||0)*180/Math.PI});
    if(v17State.burstLastShot){const interval=now-v17State.burstLastShot;
      if(interval<=1500){v17State.burstSamples.push(interval);if(v17State.burstSamples.length>100)v17State.burstSamples.shift();}}
    v17State.burstLastShot=now;
    if(v17State.cueBot){const a=angularError(v17State.cueBot);
      if(a<5){v17State.aligned++;v17Log('cue_aligned',{angle:Math.round(a)});} }
    v17Log('shot',{yaw:g.player.yaw||0,pitch:g.player.pitch||0});v18OnShot(now);
  }
  function v17OnDamage(bot,amount,shooter,wasHead){
    if(shooter!==g.player||!bot||bot.team===g.player.team||!Number.isFinite(Number(amount))||Number(amount)<=0)return;
    v18OnDamage(bot,amount,shooter,wasHead);
    // One bullet may cause multiple damage callbacks. Only count once per fired bullet.
    if(performance.now()-v17State.lastShot<500&&!v17State.lastShotHit){
      v17State.hits++;if(wasHead===true)v17State.headHits++;
      v17State.lastShotHit=true;v17Log('hit',{damage:Number(amount),head:wasHead===true});
    }
  }
  const v17LiveStats=()=>{
    const s=v17State,hits=Math.min(s.hits,s.shots),pct=s.shots?Math.round(hits/s.shots*100):0;
    return 'SHOTS '+s.shots+' · HITS '+hits+' · EST. ACCURACY '+pct+'% · HEAD HITS '+s.headHits+' · ALIGNED CUES '+s.aligned+'/'+s.cues;
  };
  function v17SaveFile(name,payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),7000);}
  function v17PickJson(onJson){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.style.display='none';document.body.append(i);
    i.addEventListener('change',async()=>{try{const file=i.files?.[0];if(!file)return;if(file.size>2e6)throw Error('File exceeds 2 MB');
      const obj=JSON.parse(await file.text());onJson(obj);v17Save();}catch(e){notice('V17 import failed: '+e.message)}finally{i.remove()}},{once:true});i.click();}
  function v17ExportConfig(){const settings={};for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);if(key&&/^(deathWon|voidware)/i.test(key))settings[key]=localStorage.getItem(key);
  }v17SaveFile('VOIDWARE_V17_CONFIG.json',{type:'voidware-settings',version:17,settings});}
  function v17ImportConfig(obj){if(obj?.type!=='voidware-settings'||!obj.settings||typeof obj.settings!=='object'||Array.isArray(obj.settings))throw Error('Invalid VOIDWARE config');
    let n=0;for(const [k,val] of Object.entries(obj.settings))if(/^(deathWon|voidware)/i.test(k)&&typeof val==='string'&&val.length<150000){localStorage.setItem(k,val);n++;}
    notice('V17 · Imported '+n+' settings. Reload VOIDWARE to apply the full config.');}
  function v17EquipLoadout(slot){const x=v17.loadouts?.[slot];if(!x)return notice('No saved loadout in slot '+slot);
    if(!v17Gear.includes(x.gun))return notice('Unsupported saved weapon');
    giveGun(x.gun);if(x.aim)v17ApplyAim(x.aim);if(x.fusion?.cfg&&typeof x.fusion.cfg==='object'){
      for(const k of Object.keys(v131Defaults))if(k in x.fusion.cfg)v131Cfg[k]=x.fusion.cfg[k];
      v131Sanitize();v131Save();}
    v17Log('loadout',{slot,gun:x.gun});notice('V17 · Equipped '+slot+' / '+x.gun.toUpperCase());}
  function v17SaveLoadout(slot){v17.loadouts[slot]={gun:g.weapons.current,aim:v17AimSnapshot(),fusion:{cfg:{...v131Cfg}}};v17Save();notice('V17 · Saved '+slot);}
  const v17Note=(parent,msg)=>{const p=document.createElement('p');p.className='v17-sub';p.textContent=msg;parent.append(p)};
  function v17Render(group){
    if(group==='aim'){
      section('V17 // AIM TRAINING LAB','5 practice tools: profiles, hitboxes, aim path, target switching and measured shots.');
      let b=v17Card('01 · Weapon-specific aim profiles','Save a real Legit Aim configuration for each weapon class. Auto-load only when enabled.');
      v17Select(b,'Profile',v17AimGroups.map(s=>[s,s.toUpperCase()]),v17.aimProfile,v=>{v17.aimProfile=v;renderTab()});
      v17Button(b,'Save current Legit settings',v17SaveAim);v17Button(b,'Load selected profile',()=>{if(v17ApplyAim(v17AimCurrent()))notice('V17 · Profile loaded');else notice('Save a profile first')});
      v17Button(b,'Auto weapon profiles: '+(v17.autoAimProfiles?'ON':'OFF'),()=>{v17.autoAimProfiles=!v17.autoAimProfiles;v17State.lastAimProfile=null;renderTab()});
      b=v17Card('02 · Hitbox selector','Sets the original Legit Aim target location.');
      v17Select(b,'Aim bone',[['head','Head'],['upper','Upper torso'],['chest','Chest']],aimBone,v=>{aimBone=v;v17.hitbox=v});
      b=v17Card('03 · Aim path visualizer','Records local camera yaw history. Chart updates while this tab is open.');v17Canvas(b,'aim');
      b=v17Card('04 · Target switching trainer','Cycle through living bots and practice placing your crosshair within 5° before firing.');
      v17Button(b,'Start / next cue',()=>{v17Cue(performance.now());renderTab()});
      v17Button(b,'Stop target cues',()=>{v17State.cueBot=null;renderTab()});
      v17Range(b,'Cue interval (ms)',750,6000,250,v17.cueMs,v=>v17.cueMs=v);
      v17Note(b,'Target: '+(v17State.cueBot?.name|| (v17State.cueBot?'Bot selected':'none'))+' · aligned shots: '+v17State.aligned);
      b=v17Card('05 · Shot accuracy analyzer','Counts confirmed weapon shots and game-reported player damage, not visual hit markers.');
      const s=document.createElement('div');s.id='v17-live-stats';s.textContent=v17LiveStats();b.append(s);
      v17Button(b,'Reset session accuracy',()=>{v17State.shots=0;v17State.hits=0;v17State.headHits=0;v17State.aligned=0;v17State.cues=0;v17State.lastShotHit=false;v17State.events=[];renderTab()});
      v17Note(b,'Accuracy is an estimate; shotgun pellets and delayed damage may be counted differently by the game.');
    } else if(group==='armory'){
      section('V17 // ARMORY STUDIO','5 weapon tools using the existing weapon definition, Weapon Fusion Reactor and Legit settings.');
      let b=v17Card('06 · Recoil Pattern Studio','Actual recorded camera-punch magnitude per fired shot.');v17Canvas(b,'recoil');
      v17Button(b,'Clear recoil recording',()=>{v17State.recoil=[];renderTab()});
      const info=g.weapons.def?.();v17Note(b,'CURRENT: '+(g.weapons.current||'unknown')+' · spread '+Number(info?.sBase||0).toFixed(3)+' · cycle '+Number(info?.cycleTime||0).toFixed(3)+'s');
      b=v17Card('07 · Fusion Reactor 3.0','Advanced donor editor uses your original working Reactor 2.0 underneath. Save, compare and equip.');
      v17Select(b,'Receiver',v17Gear.map(x=>[x,x.toUpperCase()]),paradoxCfg.receiver,v=>{paradoxCfg.receiver=v;paradoxSave()});
      for(const [title,key] of [['Fire donor','fireDonor'],['Damage donor','damageDonor'],['Magazine donor','magDonor'],['Accuracy donor','accuracyDonor']]){
        v17Select(b,title,v17Gear.map(x=>[x,x.toUpperCase()]),v131Cfg[key],v=>{v131Cfg[key]=v;v131Save()});}
      v17Range(b,'Damage multiplier ×100',50,400,10,Math.round(v131Cfg.damageScale*100),v=>{v131Cfg.damageScale=v/100;v131Save()});
      v17Range(b,'Rate multiplier ×100',50,400,10,Math.round(v131Cfg.rateScale*100),v=>{v131Cfg.rateScale=v/100;v131Save()});
      const fusionInfo=document.createElement('div');fusionInfo.className='v17-data';b.append(fusionInfo);
      const showFusion=()=>{const x=v131Stats(),raw=paradoxGetDef(paradoxCfg.receiver);
        fusionInfo.textContent=x&&raw?`BASE ${raw.dmg} DMG / ${raw.mag} AMMO / ${(60/(raw.cycleTime||.1)).toFixed(0)} RPM → FUSION ${x.dmg.toFixed(0)} DMG / ${x.mag} AMMO / ${x.rpm} RPM`:'Select available weapon donors';};showFusion();
      v17Button(b,'Preview Fusion stats',showFusion);
      v17Button(b,'Equip Fusion 3.0',()=>{v131Sanitize();v131EquipFusion();showFusion()});
      v17Button(b,'Open original Fusion 2.0',()=>selectTab('paradox131'));
      b=v17Card('08 · Auto Weapon Profiles','Load your stored aim profiles automatically when the active weapon class changes.');
      v17Button(b,'Automatic profiles: '+(v17.autoAimProfiles?'ON':'OFF'),()=>{v17.autoAimProfiles=!v17.autoAimProfiles;v17State.lastAimProfile=null;renderTab()});
      v17Note(b,'Current class: '+v17WeaponGroup()+'. Profiles are edited in Aim Training.');
      b=v17Card('09 · Burst Timing Trainer','Measures your real shot intervals; does not automatically fire bullets.');
      v17Range(b,'Target burst interval (ms)',80,1200,10,v17.burstMs,v=>v17.burstMs=v);
      const intervals=v17State.burstSamples;const avg=intervals.reduce((sum,n)=>sum+n,0)/Math.max(1,intervals.length);
      v17Note(b,'Measured average: '+(intervals.length?Math.round(avg)+' ms':'not enough shots')+' | target: '+v17.burstMs+' ms | samples: '+intervals.length);
      b=v17Card('10 · Quick Loadout Switcher','4 slots store the weapon ID, aim preferences and fusion donor settings.');
      for(const slot of ['A','B','C','D']){const r=document.createElement('div');r.className='v17-inline';b.append(r);v17Button(r,'Save '+slot,()=>v17SaveLoadout(slot));v17Button(r,'Equip '+slot,()=>v17EquipLoadout(slot));}
    } else if(group==='studio'){
      section('V17 // CONTROL STUDIO','4 utility features: portable configs, adaptive performance, FPS graph, and favorites.');
      let b=v17Card('11 · Config Export & Import','Export VOIDWARE settings into a JSON file or import a previously exported configuration.');
      v17Button(b,'Export JSON Config',v17ExportConfig);v17Button(b,'Import JSON Config',()=>v17PickJson(v17ImportConfig));
      v17Note(b,'Only local VOIDWARE/DEATH WON settings are included. Re-open VOIDWARE after import.');
      b=v17Card('12 · Adaptive Performance Mode','Opt-in FPS threshold. Enables existing FPS Boost if sustained FPS falls below the target.');
      v17Button(b,'Adaptive FPS: '+(v17.adaptiveFPS?'ON':'OFF'),()=>{v17.adaptiveFPS=!v17.adaptiveFPS;
        if(!v17.adaptiveFPS&&v17State.autoEnabledByUs){flags.fpsBooster=false;fpsBoosterEnable(false);v17State.autoEnabledByUs=false;v17State.autoFPS=false;}renderTab()});
      v17Range(b,'Minimum FPS target',25,120,5,v17.fpsFloor,v=>v17.fpsFloor=v);
      b=v17Card('13 · Live FPS & Latency Graph','Shows measured browser frame rate; network latency only if reported by the game.');v17Canvas(b,'fps');
      const ping=Number(g.ping??g.net?.ping);v17Note(b,'Live latency: '+(Number.isFinite(ping)?ping+' ms':'N/A (game does not expose ping)'));if(Number.isFinite(ping))v17Canvas(b,'ping',120);
      b=v17Card('14 · Custom Favorite Tabs','Choose your most-used pages, then move them up/down. This changes only shortcut order, not the original navigation.');
      const favs=(Array.isArray(v17.favorites)?v17.favorites:[]).filter(id=>tabInfo.has(id));
      const opts=tabs.map(t=>[t[0],t[2]]);v17Select(b,'Add favorite',opts,'rage',id=>{v17.favorites=[...new Set([...(v17.favorites||[]),id])];renderTab()});
      for(const id of favs){const r=document.createElement('div');r.className='v17-inline';const t=document.createElement('span');t.className='v17-favname';t.textContent=tabInfo.get(id)?.[2]||id;r.append(t);
        const swap=delta=>{const list=v17.favorites;const a=list.indexOf(id),n=a+delta;if(a<0||n<0||n>=list.length)return;[list[a],list[n]]=[list[n],list[a]];renderTab()};
        v17Button(r,'↑',()=>swap(-1));v17Button(r,'↓',()=>swap(1));v17Button(r,'Open',()=>selectTab(id));v17Button(r,'×',()=>{v17.favorites=v17.favorites.filter(x=>x!==id);renderTab()});b.append(r);}
    } else if(group==='replay'){
      section('V17 // REPLAY ANALYZER','15 · Session event replay, timeline, and offline JSON import/export. Video decoding is not included.');
      const b=v17Card('15 · VOIDWARE Replay Analyzer','Analyzes local shot, hit, aim training, weapon change and FPS events recorded during this session.');
      v17Note(b,v17LiveStats());
      const events=v17State.events,shots=events.filter(e=>e.type==='shot'),hits=events.filter(e=>e.type==='hit');
      const avgFPS=v17State.frames.length?v17State.frames.reduce((s,p)=>s+p.y,0)/v17State.frames.length:0;
      v17Note(b,'SESSION · '+Math.round((performance.now()-v17State.sessionStart)/1000)+'s · '+shots.length+' recorded shots · '+hits.length+' confirmed hits · '+(avgFPS?avgFPS.toFixed(1):'—')+' FPS average');
      v17Button(b,'Export session JSON',()=>v17SaveFile('VOIDWARE_V17_SESSION.json',{type:'voidware-session',version:17,
        recordedAt:new Date().toISOString(),events:v17State.events.slice(),frames:v17State.frames.slice(),aimPath:v17State.aimPath.slice(),recoil:v17State.recoil.slice()}));
      v17Button(b,'Import session JSON',()=>v17PickJson(obj=>{if(obj?.type!=='voidware-session'||!Array.isArray(obj.events))throw Error('Invalid session');
        v17State.events=obj.events.filter(x=>x&&typeof x==='object'&&typeof x.type==='string').slice(-1200);
        v17State.frames=Array.isArray(obj.frames)?obj.frames.filter(x=>Number.isFinite(x?.x)&&Number.isFinite(x?.y)).slice(-450):[];
        v17State.aimPath=Array.isArray(obj.aimPath)?obj.aimPath.filter(x=>Number.isFinite(x?.x)&&Number.isFinite(x?.y)).slice(-450):[];
        v17State.recoil=Array.isArray(obj.recoil)?obj.recoil.filter(x=>Number.isFinite(x?.x)&&Number.isFinite(x?.y)).slice(-200):[];
        renderTab();}));
      v17Button(b,'Clear timeline',()=>{v17State.events=[];renderTab()});
      const timeline=document.createElement('div');timeline.className='v17-timeline';
      const display=events.slice(-24).reverse();if(!display.length)timeline.textContent='No events yet. Fire a weapon or use the target trainer.';
      for(const ev of display){const line=document.createElement('div');line.textContent=(Number(ev.t)/1000).toFixed(1)+'s · '+ev.type+' · '+(ev.gun||'')+' '+(ev.damage?'('+ev.damage+' damage)':'');timeline.append(line);}b.append(timeline);
      v17Note(b,'MP4 videos cannot be evaluated from this in-game panel. Import the JSON telemetry recorded by VOIDWARE.');
    }
  }

  // V17 SKIN LAB — LOCAL COSMETIC PREVIEW / SIMULATED INVENTORY.
  // Never changes Clutcher.io's official inventory, case odds, coins or account data.
  const slKey='voidwareV17SkinLab';
  const slWear=[['Factory New',0,.07],['Minimal Wear',.07,.15],['Field-Tested',.15,.38],['Well-Worn',.38,.45],['Battle-Scarred',.45,1]];
  const slWeapons=[['awp','AWP'],['ak47','AK-47'],['m4a4','M4A4'],['m4a1s','M4A1-S'],['ssg08','SSG 08'],['deagle','Desert Eagle'],['glock','Glock-18'],['usps','USP-S'],['p250','P250'],['fiveseven','Five-SeveN'],['tec9','Tec-9'],['r8','R8 Revolver'],['aug','AUG'],['sg553','SG 553'],['galil','Galil AR'],['famas','FAMAS'],['scar20','SCAR-20'],['g3sg1','G3SG1'],['mp9','MP9'],['mac10','MAC-10'],['p90','P90'],['ump45','UMP-45'],['mp7','MP7'],['mp5sd','MP5-SD'],['bizon','PP-Bizon'],['negev','Negev'],['m249','M249'],['xm1014','XM1014'],['nova','Nova'],['mag7','MAG-7'],['sawedoff','Sawed-Off'],['knife','Knife / Karambit'],['gloves','Gloves (preview)']];
  const slNames={
    awp:['Dragon Lore','Gungnir','Medusa','The Prince','Desert Hydra','Asiimov','Hyper Beast','Lightning Strike','Neo-Noir','Wildfire','Containment Breach','Oni Taiji','Graphite','Fever Dream','BOOM','Chromatic Aberration','Mortis','Sun in Leo','Atheris','Phobos','Exoskeleton'],
    ak47:['Case Hardened','Fire Serpent','Vulcan','Wild Lotus','Gold Arabesque','Bloodsport','Redline','Fuel Injector','Neon Rider','Head Shot','Inheritance','Aquamarine Revenge','Nightwish','The Empress','Frontside Misty','Legion of Anubis','Slate','Elite Build','Ice Coaled'],
    m4a4:['Howl','Asiimov','The Emperor','Temukau','Desolate Space','Buzz Kill','Royal Paladin','In Living Color','Neo-Noir','Poseidon','The Coalition','Red DDPAT','Hellfire'],
    m4a1s:['Printstream','Blue Phosphor','Hot Rod','Welcome to the Jungle','Player Two','Hyper Beast','Golden Coil','Mecha Industries','Chantico’s Fire','Decimator','Nightmare','Black Lotus','Icarus Fell'],
    deagle:['Blaze','Printstream','Code Red','Ocean Drive','Kumicho Dragon','Conspiracy','Emerald Jörmungandr','Hypnotic','Crimson Web','Cobalt Disruption','Mecha Industries','Trigger Discipline'],
    ssg08:['Dragonfire','Blood in the Water','Abyss','Turbo Peek','Big Iron','Fever Dream','Ghost Crusader'],
    glock:['Fade','Gamma Doppler','Water Elemental','Neo-Noir','Bullet Queen','Vogue','Grinder','Dragon Tattoo','Candy Apple'],
    usps:['Kill Confirmed','Printstream','The Traitor','Neo-Noir','Orion','Cortex','Ticket to Hell','Stainless'],
    p250:['See Ya Later','Asiimov','Visions','Muertos','Mehndi','Sand Dune'],
    fiveseven:['Case Hardened','Hyper Beast','Angry Mob','Fairy Tale','Monkey Business'],
    aug:['Akihabara Accept','Chameleon','Syd Mead','Momentum','Aristocrat','Death by Puppy'],
    sg553:['Integrale','Colony IV','Cyrex','Dragon Tech','Pulse'],
    mp9:['Wild Lily','Starlight Protector','Food Chain','Hydra','Mount Fuji'],
    mac10:['Neon Rider','Disco Tech','Stalker','Propaganda','Heat'],
    p90:['Death by Kitty','Asiimov','Emerald Dragon','Trigon','Shallow Grave'],
    negev:['Mjölnir','Power Loader','Loudmouth','Lionfish','Ultralight'],
    xm1014:['Tranquility','Entombed','XOXO','Incinegator'],
    knife:['Case Hardened','Doppler','Gamma Doppler','Fade','Marble Fade','Crimson Web','Slaughter','Tiger Tooth','Lore','Damascus Steel','Blue Steel','Night','Ultraviolet','Vanilla','Black Laminate','Autotronic','Boreal Forest','Forest DDPAT','Safari Mesh','Stained'],
    gloves:['Pandora’s Box','Hedge Maze','Vice','Superconductor','Amphibious','Slingshot','Crimson Kimono','Spearmint','King Snake','Snow Leopard','Omega','Emerald Web','Fade','Case Hardened']
  };
  const slCatalog=Object.entries(slNames).flatMap(([weapon,names])=>names.map(name=>({weapon,name})));
  const slDefault=()=>({items:[],equipped:{},query:'',weapon:'all',name:'Dragon Lore',itemWeapon:'awp',float:0.03420,seed:661,selected:null,stattrak:false,rolls:0});
  let sl={...slDefault()};
  try{const stored=JSON.parse(localStorage.getItem(slKey)||'null');if(stored&&typeof stored==='object'){
    sl={...sl,...stored};if(!Array.isArray(sl.items))sl.items=[];if(!sl.equipped||typeof sl.equipped!=='object')sl.equipped={};
    sl.items=sl.items.slice(-250).filter(x=>x&&typeof x==='object'&&typeof x.name==='string'&&typeof x.weapon==='string');
  }}catch(e){console.warn('[VOIDWARE Skin Lab] Local save unavailable',e)}
  let slNonce=0,slRollTimer=null,slRollEpoch=0,slVisualState={key:'',root:null},slResultsMax=55;
  const slSave=()=>{try{localStorage.setItem(slKey,JSON.stringify(sl))}catch(e){notice('Skin Lab storage full; try removing saved skins')}};
  const slFloat=n=>Math.min(1,Math.max(0,Number(n)||0));
  const slExterior=f=>(slWear.find(w=>slFloat(f)>=w[1]&&(slFloat(f)<w[2]||w[2]===1))||slWear[0])[0];
  const slDefaultFloat=ext=>{const e=slWear.find(w=>w[0]===ext)||slWear[0];return Number(((e[1]+e[2])/2).toFixed(6))};
  const slNormalizeWeapon=id=>id==='knife_karambit'?'knife':id;
  const slWeaponLabel=id=>slWeapons.find(x=>x[0]===id)?.[1]||id.toUpperCase();
  const slHash=s=>{let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0};
  const slColorSet=(name,seed=0)=>{const n=name.toLowerCase();if(n.includes('dragon lore')||n.includes('lore'))return ['#b8a35e','#3f5d39','#d4c692','#6d3c26'];
    if(n.includes('case hardened')){const blues=Math.abs((seed*1103515245+12345)>>>0)%5;return blues>2?['#1a52d6','#0756a2','#b4944d','#123b79']:['#a36b3b','#2e58a1','#d3b37d','#304356'];}
    if(n.includes('fade')||n.includes('doppler'))return ['#2e68d8','#ac4ce1','#fa71a5','#e9af53'];
    if(n.includes('printstream'))return ['#ece8ef','#8c8ea0','#323541','#e6b4d8'];
    if(n.includes('asiimov'))return ['#f8f7ee','#e36d28','#222e38','#e8dbc6'];
    if(n.includes('howl'))return ['#ce4c2f','#221e1c','#bba36d','#7f251f'];
    if(n.includes('gungnir'))return ['#85aedb','#d8dde4','#314e74','#9dc1e0'];
    if(n.includes('emerald')||n.includes('jungle')||n.includes('serpent'))return ['#1b7b5d','#164737','#baaa54','#428a66'];
    if(n.includes('blue')||n.includes('vulcan'))return ['#246cc9','#152237','#7eafdf','#234066'];
    if(n.includes('red')||n.includes('crimson')||n.includes('blood'))return ['#b72749','#40151f','#d26a6d','#1d243a'];
    let hue=slHash(n)%360;return [`hsl(${hue} 68% 48%)`,`hsl(${(hue+26)%360} 48% 26%)`,`hsl(${(hue+170)%360} 65% 72%)`,`hsl(${(hue+55)%360} 55% 39%)`];};
  const slHex=col=>{const cv=document.createElement('canvas');const ctx=cv.getContext('2d');if(!ctx)return 0x8258c2;ctx.fillStyle=col;const s=ctx.fillStyle;return /^#([0-9a-f]{6})$/i.test(s)?parseInt(s.slice(1),16):0x8258c2};
  const slMakeItem=(weapon,name,float,seed,stattrak=false,source='manual')=>({id:'sl-'+Date.now().toString(36)+'-'+(++slNonce).toString(36),weapon,name:String(name||'Custom Finish').slice(0,90),float:slFloat(float),seed:Math.max(0,Math.min(1000,Math.round(Number(seed)||0))),stattrak:!!stattrak,source,date:new Date().toISOString()});
  function slAdd(item,shouldEquip=false){if(sl.items.length>=250)sl.items.shift();sl.items.push(item);sl.selected=item.id;sl.name=item.name;sl.itemWeapon=item.weapon;sl.float=item.float;sl.seed=item.seed;
    if(shouldEquip)sl.equipped[item.weapon]=item.id;slSave();return item;}
  const slFind=id=>sl.items.find(x=>x.id===id)||null;
  const slSelected=()=>slFind(sl.selected);
  function slEquip(item){if(!item)return false;sl.equipped[item.weapon]=item.id;slSave();slVisualState.key='';slPaintGame();notice('LOCAL PREVIEW · '+slWeaponLabel(item.weapon)+' | '+item.name);return true;}
  function slDelete(item){if(!item)return;sl.items=sl.items.filter(x=>x.id!==item.id);if(sl.equipped[item.weapon]===item.id)delete sl.equipped[item.weapon];if(sl.selected===item.id)sl.selected=sl.items.at(-1)?.id||null;slVisualState.key='';resetMaterials();slSave();}
  function slDrawPreview(canvas,item){if(!canvas||!item)return;const dpr=Math.min(window.devicePixelRatio||1,2),w=760,h=248;
    canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');if(!c)return;c.setTransform(dpr,0,0,dpr,0,0);
    const colors=slColorSet(item.name,item.seed),grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#181326');grad.addColorStop(1,'#080c18');c.fillStyle=grad;c.fillRect(0,0,w,h);
    // Original illustrative skin swatch, NOT an extracted/official weapon texture.
    c.save();c.translate(72,27);let shape=[[15,82],[86,64],[120,66],[144,44],[344,44],[354,58],[520,58],[520,71],[610,71],[610,94],[520,94],[520,105],[365,105],[346,117],[272,117],[249,184],[224,184],[202,125],[115,124],[55,145],[20,130]];
    c.beginPath();shape.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
    const p=c.createLinearGradient(0,40,590,140);colors.forEach((s,i)=>p.addColorStop(i/(colors.length-1),s));c.fillStyle=p;c.fillRect(0,0,650,205);
    let seed=(slHash(item.name)^item.seed)>>>0;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<210;i++){const x=random()*630,y=random()*194,r=2+random()*24;
      c.fillStyle=colors[Math.floor(random()*colors.length)];c.globalAlpha=.12+random()*.28;
      c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;const scratches=Math.floor(item.float*100);for(let i=0;i<scratches;i++){
      c.strokeStyle='rgba(12,14,21,.42)';c.lineWidth=.6+random()*2;c.beginPath();let x=random()*630,y=random()*195;c.moveTo(x,y);c.lineTo(x+random()*22,y-random()*6);c.stroke();}
    c.restore();c.fillStyle='rgba(255,255,255,.13)';c.fillRect(112,89,1,66);
    c.font='900 20px system-ui';c.fillStyle='#f5f0ff';c.fillText(slWeaponLabel(item.weapon)+' | '+item.name,18,25);
    c.font='600 12px monospace';c.fillStyle='#c9bddf';c.fillText(slExterior(item.float)+' · FLOAT '+item.float.toFixed(6)+' · PATTERN '+item.seed,20,229);
    c.font='600 10px monospace';c.fillStyle='#b99acb';c.fillText('VOIDWARE CONCEPT PREVIEW · NOT AN OFFICIAL TEXTURE',420,229);
  }
  function slPaintGame(){if(!active)return;const gun=slNormalizeWeapon(g.weapons?.current||'');const item=slFind(sl.equipped[gun]);
    if(!item||gun==='gloves')return; // glove preview is in the lab only: Clutcher model assets aren't guaranteed.
    const root=g.cs2?.rig?._paintGun||g.cs2?.rig?.gun||viewmodel;
    const id=item.id+':'+gun+':'+item.seed+':'+item.float;
    if(slVisualState.key===id&&slVisualState.root===root)return;
    slVisualState={key:id,root};resetMaterials();
    const colors=slColorSet(item.name,item.seed), faded=1-Math.min(.5,item.float*.52);let i=0;
    for(const model of [root,avatar?.heldWeapon]){model?.traverse?.(node=>{
      if(!(node.isMesh||node.isSkinnedMesh)||!node.material)return;
      for(const mat of (Array.isArray(node.material)?node.material:[node.material])){
        if(!mat?.color)continue;
        if(!savedMaterials.has(mat))savedMaterials.set(mat,{color:mat.color.clone(),emissive:mat.emissive?.clone?.()||null});
        try{mat.color.setHex(slHex(colors[(i++ + item.seed)%colors.length]));if(typeof mat.color.multiplyScalar==='function')mat.color.multiplyScalar(faded)}catch(e){}
      }
    })}
  }
  function slPeriodic(now){if(now-(slPeriodic.last||0)<650)return;slPeriodic.last=now;const item=slFind(sl.equipped[slNormalizeWeapon(g.weapons?.current||'')]);
    if(item&&slVisualState.key==='')slPaintGame();}
  function slStop(){slRollEpoch++;if(slRollTimer){clearTimeout(slRollTimer);slRollTimer=null;}slCaseStop();resetMaterials();slVisualState={key:'',root:null};}

  // V17.5 CASE SCREEN STUDIO: a clearly labeled LOCAL visual overlay over the actual Clutcher.io case screen.
  // No network calls or modifications to official case odds, purchases, reward, currency, account, or inventory.
  let slCaseArmed=false,slCaseOverlay=null,slCaseTicker=null,slCaseTimer=null,slCasePending=null,slCaseEpoch=0,slCaseLastTitle='Arms Deal 2 Case',slCaseSequence=0;
  // Default: let the game show its own reel, then completely COVER the original reward.
  // Alternate: retain V17.2's simulated reel. Neither mode changes actual rewards.
  let slCaseMode=sl.caseDisplayMode==='reel'?'reel':'cover';
  const slCaseStyle=document.createElement('style');slCaseStyle.id='voidware-case17-style';slCaseStyle.textContent=`
  #voidware-case17{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
    background:#06070d;color:#f5f1ff;isolation:isolate;
    font:600 14px/1.4 Inter,ui-sans-serif,system-ui,Arial,sans-serif;user-select:none;overflow:hidden}
  #voidware-case17::before{content:"";position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse 60% 55% at 50% 47%,#302044 0%,#0e0e1c 65%,#05050a 100%);opacity:.95}
  #voidware-case17 *{box-sizing:border-box}
  #voidware-case17 .vwcase-shell{isolation:isolate;z-index:1}
  #voidware-case17 .vwcase-win{animation:vwcase-pop .55s cubic-bezier(.2,.9,.2,1) both}
  @keyframes vwcase-pop{from{opacity:0;transform:translateY(17px) scale(.965)}to{opacity:1;transform:none}}
  #voidware-case17 .vwcase-artframe.big{perspective:1250px;overflow:visible}
  #voidware-case17 .vwcase-artframe.big img{object-fit:contain;max-height:100%;
    transform:rotateY(-9deg) rotateX(2deg) translateY(-4px) scale(.94);
    filter:url(#voidware17-whitecut) drop-shadow(0 24px 20px #000b);
    animation:vwcase-show-weapon 6s ease-in-out infinite alternate}
  @keyframes vwcase-show-weapon{from{transform:rotateY(-9deg) rotateX(2deg) translateY(-4px) scale(.94)}
    to{transform:rotateY(8deg) rotateX(-2deg) translateY(-9px) scale(.98)}}
  #voidware-case17 .vwcase-artframe.big>.vwcase-noart{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70%;min-height:55%;display:flex;align-items:center;
    justify-content:center;text-align:center;padding:30px;border:1px solid #654d81;border-radius:16px;
    background:radial-gradient(circle at 50% 45%,#2e2244 0%,#0f1121 68%);font:800 17px/1.5 system-ui;
    color:#c2a8e7;letter-spacing:1.6px;box-shadow:0 25px 65px #0008}
  #voidware-case17 .vwcase-status{padding:6px 12px;border:1px solid #64447c;border-radius:30px;background:#1a1626;color:#e7c8ff;font-size:11px;letter-spacing:1.3px;font-weight:900}
  #voidware-case17 .vwcase-truth{max-width:900px;margin:4px 0 0;color:#b7aac3;font-size:11px}

  #voidware-case17 .vwcase-shell{width:100%;height:100%;position:relative;display:flex;flex-direction:column;align-items:center}
  #voidware-case17 .vwcase-title{position:absolute;top:5.5%;left:5%;width:90%;text-align:center;font-size:clamp(18px,2.1vw,30px);font-weight:850;letter-spacing:-.35px;color:white}
  #voidware-case17 .vwcase-rarity{font-size:clamp(10px,.9vw,13px);font-weight:650;margin-top:7px;color:#c59aff;letter-spacing:.3px}
  #voidware-case17 .vwcase-label{position:absolute;top:1.4%;left:50%;transform:translateX(-50%);font-size:11px;font-weight:900;
    letter-spacing:1.2px;color:#ebcdff;background:#281842;border:1px solid #8559b8;padding:7px 12px;border-radius:8px;white-space:nowrap}
  #voidware-case17 .vwcase-stage{position:relative;width:min(92vw,1300px);margin:auto 0;min-height:280px;display:flex;align-items:center}
  #voidware-case17 .vwcase-window{position:relative;width:100%;height:min(28vh,245px);overflow:hidden;
    mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
  #voidware-case17 .vwcase-track{position:absolute;left:0;top:0;height:100%;display:flex;align-items:stretch;gap:9px;will-change:transform}
  #voidware-case17 .vwcase-card{flex:none;width:230px;display:flex;align-items:center;justify-content:center;flex-direction:column;
    background:linear-gradient(145deg,#373a47 0%,#505461 59%,#2d344b 100%);border-bottom:8px solid var(--tier,#496ee5);border-radius:3px;
    position:relative;box-shadow:inset 0 2px 13px #ffffff12,0 6px 15px #0005;padding:8px;overflow:hidden}
  #voidware-case17 .vwcase-card .vwcase-artframe{width:100%;height:calc(100% - 38px);min-height:90px}
  #voidware-case17 .vwcase-artframe{width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
  #voidware-case17 .vwcase-artframe img{display:block;width:100%;height:100%;object-fit:contain;object-position:center;filter:url(#voidware17-whitecut);transform:scale(.96)}
  #voidware-case17 .vwcase-noart{font:700 10px/1.5 system-ui,Arial;letter-spacing:1.2px;color:#a4a1b6;text-align:center;padding:20px}
  #voidware-case17 .vwcase-artframe.big{width:min(92vw,1120px);height:min(53vh,465px);min-height:220px;filter:drop-shadow(0 18px 23px #0009)}
  #voidware-case17 .vwcase-artframe.big img{object-fit:contain}
  #voidware-case17 .vwcase-card .vwcase-noart{font-size:10px;padding:9px}
  #voidware-case17 .vwcase-meta-small{font-size:10px;letter-spacing:.4px;color:#b3b6c7}
  #voidware-case17 .vwcase-card span{text-align:center;font-size:12px;text-shadow:0 1px 4px #121621;
    font-weight:800;color:white;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
  #voidware-case17 .vwcase-pointer{position:absolute;left:50%;top:-4%;height:108%;width:3px;background:#ffc545;transform:translateX(-50%);
    box-shadow:0 0 12px #ffc54599;z-index:4;pointer-events:none}
  #voidware-case17 .vwcase-lens{position:absolute;width:30%;height:180%;left:35%;top:-45%;border-radius:50%;
    pointer-events:none;background:radial-gradient(ellipse,transparent 43%,#0303098a 80%,#030309cc 100%);z-index:3}
  #voidware-case17 .vwcase-bottom{position:absolute;bottom:5%;width:90%;display:flex;align-items:center;justify-content:center;
    font:600 12px/1.4 ui-sans-serif,system-ui;color:#aaa6b9;text-align:center;gap:14px}
  #voidware-case17 .vwcase-btn{background:#202439;border:1px solid #777392;color:#fff;cursor:pointer;padding:10px 16px;
    border-radius:5px;font:800 12px system-ui;letter-spacing:.4px}
  #voidware-case17 .vwcase-btn:hover{background:#39344f}
  #voidware-case17 .vwcase-btn.primary{background:#55348d;border-color:#c19af4}
  #voidware-case17 .vwcase-win{width:min(96vw,1240px);margin:auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px;max-height:87vh}
  #voidware-case17 .vwcase-win h2{font-size:clamp(22px,2.8vw,37px);margin:0;font-weight:900;letter-spacing:-.5px;color:#fff}
  #voidware-case17 .vwcase-win .vwcase-artframe{flex:1;min-height:210px}
  #voidware-case17 .vwcase-win .vwcase-meta{font-size:clamp(12px,1.2vw,16px);font-weight:750;color:#e3c57b}
  #voidware-case17 .vwcase-win .vwcase-honest{color:#b2a9bc;padding:4px 8px;font-size:11px;max-width:850px}
  #voidware-case17 .vwcase-actions{display:flex;gap:9px;justify-content:center;flex-wrap:wrap}

  /* V17.5: Clutcher-inspired full-screen RESULT layout. The native 3D model cannot be swapped by artwork. */
  #voidware-case17{background:#16171a!important;font-family:Inter,Arial,system-ui,sans-serif!important}
  #voidware-case17::before{background:radial-gradient(ellipse 64% 72% at 50% 45%,#27272c 0%,#1a1b20 55%,#0a0b0d 100%)!important;opacity:1!important}
  #voidware-case17 .vwcase-label{top:17px!important;right:22px!important;bottom:auto!important;left:auto!important;transform:none!important;
    font:800 10px/1.3 Inter,system-ui,sans-serif!important;letter-spacing:1.1px!important;padding:7px 10px!important;
    border:1px solid #7d6696!important;border-radius:4px!important;background:#1a1622de!important;color:#e4d5fa!important;
    z-index:8!important;white-space:normal!important;max-width:270px!important;text-align:center!important}
  #voidware-case17 .vwcase-win{width:min(96vw,1400px)!important;height:100%!important;max-height:none!important;
    margin:0 auto!important;display:flex!important;flex-direction:column!important;gap:0!important;position:relative!important;
    padding:clamp(28px,4.4vh,48px) clamp(12px,2.8vw,40px) clamp(20px,3vh,32px)!important;overflow:hidden!important}
  #voidware-case17 .vwcase-result-head{width:min(74%,810px);margin:0 auto 0;display:flex;align-items:flex-start;gap:16px;
    border-bottom:3px solid #4968ed;padding:0 0 12px;min-height:98px;text-align:left;flex-shrink:0}
  #voidware-case17 .vwcase-crate{font-size:48px;line-height:1;filter:drop-shadow(0 5px 10px #0008);flex-shrink:0}
  #voidware-case17 .vwcase-headlines{display:flex;flex-direction:column;gap:3px;min-width:0}
  #voidware-case17 .vwcase-result-name{font-size:clamp(24px,3.1vw,43px);font-weight:850;line-height:1.12;
    letter-spacing:-.5px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#f9fafb}
  #voidware-case17 .vwcase-result-case{font-size:clamp(11px,1.1vw,15px);font-weight:700;color:#d5d7dc}
  #voidware-case17 .vwcase-result-meta{font:600 clamp(10px,.88vw,12px)/1.6 Inter,Arial,sans-serif;color:#b7b8bf}
  #voidware-case17 .vwcase-result-meta .vwcase-tier{color:#96a8ff}
  #voidware-case17 .vwcase-ref{position:absolute;right:clamp(8px,3vw,46px);top:clamp(75px,9vh,99px);width:clamp(112px,15.5vw,220px);
    height:clamp(94px,17vh,165px);border:1px solid #30333c;background:#0d0f15dd;border-radius:6px;
    display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8px;z-index:3}
  #voidware-case17 .vwcase-ref .vwcase-artframe{height:calc(100% - 15px)!important;width:100%!important}
  #voidware-case17 .vwcase-ref .vwcase-artframe img{filter:drop-shadow(0 3px 3px #0007)!important;transform:none!important}
  #voidware-case17 .vwcase-ref span{font:700 9px/1.3 Inter,system-ui,sans-serif;letter-spacing:1px;color:#9e9fa8}
  #voidware-case17 .vwcase-hero{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:0;overflow:visible;position:relative;padding-top:18px}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big{width:100%!important;height:100%!important;min-height:0!important;
    max-height:none!important;overflow:visible!important;filter:none!important;perspective:1600px!important}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big img{width:100%!important;height:100%!important;max-height:none!important;
    object-fit:contain!important;object-position:center!important;
    filter:drop-shadow(0 20px 18px #000b)!important;transform:scale(1.18) rotateY(var(--vw-yaw,0deg)) rotateX(var(--vw-pitch,0deg))!important;
    transition:transform .14s ease-out!important;animation:none!important;cursor:grab!important}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big img:active{cursor:grabbing!important}
  #voidware-case17 .vwcase-hero .vwcase-noart{max-width:650px!important;min-height:120px!important}
  #voidware-case17 .vwcase-tiptoe{font:700 10px/1.3 Inter,system-ui,sans-serif;color:#888b93;letter-spacing:1px;
    margin-top:-8px;z-index:1}
  #voidware-case17 .vwcase-result-bottom{width:min(96%,920px);margin:0 auto;flex-shrink:0;padding-top:10px;
    border-top:1px solid #41444c;display:flex;flex-direction:column;gap:10px}
  #voidware-case17 .vwcase-result-actions{display:flex;align-items:center;justify-content:space-between;
    gap:8px;flex-wrap:wrap;width:100%}
  #voidware-case17 .vwcase-left-info{font:600 clamp(10px,.95vw,13px)/1.45 Inter,system-ui,sans-serif;
    color:#aeb1ba;margin-right:auto;text-align:left}
  #voidware-case17 .vwcase-left-info strong{color:#95d89a}
  #voidware-case17 .vwcase-result-actions .vwcase-btn{padding:11px 16px!important;border-radius:3px!important;
    font-weight:800!important;border:0!important;background:#30343f!important;white-space:nowrap}
  #voidware-case17 .vwcase-result-actions .vwcase-btn.primary{background:#318c64!important;color:white!important}
  #voidware-case17 .vwcase-disclaimer{font:500 10px/1.5 Inter,system-ui,sans-serif;color:#a3a0ac;
    text-align:center;letter-spacing:.25px}
  #voidware-case17 .vwcase-legacy-footer{display:none!important}
  @media(max-width:720px){
    #voidware-case17 .vwcase-win{padding:64px 12px 20px!important}
    #voidware-case17 .vwcase-label{right:10px!important;top:8px!important;font-size:9px!important}
    #voidware-case17 .vwcase-result-head{width:100%!important;min-height:72px!important;gap:9px!important}
    #voidware-case17 .vwcase-crate{font-size:30px!important}
    #voidware-case17 .vwcase-result-name{font-size:clamp(19px,5vw,30px)!important}
    #voidware-case17 .vwcase-ref{display:none!important}
    #voidware-case17 .vwcase-result-actions{justify-content:center!important}
    #voidware-case17 .vwcase-left-info{width:100%!important;text-align:center!important}
    #voidware-case17 .vwcase-result-actions .vwcase-btn{font-size:10px!important;padding:9px 10px!important}
    #voidware-case17 .vwcase-hero .vwcase-artframe.big img{transform:scale(1.10) rotateY(var(--vw-yaw,0deg))!important}
  }

  /* V17.5 INSPECT EDITION: compact native-inspired treatment, full screen and no overlapping controls. */
  #voidware-case17{background:#151619!important}
  #voidware-case17::before{
    background:
      radial-gradient(ellipse 65% 48% at 50% 44%, #303038a8 0%, transparent 80%),
      repeating-linear-gradient(133deg,#16181b55 0 6px,#21232928 6px 12px),
      linear-gradient(128deg,#202125 0%,#141519 58%,#0c0d0e 100%)!important;
    opacity:1!important}
  #voidware-case17 .vwcase-win{padding-top:clamp(24px,3vh,40px)!important}
  #voidware-case17 .vwcase-result-head{
    width:min(72%,700px)!important;min-height:108px!important;gap:15px!important;
    border-bottom:4px solid var(--vw-rarity,#8754dc)!important;
    padding:0 0 14px!important;
    box-shadow:0 7px 12px -10px var(--vw-rarity,#8754dc);
    transform:translateX(-1.5vw)}
  #voidware-case17 .vwcase-crate{width:142px!important;height:102px!important;display:block!important;flex-shrink:0!important;
    background-position:center!important;background-repeat:no-repeat!important;background-size:contain!important;
    font-size:0!important;filter:drop-shadow(0 12px 15px #0009)!important}
  #voidware-case17 .vwcase-result-name{font-weight:650!important;letter-spacing:-.7px!important;
    font-size:clamp(28px,3vw,42px)!important}
  #voidware-case17 .vwcase-result-case{font-weight:500!important;font-size:clamp(14px,1.3vw,18px)!important}
  #voidware-case17 .vwcase-result-meta{font-weight:450!important;font-size:clamp(11px,1vw,14px)!important}
  #voidware-case17 .vwcase-result-meta .vwcase-tier{color:var(--vw-rarity,#b47aff)!important;font-weight:700!important}
  #voidware-case17 .vwcase-ref{width:clamp(160px,21vw,300px)!important;
    height:clamp(135px,24vh,222px)!important;top:20px!important;right:2%!important;
    border:1px solid #34353c!important;background:#0a0b0de8!important;
    box-shadow:0 12px 30px #0005;z-index:4!important}
  #voidware-case17 .vwcase-ref .vwcase-artframe img{transform:scale(1.1)!important}
  #voidware-case17 .vwcase-ref span{letter-spacing:1.6px!important;font-size:10px!important}
  #voidware-case17 .vwcase-hero{padding:0 0 16px!important;min-height:0!important;position:relative!important;
    background:radial-gradient(ellipse 46% 16% at 50% 64%, #0003,transparent 100%)}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big{
    width:min(94vw,1460px)!important;max-height:65vh!important;height:100%!important;
    touch-action:none;cursor:grab;perspective:1250px!important;transform-style:preserve-3d;
    --vw-yaw:0deg;--vw-pitch:0deg;--vw-zoom:1.00}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big:active{cursor:grabbing}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big img{
    width:100%!important;height:100%!important;pointer-events:none!important;
    transform:rotateY(var(--vw-yaw,0deg)) rotateX(var(--vw-pitch,0deg)) scale(var(--vw-zoom,1.00))!important;
    filter:drop-shadow(0 22px 16px #000c) drop-shadow(0 3px 2px #a1b7ee24)!important;
    transition:transform .1s ease-out!important;will-change:transform}
  #voidware-case17 .vwcase-hero .vwcase-artframe.big[data-dragging='1'] img{transition:none!important}
  #voidware-case17 .vwcase-tiptoe{font-size:10px!important;letter-spacing:1.6px!important;color:#c4c4ca!important;
    opacity:.9;position:absolute;bottom:8px;left:50%;transform:translateX(-50%);margin:0!important;
    white-space:nowrap;pointer-events:none}
  #voidware-case17 .vwcase-viewtools{position:absolute;bottom:20px;right:3%;display:flex;align-items:center;
    gap:5px;z-index:5;background:#0d0e11b8;border:1px solid #40414a;
    padding:4px;border-radius:6px;box-shadow:0 8px 30px #0006}
  #voidware-case17 .vwcase-viewtools button{background:#2c2d34;color:#ececf3;border:1px solid #555762;
    border-radius:4px;min-width:34px;height:32px;padding:4px 10px;font:700 12px system-ui;cursor:pointer}
  #voidware-case17 .vwcase-viewtools button:hover{background:#4d4068;border-color:#a888d5}
  #voidware-case17 .vwcase-viewtools output{font:700 11px system-ui;color:#d0bedf;padding:0 6px;min-width:45px;text-align:center}
  #voidware-case17 .vwcase-result-bottom{width:min(94%,960px)!important;margin:0 auto!important;
    padding-top:12px!important;gap:8px!important;border-top:1px solid #44474d!important}
  #voidware-case17 .vwcase-result-actions{flex-wrap:nowrap!important;gap:12px!important}
  #voidware-case17 .vwcase-result-actions .vwcase-btn{background:transparent!important;
    border:1px solid #464851!important;border-radius:3px!important;padding:11px 14px!important;
    transition:background .15s,border-color .15s}
  #voidware-case17 .vwcase-result-actions .vwcase-btn.primary{background:#1b9063!important;
    border-color:#2ca87c!important}
  #voidware-case17 .vwcase-result-actions .vwcase-btn:hover{background:#464752!important}
  #voidware-case17 .vwcase-result-actions .vwcase-btn.primary:hover{background:#35ac82!important}
  #voidware-case17 .vwcase-label{background:#15101fd8!important;right:12px!important;bottom:12px!important;top:auto!important;
    border:1px solid #5c456e!important;border-radius:3px!important;font-size:10px!important;padding:5px 8px!important}
  #voidware-case17 .vwcase-disclaimer{color:#8f929d!important;letter-spacing:.1px!important}
  #voidware-case17 .vwcase-statuspill{display:inline-flex;align-items:center;gap:6px;color:#d7b6ff;
    font-size:10px;font-weight:750;letter-spacing:.7px}
  #voidware-case17 .vwcase-statuspill::before{content:'';background:#a76af3;border-radius:50%;width:6px;height:6px}
  @media(max-width:890px){
    #voidware-case17 .vwcase-result-head{width:min(100%,670px)!important;transform:none!important;min-height:78px!important}
    #voidware-case17 .vwcase-ref{width:155px!important;height:110px!important;top:145px!important;opacity:.95}
    #voidware-case17 .vwcase-crate{width:98px!important;height:82px!important}
    #voidware-case17 .vwcase-viewtools{bottom:26px;right:1%}
    #voidware-case17 .vwcase-result-actions{flex-wrap:wrap!important;justify-content:center!important}
    #voidware-case17 .vwcase-left-info{width:100%!important;text-align:center!important}
  }
  @media(max-width:600px){
    #voidware-case17 .vwcase-win{padding:54px 12px 36px!important}
    #voidware-case17 .vwcase-label{font-size:9px!important;right:6px!important;bottom:4px!important}
    #voidware-case17 .vwcase-ref{display:none!important}
    #voidware-case17 .vwcase-result-head{gap:8px!important;min-height:80px!important}
    #voidware-case17 .vwcase-crate{width:62px!important;height:65px!important}
    #voidware-case17 .vwcase-result-name{font-size:clamp(18px,5vw,28px)!important}
    #voidware-case17 .vwcase-result-case{font-size:12px!important}
    #voidware-case17 .vwcase-result-meta{font-size:10px!important}
    #voidware-case17 .vwcase-tiptoe{font-size:8px!important;bottom:58px!important;letter-spacing:.5px!important}
    #voidware-case17 .vwcase-viewtools{left:50%!important;right:auto!important;transform:translateX(-50%);bottom:8px!important}
    #voidware-case17 .vwcase-result-actions .vwcase-btn{font-size:10px!important;padding:9px 9px!important}
    #voidware-case17 .vwcase-disclaimer{font-size:9px!important}
  }
  `;document.head.append(slCaseStyle);
  const slCaseTier=name=>/dragon lore|gungnir|medusa|case hardened|howl|wild lotus|gold arabesque|pandora/i.test(name)?'#d6a639':/doppler|fade|asiimov|printstream|vulcan|redline/i.test(name)?'#d65477':'#556ff1';
  // Real 2D catalogue artwork, *not* a simulated texture. No fake 3D model or canvas cutout.
  // The two featured AWP images are provided by public skin reference sites and loaded by the browser.
  // Other skins can resolve through the public CSGO-API catalogue; blocked/offline network => labeled fallback.
  const slArtFeatured=new Map([
    ['awp|gungnir','data:image/webp;base64,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'],
    ['awp|dragon lore','https://acdn.mitiendanube.com/stores/002/274/213/products/ccf9052b6fd962be8a573ba249baeaa2_large_preview1-53ec7e0691a2f0b23e16860170197998-1024-1024.png']
  ]);
  const slArtKey=(weapon,name)=>String(weapon||'').toLowerCase().replace(/[^a-z0-9]/g,'')+'|'+String(name||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,' ');
  let slArtIndexPromise=null;
  const slFindArt=async item=>{
    const key=slArtKey(item.weapon,item.name);
    if(slArtFeatured.has(key))return slArtFeatured.get(key);
    if(!slArtIndexPromise){slArtIndexPromise=fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',{cache:'force-cache'})
      .then(res=>{if(!res.ok)throw Error('Artwork catalogue unavailable');return res.json()})
      .then(items=>{const map=new Map();for(const data of (Array.isArray(items)?items:[])){
        const weapon=data.weapon?.name||data.weapon?.id||'';
        const finish=String(data.name||'').split('|').slice(1).join('|').trim();
        if(data.image&&finish)map.set(slArtKey(weapon,finish),data.image);
      }return map}).catch(()=>new Map());}
    return (await slArtIndexPromise).get(key)||'';
  };
  function slCaseArtwork(item,isBig){
    const frame=document.createElement('div');frame.className='vwcase-artframe'+(isBig?' big':'');
    const hint=document.createElement('div');hint.className='vwcase-noart';
    hint.textContent='LOADING 2D SKIN ART…';frame.append(hint);
    // 2D skin illustration never changes a weapon texture, 3D case mesh, or real drop.
    slFindArt(item).then(url=>{
      if(!frame.isConnected&&frame.dataset.ready==='closed')return;
      if(!url){hint.textContent='NO VERIFIED ARTWORK FOR THIS FINISH';frame.dataset.status='unavailable';return;}
      const img=document.createElement('img');img.alt=slWeaponLabel(item.weapon)+' | '+item.name+' — 2D skin reference';
      img.decoding='async';img.loading=isBig?'eager':'lazy';
      img.addEventListener('load',()=>{hint.remove();frame.dataset.status='loaded'},{once:true});
      img.addEventListener('error',()=>{img.remove();hint.textContent='SKIN ART UNAVAILABLE — HOST BLOCKED OR OFFLINE';frame.dataset.status='unavailable'},{once:true});
      img.src=url;frame.append(img);
    }).catch(()=>{hint.textContent='SKIN ART UNAVAILABLE'});
    return frame;
  }
  function slCaseClose(){if(slCasePending){clearTimeout(slCasePending);slCasePending=null;}slCaseEpoch++;if(slCaseTimer){clearTimeout(slCaseTimer);slCaseTimer=null;}slCaseOverlay?.remove();slCaseOverlay=null;}
  function slCaseStop(){slCaseArmed=false;slCaseClose();if(slCaseTicker){clearInterval(slCaseTicker);slCaseTicker=null;}window.removeEventListener('keydown',slCaseHotkey,true);slCaseStyle.remove();}
  function slCaseWin(node,shell,title,stage,footer,reward,epoch){
    if(epoch!==slCaseEpoch||!active||!node.isConnected)return false;
    // Local-only simulated item; no real game reward, account or inventory changes.
    const localItem=slAdd(reward);
    stage?.remove();title?.remove();footer?.parentElement?.remove();
    const win=document.createElement('div');win.className='vwcase-win';win.style.setProperty('--vw-rarity',slCaseTier(localItem.name));
    const head=document.createElement('header');head.className='vwcase-result-head';
    const crate=document.createElement('span');crate.className='vwcase-crate';crate.style.backgroundImage='url("data:image/webp;base64,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")';crate.setAttribute('aria-hidden','true');
    const lines=document.createElement('div');lines.className='vwcase-headlines';
    const name=document.createElement('div');name.className='vwcase-result-name';name.textContent=slWeaponLabel(localItem.weapon)+' | '+localItem.name;
    const casename=document.createElement('div');casename.className='vwcase-result-case';casename.textContent=slCaseLastTitle;
    const details=document.createElement('div');details.className='vwcase-result-meta';
    const tier=document.createElement('span');tier.className='vwcase-tier';tier.textContent='SIMULATED';
    details.append(tier,document.createTextNode(' · '+slExterior(localItem.float)+' · Pattern '+localItem.seed+' · Float '+localItem.float.toFixed(6)));
    lines.append(name,casename,details);head.append(crate,lines);win.append(head);
    const ref=document.createElement('aside');ref.className='vwcase-ref';ref.append(slCaseArtwork(localItem,false));
    const refLabel=document.createElement('span');refLabel.textContent='2D REFERENCE';ref.append(refLabel);win.append(ref);
    const hero=document.createElement('main');hero.className='vwcase-hero';
    const art=slCaseArtwork(localItem,true);hero.append(art);
    const inspect=document.createElement('div');inspect.className='vwcase-tiptoe';inspect.textContent='DRAG TO INSPECT · SCROLL TO ZOOM · DOUBLE-CLICK TO RESET';hero.append(inspect);
    let dragging=false,clientX=0,clientY=0, yaw=0,pitch=0,baseYaw=0,basePitch=0,zoom=1.00;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const view=()=>{art.style.setProperty('--vw-yaw',yaw.toFixed(1)+'deg');art.style.setProperty('--vw-pitch',pitch.toFixed(1)+'deg');art.style.setProperty('--vw-zoom',zoom.toFixed(2));
      const z=hero.querySelector('.vwcase-zoomvalue');if(z)z.textContent=Math.round(zoom/1.00*100)+'%';};
    const reset=()=>{yaw=0;pitch=0;zoom=1.00;view()};
    art.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dragging=true;clientX=e.clientX;clientY=e.clientY;baseYaw=yaw;basePitch=pitch;art.dataset.dragging='1';art.setPointerCapture?.(e.pointerId)});
    art.addEventListener('pointermove',e=>{if(!dragging)return;
      yaw=clamp(baseYaw+(e.clientX-clientX)/12,-22,22);
      pitch=clamp(basePitch-(e.clientY-clientY)/18,-12,12);view()});
    const release=()=>{dragging=false;delete art.dataset.dragging};
    art.addEventListener('pointerup',release);art.addEventListener('pointercancel',release);art.addEventListener('lostpointercapture',release);
    art.addEventListener('dblclick',reset);
    art.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+(e.deltaY<0?.1:-.1),.76,1.7);view()},{passive:false});
    const viewtools=document.createElement('div');viewtools.className='vwcase-viewtools';
    const mkViewButton=(label,tip,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=tip;b.addEventListener('click',fn);viewtools.append(b);return b;};
    mkViewButton('−','Zoom out',()=>{zoom=clamp(zoom-.12,.76,1.7);view()});
    const zLabel=document.createElement('output');zLabel.className='vwcase-zoomvalue';viewtools.append(zLabel);
    mkViewButton('+','Zoom in',()=>{zoom=clamp(zoom+.12,.76,1.7);view()});
    mkViewButton('↺','Reset weapon view',reset);
    hero.append(viewtools);view();
    win.append(hero);
    const bottom=document.createElement('footer');bottom.className='vwcase-result-bottom';
    const actionRow=document.createElement('div');actionRow.className='vwcase-result-actions';
    const info=document.createElement('div');info.className='vwcase-left-info';
    const lead=document.createElement('strong');lead.textContent='LOCAL SHOWCASE SAVED';
    info.append(lead,document.createTextNode(' · VOIDWARE inventory only'));actionRow.append(info);
    const equip=document.createElement('button');equip.type='button';equip.className='vwcase-btn primary';equip.textContent='EQUIP PREVIEW';equip.addEventListener('click',()=>{slEquip(localItem);slCaseClose()});actionRow.append(equip);
    const close=document.createElement('button');close.type='button';close.className='vwcase-btn';close.textContent='VIEW REAL 3D DROP';close.addEventListener('click',slCaseClose);actionRow.append(close);
    bottom.append(actionRow);
    const truth=document.createElement('div');truth.className='vwcase-disclaimer';
    truth.textContent='2D CONCEPT PREVIEW — The actual 3D weapon and real case reward remain unchanged. Close to see the real drop.';bottom.append(truth);
    win.append(bottom);shell.append(win);v18Celebrate(shell);
    return true;
  }
  function slCaseQueueCover(caseTitle){
    if(!active||slCaseOverlay||slCasePending)return false;
    slCaseArmed=false;slCaseLastTitle=caseTitle||slCaseLastTitle;
    // The REAL Clutcher case reel stays visible. The user-requested opaque screen appears at result time.
    // Timing is an approximation based on the supplied recording. Shift+K can manually show it earlier.
    slCasePending=setTimeout(()=>{slCasePending=null;slCaseStart(slCaseLastTitle,false,true);},5000);
    return true;
  }

  function slCaseStart(caseTitle='Arms Deal 2 Case',isDemo=false,showOnly=false){if(!active||slCaseOverlay)return false;
    // Visual layer ONLY: genuine game code and official outcome are left completely untouched.
    slCaseArmed=false;slCaseLastTitle=caseTitle||slCaseLastTitle;const epoch=++slCaseEpoch;
    const selected=slSelected(),reward=slMakeItem(selected?.weapon||sl.itemWeapon||'awp',selected?.name||sl.name||'Dragon Lore',selected?.float??sl.float,selected?.seed??sl.seed,selected?.stattrak??false,'case-screen-simulation');
    const node=document.createElement('div');node.id='voidware-case17';node.setAttribute('role','dialog');node.setAttribute('aria-label','VOIDWARE simulated case screen');
    const shell=document.createElement('div');shell.className='vwcase-shell';node.append(shell);
    // A display-only SVG filter removes near-white thumbnail backdrops. It never reads external pixels.
    const effects=document.createElementNS('http://www.w3.org/2000/svg','svg');effects.setAttribute('width','0');effects.setAttribute('height','0');
    effects.innerHTML='<filter id="voidware17-whitecut"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -2 -2 -2 6 0"/></filter>';
    node.append(effects);
    const tag=document.createElement('div');tag.className='vwcase-label';tag.textContent='VOIDWARE V17.5 · SIMULATION';shell.append(tag);
    const title=document.createElement('div');title.className='vwcase-title';title.textContent='Opening: '+slCaseLastTitle;
    const rarity=document.createElement('div');rarity.className='vwcase-rarity';rarity.textContent=(isDemo?'DEMO / NO CASE PURCHASE · ':'')+'LOCAL DISPLAY ONLY · GAME ODDS AND REWARDS UNCHANGED';title.append(rarity);shell.append(title);
    const stage=document.createElement('div');stage.className='vwcase-stage';shell.append(stage);
    const windowEl=document.createElement('div');windowEl.className='vwcase-window';stage.append(windowEl);
    const track=document.createElement('div');track.className='vwcase-track';windowEl.append(track);
    const lens=document.createElement('div');lens.className='vwcase-lens';stage.append(lens);
    const pointer=document.createElement('div');pointer.className='vwcase-pointer';stage.append(pointer);
    const bottom=document.createElement('div');bottom.className='vwcase-bottom';shell.append(bottom);
    const footer=document.createElement('span');footer.textContent='SIMULATED RESULT • Press ESC to cancel';bottom.append(footer);
    const dismiss=document.createElement('button');dismiss.className='vwcase-btn';dismiss.textContent='CLOSE PREVIEW';dismiss.addEventListener('click',slCaseClose);bottom.append(dismiss);
    const candidates=slCatalog.filter(x=>x.weapon!=='gloves');const names=Array.from({length:34},(_,i)=>i===24?reward:candidates[Math.floor(Math.random()*candidates.length)]);
    if(!showOnly)for(const item of names){const card=document.createElement('div');card.className='vwcase-card';card.style.setProperty('--tier',slCaseTier(item.name));
      const art=slCaseArtwork(item,false);card.append(art);
      const label=document.createElement('span');label.textContent=slWeaponLabel(item.weapon)+' | '+item.name;card.append(label);track.append(card);}
    document.body.append(node);slCaseOverlay=node;
    if(showOnly){
      slCaseWin(node,shell,title,stage,footer,reward,epoch);
      return true;
    }
    // Align center of 25th card with yellow stop marker.
    const spin=()=>{if(epoch!==slCaseEpoch||!node.isConnected)return;const w=windowEl.clientWidth;
      const center=24*239+115-w/2;
      track.style.transform='translateX(0px)';windowEl.offsetWidth;
      track.style.transition='transform 5.1s cubic-bezier(.075,.7,.14,1)';track.style.transform='translateX('+(-center)+'px)';};
    requestAnimationFrame(()=>requestAnimationFrame(spin));
    slCaseTimer=setTimeout(()=>{slCaseTimer=null;if(epoch!==slCaseEpoch||!active||!node.isConnected)return;
      slCaseWin(node,shell,title,stage,footer,reward,epoch);
    },5300);
    return true;
  }
  function slCaseHotkey(e){if(!active)return;
    if(e.code==='Escape'&&slCaseOverlay){e.preventDefault();e.stopImmediatePropagation();slCaseClose();return;}
    if(e.code==='KeyK'&&e.shiftKey&&!slCaseOverlay&&(slCaseArmed||slCasePending)){e.preventDefault();e.stopImmediatePropagation();if(slCasePending){clearTimeout(slCasePending);slCasePending=null;}slCaseStart(slCaseLastTitle,false,slCaseMode==='cover');}
  }
  window.addEventListener('keydown',slCaseHotkey,true);
  // Detect the visible case UI shown in the supplied clip; this may vary between game updates.
  // Never observe/store official drops; only look for the UI's opening label.
  slCaseTicker=setInterval(()=>{if(!active||!slCaseArmed||slCaseOverlay||slCasePending)return;
    try{const raw=document.body.innerText||'';
      const m=raw.match(/Opening\s*:\s*([A-Za-z0-9 _\-']{2,55}Case)/i);
      if(m){if(slCaseMode==='cover')slCaseQueueCover(m[1].trim());else slCaseStart(m[1].trim(),false);}
    }catch(e){}},220);

  const slField=(parent,label,val,fn,type='text')=>{const box=document.createElement('label');box.className='sl-field';box.textContent=label;
    const input=document.createElement('input');input.type=type;input.value=val;input.autocomplete='off';input.addEventListener(type==='range'?'input':'change',()=>fn(input.value));
    box.append(input);parent.append(box);return input;};
  function slRender(){section('V17 // SKIN LAB','Search, customize, and equip local-only finish previews. Your items live in VOIDWARE storage, not Clutcher’s real inventory.');
    const disclaimer=document.createElement('div');disclaimer.className='sl-notice';disclaimer.textContent='LOCAL COSMETIC SANDBOX — not Steam or Clutcher.io inventory. Does not grant official skins, coins, textures, tradable items, or real case rewards.';content.append(disclaimer);
    const layout=document.createElement('div');layout.className='sl-layout';content.append(layout);
    const left=document.createElement('div');left.className='sl-column';const right=document.createElement('div');right.className='sl-column';layout.append(left,right);
    const c1=document.createElement('div');c1.className='sl-panel';left.append(c1);
    const head=document.createElement('h3');head.textContent='01 / SKIN SEARCH';c1.append(head);
    const line=document.createElement('div');line.className='sl-line';c1.append(line);
    const search=slField(line,'Search finishes / type ANY custom skin name',sl.query||'',v=>{sl.query=v;slSave()});
    search.id='sl-search';search.placeholder='Dragon Lore, Case Hardened, Gungnir…';search.addEventListener('input',()=>{sl.query=search.value;slSave();drawResults()});
    const wsel=v17Select(line,'Weapon',[['all','All weapons'],...slWeapons],sl.weapon||'all',v=>{sl.weapon=v;drawResults()});wsel.id='sl-weapon-filter';
    const matches=document.createElement('div');matches.className='sl-results';matches.id='sl-results';c1.append(matches);
    function selectName(name,weapon){sl.name=name;sl.itemWeapon=weapon;sl.selected=null;slSave();refreshEditor();}
    function drawResults(){matches.replaceChildren();const q=String(sl.query||'').toLowerCase().trim();const found=slCatalog.filter(p=>(sl.weapon==='all'||p.weapon===sl.weapon)&&(!q||(p.name+' '+slWeaponLabel(p.weapon)).toLowerCase().includes(q))).slice(0,slResultsMax);
      for(const entry of found){const b=document.createElement('button');b.className='sl-result';b.type='button';b.textContent=slWeaponLabel(entry.weapon)+' · '+entry.name;b.addEventListener('click',()=>selectName(entry.name,entry.weapon));matches.append(b)}
      if(q){const create=document.createElement('button');create.type='button';create.className='sl-result sl-custom';create.textContent='＋ USE CUSTOM FINISH: '+sl.query.slice(0,55);create.addEventListener('click',()=>selectName(sl.query.slice(0,90),sl.weapon==='all'?'awp':sl.weapon));matches.append(create)}
      if(!found.length&&!q){const none=document.createElement('p');none.textContent='No results for selected weapon';matches.append(none)}
    }
    drawResults();
    const c2=document.createElement('div');c2.className='sl-panel';left.append(c2);
    const title2=document.createElement('h3');title2.textContent='02 / INSPECT & CUSTOMIZE';c2.append(title2);
    const editRoot=document.createElement('div');editRoot.id='sl-editor';c2.append(editRoot);
    const previewPanel=document.createElement('div');previewPanel.className='sl-panel';right.append(previewPanel);
    const pt=document.createElement('h3');pt.textContent='03 / FINISH PREVIEW';previewPanel.append(pt);
    const cv=document.createElement('canvas');cv.className='sl-preview';cv.id='sl-preview';cv.style.width='100%';previewPanel.append(cv);
    const inf=document.createElement('div');inf.className='sl-muted';inf.textContent='Concept art and approximate model recolor. Exact CS2 skin artwork, wear masks, and pattern templates are not included in Clutcher assets.';previewPanel.append(inf);
    function refreshEditor(){editRoot.replaceChildren();const item=slSelected()||{weapon:sl.itemWeapon||'awp',name:sl.name||'Dragon Lore',float:sl.float,seed:sl.seed,stattrak:sl.stattrak};
      const itemName=slField(editRoot,'Finish name',item.name,v=>{sl.name=v.slice(0,90);if(slSelected())slSelected().name=sl.name;slSave();slDrawPreview(cv,{...item,name:sl.name})});itemName.id='sl-name';
      const weaponField=v17Select(editRoot,'Weapon / model',slWeapons,item.weapon,v=>{sl.itemWeapon=v;if(slSelected())slSelected().weapon=v;slSave();slDrawPreview(cv,{...item,weapon:v})});weaponField.id='sl-equip-weapon';
      const ext=v17Select(editRoot,'Exterior condition',slWear.map(e=>[e[0],e[0]]),slExterior(item.float),val=>{const f=slDefaultFloat(val);sl.float=f;if(slSelected())slSelected().float=f;slSave();refreshEditor()});ext.id='sl-wear';
      const fl=slField(editRoot,'Float · exact value 0.000000–1.000000',Number(item.float).toFixed(6),v=>{const x=slFloat(v);sl.float=x;if(slSelected())slSelected().float=x;slSave();ext.value=slExterior(x);slDrawPreview(cv,{...item,float:x})},'number');fl.min='0';fl.max='1';fl.step='.000001';fl.id='sl-float';
      const sd=slField(editRoot,'Paint seed · 0–1000',item.seed,v=>{let x=Math.max(0,Math.min(1000,Math.round(Number(v)||0)));sl.seed=x;if(slSelected())slSelected().seed=x;slSave();slDrawPreview(cv,{...item,seed:x})},'number');sd.min='0';sd.max='1000';sd.step='1';sd.id='sl-seed';
      const btns=document.createElement('div');btns.className='sl-buttons';editRoot.append(btns);
      const randomSeed=v17Button(btns,'🎲 RANDOM SEED',()=>{sl.seed=Math.floor(Math.random()*1001);if(slSelected())slSelected().seed=sl.seed;refreshEditor()});
      const add=v17Button(btns,'＋ ADD TO LOCAL INVENTORY',()=>{const i=slAdd(slMakeItem(sl.itemWeapon,sl.name,sl.float,sl.seed,sl.stattrak));notice('Added locally: '+i.name);refreshEditor();drawInv()});add.id='sl-add';
      const eq=v17Button(btns,'✓ EQUIP LOCAL PREVIEW',()=>{let i=slSelected();if(!i)i=slAdd(slMakeItem(sl.itemWeapon,sl.name,sl.float,sl.seed,sl.stattrak));slEquip(i);refreshEditor();drawInv()});eq.id='sl-equip';
      slDrawPreview(cv,item);
    }
    const invPanel=document.createElement('div');invPanel.className='sl-panel';right.append(invPanel);const it=document.createElement('h3');it.textContent='04 / VOIDWARE INVENTORY';invPanel.append(it);
    const inv=document.createElement('div');inv.className='sl-inventory';inv.id='sl-inventory';invPanel.append(inv);
    function drawInv(){inv.replaceChildren();const l=[...sl.items].reverse();if(!l.length){inv.textContent='No local items yet. Add a custom skin or stage a simulated reveal on the real Cases screen.';return}
      for(const item of l.slice(0,60)){const cell=document.createElement('div');cell.className='sl-inv-item';if(sl.selected===item.id)cell.classList.add('selected');
        const label=document.createElement('button');label.type='button';label.textContent=(sl.equipped[item.weapon]===item.id?'★ ':'')+slWeaponLabel(item.weapon)+' | '+item.name+' · '+slExterior(item.float)+' · #'+item.seed;
        label.addEventListener('click',()=>{sl.selected=item.id;sl.itemWeapon=item.weapon;sl.name=item.name;sl.float=item.float;sl.seed=item.seed;slSave();refreshEditor();drawInv()});
        const equip=document.createElement('button');equip.type='button';equip.textContent='EQUIP';equip.addEventListener('click',()=>{sl.selected=item.id;slEquip(item);drawInv()});
        const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Remove from local inventory';del.addEventListener('click',()=>{slDelete(item);refreshEditor();drawInv()});cell.append(label,equip,del);inv.append(cell)}
    }
    refreshEditor();drawInv();
    const rollPanel=document.createElement('div');rollPanel.className='sl-panel sl-roll-panel';content.append(rollPanel);
    const rh=document.createElement('h3');rh.textContent='05 / REAL CASE SCREEN OVERLAY';rollPanel.append(rh);
    const simDesc=document.createElement('div');simDesc.className='sl-muted';simDesc.textContent='DEFAULT: play the REAL Clutcher.io case reel. After the roll, VOIDWARE places an OPAQUE showcase over the real result—no duplicated gun behind it. The fake item is added only to VOIDWARE local inventory. Timing may vary by game version.';rollPanel.append(simDesc);
    const displayMode=v17Select(rollPanel,'Case overlay display',[['cover','REAL case reel → cover the final drop (recommended)'],['reel','VOIDWARE simulated reel + cover']],slCaseMode,v=>{slCaseMode=v==='reel'?'reel':'cover';sl.caseDisplayMode=slCaseMode;slSave();});displayMode.id='sl-case-mode';
    const rollBtns=document.createElement('div');rollBtns.className='sl-buttons';rollPanel.append(rollBtns);
    const arm=v17Button(rollBtns,'🐉 ARM NEXT CASE REVEAL',()=>{slCaseArmed=true;notice('Local case overlay ARMED · game reel first · Shift+K = show early');});arm.id='sl-case-arm';
    const demo=v17Button(rollBtns,'👁 TEST REWARD COVER (FREE)',()=>{hideMenu();slCaseStart('Arms Deal 2 Case',true,true)});demo.id='sl-case-demo';
    const disarm=v17Button(rollBtns,'× DISARM / CANCEL',()=>{slCaseArmed=false;slCaseClose();notice('Case visual disarmed')});disarm.id='sl-case-disarm';
    const note=document.createElement('p');note.className='sl-muted';note.textContent='While armed, open a real case. V17.5 leaves the original roll visible for about 5 seconds before covering the result completely. Shift+K reveals early; Esc cancels. This is a 2D preview with perspective animation, not a cloned 3D Clutcher weapon. The real drop returns when you close the overlay.';rollPanel.append(note);
    v17Button(rollBtns,'EXPORT LOCAL INVENTORY',()=>v17SaveFile('VOIDWARE_SKIN_LAB_INVENTORY.json',{type:'voidware-local-skins',version:1,items:sl.items,equipped:sl.equipped}));
    v17Button(rollBtns,'IMPORT LOCAL INVENTORY',()=>v17PickJson(obj=>{if(obj?.type!=='voidware-local-skins'||!Array.isArray(obj.items))throw Error('Invalid local inventory');
      const loaded=obj.items.slice(0,250).filter(x=>x&&typeof x.name==='string'&&typeof x.weapon==='string'&&slWeapons.some(w=>w[0]===x.weapon));
      sl.items=loaded.map(x=>slMakeItem(x.weapon,x.name,x.float,x.seed,x.stattrak,x.source));sl.selected=sl.items.at(-1)?.id||null;sl.equipped={};slSave();renderTab();}));
  }

  const v14VisualActive=()=>v14Catalog.some(p=>p.group==='visuals'&&flags[p.flag])||v14Enabled('arena',7)||v14Enabled('arena',8)||performance.now()<v14MarkUntil;
  panel.querySelector('.dw-supermeta').title=tabs.length+' available pages';
  // VOIDWARE V18: fifteen opt-in local-bot practice, skin and HUD tools.
  // Additive to V17.5. No account / server inventory changes, no anti-cheat operations.
  const v18Storage='voidwareV18Settings';
  const v18Defaults=()=>({smartSwitch:false,adaptive:false,nearFov:24,farFov:7,nearStrength:28,farStrength:10,
    wallEstimate:true,penetration:38,peekTrainer:false,peekThreshold:2.4,blueSeed:661,
    stickers:[],stickerText:'★',stickerScale:1,stickerRotation:0,
    combos:{},activeCombo:'A',caseEffects:true,caseSound:false,
    hudEnabled:false,hudEdit:false,hudX:24,hudY:24,hudSize:100,hudAccent:'#b88dff',crosshairType:'dot',
    recording:false,recordings:[],profiles:{},replayIndex:0});
  const v18={...v18Defaults()};
  try{const saved=JSON.parse(localStorage.getItem(v18Storage)||'{}');if(saved&&typeof saved==='object'){
    for(const key of Object.keys(v18))if(Object.prototype.hasOwnProperty.call(saved,key))v18[key]=saved[key];
    if(!Array.isArray(v18.stickers))v18.stickers=[];
    if(!Array.isArray(v18.recordings))v18.recordings=[];
    if(!v18.combos||typeof v18.combos!=='object')v18.combos={};
    if(!v18.profiles||typeof v18.profiles!=='object')v18.profiles={};
  }}catch{}
  const v18Save=()=>{try{const state={...v18,hudEdit:false,recording:false};localStorage.setItem(v18Storage,JSON.stringify(state))}catch(e){console.warn('[VOIDWARE V18] Storage unavailable:',e)}};
  const v18State={lastDeath:new WeakMap(),kills:[],frames:[],movement:[],ghostIndex:0,
    lastSample:0,baseAim:null,lastFov:0,lastStrength:0,peekTime:0,wasMoving:false,peekShots:0,peekPerfect:0,
    lastSwitch:0,viewers:[],lastHud:0,caseFX:null};
  themes.midnight=['#609cff','#314a9c','#a9c9ff','#060914','#101829'];
  themes.blood=['#ef4e67','#a11b3e','#ff9cae','#10070b','#260d19'];
  themes.amoled=['#bf91ff','#6c3cb5','#f4e8ff','#000000','#09090c'];
  const v18Style=document.createElement('style');v18Style.id='voidware-v18-style';v18Style.textContent=`
    #death-won-panel .v18-banner{margin:6px 0 16px;padding:12px 14px;background:linear-gradient(105deg,#291c41,#111423);border:1px solid #694a9a;border-radius:9px;font:750 12px system-ui;color:#ecdafa}
    #death-won-panel .v18-columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:10px}
    #death-won-panel .v18-columns .v17-box{margin:0;min-width:0}
    #death-won-panel .v18-info{font:11px/1.5 system-ui;color:#b7abca;margin:5px 0 10px}
    #death-won-panel .v18-viewer,#death-won-panel .v18-pattern,#death-won-panel .v18-path{display:block;width:100%;background:#0a0d17;border:1px solid #4c3967;border-radius:7px;margin:8px 0;touch-action:none}
    #death-won-panel .v18-chip{display:inline-block;margin:4px 5px 4px 0;padding:4px 7px;border-radius:4px;border:1px solid #635081;color:#d9c1f6;background:#20182d;font:10px system-ui}
    #death-won-panel .v18-inline{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
    #death-won-panel .v18-inline input[type=text]{padding:9px;min-width:120px;max-width:180px;background:#090d18;color:#fff;border:1px solid #635081;border-radius:5px}
    #death-won-panel .v18-inline input[type=color]{width:45px;height:34px;background:transparent;border:0}
    #voidware-v18-hud{position:fixed;z-index:2147483580;left:24px;top:24px;min-width:142px;min-height:58px;padding:10px 12px;background:#090912e8;color:#eae1ff;border:1px solid #a780e3;border-radius:9px;box-shadow:0 6px 30px #0008;font:600 11px/1.7 system-ui;user-select:none}
    #voidware-v18-hud.editing{outline:2px dashed #bb85ff;cursor:move}
    #voidware-v18-crosshair{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483581;pointer-events:none;color:#b88dff;font:800 24px system-ui;text-shadow:0 0 8px #000b}
    .voidware-v18-confetti{position:absolute;top:-25px;width:6px;height:14px;pointer-events:none;animation:v18fall 2.4s ease-in forwards;z-index:7}
    @keyframes v18fall{to{transform:translate3d(var(--x),110vh,0) rotate(780deg);opacity:0}}
    @media(max-width:850px){#death-won-panel .v18-columns{grid-template-columns:1fr}}
  `;document.head.append(v18Style);
  // V18.1 STUDIO: a final visual stylesheet, deliberately separate from all gameplay logic.
  v18Style.textContent += `
/* VOIDWARE V18.1 — STUDIO UI. Presentation-only override; never touches gameplay state. */
#death-won-curtain{background:rgba(4,5,8,.76)!important;opacity:1!important;backdrop-filter:none!important}
#death-won-panel,#death-won-panel *{font-family:Inter,"Segoe UI",Arial,system-ui,sans-serif!important}
#death-won-panel{
 --vw-bg:#0d0f14;--vw-panel:#12151b;--vw-raised:#181b23;--vw-line:#2a2d36;--vw-line-soft:#22252e;
 --vw-text:#e9eaf0;--vw-muted:#979bab;
 width:min(1200px,96vw)!important;height:min(760px,94vh)!important;
 background:var(--vw-bg)!important;color:var(--vw-text)!important;
 border:1px solid #373944!important;border-radius:9px!important;
 box-shadow:0 28px 90px #000b!important;letter-spacing:0!important;
}
#death-won-panel::before{height:0!important;background:none!important}
#death-won-panel .dw-top:after{display:none!important}
#death-won-panel .dw-top{
 height:62px!important;min-height:62px!important;padding:0 22px!important;
 background:#14161d!important;border-bottom:1px solid var(--vw-line)!important;gap:12px!important;
}
#death-won-panel .dw-mark{
 width:32px!important;height:32px!important;border:1px solid #514667!important;border-radius:7px!important;
 background:#282333!important;color:#d6c5fb!important;font-size:16px!important;font-weight:850!important;
 box-shadow:none!important;animation:none!important;
}
#death-won-panel .dw-title{font-size:15px!important;font-weight:820!important;letter-spacing:1.6px!important;line-height:1.1!important}
#death-won-panel .dw-title b{color:#b7a1f6!important;text-shadow:none!important}
#death-won-panel .dw-sub{display:block!important;font-size:9px!important;font-weight:540!important;
 letter-spacing:.2px!important;color:#777d8e!important;margin-top:4px!important}
#death-won-panel .dw-dot{color:#686b78!important}
#death-won-panel .dw-topright{gap:10px!important}
#death-won-panel .dw-online{
 padding:6px 9px!important;border:1px solid #284c3e!important;background:#15251f!important;
 color:#7db89a!important;box-shadow:none!important;border-radius:5px!important;
 font-size:10px!important;font-weight:650!important;letter-spacing:0!important;
}
#death-won-panel .dw-head-btn,#death-won-panel .dw-version,#death-won-panel .dw-x{
 color:#adb1bf!important;border:1px solid #323540!important;background:#1a1d26!important;
 border-radius:5px!important;box-shadow:none!important;font-weight:650!important;
}
#death-won-panel .dw-head-btn{font-size:11px!important;padding:7px 12px!important}
#death-won-panel .dw-version{font-size:10px!important;padding:7px 10px!important;color:#b7a1f6!important}
#death-won-panel .dw-x{width:30px!important;height:30px!important;line-height:1!important;font-size:19px!important}
#death-won-panel .dw-x:hover,#death-won-panel .dw-head-btn:hover{background:#262a34!important;border-color:#50515d!important;color:#f4f4f8!important}
#death-won-panel .dw-superbar{
 height:40px!important;padding:0 20px!important;background:#111319!important;
 border-bottom:1px solid var(--vw-line-soft)!important;
}
#death-won-panel .dw-topcats{gap:24px!important;height:100%!important}
#death-won-panel .dw-topcat{
 position:relative!important;height:100%!important;padding:0 1px!important;min-width:0!important;
 border:0!important;border-radius:0!important;background:transparent!important;
 color:#9599a6!important;box-shadow:none!important;font-size:11px!important;font-weight:650!important;
 line-height:39px!important;letter-spacing:.1px!important;text-transform:none!important;
}
#death-won-panel .dw-topcat.active{color:#f5f3fc!important;border:0!important;box-shadow:none!important;background:none!important}
#death-won-panel .dw-topcat.active:after{content:"";position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--dw-accent,#a78bee)}
#death-won-panel .dw-topcat:hover{color:#e8e7f2!important;background:transparent!important;border:0!important}
#death-won-panel .dw-supermeta{color:#656b7a!important;font-size:9px!important;letter-spacing:.2px!important;text-transform:none!important}
#death-won-panel .dw-subbar{
 height:46px!important;padding:0 20px!important;background:#0f1117!important;
 border-bottom:1px solid var(--vw-line-soft)!important;gap:8px!important;
}
#death-won-panel .dw-subnav{height:42px!important;gap:4px!important;scrollbar-width:none!important}
#death-won-panel .dw-subnav::-webkit-scrollbar{display:none!important}
#death-won-panel .dw-subtab{
 background:transparent!important;border:1px solid transparent!important;color:#9a9eac!important;
 border-radius:5px!important;padding:7px 11px!important;height:31px!important;
 font-size:11px!important;font-weight:550!important;box-shadow:none!important;
}
#death-won-panel .dw-subtab:hover{background:#1d2029!important;border-color:#282c35!important;color:#ecebf1!important}
#death-won-panel .dw-subtab.active{background:#25222f!important;border:1px solid #494053!important;
 color:#e4ddf7!important;box-shadow:none!important;font-weight:680!important}
#death-won-panel .dw-subtab .dw-tabicon{display:none!important}
#death-won-panel .dw-sub-arrow{width:23px!important;height:29px!important;background:#171920!important;
 border:1px solid #292c35!important;color:#8f93a3!important;border-radius:4px!important;box-shadow:none!important}
#death-won-panel .dw-sub-arrow:hover{background:#262933!important;color:#e7e5ef!important}
#death-won-panel .dw-navsearch-wrap{
 height:30px!important;min-height:30px!important;flex-basis:185px!important;width:185px!important;
 border:1px solid #30333f!important;border-radius:5px!important;background:#181b23!important;
 box-shadow:none!important;
}
#death-won-panel .dw-navsearch-wrap:focus-within{border-color:#766499!important}
#death-won-panel #dw-nav-search{font-size:11px!important;color:#eef0f4!important}
#death-won-panel #dw-nav-search::placeholder{color:#6e7482!important}
#death-won-panel .dw-main{height:calc(100% - 185px)!important;background:var(--vw-bg)!important}
#death-won-panel .dw-content{
 padding:25px 28px 32px!important;background:var(--vw-bg)!important;
 scrollbar-color:#343844 transparent!important;
}
#death-won-panel .dw-heading{
 margin:0 0 5px!important;font-size:19px!important;line-height:1.3!important;
 font-weight:740!important;letter-spacing:-.35px!important;color:#f0f1f5!important;text-transform:none!important;
}
#death-won-panel .dw-desc{color:#858a9b!important;font-size:11px!important;line-height:1.55!important;margin-bottom:20px!important}
#death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{
 grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;
}
#death-won-panel .dw-v14-grid .dw-toggle .dw-name:before,#death-won-panel .dw-v14-grid .dw-action .dw-name:before{content:none!important}
#death-won-panel .dw-toggle,#death-won-panel .dw-action{
 min-height:87px!important;padding:14px 13px 30px!important;
 background:var(--vw-panel)!important;border:1px solid var(--vw-line)!important;
 border-radius:6px!important;box-shadow:none!important;transform:none!important;
 transition:background .12s,border-color .12s!important;
}
#death-won-panel .dw-toggle:hover,#death-won-panel .dw-action:hover{
 background:#191c26!important;border-color:#41424f!important;transform:none!important;box-shadow:none!important;
}
#death-won-panel .dw-toggle.on,#death-won-panel .dw-v14-grid .dw-toggle.on{
 background:#211d2c!important;border:1px solid #645380!important;box-shadow:none!important;
}
#death-won-panel .dw-name,#death-won-panel .dw-v14-grid .dw-toggle .dw-name{
 font-size:12px!important;font-weight:650!important;letter-spacing:0!important;line-height:1.3!important;
 color:#e7e8ed!important;padding-right:48px!important;
}
#death-won-panel .dw-toggle.on .dw-name{color:#e8e1f9!important}
#death-won-panel .dw-hint{
 display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;
 overflow:hidden!important;font-size:10.3px!important;line-height:1.42!important;color:#888d9d!important;
 margin-top:7px!important;
}
#death-won-panel .dw-indicator{
 top:11px!important;right:10px!important;background:transparent!important;border:0!important;
 padding:0!important;border-radius:0!important;box-shadow:none!important;
 color:#767d8c!important;font-size:9px!important;font-weight:700!important;
}
#death-won-panel .dw-toggle.on .dw-indicator{background:transparent!important;border:0!important;color:#bca9ee!important}
#death-won-panel .dw-shortcut{right:10px!important;bottom:8px!important;background:#1d2028!important;
 border:1px solid #30343e!important;border-radius:3px!important;padding:2px 5px!important;
 font-size:9px!important;color:#989dae!important;font-weight:550!important}
#death-won-panel .dw-section{border-top:1px solid var(--vw-line-soft)!important;padding-top:16px!important;margin-top:18px!important}
#death-won-panel .dw-range,#death-won-panel .dw-krow,#death-won-panel .dw-feature-note,
#death-won-panel .v17-box,#death-won-panel .sl-panel{
 background:var(--vw-panel)!important;border:1px solid var(--vw-line)!important;
 border-radius:6px!important;box-shadow:none!important;
}
#death-won-panel .dw-range{padding:13px!important;margin-bottom:9px!important}
#death-won-panel .dw-feature-note,#death-won-panel .dw-flick-feature{background:#181922!important;color:#aaaebe!important;border-radius:6px!important;border:1px solid #30313f!important}
#death-won-panel .v17-title{font:670 12px/1.35 Inter,"Segoe UI",system-ui!important;letter-spacing:0!important;color:#e8e5f0!important}
#death-won-panel .v17-sub,#death-won-panel .v18-info{font:420 11px/1.5 Inter,"Segoe UI",system-ui!important;color:#9296a5!important}
#death-won-panel .v17-button,#death-won-panel .dw-bind,#death-won-panel .dw-clear,#death-won-panel .dw-launch-btn,
#death-won-panel .sl-result{
 background:#22252e!important;border:1px solid #383b46!important;border-radius:5px!important;
 color:#d9dbe5!important;box-shadow:none!important;font-size:11px!important;font-weight:600!important;
 text-transform:none!important;
}
#death-won-panel .v17-button:hover,#death-won-panel .dw-bind:hover,#death-won-panel .dw-clear:hover,
#death-won-panel .sl-result:hover{background:#2c2b37!important;border-color:#6f5b91!important;color:white!important}
#death-won-panel .v17-data,#death-won-panel #v17-live-stats,#death-won-panel .v17-timeline{
 background:#151920!important;border:1px solid #2c303a!important;color:#c6cbd4!important;border-radius:5px!important}
#death-won-panel .v17-graph,#death-won-panel .v18-viewer,#death-won-panel .v18-pattern,#death-won-panel .v18-path{
 border:1px solid #30333e!important;border-radius:6px!important;background:#0f1219!important}
#death-won-panel .v18-banner,#death-won-panel .sl-notice,#death-won-panel .dw-v14-status{
 padding:11px 13px!important;background:#1d1b27!important;color:#beb2d9!important;
 border:1px solid #413a51!important;border-radius:5px!important;box-shadow:none!important;
 font:550 11px/1.5 Inter,"Segoe UI",system-ui!important;letter-spacing:0!important;
}
#death-won-panel .v18-columns{gap:12px!important}
#death-won-panel .v18-columns .v17-box{padding:17px!important}
#death-won-panel .v18-chip,#death-won-panel .dw-badge,#death-won-panel .dw-quickchip{
 background:#1d2029!important;border:1px solid #333743!important;color:#b8bbca!important;border-radius:4px!important;font-size:10px!important;box-shadow:none!important}
#death-won-panel .sl-panel h3{font:680 12px/1.4 Inter,"Segoe UI",system-ui!important;letter-spacing:0!important;color:#e0d9f0!important}
#death-won-panel .sl-field,#death-won-panel .v17-field{color:#aab0c0!important;font-weight:540!important}
#death-won-panel select,#death-won-panel input[type=number],#death-won-panel input[type=text],
#death-won-panel input[type=search],#death-won-panel .sl-field input{
 background:#10131b!important;border:1px solid #353843!important;color:#eaebf1!important;
 border-radius:5px!important;padding:9px 10px!important;font-size:11px!important;box-shadow:none!important}
#death-won-panel input[type=range]{accent-color:var(--dw-accent,#a48add)!important}
#death-won-panel .dw-home-hero{
 background:#171923!important;border:1px solid var(--vw-line)!important;border-radius:7px!important;
 box-shadow:none!important;padding:24px 25px!important}
#death-won-panel .dw-home-hero h2{font-size:23px!important;letter-spacing:-.6px!important;font-weight:740!important}
#death-won-panel .dw-home-eyebrow{font-size:10px!important;color:#a99acb!important;letter-spacing:.5px!important}
#death-won-panel .dw-home-stat{background:#171a22!important;border-color:#2b303b!important;border-radius:6px!important}
#death-won-panel .dw-home-stat strong{font-size:23px!important;font-weight:740!important}
#death-won-panel .dw-home-stat span{font-size:10px!important;letter-spacing:0!important}
#death-won-panel .dw-launch-btn{border-radius:6px!important;padding:12px!important}
#death-won-panel .dw-bottom{
 height:37px!important;padding:0 21px!important;background:#111319!important;
 border-top:1px solid var(--vw-line)!important;font-size:10px!important;color:#727989!important;
}
#death-won-panel .dw-bottom strong{color:#9294a4!important;font-weight:570!important}
#death-won-panel button:focus-visible,#death-won-panel input:focus-visible,#death-won-panel select:focus-visible{
 outline:2px solid var(--dw-accent,#a98cdb)!important;outline-offset:2px!important}
#death-won-panel .dw-pulse{animation:none!important;background:#32263e!important;border-color:#715992!important}
@media(max-width:900px){
 #death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #death-won-panel .dw-content{padding:19px 19px 25px!important}
 #death-won-panel .dw-topcats{gap:17px!important}
 #death-won-panel .dw-supermeta{display:none!important}
}
@media(max-width:600px){
 #death-won-panel{width:99vw!important;height:96vh!important}
 #death-won-panel .dw-top{padding:0 12px!important}
 #death-won-panel .dw-topright{gap:5px!important}
 #death-won-panel .dw-online,#death-won-panel .dw-version,#death-won-panel .dw-head-btn{display:none!important}
 #death-won-panel .dw-superbar{padding:0 11px!important}
 #death-won-panel .dw-topcats{gap:14px!important}
 #death-won-panel .dw-subbar{padding:0 10px!important}
 #death-won-panel .dw-navsearch-wrap{flex:0 0 118px!important;width:118px!important}
 #death-won-panel .dw-content{padding:17px 13px 24px!important}
 #death-won-panel .dw-grid,#death-won-panel .dw-v14-grid{grid-template-columns:1fr!important}
 #death-won-panel .v18-columns{grid-template-columns:1fr!important}
 #death-won-panel .dw-bottom{padding:0 10px!important}
 #death-won-panel .dw-bottom>span{font-size:9px!important}
}
@media(prefers-reduced-motion:reduce){#death-won-panel *{animation:none!important;transition:none!important}}
/* Keep the existing theme selector meaningful: theme changes tint only the selected controls. */
#death-won-panel .dw-mark{border-color:color-mix(in srgb,var(--dw-accent,#a68cdd) 30%,#42414b)!important;
 background:color-mix(in srgb,var(--dw-accent,#a68cdd) 13%,#191b24)!important;
 color:color-mix(in srgb,var(--dw-accent,#a68cdd) 68%,#f7f7fc)!important}
#death-won-panel .dw-title b{color:color-mix(in srgb,var(--dw-accent,#a68cdd) 75%,#d6d4dd)!important}
#death-won-panel .dw-version{color:color-mix(in srgb,var(--dw-accent,#a68cdd) 68%,#d6d4dd)!important}
#death-won-panel .dw-subtab.active{background:color-mix(in srgb,var(--dw-accent,#a68cdd) 9%,#202127)!important;
 border-color:color-mix(in srgb,var(--dw-accent,#a68cdd) 26%,#3a3b44)!important}
#death-won-panel .dw-toggle.on{background:color-mix(in srgb,var(--dw-accent,#a68cdd) 9%,#1b1d25)!important;
 border-color:color-mix(in srgb,var(--dw-accent,#a68cdd) 44%,#383943)!important}
#death-won-panel .dw-toggle.on .dw-indicator{color:color-mix(in srgb,var(--dw-accent,#a68cdd) 65%,#cfd1de)!important}
#death-won-panel .dw-launch-icon{display:none!important}
#death-won-panel .dw-home-highlight{color:var(--dw-accent,#a68cdd)!important}

  `;
  const v18Hud=document.createElement('div');v18Hud.id='voidware-v18-hud';v18Hud.style.display='none';document.body.append(v18Hud);
  const v18Cross=document.createElement('div');v18Cross.id='voidware-v18-crosshair';v18Cross.style.display='none';document.body.append(v18Cross);
  let v18Drag=null;
  const v18HudPointerDown=e=>{if(!v18.hudEdit)return;v18Drag={x:e.clientX,y:e.clientY,left:v18.hudX,top:v18.hudY};v18Hud.setPointerCapture?.(e.pointerId);e.preventDefault();};
  const v18HudPointerMove=e=>{if(!v18Drag)return;v18.hudX=Math.max(0,Math.min(innerWidth-140,v18Drag.left+e.clientX-v18Drag.x));v18.hudY=Math.max(0,Math.min(innerHeight-65,v18Drag.top+e.clientY-v18Drag.y));v18Hud.style.left=v18.hudX+'px';v18Hud.style.top=v18.hudY+'px';};
  const v18HudPointerUp=()=>{if(v18Drag){v18Drag=null;v18Save()}};
  v18Hud.addEventListener('pointerdown',v18HudPointerDown);v18Hud.addEventListener('pointermove',v18HudPointerMove);v18Hud.addEventListener('pointerup',v18HudPointerUp);v18Hud.addEventListener('pointercancel',v18HudPointerUp);
  const v18Button=(p,title,cb)=>v17Button(p,title,()=>{cb();v18Save()});
  const v18Range=(p,title,a,b,step,k)=>v17Range(p,title,a,b,step,v18[k],value=>{v18[k]=value;v18Save()});
  const v18Toggle=(p,title,key)=>v18Button(p,title+': '+(v18[key]?'ON':'OFF'),()=>{v18[key]=!v18[key];if(key==='adaptive'&&!v18[key])v18RestoreAim();if(key==='hudEnabled')v18HudUpdate();renderTab()});
  const v18NewCanvas=(p,className,w=760,h=280)=>{const el=document.createElement('canvas');el.width=w;el.height=h;el.className=className;p.append(el);return el};
  const v18Info=(p,text)=>{const el=document.createElement('p');el.className='v18-info';el.textContent=text;p.append(el);return el};
  function v18RestoreAim(){if(v18State.baseAim){legitFov=v18State.baseAim.fov;legitStrength=v18State.baseAim.strength;v18State.baseAim=null;}}
  function v18Tick(now,dt){if(!active)return;
    if(v18.adaptive&&g.state==='playing'&&g.player?.alive){
      if(!v18State.baseAim)v18State.baseAim={fov:legitFov,strength:legitStrength};
      if(!smoothFlickJob){let best=Infinity;for(const b of enemyBots())if(!behindWall(b))best=Math.min(best,Math.hypot(b.x-g.player.x,b.z-g.player.z));
        if(best!==Infinity){const t=Math.min(1,Math.max(0,(best-8)/80));legitFov=v18.nearFov+(v18.farFov-v18.nearFov)*t;
          legitStrength=v18.nearStrength+(v18.farStrength-v18.nearStrength)*t;}}
    }else if(v18State.baseAim)v18RestoreAim();
    if(now-v18State.lastSample<110)return;v18State.lastSample=now;
    if(g.state==='playing'&&g.player?.alive){const p=g.player;const snap={t:Math.round(now),x:Number(p.x)||0,y:Number(p.y)||0,z:Number(p.z)||0,yaw:Number(p.yaw)||0,pitch:Number(p.pitch)||0};
      v18State.frames.push(snap);if(v18State.frames.length>320)v18State.frames.shift();
      if(v18.recording){v18State.movement.push(snap);if(v18State.movement.length>2200)v18State.movement.shift();}
      if(v18.peekTrainer){const speed=Math.hypot(p.vx||0,p.vz||0);if(speed>v18.peekThreshold)v18State.wasMoving=true;
        if(v18State.wasMoving&&speed<=.8){v18State.peekTime=now;v18State.wasMoving=false;}}
    }
    if(now-v18State.lastHud>220){v18State.lastHud=now;
      if(!flags.fpsBooster||!fpsBoosterCfg.lightweightMenu||v18.hudEnabled||v18Hud.style.display!=='none')v18HudUpdate();
    }
  }
  function v18OnShot(now){if(v18.peekTrainer&&v18State.peekTime&&now-v18State.peekTime<600){v18State.peekShots++;
      const speed=Math.hypot(g.player.vx||0,g.player.vz||0);if(speed<.85)v18State.peekPerfect++;v18State.peekTime=0;}
  }
  function v18OnDamage(victim,damage,shooter,head){if(shooter!==g.player||!victim||victim.team===g.player.team)return;
    if(victim.alive!==false&&Number(victim.health)>0)return;
    const now=performance.now();if(now-(v18State.lastDeath.get(victim)||-99999)<1000)return;
    v18State.lastDeath.set(victim,now);
    const kills={time:now,weapon:g.weapons.current,head:head===true,bot:victim.name||'Bot',
      target:{x:victim.x,y:victim.y,z:victim.z},frames:v18State.frames.slice(-60).map(x=>({...x}))};
    v18State.kills.push(kills);if(v18State.kills.length>35)v18State.kills.shift();
    if(v18.smartSwitch){rageFocus=null;legitFocus=null;v17Cue(now);v18State.lastSwitch=now;}
  }
  function v18HudUpdate(){const shown=v18.hudEnabled&&active&&g.state==='playing';v18Hud.style.display=shown?'block':'none';
    v18Cross.style.display=shown&&panel.style.display==='none'?'block':'none';if(!shown)return;
    v18Hud.classList.toggle('editing',!!v18.hudEdit);v18Hud.style.left=v18.hudX+'px';v18Hud.style.top=v18.hudY+'px';
    v18Hud.style.fontSize=Math.round(11*v18.hudSize/100)+'px';v18Hud.style.borderColor=v18.hudAccent;
    v18Hud.style.pointerEvents=v18.hudEdit?'auto':'none';const fps=v17State.frames.at(-1)?.y;
    v18Hud.textContent='✦ VOIDWARE V18  ·  '+(fps?Math.round(fps)+' FPS  ·  ':'')+enemyBots().length+' BOTS  ·  '+v17State.hits+' HITS';
    v18Cross.style.color=v18.hudAccent;v18Cross.textContent=v18.crosshairType==='dot'?'•':v18.crosshairType==='cross'?'＋':v18.crosshairType==='ring'?'⊙':' ';
  }
  function v18Sketch(canvas,points,pointColor='#be9bff',focus=null){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    c.clearRect(0,0,w,h);c.fillStyle='#0a0d17';c.fillRect(0,0,w,h);c.strokeStyle='#26253d';c.lineWidth=1;
    for(let i=1;i<8;i++){c.beginPath();c.moveTo(i*w/8,0);c.lineTo(i*w/8,h);c.moveTo(0,i*h/8);c.lineTo(w,i*h/8);c.stroke();}
    if(!points.length){c.font='16px system-ui';c.fillStyle='#9f8da9';c.fillText('No recorded path yet',20,32);return;}
    const xs=points.map(x=>x.x),zs=points.map(x=>x.z),xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs);
    const xy=p=>[25+(p.x-xmin)/Math.max(1,xmax-xmin)*(w-50),25+(p.z-zmin)/Math.max(1,zmax-zmin)*(h-50)];
    c.strokeStyle=pointColor;c.lineWidth=3;c.beginPath();for(let i=0;i<points.length;i++){const [x,y]=xy(points[i]);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    if(focus){const [x,y]=xy(focus);c.fillStyle='#ffe084';c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.fill();}
  }
  function v18StartGhost(canvas,frames,label){let idx=0;const draw=()=>{if(!canvas.isConnected||!active)return;v18Sketch(canvas,frames,'#a889ff',frames[Math.min(idx,frames.length-1)]);idx=(idx+1)%Math.max(1,frames.length);
      label.textContent='Ghost playback · frame '+(idx+1)+' / '+frames.length+' · path only (never moves your player)';setTimeout(draw,115)};draw();}
  function v18DrawPattern(canvas,seed){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    c.clearRect(0,0,w,h);c.fillStyle='#111725';c.fillRect(0,0,w,h);let s=(seed+1)*2654435761>>>0;
    const rand=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
    for(let i=0;i<105;i++){const x=rand()*w,y=rand()*h,r=9+rand()*90;
      const col=rand();c.fillStyle=col>.61?'#1c4bb3':col>.31?'#287bc5':'#a8763b';c.globalAlpha=.2+rand()*.55;
      c.beginPath();c.ellipse(x,y,r,r*(.2+rand()*.7),rand()*7,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;c.fillStyle='#faf4ff';c.font='bold 21px system-ui';c.fillText('CASE HARDENED · SEED '+seed,16,30);
    c.font='13px system-ui';c.fillText('PROCEDURAL COLOR STUDY · not an official Blue Gem seed lookup',16,h-17);
  }
  function v18Stickers(canvas,item){slDrawPreview(canvas,item);const c=canvas.getContext('2d');if(!c)return;
    for(const sticker of v18.stickers.filter(x=>x.id===item.id)){c.save();c.translate(sticker.x*canvas.width,sticker.y*canvas.height);c.rotate((sticker.rotation||0)*Math.PI/180);
      c.font='bold '+Math.round(44*sticker.scale)+'px system-ui';c.shadowColor='#000';c.shadowBlur=8;c.fillStyle='#ffffff';c.textAlign='center';c.textBaseline='middle';c.fillText(sticker.text,0,0);c.restore();}
  }
  function v18Sound(){if(!v18.caseSound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ac=new A();
    [440,660,880].forEach((freq,i)=>{const o=ac.createOscillator(),gain=ac.createGain(),t=ac.currentTime+i*.12;o.type='sine';o.frequency.value=freq;
      gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.035,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+.15);
      o.connect(gain).connect(ac.destination);o.start(t);o.stop(t+.17);});setTimeout(()=>ac.close().catch(()=>{}),900);
  }catch{}}
  function v18Celebrate(shell){if(!active||!v18.caseEffects||!shell?.isConnected)return;
    const colors=['#b78cfa','#ffe495','#57c2fc','#fe8be7'];for(let i=0;i<46;i++){const t=document.createElement('span');t.className='voidware-v18-confetti';
      t.style.left=(Math.random()*100)+'%';t.style.background=colors[i%colors.length];t.style.animationDelay=(Math.random()*.7)+'s';t.style.setProperty('--x',(Math.random()*320-160)+'px');shell.append(t);setTimeout(()=>t.remove(),3250);}v18Sound();}
  function v18Play3D(parent,item){const area=document.createElement('div');area.style.cssText='position:relative;height:270px;border:1px solid #503866;border-radius:9px;overflow:hidden;background:radial-gradient(ellipse at center,#29223b,#080911)';parent.append(area);
    const T=window.THREE,model=g.viewmodel?.scene;let renderer=null,raf=0,cloned=null;
    if(T?.WebGLRenderer&&T?.Scene&&T?.PerspectiveCamera&&T?.Box3&&model?.clone){try{
      cloned=model.clone(true);const scene=new T.Scene();scene.add(cloned);
      const box=new T.Box3().setFromObject(cloned);if(!box.isEmpty()){
        const center=box.getCenter(new T.Vector3()),sz=box.getSize(new T.Vector3());cloned.position.sub(center);
        const camera=new T.PerspectiveCamera(42,760/270,.01,1000);camera.position.set(0,Math.max(1,sz.y*.35),Math.max(2,sz.length()*1.4));camera.lookAt(0,0,0);
        scene.add(new T.HemisphereLight(0xe9defe,0x22152d,2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(3,6,7);scene.add(light);
        renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(760,270);
        renderer.domElement.style.cssText='width:100%;height:100%;object-fit:contain;cursor:grab';area.append(renderer.domElement);
        let down=false,last=0;renderer.domElement.addEventListener('pointerdown',e=>{down=true;last=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)});
        renderer.domElement.addEventListener('pointerup',()=>down=false);renderer.domElement.addEventListener('pointermove',e=>{if(down){cloned.rotation.y+=(e.clientX-last)*.008;last=e.clientX}});
        const loop=()=>{if(!area.isConnected||!active){renderer.dispose();return}renderer.render(scene,camera);raf=requestAnimationFrame(loop)};loop();
        v18Info(parent,'Live 3D preview of the game’s accessible viewmodel geometry. Selected skin texture may not exist in game assets; real inventory is unchanged.');return;
      }
    }catch(e){console.warn('[VOIDWARE V18] Optional 3D preview unavailable:',e);try{renderer?.dispose()}catch{}}}
    const preview=document.createElement('canvas');preview.width=760;preview.height=248;preview.className='v18-viewer';area.append(preview);
    if(item)slDrawPreview(preview,item);
    else{const c=preview.getContext('2d');c.fillStyle='#e2cafa';c.font='20px system-ui';c.fillText('Select a local item in Skin Lab first',20,80)}
    v18Info(parent,'2D fallback: this game version does not expose a compatible 3D model/renderer. We will not fake a 3D skin.');
  }
  function v18GroupFlags(group){const keys=Object.keys(flags);const exact={rage:['wallbang','silent','autoShoot','megaRage','rage360','rageSticky','rageLead','rageHead','fastFire','noRecoil','noSpread','infinity'],
      legit:['legitAim','triggerbot','legitSticky','legitVisible','legitDeadzone','quickStop'],
      visuals:['esp','glow','chams','radar','showCrosshair','espTracers','espHealth','espSkeleton','aimFovRing','targetHUD','killHUD','hitmarkers','fpsBoost']};
    const dynamic=group==='rage'?ragePlusDefs.map(x=>x.id):group==='legit'?[...legitProDefs.map(x=>x.flag),...v16Opts.filter(x=>['aim','trigger'].includes(x.group)).map(x=>x.flag)]:v16Opts.filter(x=>x.group==='visuals').map(x=>x.flag);
    return [...new Set([...exact[group],...dynamic])].filter(x=>keys.includes(x));}
  function v18SaveProfile(group,slot){const f=Object.fromEntries(v18GroupFlags(group).map(k=>[k,!!flags[k]]));
    v18.profiles[group+':'+slot]={flags:f,aim:group==='legit'?v17AimSnapshot():null,uiTheme,created:new Date().toISOString()};v18Save();}
  function v18LoadProfile(group,slot){const item=v18.profiles[group+':'+slot];if(!item)return notice('V18 · Profile slot '+slot+' is empty');
    for(const k of v18GroupFlags(group))if(k in item.flags)flags[k]=!!item.flags[k];
    if(group==='legit'&&item.aim){v18RestoreAim();v17ApplyAim(item.aim)}
    if(group==='visuals'&&themes[item.uiTheme]){uiTheme=item.uiTheme;applyTheme()}
    notice('V18 · Loaded '+group.toUpperCase()+' · '+slot);renderTab();}
  function v18Render(group){
    section(({rage:'Rage / Practice',legit:'Legit / Training',skins:'Skins / Workshop',studio:'Appearance & Profiles',replay:'Replay / Analysis'}[group]||group),'15 additions · local bot sandbox · all V17.5 modules retained');
    const banner=document.createElement('div');banner.className='v18-banner';banner.textContent='Settings for this local session. Changes are optional and saved in your browser.';content.append(banner);
    const cols=document.createElement('div');cols.className='v18-columns';content.append(cols);
    const card=(name,description)=>{const box=document.createElement('div');box.className='v17-box';const h=document.createElement('div');h.className='v17-title';h.textContent=name;box.append(h);v18Info(box,description);cols.append(box);return box};
    if(group==='rage'){
      let b=card('01 · SMART TARGET SWITCH','On confirmed bot kills, releases the previous target and cues another live bot. It never switches to teammates.');
      v18Toggle(b,'Switch after confirmed kill','smartSwitch');v18Info(b,'Registered local kills: '+v18State.kills.length+' · latest: '+(v18State.kills.at(-1)?.bot||'none'));
      b=card('04 · WALLBANG DAMAGE ESTIMATOR','Shows an indicative estimate from weapon damage and user-set penetration percent. Not a measured game penetration value.');
      v18Toggle(b,'Show estimate','wallEstimate');v18Range(b,'Penetration retained (%)',5,90,1,'penetration');
      const info=g.weapons.def?.(),dmg=Number(info?.dmg)||0;
      const walls=enemyBots().filter(x=>behindWall(x)).length;
      v18Info(b,'Current weapon: '+String(g.weapons.current).toUpperCase()+' · base damage '+dmg.toFixed(1)+' · through cover ≈ '+(dmg*v18.penetration/100).toFixed(1)+' before armor/range · '+walls+' blocked bots');
      b=card('RAGE TARGETS','Prior Rage +10, auto-fire, instant flick, and wallbang settings are unchanged.');v18Button(b,'OPEN RAGE',()=>selectTab('rage'));v18Button(b,'OPEN RAGE +10',()=>selectTab('mega'));
    }
    if(group==='legit'){
      let b=card('02 · ADAPTIVE AIM','Opt-in distance-based interpolation of the original Legit FOV and response strength. Restores settings when disabled.');
      v18Toggle(b,'Adaptive distance profiles','adaptive');v18Range(b,'Near FOV',2,90,1,'nearFov');v18Range(b,'Far FOV',2,90,1,'farFov');
      v18Range(b,'Near response',1,65,1,'nearStrength');v18Range(b,'Far response',1,65,1,'farStrength');
      b=card('03 · FLICK STUDIO','Real controls for the existing Shift+O smooth head flick. One shot then returns to the saved camera position.');
      v17Range(b,'Aim travel (ms)',120,850,10,smoothAimMs,v=>{smoothAimMs=v;saveSmoothFlick()});
      v17Range(b,'Return travel (ms)',120,850,10,smoothReturnMs,v=>{smoothReturnMs=v;saveSmoothFlick()});
      v17Range(b,'Hold before return (ms)',0,300,5,smoothShotHoldMs,v=>{smoothShotHoldMs=v;saveSmoothFlick()});
      v17Range(b,'Capture FOV (deg)',15,360,5,flickFov,v=>{flickFov=v;saveUi()});
      v18Button(b,'START SMOOTH FLICK (CLOSE MENU FIRST)',()=>{hideMenu();smoothHeadFlick()});
      b=card('05 · PERFECT PEEK TRAINER','Records when you stop after strafing and score shots fired within the next 600 ms while still nearly stationary.');
      v18Toggle(b,'Peek timing coach','peekTrainer');v18Range(b,'Moving speed threshold',1,12,.2,'peekThreshold');
      v18Info(b,'Timed shots: '+v18State.peekShots+' · stable timing: '+v18State.peekPerfect);
      v18Button(b,'RESET PEEK SCORE',()=>{v18State.peekShots=0;v18State.peekPerfect=0;renderTab()});
    }
    if(group==='skins'){
      let b=card('06 · REAL-MODEL INSPECTOR','Uses accessible Clutcher 3D viewmodel geometry when Three.js can render it. Otherwise uses an explicitly labeled 2D fallback.');
      const item=slSelected()||slFind(sl.equipped[slNormalizeWeapon(g.weapons.current||'')]);v18Play3D(b,item);
      v18Button(b,'OPEN SKIN LAB INVENTORY',()=>selectTab('v17:skins'));
      b=card('07 · BLUE GEM PATTERN STUDIO','Seed-selectable procedural case-hardened-style color study. Not an official pattern ranking.');
      const patt=v18NewCanvas(b,'v18-pattern',760,205);v18DrawPattern(patt,v18.blueSeed);
      v18Range(b,'Paint seed (0–1000)',0,1000,1,'blueSeed');v18Button(b,'PREVIEW SEED',()=>v18DrawPattern(patt,v18.blueSeed));
      v18Button(b,'RANDOM SEED',()=>{v18.blueSeed=Math.floor(Math.random()*1001);v18DrawPattern(patt,v18.blueSeed);renderTab()});
      b=card('08 · STICKER WORKSHOP','Click the preview to place a local sticker. Choose symbol, scale and rotation. Preview/export only, not actual textures.');
      const stickerItem=item||slMakeItem('awp','Gungnir',.03,661);const cv=v18NewCanvas(b,'v18-pattern',760,248);
      v18Stickers(cv,stickerItem);
      v17Select(b,'Sticker icon',[['★','Gold Star'],['✦','Spark'],['◆','Diamond'],['☠','Skull'],['✕','Cross'],['V','VOIDWARE V']],v18.stickerText,v=>{v18.stickerText=v;v18Save()});
      v18Range(b,'Sticker size',.4,2.5,.1,'stickerScale');v18Range(b,'Sticker angle',-180,180,5,'stickerRotation');
      cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();v18.stickers.push({id:stickerItem.id,text:v18.stickerText,x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,scale:v18.stickerScale,rotation:v18.stickerRotation});
        v18.stickers=v18.stickers.slice(-80);v18Stickers(cv,stickerItem);v18Save()});
      v18Button(b,'REMOVE LAST STICKER',()=>{let idx=v18.stickers.map(x=>x.id).lastIndexOf(stickerItem.id);if(idx>=0)v18.stickers.splice(idx,1);v18Stickers(cv,stickerItem)});
      b=card('09 · GLOVE + KNIFE COMBOS','Save a matching local glove and knife finish together, with four loadout slots.');
      const weapons=['knife','gloves'];const selectors={};for(const key of weapons){const options=sl.items.filter(x=>x.weapon===key).map(x=>[x.id,x.name+' · '+slExterior(x.float)]);
        selectors[key]=v17Select(b,key.toUpperCase(),[['','Select saved '+key],...options],v18.combos[v18.activeCombo]?.[key]||'',()=>{});}
      v17Select(b,'Combo slot',['A','B','C','D'].map(x=>[x,'Slot '+x]),v18.activeCombo,x=>{v18.activeCombo=x;renderTab()});
      v18Button(b,'SAVE COMBO',()=>{v18.combos[v18.activeCombo]={knife:selectors.knife.value,gloves:selectors.gloves.value};notice('V18 · Combo saved')});
      v18Button(b,'EQUIP LOCAL COMBO',()=>{const combo=v18.combos[v18.activeCombo];if(!combo)return notice('No saved combo');for(const key of weapons){const it=slFind(combo[key]);if(it)slEquip(it)}notice('V18 · Local glove/knife preview equipped')});
      b=card('10 · CASE OPENING 2.0 FX','Optional rarity burst, local celebratory sound, and reel/showcase integrated into your V17.5 fake case screen. The real drop is untouched.');
      v18Toggle(b,'Rarity confetti','caseEffects');v18Toggle(b,'Local sound','caseSound');
      v18Button(b,'TEST SIMULATED REVEAL',()=>{hideMenu();slCaseStart('Arms Deal 2 Case',true,true)});
    }
    if(group==='studio'){
      let b=card('11 · VOIDWARE HUD EDITOR','An optional FPS/hit HUD and crosshair overlay. Enable Edit to drag the HUD around the game screen.');
      v18Toggle(b,'Custom HUD','hudEnabled');v18Toggle(b,'HUD drag editing','hudEdit');v18Range(b,'HUD text size (%)',80,160,5,'hudSize');
      v17Select(b,'Crosshair',[['dot','Dot'],['cross','Cross'],['ring','Ring'],['off','Hidden']],v18.crosshairType,x=>{v18.crosshairType=x;v18HudUpdate()});
      const r=document.createElement('div');r.className='v18-inline';const color=document.createElement('input');color.type='color';color.value=v18.hudAccent;
      color.addEventListener('change',()=>{v18.hudAccent=color.value;v18Save();v18HudUpdate()});r.append(document.createTextNode('Accent: '),color);b.append(r);
      v18Button(b,'RESET HUD POSITION',()=>{v18.hudX=24;v18.hudY=24;v18HudUpdate()});
      b=card('14 · INDEPENDENT CONFIG PROFILES','Separate snapshot slots for Rage, Legit, and Visuals. Only relevant toggle groups are copied.');
      for(const groupName of ['rage','legit','visuals']){const row=document.createElement('div');row.className='v18-inline';
        const label=document.createElement('strong');label.textContent=groupName.toUpperCase();label.style.minWidth='65px';row.append(label);
        for(const slot of ['A','B']){v18Button(row,'SAVE '+slot,()=>v18SaveProfile(groupName,slot));v18Button(row,'LOAD '+slot,()=>v18LoadProfile(groupName,slot));}b.append(row)}
      b=card('15 · VOIDWARE THEMES','Premium menu palettes; does not change the game world. Your old theme choices still work.');
      for(const [id,label] of [['violet','Classic Purple'],['midnight','Midnight Blue'],['blood','Blood Red'],['amoled','AMOLED Black']])v18Button(b,label+(uiTheme===id?' ✓':''),()=>{uiTheme=id;applyTheme();renderTab()});
    }
    if(group==='replay'){
      let b=card('12 · KILL REPLAY CAMERA','Timeline review from sampled player positions at confirmed bot kills. Top-down camera replay, not decoded video or a replay of unseen world frames.');
      v18Info(b,'Confirmed kills recorded: '+v18State.kills.length);
      const options=v18State.kills.map((x,i)=>[String(i),new Date(Date.now()-(performance.now()-x.time)).toLocaleTimeString()+' · '+x.bot+' · '+x.weapon]);
      const sel=v17Select(b,'Choose kill',options.length?options:[['','None recorded']],String(Math.min(v18.replayIndex,Math.max(0,options.length-1))),x=>{v18.replayIndex=Number(x)||0;renderTab()});
      const kill=v18State.kills[Number(sel.value)||0];if(kill?.frames?.length){const cv=v18NewCanvas(b,'v18-path');const label=v18Info(b,'');v18StartGhost(cv,kill.frames,label)}
      b=card('13 · MOVEMENT RECORD + GHOST','Record your local x/z route. Playback draws a top-down ghost path without moving your actual player.');
      v18Button(b,v18.recording?'STOP RECORDING':'START RECORDING',()=>{v18.recording=!v18.recording;if(v18.recording){v18State.movement=[];notice('V18 · Movement recording started')}
        else{v18.recordings.push({created:new Date().toISOString(),frames:v18State.movement.slice()});v18.recordings=v18.recordings.slice(-6);notice('V18 · Path saved ('+v18State.movement.length+' points)')}renderTab()});
      const latest=v18State.movement.length?v18State.movement:v18.recordings.at(-1)?.frames||[];
      v18Info(b,'Captured route points: '+latest.length+' · saved paths: '+v18.recordings.length);
      const graph=v18NewCanvas(b,'v18-path');v18Sketch(graph,latest);
      v18Button(b,'PLAY GHOST PATH',()=>{if(!latest.length)return notice('Record a movement path first');const label=v18Info(b,'');v18StartGhost(graph,latest,label)});
      v18Button(b,'EXPORT MOVEMENT JSON',()=>v17SaveFile('VOIDWARE_V18_MOVEMENT.json',{type:'voidware-v18-path',version:18,frames:latest}));
      v18Button(b,'IMPORT MOVEMENT JSON',()=>v17PickJson(data=>{if(data?.type!=='voidware-v18-path'||!Array.isArray(data.frames))throw Error('Wrong movement file');
        v18State.movement=data.frames.filter(x=>Number.isFinite(x?.x)&&Number.isFinite(x?.z)).slice(-2200);renderTab()}));
    }
  }
  function v18Remove(){v18RestoreAim();v18Hud.remove();v18Cross.remove();v18Style.remove();v18State.recording=false;v18.recording=false;v18.hudEdit=false;}

  function renderTab(){content.replaceChildren();
    if(activeTab==='fps:lab'){fpsBoosterRender();return;}
    if(activeTab.startsWith('v18:')){v18Render(activeTab.slice(4));return;}
    if(activeTab==='v17:skins'){slRender();return;}
    if(activeTab.startsWith('v17:')){v17Render(activeTab.slice(4));return;}


    if(activeTab==='home'){
      const hero=document.createElement('div');hero.className='dw-home-hero';
      hero.innerHTML='<div class="dw-home-eyebrow">VOIDWARE / WORKSPACE</div><h2>Overview</h2><p>Tools, saved configurations, and bot practice controls in one place. Press O for your existing head flick.</p>';
      content.append(hero);
      const stats=document.createElement('div');stats.className='dw-home-stats';
      const activeCount=Object.values(flags).filter(Boolean).length;
      for(const [value,label] of [[String(activeCount),'ACTIVE TOGGLES'],[String(enemyBots().length),'ENEMY BOTS'],['100','NEW V12 POWERS'],['10','SUPERNOVA LABS']]){
        const box=document.createElement('div');box.className='dw-home-stat';const v=document.createElement('strong');v.textContent=value;
        const t=document.createElement('span');t.textContent=label;box.append(v,t);stats.append(box);
      }content.append(stats);
      const v14Call=grid();tile(v14Call,'☠ V14 ABSOLUTE CHAOS · 200','Open the brand-new 10-lab cheat dashboard; all original pages remain available.',()=>showMenu('v14:aim'));
      section('QUICK LAUNCH','Jump straight to your most-used settings.');
      const launch=document.createElement('div');launch.className='dw-launch';
      for(const [icon,name,detail,id] of [['🎯','Rage','Aiming & shots','rage'],['◎','Legit Aim','Flickshot · O key','legit'],['⚡','Movement','Flight & BHOP','move'],['🚀','Rocket Recoil','Launch backwards when firing','rocket'],['◈','ESP','Players & glow','visual'],['☄','Reality Breaker','35 chaos effects','re:cosmic'],['⚔','OMEGA LAB','24 new powers','omega:combat'],['🚀','SUPERNOVA V12','100 new powers','sn:rocket'],['✦','PARADOX V13','15 powerful experiments','paradox'],['▤','FPS Boost','Performance','performance']]){
        const b=document.createElement('button');b.type='button';b.className='dw-launch-btn';
        const i=document.createElement('span');i.className='dw-launch-icon';i.textContent=icon;
        const box=document.createElement('span');const title=document.createElement('strong');title.textContent=name;const desc=document.createElement('small');desc.textContent=detail;
        box.append(title,desc);const arrow=document.createElement('span');arrow.className='dw-launch-arrow';arrow.textContent='↗';b.append(i,box,arrow);
        b.addEventListener('click',()=>selectTab(id));launch.append(b);
      }content.append(launch);
      section('FAST TOGGLES','The most useful settings, without hunting through tabs.');
      const quick=grid();tile(quick,'🎯 Silent Aim','FOV-based local bot aim redirect.',null,'silent');tile(quick,'◈ ESP','Enable enemy markers.',null,'esp');
      tile(quick,'🐇 Hold-Space BHOP','Jump only when holding Space.',null,'autoBhop');tile(quick,'▤ FPS Boost','Lower rendering cost when enabled.',null,'fpsBoost');
      const flickQuick=grid();tile(flickQuick,'🎯 Visible Head Flick · O','Single shot at the nearest visible head, without wall penetration.',visibleHeadFlick);
      const footer=document.createElement('p');footer.className='dw-home-tip';footer.textContent='TIP  •  O = visible flickshot. / = search. Esc = close. All shortcuts can be rebound.';content.append(footer);
    } else if(activeTab==='rocket') {
      section('🚀 ROCKET RECOIL','Fire to launch yourself in the opposite direction. Shoot forward to fly backward, shoot toward the ground to rocket-jump upward. Works with your regular guns and the real firing animation.');
      const rocketGrid=grid();
      tile(rocketGrid,'🚀 ROCKET RECOIL · Alt+J','Backward impulse is applied only when a bullet is actually fired.',null,'rocketRecoil');
      tile(rocketGrid,'↺ Restore Rocket Defaults','Reset launch power and physics settings.',()=>{rocketPower=24;rocketVertical=1;rocketMaxSpeed=145;saveRocket();renderTab()});
      slider('Launch force per bullet',2,90,1,rocketPower,v=>{rocketPower=v;saveRocket()},' u');
      slider('Vertical rocket jump multiplier',0,3,.1,rocketVertical,v=>{rocketVertical=v;saveRocket()},'×');
      slider('Maximum launch velocity',20,240,5,rocketMaxSpeed,v=>{rocketMaxSpeed=v;saveRocket()},' u/s');
      const info=document.createElement('div');info.className='dw-feature-note';
      info.textContent='Tip: Point straight ahead for backwards flight. Look down and shoot to launch upward. Higher fire rates create stronger sustained thrust. If Fly or movement modifiers are also enabled, they may override your momentum. Press End for emergency off.';
      content.append(info);
      const rocketLinks=grid();tile(rocketLinks,'⌨ Change Rocket Hotkey','The default toggle is Alt+J. Rebind in Hotkeys.',()=>{bindingFilter='Rocket Recoil';showMenu('hotkeys')});
    } else if(activeTab==='paradox'){paradoxRenderTab();} else if(activeTab==='paradox131'){v131RenderTab();} else if(activeTab.startsWith('v15:')){v15Render();} else if(activeTab.startsWith('v14:')){v14Render();} else if(activeTab.startsWith('sn:')) { snRenderTab(); } else if(activeTab.startsWith('re:')) { reRenderTab(); } else if(activeTab.startsWith('omega:')) { omegaRenderTab(); } else if(activeTab==='finder'){
      section('POWER FINDER · 100 ABILITIES','Search every Overdrive power. Click to toggle or activate, then open its lab to change strength or assign a hotkey.');
      const search=document.createElement('input');search.className='dw-search';search.type='text';search.placeholder='⌕ Search survival, fly, gun, physics, armor, bot, ESP...';
      search.autocomplete='off';content.append(search);
      const count=document.createElement('div');count.className='dw-kicker';count.textContent='100 / 100 powers';content.append(count);
      const holder=grid();
      const show=()=>{const q=search.value.trim().toLowerCase();holder.replaceChildren();
        const filtered=odPowers.filter(p=>(p.name+' '+p.desc+' '+p.group).toLowerCase().includes(q));
        count.textContent=filtered.length+' / 100 powers';
        for(const p of filtered.slice(0,45)){
          if(p.mode==='t')tile(holder,p.icon+' '+p.name,p.desc,null,odFlagById.get(p.id));
          else tile(holder,p.icon+' '+p.name,p.desc,()=>odAction(p.id));
        }
        if(filtered.length>45){const t=document.createElement('p');t.className='dw-desc';t.textContent='Showing the first 45 results. Type more letters to narrow your search.';holder.after(t)}
      };
      search.addEventListener('input',show);show();
      content.insertAdjacentHTML('beforeend','<div class="dw-feature-note">Open a category on the left for per-power strength controls. All hotkeys can be changed in the Hotkeys tab.</div>');
    } else if(activeTab==='presets'){
      section('PRESET VAULT · SAVE YOUR BUILD','Save and restore your active toggles, power strengths and theme. Profiles are stored locally in this browser.');
      const g0=grid();
      for(const i of [1,2,3]){
        tile(g0,'⬇ Save Slot '+i,'Overwrite preset slot '+i+' with your current setup.',()=>odSaveSlot(i));
        tile(g0,'↗ Load Slot '+i,'Restore all the saved toggles, strengths, and theme from slot '+i+'.',()=>odLoadSlot(i));
      }
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      section('QUICK PRESETS','Preconfigured setups that turn on practical bundles without saving your private setup slots.');
      const g1=grid();
      tile(g1,'◈ CLEAN ESP','Four light visual markers plus FPS readout.',()=>odQuickPreset('marks'));
      tile(g1,'🛡 SURVIVAL','Five healing and safe-movement boosts.',()=>odQuickPreset('rescue'));
      tile(g1,'☄ MAYHEM','Fun bot physics and crowd-control combo.',()=>odQuickPreset('mayhem'));
    } else if(activeTab==='performance'){

      section('FPS BOOST · FRAME ENGINE','Optional graphics reduction to improve performance. Toggle OFF to restore your original renderer resolution and visual features. Results depend on hardware.');
      const pa=grid();tile(pa,'◉ FPS BOOST MASTER','Lower rendering resolution, cap costly overlays, disable GPU-heavy visual extras, restore everything when switched OFF.',null,'fpsBoost');
      tile(pa,'↺ Restore Full Quality','Disable FPS Boost and restore the original pixel ratio and visuals.',()=>{if(flags.fpsBoost)toggleFlag('fpsBoost');else odRestoreFps()});
      selector('Performance profile',[['balanced','BALANCED · Clearer graphics'],['fast','FAST · Lower effects'],['extreme','EXTREME · Lowest resolution']],odPrefs.fpsPreset,v=>{odPrefs.fpsPreset=v;odSave();odApplyFps()});
      slider('2D ESP refresh rate',5,60,1,odPrefs.espRate,v=>{odPrefs.espRate=v;odSave()},' Hz');
      slider('3D render scale',.45,1,.05,odPrefs.quality,v=>{odPrefs.quality=v;odSave();odApplyFps()},'×');
      content.insertAdjacentHTML('beforeend','<div class="dw-feature-note">Actual FPS gains are hardware-dependent. FPS Boost reduces 3D render pixel ratio, slows overlay redraws, and temporarily disables Third Person, Glow and Chams. All original settings are restored on disable. This is a local graphics setting, not guaranteed extra FPS.</div>');
      const pg=grid();tile(pg,'↗ Open Visual Lab','Configure extra ESP overlays.',()=>showMenu('ov:visual'));tile(pg,'◈ Show Hotkey Editor','Configure a hotkey for FPS Boost.',()=>showMenu('hotkeys'));
    } else if(activeTab.startsWith('ov:')){
      const key=activeTab.slice(3),record=odGroups[key];
      section('OVERDRIVE · '+record[1], '10 extra powers · Each toggle/action has an individual hotkey and strength setting · Local bot sandbox.');
      content.insertAdjacentHTML('beforeend','<div class="dw-kicker">✦ POWER LAB '+String(Object.keys(odGroups).indexOf(key)+1).padStart(2,'0')+' / 10 · 100 POWERS TOTAL · ALL DISABLED BY DEFAULT</div>');
      const a=grid();
      for(const power of odPowers.filter(p=>p.group===key)){
        if(power.mode==='t')tile(a,power.icon+' '+power.name,power.desc+' · Strength '+odPowerLevel(power.id).toFixed(2)+'×',null,odFlagById.get(power.id));
        else tile(a,power.icon+' '+power.name,power.desc+' · Strength '+odPowerLevel(power.id).toFixed(2)+'×',()=>odAction(power.id));
      }
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      const groupList=odPowers.filter(p=>p.group===key);
      const pick=odPrefs.selected[key]&&odById.has(odPrefs.selected[key])?odPrefs.selected[key]:groupList[0].id;
      selector('CUSTOMIZE A POWER',groupList.map(p=>[p.id,p.name]),pick,v=>{odPrefs.selected[key]=v;odSave();renderTab()});
      slider('Strength / effect scale · '+odById.get(pick).name,.25,4,.05,odPowerLevel(pick),v=>{odPrefs.levels[pick]=v;odSave()},'×');
      content.insertAdjacentHTML('beforeend','<div class="dw-feature-note">Bind any of these powers in <b>Hotkeys</b>. Strength settings are saved; enabled toggles reset when the match reloads. Abilities affect only local bot objects and are experimental.</div>');
      const b=grid();tile(b,'⌨ Bind This Power','Jump to the hotkey editor for this power.',()=>{bindingFilter=odById.get(pick).name;showMenu('hotkeys')});
    } else if(activeTab==='rage'){

      section('Rage Engine','Client-side bot training only. Target selection triggers when you fire; your camera stays steady.');
      const a=grid();
      tile(a,'🎯 Silent Aim','Redirect fired bullets to an enemy inside your chosen field of view.',null,'silent');
      tile(a,'🔫 Auto Shoot','Automatically fire at enemies in your Rage FOV; respects weapon cooldown.',null,'autoShoot');
      tile(a,'⚡ Rapid Fire','Reduce weapon fire cooldown; rate adjustable below.',null,'fastFire');
      tile(a,'♾️ Infinite Ammo','Automatically refill current weapon and reserve ammunition.',null,'infinity');
      tile(a,'♾ Unlimited Utility','Refill grenades and the Taser in supported local game inventory structures.',null,'utilAll');
      tile(a,'🧱 Wallbang','Ignore static walls for your shots; enemy hits can show the penetration symbol.',null,'wallbang');
      tile(a,'◈ Wallbang Kill Icon','Clutcher built-in pierced indicator on confirmed obstructed kills.',null,'wallIcon');
      tile(a,'🌀 Body Spinbot','Body turns while head looks DOWN. Does not rotate your camera.',null,'spin');
      tile(a,'🎥 Third Person','Animated character with synchronized position, stance and weapon.',null,'third');
      tile(a,'◉ No Recoil','Remove weapon/view recoil, suppress first-person firing kick. Shortcut Alt+R.',null,'noRecoil');
      tile(a,'⊕ No Spread','Force player shots to the crosshair center (removes random bullet spread). Shortcut Alt+N.',null,'noSpread');
      content.insertAdjacentHTML('beforeend','<div class="dw-feature-note">TIP: No Recoil keeps your view steady. No Spread keeps bullets centered. Enable both if you want to test pinpoint firing in a local bot match.</div>');
      const targetRow=grid();tile(targetRow,'⟳ Cycle Rage Target','Switch locked enemy bot.',cycleRageTarget);
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      numericControl('Body spin speed',0,6000,spinDeg,v=>spinDeg=v,'degrees / second');
      slider('Fast fire maximum shots/second',2,40,1,fireRate,v=>fireRate=v,' rps');
      slider('Silent Aim FOV',5,360,5,rageFov,x=>rageFov=x,'°');
      selector('Target priority', [['crosshair','Closest to crosshair'],['distance','Closest to player']], targetMode,v=>{targetMode=v});
      section('INFINITE UTILITY · V18.4','Refills the game\'s local smoke, flash, explosive, fire and decoy supplies while enabled. Every type has its own toggle.');
      const utilityGrid=grid();
      for(const item of utilityTypes){
        const hint=item.id==='molotov'?'T-side fire grenade. CT side uses Incendiary.':item.id==='incendiary'?'CT-side fire grenade. Buy or equip once first; T side uses Molotov.':item.id==='taser'?'Restore Zeus charges when owned.':'Restock this throwable after each use.';
        tile(utilityGrid,item.title,hint,null,item.flag);
      }
      const utilityActions=grid();
      tile(utilityActions,'Refill Utility Now','Restock currently enabled utility types immediately.',()=>{if(!flags.utilAll&&!utilityTypes.some(utilityEnabled))flags.utilAll=true;utilityRefill(true);renderTab();});
      tile(utilityActions,'Turn Off Utility','Disable all seven utility switches and the master switch.',()=>{flags.utilAll=false;for(const item of utilityTypes)flags[item.flag]=false;renderTab();});
      slider('Refill each utility to',1,10,1,utilitySettings.refillTo,v=>{utilitySettings.refillTo=v;utilitySave();},' charges');
      const utilityDetected=utilityStatus();
      const utilityNote=document.createElement('p');utilityNote.className='dw-feature-note';
      utilityNote.textContent=utilityDetected.length
        ?'Detected in this game build: '+utilityDetected.join(', ')+'. Utility is replenished only where the client exposes a modifiable local count. C4 and defuse kit are excluded.'
        :'No grenade inventory values detected yet. Buy or equip a grenade in a local match, then reopen Rage. Availability varies by Clutcher version. C4 and defuse kit are excluded.';
      content.append(utilityNote);
      section('RAGE +10 // PRACTICAL CONTROLS','Ten new opt-in Rage modifiers. None replaces the old Rage settings or the Smooth Head Flick.');
      const rageGrid=grid();rageGrid.classList.add('dw-v14-grid');
      for(const opt of ragePlusDefs)tile(rageGrid,'◉ '+opt.name,opt.desc,null,opt.id);
      section('RAGE +10 // FINE TUNING','Only enabled features use these values. Three priority modes are mutually exclusive.');
      slider('Maximum acquisition distance',15,300,5,ragePlusCfg.maxRange,v=>{ragePlusCfg.maxRange=v;ragePlusSave();},' m');
      slider('Minimum acquisition distance',1,50,1,ragePlusCfg.minRange,v=>{ragePlusCfg.minRange=v;ragePlusSave();},' m');
      slider('Burst recovery',150,1500,50,ragePlusCfg.burstCooldownMs,v=>{ragePlusCfg.burstCooldownMs=v;ragePlusSave();},' ms');
      slider('Early reload at ammo',1,10,1,ragePlusCfg.reloadAt,v=>{ragePlusCfg.reloadAt=v;ragePlusSave();},' rounds');
      const rageActions=grid();tile(rageActions,'⛔ Disable Rage +10','Turn off only these ten modifiers. All existing Rage controls stay unchanged.',()=>{ragePlusOff();renderTab();});
    } else if(activeTab==='mega'){
      section('MEGA RAGE · OVERDRIVE','Separate from regular Rage. The master switch enables the aggressive bundle and restores your old Rage settings when turned off.');
      const a=grid();
      tile(a,'☠ MEGA RAGE MASTER','Enable 360° auto shooting, prediction, silent aim, wallbang, native pierced kill icon, and rapid fire.',null,'megaRage');
      tile(a,'🌐 360° Targeting','Choose enemies behind you without rotating your screen.',null,'rage360');
      tile(a,'📌 Sticky Target','Stay locked on a selected enemy while it lives.',null,'rageSticky');
      tile(a,'➤ Movement Prediction','Lead moving targets when firing.',null,'rageLead');
      tile(a,'☄ Head Priority','Prefer a head-height hit point for auto-fire.',null,'rageHead');
      tile(a,'↻ Auto Reload','Automatically reload an empty magazine.',null,'autoReload');
      tile(a,'◎ Auto Scope','Automatically zoom a sniper when a Rage target is selected.',null,'autoScope');
      tile(a,'⚡ Rapid Fire','Extra firing rate in the bot sandbox.',null,'fastFire');
      tile(a,'🧱 Wallbang','Ignore static wall raycasts while shooting.',null,'wallbang');
      tile(a,'◈ Pierced Kill Icon','Use the game’s actual wallbang marker for obstructed kills.',null,'wallIcon');
      section('🏆 LOCAL AUTO WIN','Complete the round instantly using the built-in bot-match win handler. Match Win grants the necessary score first; it cannot alter online games.');
      const winCards=grid();
      tile(winCards,'🏆 AUTO WIN ROUND','Finish the current local round as a win for your team.',()=>paradoxAutoWin(false));
      tile(winCards,'👑 AUTO WIN MATCH','Set up the local match-winning score and end the round. The final results screen appears after the normal round-end delay.',()=>paradoxAutoWin(true));
      const b=grid();tile(b,'⟳ Next locked target','Cycle the bot being tracked by Rage.',cycleRageTarget);
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      slider('Mega Rage target FOV',5,360,5,rageFov,x=>rageFov=x,'°');
      slider('Mega weapon rate',2,40,1,fireRate,v=>fireRate=v,' rps');
      selector('Target priority', [['crosshair','Closest to crosshair'],['distance','Closest to player']],targetMode,v=>{targetMode=v});
      content.insertAdjacentHTML('beforeend','<p class="dw-desc dw-section">Switch OFF Mega Rage Master to restore your earlier regular Rage settings. Both tabs remain independently accessible: P = Rage, Q = Mega Rage.</p>');
    } else if(activeTab.startsWith('v16:')){v16Render();
    } else if(activeTab==='legitpro'){legitProRender();
    } else if(activeTab==='legit'){
      section('Legit Aimbot · PRECISION', 'Visible flickshots, smooth aim, and optional wall lock. Flickshot NEVER targets hidden enemies.');
      const flickHero=document.createElement('div');flickHero.className='dw-flick-feature';flickHero.innerHTML='🎯 <b>VISIBLE HEAD FLICK</b> <kbd>O</kbd> Snap to the nearest visible enemy head and fire one actual bullet. No targeting through walls.';content.append(flickHero);
      const a=grid();
      tile(a,'◎ Legit Aim Assist','Smoothly guide aim toward enemies while holding right mouse.',null,'legitAim');
      tile(a,'🎯 Visible Head Flick','Press O: instantly snap to a visible enemy head and fire once.',visibleHeadFlick);
      tile(a,'✦ Smooth Head Flick','Shift+O: ease to a visible head, shoot once, then smoothly restore your original view.',smoothHeadFlick);
      tile(a,'✧ Flick Precision','No bullet spread only for Flickshot (still checks solid walls).',null,'flickPrecision');
      tile(a,'◉ Triggerbot','Fire only when a visible enemy is directly under the crosshair.',null,'triggerbot');
      tile(a,'📌 Sticky Aim Lock','Keep the same enemy selected as you adjust your mouse.',null,'legitSticky');
      tile(a,'👁 Visible Enemies Only','Only target bots in direct line of sight.',null,'legitVisible');
      tile(a,'🧱 Lock Through Walls','Target bots behind walls while ON. When OFF, it drops your target and restores visible-only.',null,'legitWallLock');
      tile(a,'⛔ Stop Legit Lock','Immediately disable Legit Aim, wall lock and sticky tracking. Default hotkey: Alt+K.',stopLegitLock);
      tile(a,'〰 Aim Deadzone','Stop micro-adjustments after reaching the target.',null,'legitDeadzone');
      tile(a,'◎ Draw Aim FOV','Show your aiming field as a ring around the crosshair.',null,'aimFovRing');
      tile(a,'➤ Target Line','Draw a thin line to the enemy selected by aim assist.',null,'aimTargetLine');
      tile(a,'🔁 Trigger Burst','Trigger again if the crosshair stays on a bot (cooldown still applies).',null,'triggerBurst');
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      selector('Aim assist activation',[['mouse2','Hold right mouse (default)'],['mouse1','Hold left mouse / shoot'],['shift','Hold Shift'],['always','Always (when enabled)']],aimActivation,v=>{aimActivation=v});
      selector('Aim point',[['upper','Upper torso'],['head','Head'],['chest','Chest']],aimBone,v=>{aimBone=v});
      slider('Legit Aim FOV',2,120,1,legitFov,x=>legitFov=x,'°');
      slider('Flickshot field of view',15,360,5,flickFov,x=>{flickFov=x;saveUi()},'°');
      slider('Flickshot maximum distance',5,300,5,flickMaxDist,x=>{flickMaxDist=x;saveUi()},' m');
      section('SMOOTH FLICK · SHIFT+O','Uses original visible-only hit check and native weapon fire; never shoots through walls.');
      slider('Smooth flick travel',120,850,10,smoothAimMs,x=>{smoothAimMs=x;saveSmoothFlick()},' ms');
      slider('Smooth flick return',120,850,10,smoothReturnMs,x=>{smoothReturnMs=x;saveSmoothFlick()},' ms');
      slider('Headshot pause',0,300,5,smoothShotHoldMs,x=>{smoothShotHoldMs=x;saveSmoothFlick()},' ms');
      slider('Behind-wall lock FOV',10,240,5,legitWallFov,x=>{legitWallFov=x;saveUi()},'°');
      slider('Aim Assist Response',1,70,.5,legitStrength,x=>legitStrength=x,' /s');
      slider('Triggerbot Hit Radius',.15,.65,.01,triggerRadius,x=>triggerRadius=x,' m');
      slider('Trigger activation delay',0,250,10,triggerDelay,x=>triggerDelay=x,' ms');
      content.insertAdjacentHTML('beforeend','<div class="dw-feature-note">If aim assist felt broken in V5, try: <b>Activation = Always</b>, <b>FOV = 60°</b>, <b>Response = 30/s</b>. It only targets enemies inside the ring. Turn Rage Auto Shoot OFF to test Legit mode. For walls: enable <b>Lock Through Walls</b> and increase Behind-wall FOV.</div>');
      content.insertAdjacentHTML('beforeend','<p class="dw-desc dw-section">Tip: Keep Rage Silent Aim OFF if you want ordinary line-of-sight aiming. Triggerbot cannot shoot through walls; Rage Auto Shoot can when Wallbang is on.</p>');
    } else if(activeTab==='move'){
      section('Movement · HYPERDRIVE','Ground-safe Blink • full 3D Flight • stable airborne steering. Hold SPACE to bunnyhop.');
      const a=grid();
      tile(a,'🐇 Hold-Space BHOP','Only jumps again while you KEEP holding your jump key.',null,'autoBhop');
      tile(a,'↔️ Controlled Auto Strafe','Steer in air with A/D or mouse turning. No automatic acceleration; horizontal speed is capped.',null,'autoStrafe');
      tile(a,'❤️ Auto Heal','Keep HP and armor topped up.',null,'god');
      tile(a,'🕊️ Hyper Flight','WASD freely · SPACE rises · CTRL descends · SHIFT is TURBO.',null,'fly');
      tile(a,'◈ Phase Mode','Flight can pass through walls. OFF = collision checked.',null,'flyNoclip');
      tile(a,'📊 Flight HUD','Compact live speed and flight controls overlay.',null,'speedHud');
      tile(a,'⏹ Quick Stop','Brake quickly on the ground when you release movement keys.',null,'quickStop');
      tile(a,'➤ Sprint Boost','Extra 1.8× running speed while moving forward.',null,'sprintBoost');
      tile(a,'☾ Moon Jump','Higher jumping while jump is pressed.',null,'moonJump');
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      slider('Movement speed',1,20,.25,speed,x=>speed=x,'×');
      slider('Gravity strength',0,2,.05,gravityScale,x=>gravityScale=x,'×');
      numericControl('Flight base speed',8,150,flySpeed,x=>flySpeed=x,'world units / sec');
      slider('Flight TURBO multiplier',1,5,.25,flyBoost,x=>flyBoost=x,'×');
      slider('Flight handling / response',4,35,1,flySmooth,x=>flySmooth=x,' /s');
      slider('Air strafe steering',2,25,1,airSteer,x=>{airSteer=x;strafeSave()},' /s');
      slider('Air strafe speed cap',6,30,1,airMaxSpeed,x=>{airMaxSpeed=x;strafeSave()},' u/s');
      gameClockRenderControls();
      slider('Safe Blink distance',3,60,1,blinkDistance,x=>blinkDistance=x,' m');
      const a2=grid();tile(a2,'↺ Reset Speed','Restore normal movement multiplier.',()=>{speed=1;renderTab()});
      tile(a2,'↔️ Reset Strafe','Restore stable strafe steering and safe airborne speed cap.',()=>{airSteer=14;airMaxSpeed=11;strafeSave();renderTab()});
      tile(a2,'🚀 Jump Boost','Give an upward boost immediately.',()=>{g.player.vy=Math.max(g.player.vy||0,9);g.player.onGround=false});
      tile(a2,'⚡ Air Dash','Launch forward at high speed.',airDash);
      tile(a2,'⏹ Emergency Airbrake','Stop horizontal momentum in the air.',airBrake);
      tile(a2,'✦ Teleport to Enemy','Try safe ground near the nearest enemy.',teleportToBot);
      tile(a2,'➜ Safe Blink','Walk ahead virtually and stop at walls, cliffs and slopes.',blinkForward);
      tile(a2,'↶ Blink Back','Return to the saved position before your last blink.',undoBlink);
      tile(a2,'◉ Save Checkpoint','Remember a safe position to return to.',saveCheckpoint);
      tile(a2,'↩ Return to Checkpoint','Go back to saved checkpoint if safe.',returnCheckpoint);
      content.insertAdjacentHTML('beforeend','<p class="dw-desc dw-section">FLIGHT: WASD move · SPACE ascend · CTRL descend · hold SHIFT to boost. AUTO STRAFE: A/D controls direction in the air, including after releasing SPACE. Mouse turns also steer while holding forward or jump. It never adds speed, and the cap is separate from Movement Speed.</p>');
    } else if(activeTab==='guns'){
      section('Weapons & Skins','Give local weapons and apply visual colorways. Skins are previews, not permanent inventory items.');
      const weaponOptions=['ak47','m4a4','m4a1s','awp','ssg08','deagle','r8','glock','usps','p250','fiveseven','tec9','aug','sg553','galil','scar20','g3sg1','mp9','mac10','p90','negev','nova','xm1014','knife'].map(x=>[x,x.toUpperCase()]);
      selector('Weapon giver',weaponOptions,selectedGun,v=>{selectedGun=v});
      let row=grid();tile(row,'🔫 Give selected gun','Equip weapon without opening buy menu.',()=>giveGun(selectedGun));
      tile(row,'🎯 Give Scout','SSG 08',()=>giveGun('ssg08'));
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      selector('Skin giver — client-side color preview', [['default','Original / None'],['bluegem','💎 Blue Gem-inspired Karambit (3P)'],['sapphire','🔵 Sapphire Blue'],['ruby','🔴 Ruby Red'],['gold','🟡 Golden'],['neon','🟣 Neon Purple']], skin, v=>{
        chooseSkin(v);
      });
      row=grid();tile(row,'💎 Equip Blue Gem Karambit','Equip knife and show Blue Gem-inspired Karambit in first person (experimental) or third person.',()=>{chooseSkin('bluegem');renderTab()});
      tile(row,'🧼 Clear visual skin','Restore original weapon colors.',()=>{chooseSkin('default');renderTab()});
      content.insertAdjacentHTML('beforeend','<p class="dw-desc dw-section">Blue Gem is a LOCAL visual preview, not a genuine Case Hardened Blue Gem inventory item. The game’s Karambit viewmodel is requested in first person when supported. If you do not see it, enable Rage → Third Person and equip Knife.</p>');
    } else if(activeTab==='audio'){
      section('KILL SOUND STUDIO','Locally generated kill-confirmation sounds. No downloads or external audio files; only plays when YOU score a kill.');
      const a=grid();
      tile(a,'♫ Kill Sound','Play a custom confirmation sound whenever you eliminate a bot.',()=>{if(flags.killSound)getKillAudio()},'killSound');
      tile(a,'▶ Test Sound','Preview the selected sound and unlock browser audio.',()=>playKillSound(false,true));
      selector('Sound preset',[
        ['bell','CRYSTAL BELL · bright CS-like chime'],
        ['classic','CLASSIC · clean hit confirmation'],
        ['arcade','ARCADE · retro game sound'],
        ['laser','LASER · quick sci-fi zap'],
        ['bass','BASS · deep elimination punch']
      ],soundPreset,v=>{soundPreset=v;playKillSound(false,true)});
      slider('Kill sound volume',0,100,1,Math.round(soundVolume*100),v=>{soundVolume=v/100},'%');
      const b=grid();
      tile(b,'✦ Test Headshot Sound','Headshots make the chosen sound slightly higher pitched.',()=>playKillSound(true,true));
      tile(b,'♢ Mute Kill Sound','Silence sound effects immediately.',()=>{flags.killSound=false;renderTab()});
      content.insertAdjacentHTML('beforeend','<p class="dw-feature-note">Audio starts after a browser interaction. If you hear nothing, click TEST SOUND once, check the game tab is not muted, and enable Kill Sound.</p>');
    } else if(activeTab==='models'){
      section('PLAYER MODEL CHANGER','Choose the full-body character shown in Third Person. Local preview only: does not modify server-side player models, skins or inventory.');
      const a=grid();
      tile(a,'🎥 Show Third Person','Turn on the third-person camera and visible character model.',null,'third');
      tile(a,'🎲 Reroll Character','Choose a new random CT or T model preset.',()=>{rerollModel();renderTab()});
      selector('Character appearance',[
        ['auto','Auto · my team'],['ct','Counter-Terrorist body'],['t','Terrorist body'],
        ['enemy','Enemy-team appearance'],['random','Random CT/T (reroll button)']
      ],modelChoice,v=>setModelChoice(v));
      selector('Body material style',[
        ['original','Original outfit'],['cobalt','Cobalt blue'],['crimson','Crimson red'],
        ['gold','Golden armor'],['neon','Neon violet & cyan'],['emerald','Emerald green'],['ghost','Ghost · transparent']
      ],modelColor,v=>{modelColor=v;applyModelColors();notice('Body: '+v)});
      slider('Character model size',65,150,5,Math.round(modelSize*100),v=>{modelSize=v/100},'%');
      const b=grid();
      tile(b,'♢ Reset Appearance','Default team character, original materials and 100% size.',()=>{
        modelColor='original';modelSize=1;setModelChoice('auto');applyModelColors();renderTab();
      });
      tile(b,'↻ Reload Player Model','Rebuild the third-person model after changing presets.',()=>{
        disposeAvatar();nextAvatarRetry=0;notice('Player model reload queued');
      });
      content.insertAdjacentHTML('beforeend','<p class="dw-feature-note">Model color and size affect only your rendered third-person body. Turn on Third Person to see them. The game currently exposes CT/T body assets, not unrestricted custom Steam Workshop player models.</p>');
    } else if(activeTab==='visual'){
      section('Visuals & ESP','Clear enemy boxes and an improved third-person perspective.');
      const a=grid();
      tile(a,'▣ Box ESP','60 FPS projected enemy boxes, distances and names.',null,'esp');
      tile(a,'💠 Model Chams','Tint 3D enemy bodies cyan, drawing them through walls.',()=>{if(!flags.chams)clearChams();else applyChams()},'chams');
      tile(a,'✨ Glow Outline','Soft neon outline around projected enemies, including behind walls.',null,'glow');
      tile(a,'│ Health Bars','Dynamic health bars next to ESP boxes.',null,'espHealth');
      tile(a,'╲ Tracers','Thin lines from bottom-center to each enemy.',null,'espTracers');
      tile(a,'✛ Center Dot','Custom center crosshair overlay.',null,'showCrosshair');
      tile(a,'🎥 Third Person','Show your animated body behind the camera.',null,'third');
      tile(a,'🌀 Downward Body Spin','Rotate just your character avatar.',null,'spin');
      tile(a,'◈ Wallbang Icon','Use the kill feed’s native wall penetration icon.',null,'wallIcon');
      tile(a,'◉ Mini Radar','Live radar above the game HUD. Close the menu to see it.',null,'radar');
      tile(a,'↑↓ Radar Height Arrows','Show clear ↑/↓ markers for bots on different floors. Automatically enables the mini-radar.',null,'radarElevation');
      tile(a,'◎ Green Aim Pulse','Flash the enemy radar dot green whenever your crosshair is on their visible body.',null,'radarAimPulse');
      tile(a,'✦ Purple Void Aim Chams','Purple full-body chams after holding your crosshair on a bot. The radius and delay are adjustable below. Separate from radar flash.',null,'aimBodyGlow');
      tile(a,'◉ Aim Pulse: Line of Sight','Require a clear wall raycast for the green pulse. Leave OFF if Clutcher incorrectly flags visible bots.',null,'radarRequireLOS');
      tile(a,'⇧ Offscreen Arrows','Markers on the screen edge for enemies outside view.',null,'enemyArrows');
      tile(a,'♢ Aim Target HUD','Show target name and distance in a floating panel.',null,'targetHUD');
      tile(a,'◆ Kill Counter','Show local kill count for this session.',null,'killHUD');
      tile(a,'✕ Kill Hitmarker','Show a quick impact confirmation marker after a kill.',null,'hitmarkers');
      tile(a,'↗ Aim Target Line','Aim-selected enemy line overlay.',null,'aimTargetLine');
      tile(a,'◉ Teammate Boxes','Include bots on your team in ESP (green).',null,'espTeam');
      tile(a,'⌘ Name Labels','Show player names and distance over boxes.',null,'botNames');
      tile(a,'♢ Clear Skin Colors','Restore the default weapon coloring.',()=>{skin='default';resetMaterials();avatarGun=''});
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      slider('Third-person camera distance',1.8,7,.1,thirdDistance,x=>thirdDistance=x,' m');
      slider('Third-person height',-.2,1.25,.05,thirdHeight,x=>thirdHeight=x,' m');
      selector('Radar placement',[['top-left','Top left (over game HUD)'],['top-right','Top right'],['bottom-left','Bottom left'],['bottom-right','Bottom right']],radarCorner,x=>{radarCorner=x;radarSave()});
      slider('Radar range',15,100,5,radarRange,x=>{radarRange=x;radarSave()},' meters');
      slider('Height arrow threshold',.4,4,.2,radarHeightThreshold,x=>{radarHeightThreshold=x;radarSave()},' m');
      section('PURPLE VOID · AIM CHAMS','Hold your crosshair near an enemy to activate purple full-body chams. 0 ms activates instantly.');
      slider('Aim radius',0,90,2,voidChamsCfg.aimRadiusPx,x=>{voidChamsCfg.aimRadiusPx=x;voidChamsSave()},' px');
      slider('Required aim time',0,1500,50,voidChamsCfg.holdMs,x=>{voidChamsCfg.holdMs=x;voidChamsSave()},' ms');
      slider('Purple chams opacity',.25,1,.05,voidChamsCfg.opacity,x=>{voidChamsCfg.opacity=x;voidChamsSave()},'×');
      const radarHint=document.createElement('p');radarHint.className='dw-feature-note';radarHint.textContent='Radar green pulse and Purple Void chams are separate. Chams uses a purple full-body material on supported models and a purple body contour fallback. Change the aim radius and required aim time above. Close U to see it. deathWon.radar.debug() shows the current target and glow state.';content.append(radarHint);
    } else if(activeTab==='bots'){
      section('Bot Lab','Your original chaos powers are here, including delete-all on I.');
      const a=grid();
      tile(a,'☠️ Delete ALL bots','Includes bot teammates.',()=>killBots(false));
      tile(a,'🎯 Delete enemies','Leave bot teammates alive.',()=>killBots(true));
      tile(a,'♻️ Revive all','Bring dead bots back.',revive);
      tile(a,'🧊 Freeze bots','Pause the bot movement/AI update.',()=>{if(!flags.freeze)unfreeze()},'freeze');
      tile(a,'❤️ Instant heal','Full HP, armor, helmet.',heal);
      tile(a,'💰 $16,000','Fill your local money balance.',()=>{g.player.money=16000;g.hud?.updateMoney?.()});
      tile(a,'☮ Ceasefire','Stop bot firing without freezing their movement.',null,'peacefulBots');
      tile(a,'🪩 Bot Dance','Spin all bots for a weird dance party.',null,'botSpin');
      tile(a,'🥷 Disarm all bots','Replace bot weapons with knives.',botDisarm);
      tile(a,'↩ Turn bots around','Turn every alive bot away from their facing.',botTurnAround);
      tile(a,'❤️ Heal bots','Heal every bot to 100 HP and armor.',botFullHeal);
      tile(a,'⬆ Launch bots','Give every bot upward momentum.',botLaunch);
      tile(a,'◎ Bot constellation','Scatter bots around you on safe ground when possible.',botShuffle);
      tile(a,'✚ Heal weakest enemy','Instantly heal the weakest living enemy.',healWeakBot);
      tile(a,'👥 Bot crowd','Line up living bots in front of you.',()=>{
        const p=g.player;let n=0;for(const bot of allBots()){
          const side=(n%5-2)*1.7,d=8+Math.floor(n/5)*1.8;
          bot.x=p.x-Math.sin(p.yaw)*d+Math.cos(p.yaw)*side;
          bot.z=p.z-Math.cos(p.yaw)*d-Math.sin(p.yaw)*side;
          bot.y=p.y;bot.vx=bot.vy=bot.vz=0;n++;
        }
      });
      tile(a,'📍 Teleport to enemy','Jump near the closest enemy bot.',()=>{
        const b=nearest();if(!b)return notice('No living enemies');
        g.player.x=b.x+1.5;g.player.z=b.z+1.5;g.player.y=b.y;g.player.vx=g.player.vy=g.player.vz=0;
      });
    } else if(activeTab==='extras'){
      section('EXTRAS · TEN NEW POWERS','Seven live modifiers and three instant actions. Each one has a customizable hotkey. Magnet, Repulsor and Orbit are mutually exclusive.');
      const a=grid();
      tile(a,'🧲 Enemy Magnet','Attract enemy bots toward your position without affecting your camera.',null,'botMagnet');
      tile(a,'💥 Enemy Repulsor','Push enemy bots away when they get close.',null,'botRepulse');
      tile(a,'🪐 Orbit Army','Make enemy bots circle you in a formation, using safe-ground checks.',null,'botOrbit');
      tile(a,'❤️ Critical Auto Heal','Automatically recover when HP drops to 35 or below (short cooldown).',null,'criticalHeal');
      tile(a,'🛡 Armor Regeneration','Slowly replenish armor during combat.',null,'armorRegen');
      tile(a,'📦 Reserve Ammo Regen','Gradually refill your current weapon’s reserve ammunition.',null,'ammoRegen');
      tile(a,'🐌 Slow-Motion Enemies','Dampen bot movement and delay their shots.',null,'slowBots');
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      const b=grid();
      tile(b,'🔄 Swap with Enemy','Swap positions with the selected/nearest enemy only if both destinations are safe.',swapEnemy);
      tile(b,'🪝 Pull Enemy to Me','Place the selected/nearest enemy a few meters in front of you.',pullEnemy);
      tile(b,'🚀 Launch One Enemy','Send the selected/nearest enemy upward with a big impulse.',launchEnemy);
      content.insertAdjacentHTML('beforeend','<p class="dw-desc dw-section">Tip: Use the HOTKEYS tab to assign an instant key to each of these 10 powers. These change only the local bot simulation, not online player data.</p>');
    } else if(activeTab==='nightfall'){
      section('NIGHTFALL · 16 NEW POWERS','Nine live abilities and seven instant bot actions. Every tile is independently bindable. Effects are local to your bot match.');
      content.insertAdjacentHTML('beforeend','<div class="dw-kicker">✦ AURA FIELD · adjustable radius in Customize · effects can overlap</div>');
      const a=grid();
      tile(a,'☠ Kill Aura','Automatically eliminate the closest enemy in range, one every 330ms.',null,'killAura');
      tile(a,'🛡 Team Guardian','Protect nearby teammate bots with HP and armor.',null,'teamGuardian');
      tile(a,'🔇 Silence Field','Stop nearby enemy bots firing while inside range.',null,'silenceAura');
      tile(a,'✦ Flash Field','Continuously blind nearby enemies.',null,'blindAura');
      tile(a,'↥ Bounce Field','Launch nearby bots upward each second.',null,'bounceAura');
      tile(a,'☄ Glass Enemies','Set every enemy bot to 1 HP; one hit will finish them.',null,'glassBots');
      tile(a,'♥ Vampire Healing','Recover 25 HP on each confirmed bot kill.',null,'vampire');
      tile(a,'🌀 Confusion Field','Make nearby enemies spin and lose movement momentum.',null,'enemyConfuse');
      tile(a,'⚔ Disarm Field','Force nearby enemy bots to hold knives.',null,'disarmAura');
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      const b=grid();
      tile(b,'💥 Shockwave','Push and launch all enemies around you.',shockwave);
      tile(b,'✨ Flash Everyone','Blind every enemy bot for 16 seconds.',flashAll);
      tile(b,'🧊 1 HP Wave','Instantly set all enemies to 1 HP.',glassNow);
      tile(b,'🎯 Scout Army','Give all bots SSG 08 Scouts.',sniperArmy);
      tile(b,'♻ Full Respawn','Respawn all bots at their spawn points.',allBotReset);
      tile(b,'❄ Stun Target','Prevent selected enemy from shooting for 30 seconds.',freezeTarget);
      tile(b,'✦ Enemy Summon Circle','Bring enemies into a safe ring around you.',summonCircle);
      slider('Aura Field Radius',3,25,1,auraRadius,v=>{auraRadius=v;saveUi()},' m');
    } else if(activeTab==='custom'){
      section('CUSTOMIZE · NIGHTFALL DESIGN','Choose accent, interface size, opacity and combat control ranges. Hotkeys remain in their own tab.');
      content.insertAdjacentHTML('beforeend','<div class="dw-kicker">✦ LIVE DESIGN STUDIO · changes are saved locally in your browser · no external services</div>');
      const themesRow=document.createElement('div');themesRow.className='dw-brand-row';
      for(const [name,colors] of Object.entries(themes)){
        const b=document.createElement('button');b.type='button';b.className='dw-theme'+(name===uiTheme?' selected':'');
        b.title=name.toUpperCase();b.style.background='linear-gradient(145deg,'+colors[0]+','+colors[3]+')';
        b.addEventListener('click',()=>{uiTheme=name;applyTheme();renderTab();notice('Theme: '+name.toUpperCase())});themesRow.append(b);
      }
      content.append(themesRow);
      selector('Menu theme',Object.keys(themes).map(k=>[k,k.toUpperCase()]),uiTheme,v=>{uiTheme=v;applyTheme();renderTab()});
      slider('Interface Size',.78,1.1,.01,uiScale,v=>{uiScale=v;applyTheme()},'×');
      slider('Interface Opacity',.86,1,.01,uiOpacity,v=>{uiOpacity=v;applyTheme()},'');
      selector('Menu Pop Animation',[['pop','✦ Smooth Pop'],['slide','↗ Slide Up'],['zoom','◈ Cinematic Zoom'],['off','○ Off / Maximum FPS']],menuFxMode,v=>{menuFxMode=v;saveUi();notice('Menu animation: '+v)});
      slider('Menu Animation Speed',140,650,10,menuFxDuration,v=>{menuFxDuration=v;saveUi()},' ms');
      const previewBox=grid();tile(previewBox,'▶ Replay Opening Animation','Watch the selected pop-up animation without reloading.',()=>{hideMenu();setTimeout(()=>{if(active)showMenu('custom')},Math.max(180,menuFxDuration+30))});
      slider('ESP Box Line Thickness',.7,4,.1,espThickness,v=>{espThickness=v;saveUi()},' px');
      slider('Aura Effect Radius',3,25,1,auraRadius,v=>{auraRadius=v;saveUi()},' m');
      slider('Behind-wall Lock FOV',10,240,5,legitWallFov,v=>{legitWallFov=v;saveUi()},'°');
      content.insertAdjacentHTML('beforeend','<div class="dw-section"></div>');
      const x=grid();
      tile(x,'⌨ Open Hotkey Editor','Set custom keys for every new Nightfall power.',()=>showMenu('hotkeys'));
      tile(x,'↺ Reset Appearance','Restore default violet colors and menu scaling.',()=>{uiTheme='violet';uiScale=1;uiOpacity=.98;espThickness=1.6;menuFxMode='pop';menuFxDuration=320;applyTheme();renderTab()});
      content.insertAdjacentHTML('beforeend','<p class="dw-desc dw-section">Visual themes and sliders persist between reloads. Enabling cheats is not saved, so each new session starts with controls OFF.</p>');
    } else if(activeTab==='hotkeys') {
      renderHotkeysPage();
    }
  }
  function renderHotkeysPage(){
    section('Keyboard Shortcuts','Click BIND, then press a key or combination. Escape cancels; Backspace removes a shortcut. Duplicate keys are reassigned automatically.');
    const quick=document.createElement('div');quick.className='dw-quick';
    for(const [id,title] of [['nav:menu','Menu'],['nav:rage','Rage'],['nav:mega','Mega Rage'],['nav:panic','Panic'],['action:delete-all-bots','Wipe bots'],['flag:wallbang','Wallbang']]){
      const chip=document.createElement('span');chip.className='dw-quickchip';chip.textContent=title+'  ·  '+displayKey(bindings[id]);quick.append(chip);
    }
    content.append(quick);
    const input=document.createElement('input');input.type='text';input.className='dw-search';input.placeholder='Search every power, action and hotkey...';
    input.value=bindingFilter;input.autocomplete='off';
    input.addEventListener('input',()=>{bindingFilter=input.value;renderHotkeyRows()});
    content.append(input);
    const rows=document.createElement('div');rows.id='dw-hotkey-rows';content.append(rows);
    const reset=document.createElement('button');reset.type='button';reset.className='dw-clear';reset.style.marginTop='12px';reset.textContent='↺ Restore default hotkeys';
    reset.addEventListener('click',()=>{bindings={...defaults};saveBindings();notice('Default hotkeys restored');renderTab()});content.append(reset);
    renderHotkeyRows();
  }
  function renderHotkeyRows(){
    const holder=content.querySelector('#dw-hotkey-rows');if(!holder)return;
    holder.replaceChildren();
    const entries=[['nav:menu','Menu'],['nav:rage','Open Rage tab'],['nav:mega','Open Mega Rage tab'],['nav:panic','Emergency off']];
    for(const k of Object.keys(flags))if(k!=='espSkeleton')entries.push(['flag:'+k,describeHotkey('flag:'+k)]);
    for(const [id,act] of actions)entries.push([id,act.tab?.startsWith('v14:')?'V14 '+act.title:act.title]);
    const query=bindingFilter.trim().toLowerCase();let num=0;
    for(const [id,label] of entries){
      const detail=id.startsWith('flag:')?'TOGGLE FEATURE':id.startsWith('action:')?(actions.get(id)?.tab==='adjustments'?'PARAMETER ADJUSTMENT':'INSTANT ACTION'):'GLOBAL CONTROL';
      if(query&&!String(label+' '+detail+' '+displayKey(bindings[id])).toLowerCase().includes(query))continue;
      num++;
      const row=document.createElement('div');row.className='dw-krow';
      const words=document.createElement('div');words.className='dw-krowtext';words.textContent=label;
      const note=document.createElement('div');note.className='dw-kg';note.textContent=detail;words.append(note);
      const bind=document.createElement('button');bind.type='button';bind.className='dw-bind';bind.textContent=displayKey(bindings[id]);
      bind.addEventListener('click',()=>{
        capturingId=id;
        for(const btn of holder.querySelectorAll('.dw-bind'))btn.classList.remove('dw-pulse');
        bind.classList.add('dw-pulse');bind.textContent='PRESS A KEY…';bind.blur();
      });
      const clear=document.createElement('button');clear.type='button';clear.className='dw-clear';clear.textContent='×';clear.title='Remove binding';
      clear.addEventListener('click',()=>{capturingId=null;setBinding(id,'')});
      row.append(words,bind,clear);holder.append(row);
    }
    if(!num){const p=document.createElement('p');p.className='dw-desc';p.textContent='No shortcuts match your search.';holder.append(p)}
  }
  function panicReset(){if(v17State.autoEnabledByUs){flags.fpsBooster=false;fpsBoosterEnable(false);v17State.autoEnabledByUs=false;}v17.adaptiveFPS=false;v17State.cueBot=null;v17CueHud.style.display='none';cancelSmoothHeadFlick();ragePlusOff();v16Off();legitProDisable();v15Off();v14Disable();v131Off();snClear();omegaOffAll();
    ++menuAnimationToken;cancelMenuAnimation();odRestoreFps();reDisableAll();
    for(const id of Object.keys(flags))flags[id]=false;
    fpsBoosterEnable(false);
    flags.wallIcon=true;flags.legitVisible=true;legitFocus=null;rageFocus=null;triggerPrev=null;triggerOnset=0;speed=1;gravityScale=1;spinPhase=0;flightVel={x:0,y:0,z:0};blinkUndo=null;megaSnapshot=null;ammoRegenAccumulator=0;
    gameClockReset();clearAimBodyGlow();clearChams();unfreeze();notice('Emergency OFF · all powers disabled');
    if(panel.style.display!=='none')renderTab();
  }
  // Values also get bindable increment/decrement actions, not just toggle switches.
  const adjustments=[
    ['Speed +1×',()=>{speed=Math.min(20,Math.round((speed+1)*100)/100);notice('Speed '+speed+'×')}],
    ['Speed -1×',()=>{speed=Math.max(1,Math.round((speed-1)*100)/100);notice('Speed '+speed+'×')}],
    ['Flight speed +10',()=>{flySpeed=Math.min(150,flySpeed+10);notice('Fly '+flySpeed+' u/s')}],
    ['Flight speed -10',()=>{flySpeed=Math.max(8,flySpeed-10);notice('Fly '+flySpeed+' u/s')}],
    ['Spin +180°/s',()=>{spinDeg=Math.min(6000,spinDeg+180);notice('Spin '+spinDeg+'°/s')}],
    ['Spin -180°/s',()=>{spinDeg=Math.max(0,spinDeg-180);notice('Spin '+spinDeg+'°/s')}],
    ['Rage FOV +10°',()=>{rageFov=Math.min(180,rageFov+10);notice('Rage FOV '+rageFov+'°')}],
    ['Rage FOV -10°',()=>{rageFov=Math.max(5,rageFov-10);notice('Rage FOV '+rageFov+'°')}],
    ['Camera farther',()=>{thirdDistance=Math.min(7,thirdDistance+.5);notice('Camera '+thirdDistance.toFixed(1)+' m')}],
    ['Camera closer',()=>{thirdDistance=Math.max(1.8,thirdDistance-.5);notice('Camera '+thirdDistance.toFixed(1)+' m')}],
    ['Gravity +0.1',()=>{gravityScale=Math.min(2,gravityScale+.1);notice('Gravity '+gravityScale.toFixed(1)+'×')}],
    ['Gravity -0.1',()=>{gravityScale=Math.max(0,gravityScale-.1);notice('Gravity '+gravityScale.toFixed(1)+'×')}],
    ['Fire rate +2',()=>{fireRate=Math.min(40,fireRate+2);notice('Fire '+fireRate+' rps')}],
    ['Fire rate -2',()=>{fireRate=Math.max(2,fireRate-2);notice('Fire '+fireRate+' rps')}],
  ];
  for(const [title,handler] of adjustments)actions.set(actionId(title),{title,handler,tab:'adjustments'});
  // Render each category once to register ALL actions. The selected tab remains Rage.
  for(const [tabId] of tabs){if(tabId!=='hotkeys'){activeTab=tabId;renderTab();}}
  selectTab('home');
  // V10.1: GPU-friendly pop/slide/zoom entrance with reversible close animation.
  // Animate only opacity and transform. UI scale is preserved, and reduced-motion is respected.
  let menuAnimation=null, curtainAnimation=null, menuAnimationToken=0;
  const animationsAllowed=()=>menuFxMode!=='off' && typeof panel.animate==='function' &&
    !(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  function cancelMenuAnimation(){
    try{menuAnimation?.cancel()}catch{};try{curtainAnimation?.cancel()}catch{}
    menuAnimation=null;curtainAnimation=null;
  }
  function panelTransform(kind){
    const sc=uiScale;
    if(kind==='popStart')return `translate(-50%,-50%) translateY(18px) scale(${(sc*.92).toFixed(4)})`;
    if(kind==='popMid')return `translate(-50%,-50%) translateY(-3px) scale(${(sc*1.018).toFixed(4)})`;
    if(kind==='slideStart')return `translate(-50%,-50%) translateY(48px) scale(${(sc*.985).toFixed(4)})`;
    if(kind==='zoomStart')return `translate(-50%,-50%) scale(${(sc*.78).toFixed(4)})`;
    if(kind==='close')return `translate(-50%,-50%) translateY(9px) scale(${(sc*.955).toFixed(4)})`;
    return `translate(-50%,-50%) scale(${sc})`;
  }
  function showMenu(tab){
    capturingId=null;selectTab(tab||activeTab);
    const wasHidden=panel.style.display==='none';
    ++menuAnimationToken;
    cancelMenuAnimation();
    panel.style.display='block';panel.style.pointerEvents='auto';
    curtain.style.display='block';
    // The tab strip is measurable only after the previously hidden menu becomes visible.
    if(!navFilter)navElems.get(activeTab)?.scrollIntoView?.({block:'nearest',inline:'nearest'});
    if(animationsAllowed()&&wasHidden){
      const duration=menuFxDuration, ending=panelTransform('normal');
      const start=panelTransform(menuFxMode==='slide'?'slideStart':menuFxMode==='zoom'?'zoomStart':'popStart');
      const frames=menuFxMode==='pop'?[
        {opacity:0,transform:start,offset:0},
        {opacity:uiOpacity,transform:panelTransform('popMid'),offset:.74},
        {opacity:uiOpacity,transform:ending,offset:1}
      ]:[{opacity:0,transform:start},{opacity:uiOpacity,transform:ending}];
      menuAnimation=panel.animate(frames,{duration,easing:'cubic-bezier(.17,.8,.24,1)',fill:'both'});
      curtainAnimation=curtain.animate([{opacity:0},{opacity:.45}],{duration:Math.min(duration,260),easing:'ease-out',fill:'both'});
      const currentToken=menuAnimationToken;
      menuAnimation.finished.then(()=>{
        if(currentToken!==menuAnimationToken)return;
        cancelMenuAnimation();
      }).catch(()=>{});
    }
    try{document.exitPointerLock?.()}catch{}
  }
  function hideMenu(){
    if(panel.style.display==='none')return;
    const currentToken=++menuAnimationToken;
    cancelMenuAnimation();
    if(!animationsAllowed()){
      panel.style.display='none';curtain.style.display='none';
    }else{
      panel.style.pointerEvents='none';
      menuAnimation=panel.animate([
        {opacity:uiOpacity,transform:panelTransform('normal')},
        {opacity:0,transform:panelTransform('close')}
      ],{duration:Math.max(130,Math.round(menuFxDuration*.62)),easing:'cubic-bezier(.4,0,1,1)',fill:'both'});
      curtainAnimation=curtain.animate([{opacity:.45},{opacity:0}],
        {duration:Math.max(120,Math.round(menuFxDuration*.57)),fill:'both'});
      menuAnimation.finished.then(()=>{
        if(currentToken!==menuAnimationToken)return;
        cancelMenuAnimation();panel.style.display='none';curtain.style.display='none';panel.style.pointerEvents='auto';
      }).catch(()=>{});
    }
    try{g.hud?.hidePause?.();g.input?.requestLock?.()}catch{}
  }
  curtain.addEventListener('click',hideMenu);
  panel.querySelector('#dw-close').addEventListener('click',hideMenu);
  function keys(e){
    if(!active||e.repeat)return;
    if(panel.style.display!=='none'&&!capturingId&&e.key==='Escape'&&!(e.target===navSearch)){
      e.preventDefault();hideMenu();return;
    }
    if(panel.style.display!=='none'&&!capturingId&&(e.key==='/'||(e.ctrlKey&&e.key.toLowerCase()==='k'))&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')){
      e.preventDefault();navSearch.focus();navSearch.select();return;
    }
    if(capturingId){
      e.preventDefault();e.stopImmediatePropagation();
      if(e.code==='Escape'){capturingId=null;renderHotkeyRows();return;}
      if(e.code==='Backspace'||e.code==='Delete'){const id=capturingId;capturingId=null;setBinding(id,'');return;}
      const chord=keyCode(e);if(!chord)return;
      const id=capturingId;capturingId=null;setBinding(id,chord);return;
    }
    if(e.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))return;
    const chord=keyCode(e);if(!chord)return;
    const id=Object.keys(bindings).find(id=>bindings[id]===chord);
    if(!id)return;
    // While menu is open, only global navigation shortcuts should run.
    if(panel.style.display!=='none' && !id.startsWith('nav:'))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(id==='nav:menu'){panel.style.display==='none'?showMenu():hideMenu();return;}
    if(id==='nav:rage'){showMenu('rage');return;}
    if(id==='nav:mega'){showMenu('mega');return;}
    if(id==='nav:panic'){panicReset();return;}
    if(g.state!=='playing')return;
    if(id.startsWith('flag:')){
      safe(()=>{toggleFlag(id.slice(5));g.hud?.announce?.(describeHotkey(id)+' '+(flags[id.slice(5)]?'ON':'OFF'),650)});
    }else if(actions.has(id)){
      safe(()=>{const action=actions.get(id);action.handler();if(id!=='action:visible-head-flick')notice(action.title+' done')});
    }
  }
  window.addEventListener('keydown',keys,true);

  // -------------------- TICK / LIVE FEATURES --------------------

  // V18.5 RADAR: camera-derived ray (not estimated view angles) for reliable aim.
  // PerspectiveCamera.getWorldDirection() reflects actual game look, recoil and view changes.
  // Gracefully fall back to player yaw/pitch for test environments and older builds.
  function radarVector3(o){
    return o&&[o.x,o.y,o.z].every(Number.isFinite)?[o.x,o.y,o.z]:null;
  }
  function radarSightRay(){
    const p=g.player,cam=g.camera;
    if(!p?.alive)return null;
    try{
      if(typeof cam?.getWorldDirection==='function'){
        let vec;
        // three.js getWorldDirection needs a mutable target. Use existing camera vector clone.
        if(typeof cam.position?.clone==='function')vec=cam.position.clone();
        else vec={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;return this}};
        const direction=radarVector3(cam.getWorldDirection(vec));
        const origin=radarVector3(cam.position);
        const norm=direction&&Math.hypot(...direction);
        if(origin&&norm>0.001){radarStats.aimSource='camera';return {origin,dir:direction.map(v=>v/norm)};}
      }
    }catch(e){radarStats.lastError='Camera ray: '+String(e.message||e)}
    const pitch=Number(p.pitch)||0,yaw=Number(p.yaw)||0,c=Math.cos(pitch);
    radarStats.aimSource='player fallback';
    return {origin:[Number(p.x)||0,(Number(p.y)||0)+(Number(p.eyeH)||1.6),Number(p.z)||0],
      dir:[-Math.sin(yaw)*c,Math.sin(pitch),-Math.cos(yaw)*c]};
  }
  function radarIntersectsBot(ray,bot){
    if(!ray||!bot?.alive)return false;
    const x=Number(bot.x),z=Number(bot.z),y=Number(bot._visY??bot.y);
    if(![x,y,z].every(Number.isFinite))return false;
    const radius=Math.max(.3,Math.min(.85,Number(bot.radius)||.48));
    const height=Math.max(1.2,Math.min(2.6,Number(bot.height)||1.8));
    const mins=[x-radius,y+.02,z-radius],maxs=[x+radius,y+height,z+radius];
    let near=0,far=Math.max(20,radarRange);
    for(let axis=0;axis<3;axis++){
      const v=ray.dir[axis],o=ray.origin[axis];
      if(Math.abs(v)<1e-8){if(o<mins[axis]||o>maxs[axis])return false;continue;}
      let a=(mins[axis]-o)/v,b=(maxs[axis]-o)/v;
      if(a>b)[a,b]=[b,a];near=Math.max(a,near);far=Math.min(b,far);
      if(far<near)return false;
    }
    return far>=near;
  }
  function radarCrosshairOn(bot,ray=radarSightRay()){
    if(!bot?.alive||!g.player?.alive||bot.team===g.player.team)return false;
    if(!radarIntersectsBot(ray,bot))return false;
    if(flags.radarRequireLOS&&behindWall(bot))return false;
    return true;
  }
  function radarElevationKind(bot){
    if(!bot||!g.player)return 0;
    const height=(Number(bot._visY??bot.y)||0)-(Number(g.player.y)||0);
    return height>=radarHeightThreshold?1:height<=-radarHeightThreshold?-1:0;
  }
  function radarCoordinates(bot){
    const p=g.player;
    if(!p||!bot)return null;
    const dx=Number(bot.x)-Number(p.x),dz=Number(bot.z)-Number(p.z),yaw=Number(p.yaw)||0;
    if(![dx,dz].every(Number.isFinite))return null;
    // Camera points toward -Z at yaw 0. A bot straight ahead must ALWAYS be above
    // the centre dot, including after a 90°/180° turn (V18.4 had wrong signs).
    const x=dx*Math.cos(yaw)-dz*Math.sin(yaw);
    const y=dx*Math.sin(yaw)+dz*Math.cos(yaw);
    return {x,y};
  }
  // V18.7 | Purple Void: screen-space aim gate, a per-target dwell timer,
  // and cloned through-wall chams materials. Never mutate the shared originals.
  const bodyGlowMeshes=new Map();
  let bodyGlowBot=null,voidCandidate=null,voidCandidateSince=0,voidReadyBot=null;
  function resetVoidFocus(){voidCandidate=null;voidCandidateSince=0;voidReadyBot=null;}
  function clearAimBodyGlow(){
    for(const [node,item] of bodyGlowMeshes){
      try {
        if(node.material===item.applied){
          node.material=item.original;
          node.renderOrder=item.renderOrder;
          node.frustumCulled=item.frustumCulled;
        }
        for(const m of item.clones)m?.dispose?.();
      }catch{}
    }
    bodyGlowMeshes.clear();bodyGlowBot=null;
  }
  function updateAimBodyGlow(bot,pulse){
    if(!flags.aimBodyGlow||!bot?.alive){clearAimBodyGlow();return;}
    const root=bot.cs2Agent?.root||bot.agent?.root||bot.model?.root||bot.mesh;
    if(bodyGlowBot!==bot){clearAimBodyGlow();bodyGlowBot=bot;}
    if(root && typeof root.traverse==='function'){
      root.traverse(node=>{
        if((!node.isMesh&&!node.isSkinnedMesh)||!node.material||bodyGlowMeshes.has(node))return;
        try {
          const original=node.material;
          const copy=m=>{
            const c=m.clone();
            // Keep the original map and normals for texture detail, but tint purple.
            c.color?.setHex?.(0xa86bff);
            c.emissive?.setHex?.(0x5421b8);
            if('emissiveIntensity' in c)c.emissiveIntensity=1.5;
            c.depthTest=false;c.depthWrite=false;c.transparent=true;
            c.opacity=voidChamsCfg.opacity;
            c.side=2; c.needsUpdate=true;
            return c;
          };
          const clones=(Array.isArray(original)?original:[original]).map(copy);
          const applied=Array.isArray(original)?clones:clones[0];
          bodyGlowMeshes.set(node,{original,applied,clones,renderOrder:node.renderOrder,frustumCulled:node.frustumCulled});
          node.material=applied;node.renderOrder=1001;node.frustumCulled=false;
        }catch(e){console.warn('[VOIDWARE] Purple Void chams mesh:',e)}
      });
    }
    for(const [node,item] of bodyGlowMeshes){
      if(node.material!==item.applied)continue;
      for(const mat of item.clones){
        if('emissiveIntensity' in mat)mat.emissiveIntensity=1.0+1.55*pulse;
        mat.opacity=voidChamsCfg.opacity*(.86+.14*pulse);
      }
    }
  }
  function aimCandidateByProjection(bot,project,w,h,extraPixels=0){
    const by=Number(bot?._visY??bot?.y),height=Math.max(1.2,Math.min(2.6,Number(bot?.height)||1.8));
    if(!Number.isFinite(by))return null;
    const head=project(Number(bot.x),by+height+.08,Number(bot.z));
    const feet=project(Number(bot.x),by-.05,Number(bot.z));
    if(!head||!feet)return null;
    const tall=Math.abs(head.y-feet.y);
    if(tall<5||tall>h*3)return null;
    const middle=(head.y+feet.y)*.5;
    const halfWidth=Math.max(5,tall*.235);
    const tolerance=Math.min(12,Math.max(3,tall*.085))+Math.max(0,extraPixels);
    const dx=Math.abs(head.x-w*.5),dy=Math.abs(middle-h*.5);
    if(dx>halfWidth+tolerance||dy>tall*.5+tolerance)return null;
    return {score:dx/Math.max(1,halfWidth)+Math.abs(dy)/Math.max(1,tall),tall};
  }
  function findCrosshairBot(project,w,h,extraPixels=0,updateStats=true){
    const ray=radarSightRay();let selected=null,best=Infinity,source='none';
    for(const bot of enemyBots()){
      if(!bot.alive)continue;
      if(flags.radarRequireLOS && behindWall(bot))continue;
      const projected=aimCandidateByProjection(bot,project,w,h,extraPixels);
      const rayHit=radarIntersectsBot(ray,bot);
      if(!projected&&!rayHit)continue;
      const dist=Math.hypot(bot.x-g.player.x,bot.y-g.player.y,bot.z-g.player.z);
      const score=dist*.001+(projected?projected.score:2.0);
      if(score<best){best=score;selected=bot;source=projected?'screen+camera':'camera ray';}
    }
    if(updateStats){radarStats.aimSource=source;radarStats.aimed=selected?String(selected.name||'Enemy'):null;}
    return selected;
  }
  function aimChamsReadyTarget(candidate,now){
    if(!flags.aimBodyGlow||!candidate){resetVoidFocus();return null;}
    if(candidate!==voidCandidate){voidCandidate=candidate;voidCandidateSince=now;voidReadyBot=null;}
    if(now-voidCandidateSince>=voidChamsCfg.holdMs)voidReadyBot=candidate;
    return voidReadyBot;
  }
  function renderESP(){
    if(!ctx)return;
    const w=window.innerWidth, h=window.innerHeight;
    const dpr=Math.min(window.devicePixelRatio||1,flags.fpsBoost?1:2);
    const cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
    if(espCanvas.width!==cw||espCanvas.height!==ch){espCanvas.width=cw;espCanvas.height=ch;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    if((!flags.esp&&!flags.glow&&!flags.radar&&!flags.aimBodyGlow&&!flags.enemyArrows&&!flags.aimFovRing&&!flags.aimTargetLine&&!flags.hitmarkers&&!odVisualOn()&&!reVisualOn()&&!snVisualActive()&&!paradoxVisualActive()&&!v131VisualActive()&&!v14VisualActive()&&!v15AnyVisual())||panel.style.display!=='none'||g.state!=='playing'||!g.camera){clearAimBodyGlow();resetVoidFocus();return;}
    g.camera.updateMatrixWorld?.();
    // Reuse one vector for screen projections instead of allocating
    // a THREE.Vector3 for every bot, box, tracer and HUD marker.
    const projectVector=g.camera.position.clone();
    const project=(x,y,z)=>{const v=projectVector.set(x,y,z).project(g.camera);
      if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.z<-1||v.z>1)return null;
      return {x:(v.x+1)*w*.5,y:(1-v.y)*h*.5};
    };
    const crosshairBot=(flags.radarAimPulse&&flags.radar)?findCrosshairBot(project,w,h):null;
    const glowCandidate=flags.aimBodyGlow?findCrosshairBot(project,w,h,voidChamsCfg.aimRadiusPx,!crosshairBot):null;
    const activeGlowBot=aimChamsReadyTarget(glowCandidate,performance.now());
    const aimPulse=.5+.5*Math.sin(performance.now()*.015);
    updateAimBodyGlow(activeGlowBot,aimPulse);
    const drawCorner=(x,y,bw,bh,color)=>{
      const corner=Math.min(14,Math.max(5,bw*.24));ctx.strokeStyle=color;ctx.lineWidth=1.7;
      ctx.beginPath();
      ctx.moveTo(x+corner,y);ctx.lineTo(x,y);ctx.lineTo(x,y+corner);
      ctx.moveTo(x+bw-corner,y);ctx.lineTo(x+bw,y);ctx.lineTo(x+bw,y+corner);
      ctx.moveTo(x,y+bh-corner);ctx.lineTo(x,y+bh);ctx.lineTo(x+corner,y+bh);
      ctx.moveTo(x+bw-corner,y+bh);ctx.lineTo(x+bw,y+bh);ctx.lineTo(x+bw,y+bh-corner);
      ctx.stroke();
    };
    for(const b of (flags.espTeam?allBots():enemyBots())){
      try {
        const by=b._visY??b.y;
        const top=project(b.x,by+(b.height||1.8)+.14,b.z);
        const bottom=project(b.x,by-.10,b.z);
        if(!top||!bottom)continue;
        const bh=Math.min(h*2,Math.abs(bottom.y-top.y));
        if(bh<5||bh>h*2)continue;
        const bw=bh*.41, x=top.x-bw/2,y=Math.min(top.y,bottom.y);
        if(x>w+200||x+bw<-200||y>h+100||y+bh<-100)continue;
        const blocked=behindWall(b);
        const color=b.team===g.player.team?'#6be6a3':blocked?'#a070ef':'#65e0c4';
        if(flags.espTracers&&flags.esp){ctx.strokeStyle=blocked?'#8d53b35e':'#61c7bb59';ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(w*.5,h);ctx.lineTo(top.x,y+bh);ctx.stroke();}
        if(flags.aimBodyGlow && b===activeGlowBot){
          ctx.save();
          ctx.globalAlpha=.7+.3*aimPulse;ctx.lineWidth=2.4+1.8*aimPulse;
          ctx.strokeStyle='#bf8cff';ctx.shadowColor='#9745ff';ctx.shadowBlur=14+18*aimPulse;
          // A rough human-shaped contour, rather than a giant rectangular ESP box.
          const mx=top.x,headR=Math.max(3.5,Math.min(16,bw*.16));
          ctx.beginPath();ctx.arc(mx,y+headR+1,headR,0,Math.PI*2);ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(mx-bw*.23,y+headR*2.2);
          ctx.lineTo(mx-bw*.39,y+bh*.32);
          ctx.lineTo(mx-bw*.22,y+bh*.61);
          ctx.lineTo(mx-bw*.2,y+bh*.96);
          ctx.moveTo(mx+bw*.23,y+headR*2.2);
          ctx.lineTo(mx+bw*.39,y+bh*.32);
          ctx.lineTo(mx+bw*.22,y+bh*.61);
          ctx.lineTo(mx+bw*.2,y+bh*.96);
          ctx.moveTo(mx-bw*.22,y+bh*.61);ctx.lineTo(mx+bw*.22,y+bh*.61);
          ctx.stroke();ctx.restore();
        }
        if(flags.glow){
          ctx.save();ctx.shadowColor=blocked?'#bb69ff':'#22e4ff';ctx.shadowBlur=25;
          ctx.strokeStyle=blocked?'#bb70ff':'#3ae2ff';ctx.lineWidth=3.2;
          ctx.strokeRect(x,y,bw,bh);ctx.restore();
        }
        if(flags.esp){
          ctx.fillStyle='#08091122';ctx.fillRect(x,y,bw,bh);
          ctx.strokeStyle='#030509cc';ctx.lineWidth=3;ctx.strokeRect(x-.5,y-.5,bw+1,bh+1);
          drawCorner(x,y,bw,bh,color);
        }
        if(flags.espHealth&&flags.esp){const health=Math.max(0,Math.min(100,b.health||0))/100;
          ctx.fillStyle='#090910dd';ctx.fillRect(x-7,y,4,bh);
          ctx.fillStyle=health>.6?'#5cd8a9':health>.3?'#efc36b':'#f07c89';
          ctx.fillRect(x-7,y+bh*(1-health),4,bh*health);
        }
        if(flags.esp&&flags.botNames){
        const dist=Math.hypot(b.x-g.player.x,b.z-g.player.z).toFixed(0);
        const name=String(b.name||'BOT').slice(0,20);
        ctx.font='bold 11px system-ui,Arial';ctx.textAlign='center';
        ctx.fillStyle='#07070bd9';ctx.fillRect(top.x-65,y-24,130,19);
        ctx.fillStyle='#f5f4fb';ctx.fillText(name+'  ['+dist+'m]',top.x,y-10);
        ctx.font='10px system-ui,Arial';ctx.fillStyle=color;ctx.fillText(blocked?'THROUGH WALL':'VISIBLE',top.x,y+bh+15);
        }
      }catch(e){}
    }
    if(flags.aimFovRing){
      const viewFov=(g.camera.fov||75)*Math.PI/180;
      const radius=Math.min(Math.max(20,Math.tan(legitFov*Math.PI/360)/Math.tan(viewFov/2)*(h/2)),Math.max(w,h));
      ctx.strokeStyle='#9974ff88';ctx.lineWidth=espThickness;ctx.beginPath();ctx.arc(w/2,h/2,radius,0,Math.PI*2);ctx.stroke();
      ctx.font='10px system-ui';ctx.fillStyle='#be9dfb';ctx.textAlign='center';ctx.fillText('LEGIT '+legitFov+'°',w/2,h/2-radius-9);
    }
    if(flags.enemyArrows){
      const yaw=g.player.yaw||0;
      const ymid=h/2;const rad=Math.min(w,h)*.37;
      for(const b of enemyBots()){
        const rel=Math.atan2(-(b.x-g.player.x),-(b.z-g.player.z))-yaw;
        const a=angleDiff(rel,0), px=w/2+Math.sin(a)*rad,py=ymid-Math.cos(a)*rad;
        const pp=project(b.x,(b._visY??b.y)+1,b.z);
        if(pp&&pp.x>15&&pp.x<w-15&&pp.y>15&&pp.y<h-15)continue;
        ctx.save();ctx.translate(px,py);ctx.rotate(a);
        ctx.fillStyle='#a785ffdc';ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(-7,3);ctx.lineTo(7,3);ctx.closePath();ctx.fill();ctx.restore();
      }
    }
    if(flags.aimTargetLine){
      const target=flags.legitAim?legitFocus:rageFocus;
      if(target?.alive){const pos=project(target.x,(target._visY??target.y)+1.2,target.z);
        if(pos){ctx.strokeStyle='#a879ff9c';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(pos.x,pos.y);ctx.stroke();}}
    }
    if(flags.radar){
      // V18.5 uses a HUD overlay. Configurable placement; default top-left.
      const R=radarSize,margin=20,upper=70;
      const right=radarCorner.endsWith('right'),lower=radarCorner.startsWith('bottom');
      const left=right?w-R-margin:margin,top=lower?h-R-margin-28:upper;
      const cx=left+R/2,cy=top+R/2;
      ctx.save();
      ctx.fillStyle='#0d1016f2';ctx.strokeStyle='#414053';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.roundRect(left,top,R,R,8);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#292d3a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(left+10,cy);ctx.lineTo(left+R-10,cy);
      ctx.moveTo(cx,top+10);ctx.lineTo(cx,top+R-10);ctx.stroke();
      const p=g.player,yaw=Number(p.yaw)||0;
      const scale=(R/2-15)/Math.max(15,radarRange),now=performance.now();
      radarStats.frames++;radarStats.drawn=0;
      for(const b of allBots()){
        const rel=radarCoordinates(b);if(!rel)continue;
        const rx=rel.x*scale,ry=rel.y*scale;
        if(Math.hypot(rx,ry)>R/2-14)continue;
        const bx=cx+rx,by=cy+ry,enemy=b.team!==p.team;
        const aimed=enemy&&flags.radarAimPulse&&b===crosshairBot;
        // Crosshair target is detected once per frame by camera projection + 3D ray fallback.
        radarStats.drawn++;
        const pulse=.5+.5*Math.sin(now*.025);
        if(aimed){
          ctx.save();ctx.globalAlpha=.4+.55*pulse;
          ctx.shadowColor='#27ff82';ctx.shadowBlur=9+16*pulse;
          ctx.strokeStyle='#39ff7f';ctx.lineWidth=2.0+1.4*pulse;
          ctx.beginPath();ctx.arc(bx,by,7+pulse*4,0,Math.PI*2);ctx.stroke();ctx.restore();
        }
        ctx.fillStyle=aimed?(pulse>.42?'#39ff87':'#e6fff0'):enemy?'#fd6978':'#6ce3b3';
        ctx.beginPath();ctx.arc(bx,by,aimed?5.6:4,0,Math.PI*2);ctx.fill();
        if(enemy&&flags.radarElevation){
          const elevation=radarElevationKind(b);
          if(elevation){
            // Readable 13 px marker on each dot, clamped within the radar.
            ctx.font='900 15px system-ui,Arial';ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.lineWidth=2.3;ctx.strokeStyle='#14131b';ctx.fillStyle=aimed?'#6effad':'#e1bbff';
            const ax=Math.min(left+R-8,bx+10),ay=Math.max(top+9,Math.min(top+R-8,by));
            const arrow=elevation>0?'↑':'↓';
            ctx.strokeText(arrow,ax,ay);ctx.fillText(arrow,ax,ay);
          }
        }
      }
      // Facing indicator (player at origin, north/up of radar = aim forward)
      ctx.fillStyle='#ab91ff';ctx.beginPath();ctx.moveTo(cx,cy-7);ctx.lineTo(cx-5,cy+5);
      ctx.lineTo(cx+5,cy+5);ctx.closePath();ctx.fill();
      ctx.font='700 10px system-ui,Arial';ctx.fillStyle='#d5c7ef';ctx.textAlign='left';
      ctx.textBaseline='alphabetic';ctx.fillText('VOIDWARE · RADAR',left+6,top-9);
      ctx.font='10px system-ui,Arial';ctx.fillStyle=radarStats.aimed?'#68f6a7':'#a49aaf';
      ctx.fillText(radarStats.aimed?'AIM  ● '+radarStats.aimed:'↑ ABOVE  ↓ BELOW  • AIM = GREEN',left+5,top+R+16);
      radarStats.lastState='drawn '+radarStats.drawn+' of '+allBots().length+' bots';
      ctx.restore();
    }
    if(flags.hitmarkers&&performance.now()<hitmarkerUntil){
      ctx.strokeStyle='#d4f9ff';ctx.lineWidth=2;ctx.beginPath();
      for(const [ax,ay,bx,by] of [[-13,-13,-6,-6],[13,-13,6,-6],[-13,13,-6,6],[13,13,6,6]]){
        ctx.moveTo(w/2+ax,h/2+ay);ctx.lineTo(w/2+bx,h/2+by)
      }ctx.stroke();
    }
  
    odVisualDraw(ctx,w,h);
    reDraw(ctx,w,h,project);omegaDraw(ctx,w,h,project);snDraw(ctx,w,h,project);paradoxDraw(ctx,w,h,project);v131Draw(ctx,w,h,project);v14Draw(ctx,w,h,project);v15Draw(ctx,w,h,project);
  }
  let lastSkinWeapon=null;
  function frame(now){
    if(!active)return;
    const dt=Math.min(.055,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
    fpsBoosterTick();
    const p=g.player,playing=g.state==='playing'&&p?.alive;
    v17Tick(now,dt);v18Tick(now,dt);
    odFpsFrames++;if(now-odLastFpsAt>=1000){odMeasuredFPS=odFpsFrames*1000/(now-odLastFpsAt||1000);odFpsFrames=0;odLastFpsAt=now;}
    if(playing){odTick(now);reTick(dt,now);omegaTick(dt,now);snTick(dt,now);paradoxTick(dt,now);v131Tick(dt,now);v14Tick(dt,now);v15Tick(dt,now);v16WeaponsTick(dt);}
    if(onlineEl && now%850<55)onlineEl.textContent='● '+allBots().length+' BOTS ALIVE';
    if(flags.freeze)freezeBots();else if(storedFreeze.size)unfreeze();
    if(now-lastHudUpdate>130){lastHudUpdate=now;
      const hudLines=[];
      if(flags.targetHUD)hudLines.push('◉ '+aimStatusText());
      if(flags.killHUD)hudLines.push('✦ SESSION KILLS: '+killCount);
      v6Hud.style.display=hudLines.length&&panel.style.display==='none'?'block':'none';
      v6Hud.textContent=hudLines.join('\n');
    }
    if(viewmodel)viewmodel.visible=!flags.third && viewmodelWasVisible;
    flyHud.style.display=flags.speedHud&&flags.fly&&playing&&panel.style.display==='none'?'block':'none';
    if(flyHud.style.display!=='none'){
      const v=Math.round(Math.hypot(flightVel.x,flightVel.y,flightVel.z));
      flyHud.innerHTML='<b>✦ HYPER FLIGHT</b> · '+v+' u/s · '+(flags.flyNoclip?'PHASE':'COLLISION')+'<br>WASD steer · SPACE up · CTRL down · SHIFT boost';
    }
    cross.style.display=flags.showCrosshair&&panel.style.display==='none'?'block':'none';
    if(playing){
      if(flags.god)heal();
      if(flags.criticalHeal && p.health>0 && p.health<=35 && now-lastCriticalHeal>1100){
        lastCriticalHeal=now;p.health=Math.min(100,p.health+70);g.hud?.updateHealth?.();
      }
      if(flags.armorRegen && Number.isFinite(p.armor) && p.armor<100){
        p.armor=Math.min(100,p.armor+18*dt);g.hud?.updateHealth?.();
      }
      if(flags.ammoRegen && g.weapons?.current && !['knife','c4'].includes(g.weapons.current)){
        const st=g.weapons.state?.();ammoRegenAccumulator+=16*dt;
        if(st && Number.isFinite(st.reserve) && ammoRegenAccumulator>=1){
          const n=Math.floor(ammoRegenAccumulator);ammoRegenAccumulator-=n;
          st.reserve=Math.min(999,st.reserve+n);
        }
      }
      if(flags.slowBots){for(const b of enemyBots()){
        b.vx=(b.vx||0)*Math.max(.1,1-6*dt);
        b.vz=(b.vz||0)*Math.max(.1,1-6*dt);
        b.nextFire=Math.max(b.nextFire||0,g.time+dt*1.25);
      }}
      if(flags.botMagnet||flags.botRepulse||flags.botOrbit)applyExtraBotFields(dt,now);
      botCeasefire();
      applyNightfall(dt,now);
      if(flags.botSpin){for(const bot of allBots())bot.yaw=(bot.yaw||0)+dt*9;}
      if(flags.autoReload&&g.weapons?.state&&g.weapons?.startReload&&!g.weapons.reloading){
        const weapon=g.weapons.def?.(),st=g.weapons.state();
        if(weapon&&st?.ammo===0&&st?.reserve>0&&!["knife","grenade","c4","zeus"].includes(weapon.class)){
          try{g.weapons.startReload()}catch(e){}
        }
      }
      if(!smoothFlickJob)assistAim(dt);
      if(panel.style.display==='none'&&!smoothFlickJob){
        if(flags.autoShoot){
          const tgt=nearest();
          if(tgt&&(!behindWall(tgt)||flags.wallbang)&&rageFireReady(tgt,now)){
            if(flags.autoScope&&g.weapons.def?.()?.zoom&&g.weapons.scopeLevel===0&&now-autoScopeAt>750){
              try{g.weapons.setScope(1);autoScopeAt=now}catch(e){}
            }
            ragePlusState.autoFireContext=true;
            try{fireNow(tgt,false);}finally{ragePlusState.autoFireContext=false;}
          }
        }else if(flags.triggerbot){
          // A small intentional trigger delay improves predictability.
          const tgt=sightTarget(2.5,true);
          if(tgt){
            if(tgt!==triggerPrev){triggerPrev=tgt;triggerOnset=now;}
            if(now-triggerOnset>=triggerDelay){fireNow(null,true);if(!flags.triggerBurst)triggerOnset=now+300;}
          }else{triggerPrev=null;triggerOnset=0;}
        }
      }
      if(now-lastChamsScan>500){lastChamsScan=now;applyChams();}
      if(flags.infinity&&g.weapons.current!=='knife'&&g.weapons.current!=='c4'){
        const st=g.weapons.state?.();if(st&&Number.isFinite(st.ammo)){st.ammo=99;st.reserve=999;g.weapons.reloading=false}
      }
      utilityTick(now);
      rageEarlyReloadTick(now);
      if(flags.noRecoil)clearWeaponRecoil();
      // BHOP and air-strafe are now integrated in player.update before the physics step.
      // V18.8: Steering changes only direction; separate hard cap prevents runaway speed.

    }
    if(flags.third&&playing)ensureAvatar();
    if(avatar){
      if(avatarTeam!==appearanceTeam()){disposeAvatar();nextAvatarRetry=0}
      else{
        avatar.root.visible=!!(flags.third&&playing);
        if(avatar.root.visible){
          spinPhase=flags.spin?(spinPhase+dt*spinDeg*Math.PI/180)%(Math.PI*2):0;
          const yaw=(p.yaw||0)+spinPhase;
          safe(()=>{
            // The world-body is separate from the first-person camera and aim.
            // Keep the root aligned with physics (not the camera's head height).
            avatar.setTransform(p.x,p.y,p.z,yaw);
            avatar.update(dt,{vx:p.vx||0,vz:p.vz||0,
              crouch:p.crouching?1:0,airborne:!p.onGround,
              pitch:flags.spin?-1.45:(p.pitch||0)});
            if(avatarBaseScale&&avatar.root?.scale)avatar.root.scale.copy(avatarBaseScale).multiplyScalar(modelSize);
          });
          const desired=avatarWeaponId();
          if(desired!==avatarGun&&typeof avatar.setWeapon==='function'){
            avatarGun=desired;
            Promise.resolve(avatar.setWeapon(desired,desired.includes('knife')?'knife':g.weapons.def?.()?.class||'rifle')).then(()=>{
              if(active){tintModel(avatar?.heldWeapon)}
            }).catch(err=>console.warn('[VOIDWARE] Third-person weapon:',err));
          }
        }
      }
    }
    if(g.weapons.current!==lastSkinWeapon){lastSkinWeapon=g.weapons.current;applySkin();slVisualState.key='';slVisualState.root=null;}
    slPeriodic(now);
    if(skin==='bluegem'&&g.weapons.current==='knife'&&!flags.third)syncBlueGemFirstPerson();
    if(flags.esp||flags.glow||flags.radar||flags.aimBodyGlow||flags.enemyArrows||flags.aimFovRing||flags.aimTargetLine||flags.hitmarkers||odVisualOn()||reVisualOn()||omegaVisualOn()||snVisualActive()||paradoxVisualActive()||v131VisualActive()||v14VisualActive()){
      fpsBoosterState.blankedOverlay=false;
      if((!flags.fpsBoost||now-odLastEsp>=1000/odPrefs.espRate)&&fpsBoosterAllowOverlay()){odLastEsp=now;renderESP();}
    }
    else if(ctx){
      clearAimBodyGlow();resetVoidFocus();
      // Don't clear and composite an already-empty giant transparent canvas 60–200×/s.
      if(!flags.fpsBooster||!fpsBoosterState.blankedOverlay){
        ctx.clearRect(0,0,espCanvas.width,espCanvas.height);
        fpsBoosterState.blankedOverlay=true;
      }
    }
    nativeGameRAF(frame);
  }
  // V17 telemetry wraps final gameplay hooks once, and restores them on cleanup.
  const v17BeforeFire=g.weapons.fire;
  if(typeof v17BeforeFire==='function')g.weapons.fire=function(...args){
    const t=this.lastShotT,ammo=this.state?.()?.ammo;
    const ret=v17BeforeFire.apply(this,args);
    const left=this.state?.()?.ammo;
    if(active&&g.state==='playing'&&(this.lastShotT!==t||(Number.isFinite(ammo)&&Number.isFinite(left)&&left<ammo)))v17OnShot(performance.now());
    return ret;
  };
  const v17BeforeDamage=g.dealDamage;
  if(typeof v17BeforeDamage==='function')g.dealDamage=function(victim,damage,shooter,head,...extra){
    const prev=Number(victim?.health),r=v17BeforeDamage.apply(this,arguments);
    if(active&&(!Number.isFinite(prev)||Number(victim?.health)!==prev))v17OnDamage(victim,damage,shooter,head);
    return r;
  };
  nativeGameRAF(frame);
  function remove(){
    if(!active)return;
    v18Remove();
    fpsBoosterEnable(false);
    gameClockRestore();
    slStop();
    if(v17State.autoEnabledByUs){flags.fpsBooster=false;fpsBoosterEnable(false);v17State.autoEnabledByUs=false;}
    if(g.weapons.fire!==v17BeforeFire)g.weapons.fire=v17BeforeFire;
    if(typeof v17BeforeDamage==='function'&&g.dealDamage!==v17BeforeDamage)g.dealDamage=v17BeforeDamage;cancelSmoothHeadFlick();ragePlusOff();active=false;window.removeEventListener('keydown',keys,true);
    odRestoreFps();v16Off();legitProDisable();v15Off();v14Disable();v131Off();paradoxOff();snClear();reDisableAll();omegaOffAll();
    if(g.killEntity!==v131PreviousKill)g.killEntity=v131PreviousKill;
    if(g.fireBullet!==v131PreviousFire)g.fireBullet=v131PreviousFire;
    omegaCleanup();
    if(g.dealDamage!==reDealPrev&&reDealPrev)g.dealDamage=reDealPrev;
    if(g.killEntity!==reKillPrev&&reKillPrev)g.killEntity=reKillPrev;
    flags.freeze=false;flags.chams=false;omegaOffAll();clearAimBodyGlow();resetVoidFocus();clearChams();unfreeze();disposeAvatar();resetMaterials();
    if(g.killEntity===odWrappedKill)g.killEntity=odNativeKill;
    if(soundContext){try{soundContext.close()}catch{}soundContext=null;}
    if(g.fireBullet&&g.fireBullet!==originalFireBullet)g.fireBullet=originalFireBullet;
    if(g.hud.addKill&&g.hud.addKill!==originalAddKill)g.hud.addKill=originalAddKill;
    if(typeof originalMaxSpeed==='function')g.weapons.maxSpeed=originalMaxSpeed;
    if(typeof paradoxOldDef==='function')g.weapons.def=paradoxOldDef;
    if(typeof paradoxOldCycle==='function')g.weapons.cycleTime=paradoxOldCycle;
    if(typeof originalWeaponFire==='function')g.weapons.fire=originalWeaponFire;
    if(typeof originalWeaponUpdate==='function')g.weapons.update=originalWeaponUpdate;
    if(typeof originalPlayerShoot==='function')g.playerShoot=originalPlayerShoot;
    if(g.cs2&&typeof originalCs2Play==='function')g.cs2.play=originalCs2Play;
    if(g.viewmodel&&typeof originalViewmodelKick==='function')g.viewmodel.kick=originalViewmodelKick;
    if(typeof originalPlayerUpdate==='function')g.player.update=originalPlayerUpdate;
    if(cameraPosition&&typeof originalCamSet==='function'){
      if(hadCamSet)cameraPosition.set=originalCamSet;else delete cameraPosition.set;
    }
    if(firstPersonRig&&typeof originalRigVisible==='function'){
      if(hadRigVisible)firstPersonRig.setVisible=originalRigVisible;else delete firstPersonRig.setVisible;
    }
    if(viewmodel)viewmodel.visible=viewmodelWasVisible;
    if(skin==='bluegem')restoreFirstPersonKnife();
    panel.remove();curtain.remove();style.remove();esp.remove();cross.remove();flyHud.remove();v6Hud.remove();
    if(window.deathWon?.remove===remove)delete window.deathWon;
  }
  window.deathWon={version:"19.1-VOIDWARE",fpsBooster:{get enabled(){return flags.fpsBooster},get fps(){return fpsBoosterState.realFps},get cullingCount(){return fpsBoosterState.optimizedMeshes.size},settings:fpsBoosterCfg,get statistics(){return {realFps:fpsBoosterState.realFps,cullCandidates:fpsBoosterState.scannedMeshes,cullingCount:fpsBoosterState.optimizedMeshes.size,overlayDraws:fpsBoosterState.overlayDraws,overlaySkipped:fpsBoosterState.overlaySkipped,error:fpsBoosterState.error}},enable:()=>{flags.fpsBooster=true;fpsBoosterEnable(true)},disable:()=>{flags.fpsBooster=false;fpsBoosterEnable(false)}},gameSpeed:{get enabled(){return flags.gameSpeedHack},get rate(){return gameClockRate},get applied(){return gameClockState.requestedRate},get status(){return {...gameClockState,clockNow:gameClockNow()}},set:r=>gameClockSet(r),reset:gameClockReset},airStrafe:{get enabled(){return flags.autoStrafe},get steer(){return airSteer},get cap(){return airMaxSpeed},get horizontalSpeed(){return Math.hypot(g.player.vx||0,g.player.vz||0)},reset:()=>{airSteer=14;airMaxSpeed=11;strafeSave()}},voidChams:{settings:voidChamsCfg,save:voidChamsSave,get pending(){return voidCandidate?.name||null},get activated(){return voidReadyBot?.name||null},get meshes(){return bodyGlowMeshes.size}},radar:{aimedAt:radarCrosshairOn,elevation:radarElevationKind,coordinates:radarCoordinates,ray:radarSightRay,debug:()=>({on:flags.radar,arrows:flags.radarElevation,pulse:flags.radarAimPulse,bodyGlow:flags.aimBodyGlow,glowingMeshes:bodyGlowMeshes.size,los:flags.radarRequireLOS,corner:radarCorner,...radarStats,enemyPositions:enemyBots().slice(0,12).map(b=>({name:b.name||"Enemy",relative:radarCoordinates(b),elevation:radarElevationKind(b),crosshair:radarCrosshairOn(b)}))}),get threshold(){return radarHeightThreshold},get range(){return radarRange}},utility:{types:utilityTypes.map(t=>({id:t.id,flag:t.flag,title:t.title})),settings:utilitySettings,status:utilityStatus,refill:()=>utilityRefill(true),get live(){return {...utilityRuntime}}},v18Settings:v18,v18State,v18Render,v18Save,skinLab:{get inventory(){return sl.items.map(x=>({...x}))},get equipped(){return {...sl.equipped}},get catalogSize(){return slCatalog.length},get exterior(){return slExterior(sl.float)},add:(weapon,name,float,seed)=>slAdd(slMakeItem(weapon,name,float,seed)),equip:id=>slEquip(slFind(id)),remove:id=>slDelete(slFind(id)),preview:slPaintGame,armCase:()=>{slCaseArmed=true;return true},get caseArmed(){return slCaseArmed},get caseMode(){return slCaseMode},setCaseMode:v=>{slCaseMode=v==='reel'?'reel':'cover';sl.caseDisplayMode=slCaseMode;slSave()},get casePending(){return !!slCasePending},caseDemo:()=>slCaseStart('Arms Deal 2 Case',true,true),caseStart:()=>slCaseStart(slCaseLastTitle,false,slCaseMode==='cover'),caseClose:slCaseClose},v17Settings:v17,v17State,v17OnShot,v17OnDamage,v17ApplyAim,v17SaveAim,v17EquipLoadout,v17SaveLoadout,v17ExportConfig,v17ImportConfig,v17Cue,ragePlusDefs:ragePlusDefs.map(o=>({...o})),ragePlusCfg,ragePlusOff,get rageTargetName(){return rageFocus?.name||null;},smoothHeadFlick,get smoothFlickActive(){return !!smoothFlickJob},v16Options:v16Opts.map(o=>({id:o.flag,name:o.name,group:o.group,desc:o.desc})),v16Config:v16Cfg,v16Off,legitProOptions:legitProDefs.map(p=>({id:p.flag,name:p.name,desc:p.desc})),legitProSettings:legitProCfg,legitProState,legitProDisable,v15Powers:v15Powers.map(p=>({id:p.id,name:p.name,group:p.group,desc:p.desc})),v15Off,v14Powers:v14Catalog.map(p=>({id:p.id,name:p.name,group:p.group,mode:p.mode})),v14Action:(id)=>{const p=v14ById.get(id);if(p?.mode==='action')v14RunPower(p);},v14Off:v14Disable,v14Settings:v14Cfg,paradox131Powers:v131Powers.map(p=>({id:p[0],name:p[1],mode:p[2]})),paradox131Action:v131Action,paradox131Off:v131Off,paradox131FusionEquip:v131EquipFusion,autoWin:paradoxAutoWin,paradoxPowers:paradoxPowers.map(p=>({id:p[0],name:p[1],mode:p[2]})),paradoxAction,paradoxOff,supernovaPowers:snPowers.map(p=>({...p})),supernovaAction:snAction,omegaPowers:omegaPowers.map(p=>({...p})),omegaAction,remove,flags,visibleHeadFlick,realityPowers:rePowers.map(p=>({...p})),realityAction:reDoAction,realityOff:reDisableAll,overdrivePowers:odPowers.map(p=>({id:p.id,name:p.name,group:p.group,mode:p.mode})),usePower:id=>odAction(id),fpsBoost:on=>{if(!!flags.fpsBoost!==!!on)toggleFlag('fpsBoost')},open:showMenu,killBots,stopLegitLock,playKillSound:()=>playKillSound(false,true),get bindings(){return {...bindings}},setBinding,panicReset};
  notice('VOIDWARE V19.1 loaded • PEAQ 8GB Full Quality Booster');
})();
