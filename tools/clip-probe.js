window.__probe=(samples)=>{const out=[];const ray=new THREE.Raycaster();ray.far=60;
  const solids=[];planes.forEach((p,i)=>p.g.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&o.userData.layer===3&&o.geometry.type!=='PlaneGeometry')solids.push({o,who:p.name});}));
  bridges.forEach((b,i)=>b.g.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial)solids.push({o,who:(i+1)+'号登机桥'});}));
  LG[5].traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&o.geometry.type==='BoxGeometry')solids.push({o,who:'航站楼'});});
  const movers=[...svc.map(s=>s.g),...bagCarts,pushTug,...chocks,marshal,...crew];
  const statics=VEH.filter(g=>!movers.includes(g));
  const vis=o=>{while(o){if(!o.visible)return false;o=o.parent;}return true;};
  const vtx=(g,n)=>{const pts=[];g.updateMatrixWorld(true);g.traverse(o=>{if(!o.isMesh||o.material.isMeshBasicMaterial||o.isInstancedMesh)return;const p=o.geometry.attributes.position;const step=Math.max(1,Math.floor(p.count/40));
      for(let i=0;i<p.count;i+=step)pts.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});return pts;};
  const inside=(pt,objs)=>{const hits={};for(const d of [new THREE.Vector3(0,1,0),new THREE.Vector3(.3,1,.2).normalize()]){ray.set(pt,d);const hs=ray.intersectObjects(objs.map(s=>s.o),false);const per={};hs.forEach(h=>{per[h.object.uuid]=(per[h.object.uuid]||0)+1;});
      for(const k in per)if(per[k]%2===1)hits[k]=(hits[k]||0)+1;}return Object.keys(hits).filter(k=>hits[k]===2);};
  let solidsAll=solids.slice();const nameOf=uuid=>{const s=solidsAll.find(x=>x.o.uuid===uuid);return s?(s.who+' / '+s.o.userData.name):uuid;};
  const vsolids=g0=>{const a=[];VEH.forEach(v=>{if(v===g0||!vis(v)||(v.parent===train))return;v.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&!o.isInstancedMesh){a.push({o,who:'车辆'});}});});return a;};
  const GB=new THREE.Box3(),SB=new THREE.Box3();
  const near=(g,list)=>{GB.setFromObject(g).expandByScalar(.1);return list.filter(x=>{if(!vis(x.o))return false;SB.setFromObject(x.o);return SB.intersectsBox(GB);});};
  const check=(g,t)=>{if(!vis(g))return;const all=near(g,solids.concat(vsolids(g)));solidsAll=solidsAll.concat(all);if(!all.length)return;const pts=vtx(g);const bad={};let n=0;pts.forEach(pt=>{inside(pt,all).forEach(u=>{bad[u]=(bad[u]||0)+1;n++;});});
    for(const u in bad)out.push({t,veh:(g.userData.vname||g.children.find(c=>c.userData&&c.userData.name)?.userData.name),hit:nameOf(u),pts:bad[u],of:pts.length});};
  const others=[];[planes[0],planes[2]].forEach(p=>p.g.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial)others.push({o,who:p.name});}));
  const planeCheck=(t)=>{if(!P2.g.visible)return;const pts=vtx(P2.g);const all=others.concat(vsolids(null)).concat(solids.filter(x=>x.who.indexOf('客机')<0));solidsAll=all;const bad={};pts.forEach(pt=>inside(pt,all).forEach(u=>{bad[u]=(bad[u]||0)+1;}));for(const u in bad)out.push({t,veh:'中间客机',hit:nameOf(u),pts:bad[u],of:pts.length});};
  // reverse direction: thin parts (tailplane, wingtips, hoses) can slice through a vehicle without any vehicle vertex ending up inside them
  const B=new THREE.Box3(),PB=new THREE.Box3();
  const rev=(g,t)=>{if(!vis(g))return;B.setFromObject(g).expandByScalar(.05);const gs=[];g.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&!o.isInstancedMesh)gs.push({o,who:'车辆'});});if(!gs.length)return;
    const vname=(g.children.find(c=>c.userData&&c.userData.name)||{userData:{}}).userData.name;
    planes.forEach(pl=>{if(!pl.g.visible)return;PB.setFromObject(pl.g);if(!PB.intersectsBox(B))return;pl.g.updateMatrixWorld(true);
      pl.g.traverse(o=>{if(!o.isMesh||o.material.isMeshBasicMaterial)return;const p=o.geometry.attributes.position;let n=0;
        for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(!B.containsPoint(v))continue;if(inside(v,gs).length)n++;}
        if(n)out.push({t,veh:vname,hit:pl.name+' / '+o.userData.name+'（反向）',pts:n,of:p.count});});});};
  for(const t of samples){TA.t=t;TA.play=false;taUpdate(0);scene.updateMatrixWorld(true);movers.forEach(g=>{check(g,t);rev(g,t);});if(t>=37)for(const x of [-80,-40,0,40,80]){train.position.x=x;scene.updateMatrixWorld(true);planeCheck(t+'@train'+x);}}

  if(samples.length===0){TA.t=14;taUpdate(0);scene.updateMatrixWorld(true);statics.forEach(g=>{check(g,'static');rev(g,'static');});
    for(let x=-80;x<=80;x+=4){train.position.x=x;scene.updateMatrixWorld(true);train.children.forEach(c=>check(c,'train@'+x));}}
  return out;};

window.__trainSim=(speed,startX,t0)=>{TA.t=t0;TA.speed=speed;TA.play=true;train.position.x=startX;taUpdate(0);trainStep(0);let hits=[],stops=0,lastX=train.position.x;const box=new THREE.Box3();
  const steps=Math.ceil(CYCLE/(.8*speed)/.05)+20;
  for(let i=0;i<steps;i++){taUpdate(.05);trainStep(.05);if(Math.abs(train.position.x-lastX)<1e-6)stops++;lastX=train.position.x;scene.updateMatrixWorld(true);
    const obs=occ.map(occBox).filter(b=>b&&!b.isEmpty()).map(b=>b.clone());
    train.children.forEach(c=>{box.setFromObject(c).expandByScalar(-.05);obs.forEach(b=>{if(b.intersectsBox(box))hits.push(TA.t.toFixed(2)+'@'+train.position.x.toFixed(1));});});}
  TA.speed=1;return {hits:hits.length,first:hits.slice(0,4),stops};};
window.__jumpTest=()=>{const box=new THREE.Box3();let bad=0;for(let t=0;t<CYCLE;t+=.25)for(let x=-80;x<=80;x+=4){TA.t=t;TA.play=false;taUpdate(0);train.position.x=x;trainStep(0);scene.updateMatrixWorld(true);
  const obs=occ.map(occBox).filter(b=>b&&!b.isEmpty()).map(b=>b.clone());train.children.forEach(c=>{box.setFromObject(c).expandByScalar(-.05);obs.forEach(b=>{if(b.intersectsBox(box))bad++;});});}TA.play=true;return bad;};
