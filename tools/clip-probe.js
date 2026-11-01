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
  let solidsAll=solids;const nameOf=uuid=>{const s=solidsAll.find(x=>x.o.uuid===uuid);return s?(s.who+' / '+s.o.userData.name):uuid;};
  const vsolids=g0=>{const a=[];VEH.forEach(v=>{if(v===g0||!vis(v)||(v.parent===train))return;v.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&!o.isInstancedMesh){a.push({o,who:'车辆'});}});});return a;};
  const check=(g,t)=>{if(!vis(g))return;const pts=vtx(g);const bad={};let n=0;const all=solids.concat(vsolids(g));solidsAll=all;pts.forEach(pt=>{inside(pt,all).forEach(u=>{bad[u]=(bad[u]||0)+1;n++;});});
    for(const u in bad)out.push({t,veh:(g.userData.vname||g.children.find(c=>c.userData&&c.userData.name)?.userData.name),hit:nameOf(u),pts:bad[u],of:pts.length});};
  const others=[];[planes[0],planes[2]].forEach(p=>p.g.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial)others.push({o,who:p.name});}));
  const planeCheck=(t)=>{if(!P2.g.visible)return;const pts=vtx(P2.g);const all=others.concat(vsolids(null)).concat(solids.filter(x=>x.who.indexOf('客机')<0));solidsAll=all;const bad={};pts.forEach(pt=>inside(pt,all).forEach(u=>{bad[u]=(bad[u]||0)+1;}));for(const u in bad)out.push({t,veh:'中间客机',hit:nameOf(u),pts:bad[u],of:pts.length});};
  for(const t of samples){TA.t=t;TA.play=false;taUpdate(0);scene.updateMatrixWorld(true);movers.forEach(g=>check(g,t));if(t>=37)for(const x of [-80,-40,0,40,80]){train.position.x=x;scene.updateMatrixWorld(true);planeCheck(t+'@train'+x);}}

  if(samples.length===0){TA.t=14;taUpdate(0);scene.updateMatrixWorld(true);statics.forEach(g=>check(g,'static'));
    for(let x=-80;x<=80;x+=4){train.position.x=x;scene.updateMatrixWorld(true);train.children.forEach(c=>check(c,'train@'+x));}}
  return out;};
