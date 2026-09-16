import React, { useEffect, useRef } from 'react';
import { useBranding } from '../../store/BrandingContext';

type NodeDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  radius: number;
};

const NODES: NodeDef[] = [
  { id:'suppliers', label:'SUPPLIERS', x:.235, y:.205, color:'#00d9ff', radius:5 },
  { id:'materials', label:'MATERIALS', x:.168, y:.405, color:'#00d9ff', radius:6 },
  { id:'procurement', label:'PROCUREMENT', x:.235, y:.565, color:'#00d9ff', radius:6 },
  { id:'warehouse', label:'WAREHOUSE', x:.355, y:.755, color:'#00d9ff', radius:7 },
  { id:'inventory', label:'INVENTORY', x:.585, y:.79, color:'#00d9ff', radius:6 },
  { id:'logistics', label:'LOGISTICS', x:.70, y:.67, color:'#00d9ff', radius:5 },
  { id:'customers', label:'CUSTOMERS', x:.82, y:.735, color:'#00d9ff', radius:5 },
  { id:'data', label:'DATA', x:.405, y:.19, color:'#8175ff', radius:5 },
  { id:'ai', label:'AI', x:.59, y:.22, color:'#38aaff', radius:5 },
  { id:'risk', label:'RISK', x:.70, y:.355, color:'#f2ad38', radius:5 },
  { id:'decision', label:'DECISION', x:.56, y:.49, color:'#c59aff', radius:6 },
  { id:'workflow', label:'WORKFLOW', x:.49, y:.56, color:'#5aaeff', radius:5 },
  { id:'audit', label:'AUDIT', x:.80, y:.565, color:'#4da8ff', radius:4 },
  { id:'memory', label:'MEMORY', x:.34, y:.35, color:'#9b83ff', radius:4 },
  { id:'demand', label:'DEMAND', x:.88, y:.43, color:'#00d9ff', radius:5 },
];

const PATHS = [
  ['suppliers','materials'],['materials','procurement'],['procurement','warehouse'],
  ['warehouse','inventory'],['inventory','logistics'],['logistics','customers'],
  ['data','ai'],['ai','risk'],['risk','decision'],['decision','workflow'],
  ['workflow','audit'],['memory','decision'],['decision','procurement'],
  ['suppliers','data'],['customers','demand'],['demand','procurement'],['workflow','warehouse']
] as const;

type Particle = { path:number; t:number; speed:number; color:string };

const hash = (n:number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function OrionLiveWallpaper({ isShuttingDown }: { isShuttingDown?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shuttingDown = useRef(Boolean(isShuttingDown));
  const { branding } = useBranding();

  useEffect(() => { shuttingDown.current = Boolean(isShuttingDown); }, [isShuttingDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 1, h = 1, dpr = 1, raf = 0, last = performance.now();
    let parallaxX = 0, parallaxY = 0, targetX = 0, targetY = 0;
    let t = 0;
    const particles: Particle[] = [];
    const stars = Array.from({length: 360}, (_,i) => ({
      x: hash(i*3+1), y: hash(i*3+2), r: .35 + hash(i*3+3)*1.25,
      a: .18 + hash(i*3+4)*.65, tw: .4 + hash(i*3+5)*1.8
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w*dpr);
      canvas.height = Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const onMove = (e:MouseEvent) => {
      targetX = (e.clientX / Math.max(1,w) - .5) * 12;
      targetY = (e.clientY / Math.max(1,h) - .5) * 9;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, {passive:true});

    const node = (id:string) => NODES.find(n=>n.id===id)!;
    const nodePoint = (n:NodeDef, cx:number, cy:number, rx:number, ry:number) => ({
      x: n.x*w + parallaxX*(.2 + Math.abs(n.x-.55)),
      y: n.y*h + parallaxY*(.2 + Math.abs(n.y-.5))
    });

    // Hand-drawn continental silhouettes. These are deliberately soft/abstract:
    // they read as a living Earth rather than a static stock map.
    const continents = [
      // North/South America
      [[-.73,-.48],[-.57,-.55],[-.47,-.40],[-.50,-.22],[-.40,-.08],[-.47,.08],[-.43,.23],[-.56,.40],[-.60,.63],[-.74,.72],[-.79,.51],[-.72,.29],[-.82,.08],[-.73,-.08]],
      // Europe / Africa
      [[-.08,-.57],[.12,-.60],[.24,-.47],[.17,-.31],[.10,-.20],[.17,-.08],[.10,.06],[.04,.25],[-.05,.47],[-.18,.60],[-.29,.46],[-.24,.25],[-.19,.06],[-.29,-.07],[-.22,-.27],[-.12,-.34]],
      // Asia
      [[.17,-.52],[.34,-.57],[.53,-.48],[.67,-.34],[.79,-.18],[.70,-.04],[.54,-.08],[.43,.03],[.29,-.02],[.18,-.14],[.08,-.27]],
      // Australia
      [[.47,.44],[.63,.41],[.72,.52],[.68,.67],[.52,.72],[.42,.61]]
    ];

    const drawContinents = (cx:number,cy:number,r:number,rotation:number,alpha:number) => {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
      // Longitude/latitude grid
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = 'rgba(65,178,224,.13)';
      for (let i=-4;i<=4;i++) {
        const x = cx + (i/5)*r;
        ctx.beginPath();
        ctx.ellipse(x,cy,Math.max(8,r*.14),r,0,0,Math.PI*2);
        ctx.stroke();
      }
      for (let i=-3;i<=3;i++) {
        const y = cy + (i/4)*r;
        ctx.beginPath();
        ctx.ellipse(cx,y,r,Math.max(8,r*.11),0,0,Math.PI*2);
        ctx.stroke();
      }

      const light = ctx.createRadialGradient(cx-r*.35,cy-r*.35,0,cx,cy,r);
      light.addColorStop(0,'rgba(80,174,255,.17)');
      light.addColorStop(.55,'rgba(12,51,90,.10)');
      light.addColorStop(1,'rgba(0,0,0,.70)');
      ctx.fillStyle=light; ctx.fillRect(cx-r,cy-r,r*2,r*2);

      ctx.translate(cx,cy); ctx.rotate(rotation); ctx.translate(-cx,-cy);
      continents.forEach((poly,ci)=>{
        ctx.beginPath();
        poly.forEach(([px,py],i)=>{
          const x=cx+px*r, y=cy+py*r;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        });
        ctx.closePath();
        ctx.fillStyle = ci===3 ? 'rgba(50,145,170,.30)' : 'rgba(47,111,146,.28)';
        ctx.strokeStyle='rgba(79,190,224,.30)';
        ctx.lineWidth=.8;
        ctx.fill(); ctx.stroke();

        // City lights clustered over populated land
        for(let j=0;j<ci===0?0:0;j++) {}
        const count = ci===2 ? 115 : ci===1 ? 85 : ci===0 ? 65 : 30;
        for(let j=0;j<count;j++){
          const px=poly[j%poly.length][0] + (hash(ci*500+j*2)-.5)*.24;
          const py=poly[j%poly.length][1] + (hash(ci*500+j*2+1)-.5)*.18;
          const rr=(.45+hash(ci*500+j*2+2)*.8);
          ctx.fillStyle=`rgba(255,197,92,${.18+hash(ci*500+j)*.42})`;
          ctx.beginPath();ctx.arc(cx+px*r,cy+py*r,rr,0,Math.PI*2);ctx.fill();
        }
      });
      ctx.restore();
    };

    const draw = (now:number) => {
      const dt = Math.min(32, now-last); last=now; t += dt*.001;
      const reduced = document.documentElement.classList.contains('reduced-motion');
      parallaxX += (targetX-parallaxX)*.035;
      parallaxY += (targetY-parallaxY)*.035;

      ctx.clearRect(0,0,w,h);
      const bg=ctx.createLinearGradient(0,0,w,h);
      bg.addColorStop(0,'#01050b'); bg.addColorStop(.48,'#020b14'); bg.addColorStop(1,'#01040a');
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

      // Deep-space nebulae
      const nebula=(x:number,y:number,r:number,c:string)=>{
        const g=ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,c);g.addColorStop(.35,c.replace(/[\d.]+\)$/,'0.045)'));g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      };
      nebula(w*.83,h*.18,w*.42,'rgba(30,115,220,.12)');
      nebula(w*.25,h*.82,w*.34,'rgba(0,190,230,.08)');
      nebula(w*.93,h*.75,w*.28,'rgba(100,70,220,.07)');

      // Milky-way band
      ctx.save();ctx.globalAlpha=.18;
      const mw=ctx.createLinearGradient(w*.18,h*.88,w*.92,h*.06);
      mw.addColorStop(0,'rgba(30,110,180,0)');mw.addColorStop(.45,'rgba(100,160,220,.18)');mw.addColorStop(.65,'rgba(90,135,205,.10)');mw.addColorStop(1,'rgba(0,0,0,0)');
      ctx.strokeStyle=mw;ctx.lineWidth=Math.max(40,w*.055);
      ctx.beginPath();ctx.moveTo(w*.12,h*.93);ctx.bezierCurveTo(w*.35,h*.58,w*.58,h*.30,w*.95,h*.03);ctx.stroke();ctx.restore();

      stars.forEach((s,i)=>{
        const sx=s.x*w+parallaxX*(.15+(i%3)*.1), sy=s.y*h+parallaxY*.15;
        const tw=s.a*(.72+.28*Math.sin(t*s.tw+i));
        ctx.globalAlpha=tw;ctx.fillStyle='#d9edff';ctx.beginPath();ctx.arc(sx,sy,s.r,0,Math.PI*2);ctx.fill();
      });ctx.globalAlpha=1;

      // Earth position and scale match the reference composition: slightly right of center,
      // large enough to dominate, while leaving the branding lane clean on the left.
      const cx=w*.545+parallaxX*.55, cy=h*.515+parallaxY*.5;
      // REFERENCE-A composition: large dominant world model, slightly right of center.
      // Keep the left branding lane open and reserve the lower-left lane for the tagline.
      const r=Math.min(w*.185,h*.335);
      const fade=Math.min(1, Math.max(0, (now-(performance.timeOrigin||0)-0) / 1)); // stable full-alpha
      void fade;

      // atmospheric halo
      const halo=ctx.createRadialGradient(cx,cy,r*.72,cx,cy,r*1.28);
      halo.addColorStop(0,'rgba(0,120,210,0)');
      halo.addColorStop(.82,'rgba(0,182,255,.12)');
      halo.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=halo;ctx.fillRect(cx-r*1.3,cy-r*1.3,r*2.6,r*2.6);

      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
      const earth=ctx.createRadialGradient(cx-r*.32,cy-r*.32,r*.02,cx,cy,r);
      earth.addColorStop(0,'#173f65');earth.addColorStop(.35,'#09253e');earth.addColorStop(.72,'#03121f');earth.addColorStop(1,'#00030a');
      ctx.fillStyle=earth;ctx.fill();

      // day/night edge
      ctx.save();ctx.clip();
      const day=ctx.createRadialGradient(cx-r*.62,cy-r*.18,0,cx-r*.35,cy-r*.10,r*1.1);
      day.addColorStop(0,'rgba(255,215,135,.75)');day.addColorStop(.24,'rgba(255,188,94,.30)');day.addColorStop(.58,'rgba(255,170,90,.03)');day.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=day;ctx.fillRect(cx-r,cy-r,r*2,r*2);
      drawContinents(cx,cy,r,t*.035);
      ctx.restore();

      // atmospheric rim
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.strokeStyle='rgba(0,207,255,.72)';ctx.lineWidth=1.35;ctx.stroke();
      ctx.beginPath();ctx.arc(cx-r*.03,cy-r*.02,r*1.012,Math.PI*.70,Math.PI*1.62);
      ctx.strokeStyle='rgba(108,206,255,.52)';ctx.lineWidth=2.2;ctx.stroke();

      // orbital rings
      [[1.32,.72,.22],[1.62,.50,.15],[1.82,.92,.10]].forEach(([rx,ry,a],i)=>{
        ctx.save();ctx.translate(cx,cy);ctx.rotate(i===1?-0.32:0.22);
        ctx.beginPath();ctx.ellipse(0,0,r*rx,r*ry,0,0,Math.PI*2);
        ctx.strokeStyle=`rgba(0,195,255,${a})`;ctx.lineWidth=.8;ctx.stroke();ctx.restore();
      });

      // Network paths
      PATHS.forEach(([a,b],i)=>{
        const p1=node(a),p2=node(b);
        const A=nodePoint(p1,cx,cy,r,r),B=nodePoint(p2,cx,cy,r,r);
        const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;
        const bend=((i%3)-1)*Math.min(80,w*.045);
        const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy)||1;
        const nx=-dy/len,ny=dx/len;
        ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.quadraticCurveTo(mx+nx*bend,my+ny*bend,B.x,B.y);
        ctx.strokeStyle=i%5===0?'rgba(120,120,255,.20)':'rgba(0,198,240,.18)';
        ctx.lineWidth=.85;ctx.stroke();
      });

      // moving supply-chain packets
      if(!reduced && particles.length<24 && Math.random()<.055){
        const pi=Math.floor(Math.random()*PATHS.length), to=node(PATHS[pi][1]);
        particles.push({path:pi,t:0,speed:.00018+Math.random()*.00025,color:to.color});
      }
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];p.t+=p.speed*dt;
        if(p.t>=1){particles.splice(i,1);continue;}
        const [a,b]=PATHS[p.path],A=node(a),B=node(b);
        const p1=nodePoint(A,cx,cy,r,r),p2=nodePoint(B,cx,cy,r,r);
        const mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2;
        const dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
        const bend=((p.path%3)-1)*Math.min(80,w*.045),nx=-dy/len,ny=dx/len;
        const qx=mx+nx*bend,qy=my+ny*bend,tt=p.t;
        const x=(1-tt)*(1-tt)*p1.x+2*(1-tt)*tt*qx+tt*tt*p2.x;
        const y=(1-tt)*(1-tt)*p1.y+2*(1-tt)*tt*qy+tt*tt*p2.y;
        ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.fillStyle=p.color;
        ctx.beginPath();ctx.arc(x,y,2.1,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      }

      // node field
      NODES.forEach((n,i)=>{
        const p=nodePoint(n,cx,cy,r,r), pulse=.5+.5*Math.sin(t*1.4+i);
        ctx.strokeStyle=`${n.color}33`;ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(p.x,p.y,n.radius+6+pulse*2,0,Math.PI*2);ctx.stroke();
        ctx.shadowColor=n.color;ctx.shadowBlur=10;ctx.fillStyle=n.color;
        ctx.beginPath();ctx.arc(p.x,p.y,n.radius*.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        ctx.fillStyle=`${n.color}bb`;ctx.font=`500 ${Math.max(8,Math.min(10,w/150))}px "JetBrains Mono",monospace`;
        ctx.fillText(n.label,p.x+12,p.y+3);
      });

      // subtle technical copy, kept away from the brand lane
      ctx.fillStyle='rgba(0,211,240,.45)';ctx.font='500 8px "JetBrains Mono",monospace';
      ['OBSERVE','ANALYZE','ANTICIPATE','ACT'].forEach((s,i)=>ctx.fillText(s,w-82,36+i*14));
      ctx.fillStyle='rgba(0,211,240,.32)';ctx.fillText('INTELLIGENCE IN MOTION',w-150,h-68);

      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('mousemove',onMove)};
  }, []);

  const logo = branding?.logo || branding?.logoUrl || '/orion-9-logo.png';

  return (
    <div className="orion-live-wallpaper absolute inset-0 pointer-events-none z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Fixed brand lockup: small, below the shell bar. Never part of the animated globe. */}
      <div className="orion-wallpaper-brand" aria-hidden="true">
        <img src={logo} alt="" className="orion-wallpaper-logo" />
      </div>

      {/* Reference tagline: deliberately placed bottom-left, above the dock. */}
      <div className="orion-wallpaper-tagline" aria-hidden="true">
        <span>CONNECTED INTELLIGENCE</span>
        <span>FOR A MORE RESILIENT</span>
        <span>TOMORROW</span>
        <i />
      </div>
    </div>
  );
}
