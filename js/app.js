/* ══════════════════════════════════════════════════════════════════════════
   PHẦN 2 — BỘ MÁY DỰNG CẢNH.
   ══════════════════════════════════════════════════════════════════════════ */

(function(){
"use strict";
var D = DULIEU, cv = document.getElementById('scene');

var renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true,
  logarithmicDepthBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xEDEFE6);
scene.fog = new THREE.Fog(0xEDEFE6, 700, 1750);
var camera = new THREE.PerspectiveCamera(36, 8, 8, 5000);

scene.add(new THREE.HemisphereLight(0xFFFDF6, 0xBFCBA8, 0.74));
var sun = new THREE.DirectionalLight(0xFFF6E4, 0.80);
sun.position.set(-380,480,260); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.bias = -0.0006;
var sc = sun.shadow.camera;
sc.left=-620; sc.right=620; sc.top=620; sc.bottom=-620; sc.near=10; sc.far=1400;
scene.add(sun);

/* ── tiện ích hình học ─────────────────────────────────────────────── */
function shape(pts){
  var s = new THREE.Shape();
  s.moveTo(pts[0][0], -pts[0][1]);
  for(var i=1;i<pts.length;i++) s.lineTo(pts[i][0], -pts[i][1]);
  s.closePath(); return s;
}
function phang(pts, mau, y, mo){
  var g=new THREE.ShapeGeometry(shape(pts)); g.rotateX(-Math.PI/2);
  var m=new THREE.Mesh(g, new THREE.MeshLambertMaterial(
    {color:mau, transparent:mo!==undefined, opacity:mo!==undefined?mo:1}));
  m.position.y=y; m.receiveShadow=true; scene.add(m); return m;
}
function daiDuong(diem, rong, y){
  /* Bản trước dựng tam giác theo chiều khiến pháp tuyến hướng XUỐNG, nên
     mặt đường bị cull khi nhìn từ trên — đường vô hình chứ không phải mờ.
     Nay đảo thứ tự đỉnh và gán thẳng pháp tuyến (0,1,0). */
  var v=[], nrm=[];
  function dinh(x,z){ v.push(x,y,z); nrm.push(0,1,0); }
  for(var i=0;i<diem.length-1;i++){
    var a=diem[i], b=diem[i+1];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1;
    var nx=-dz/L*rong/2, nz=dx/L*rong/2;
    dinh(a[0]+nx,a[1]+nz); dinh(b[0]+nx,b[1]+nz); dinh(a[0]-nx,a[1]-nz);
    dinh(b[0]+nx,b[1]+nz); dinh(b[0]-nx,b[1]-nz); dinh(a[0]-nx,a[1]-nz);
    if(i+2 < diem.length){
      var c=diem[i+2];
      var ex=c[0]-b[0], ez=c[1]-b[1], L2=Math.hypot(ex,ez)||1;
      var mx=-ez/L2*rong/2, mz=ex/L2*rong/2;
      dinh(b[0],b[1]); dinh(b[0]+nx,b[1]+nz); dinh(b[0]+mx,b[1]+mz);
      dinh(b[0],b[1]); dinh(b[0]+mx,b[1]+mz); dinh(b[0]+nx,b[1]+nz);
      dinh(b[0],b[1]); dinh(b[0]-nx,b[1]-nz); dinh(b[0]-mx,b[1]-mz);
      dinh(b[0],b[1]); dinh(b[0]-mx,b[1]-mz); dinh(b[0]-nx,b[1]-nz);
    }
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm,3));
  return g;
}
function gop(ds){
  var pos=[], nor=[], uvs=[], coUV=false;
  var M=new THREE.Matrix4(), Q=new THREE.Quaternion(),
      V=new THREE.Vector3(), Sc=new THREE.Vector3();
  ds.forEach(function(it){
    var g = it.g.index ? it.g.toNonIndexed() : it.g.clone();
    Q.setFromAxisAngle(new THREE.Vector3(0,1,0), it.ry||0);
    V.set(it.p[0], it.p[1], it.p[2]);
    Sc.set(it.s||1, it.sy||it.s||1, it.s||1);
    M.compose(V,Q,Sc); g.applyMatrix4(M);
    var p=g.attributes.position.array, q=g.attributes.normal.array;
    for(var i=0;i<p.length;i++) pos.push(p[i]);
    for(var i=0;i<q.length;i++) nor.push(q[i]);
    if(g.attributes.uv){
      coUV=true;
      var u=g.attributes.uv.array;
      for(var i=0;i<u.length;i++) uvs.push(u[i]);
    } else {
      for(var i=0;i<p.length/3;i++) uvs.push(0,0);
    }
  });
  var G=new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  G.setAttribute('normal', new THREE.Float32BufferAttribute(nor,3));
  if(coUV) G.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  return G;
}
function dienTich(p){
  var s=0; for(var i=0;i<p.length;i++){ var a=p[i], b=p[(i+1)%p.length];
    s += a[0]*b[1]-b[0]*a[1]; } return Math.abs(s)/2;
}
function lech(pts,d,w){
  var n=pts.length, out=[];
  for(var i=0;i<n;i++){
    var p=pts[i], a=pts[(i-1+n)%n], b=pts[(i+1)%n];
    var e1x=p[0]-a[0], e1z=p[1]-a[1], l1=Math.hypot(e1x,e1z)||1; e1x/=l1; e1z/=l1;
    var e2x=b[0]-p[0], e2z=b[1]-p[1], l2=Math.hypot(e2x,e2z)||1; e2x/=l2; e2z/=l2;
    var n1x=-e1z*w, n1z=e1x*w, n2x=-e2z*w, n2z=e2x*w;
    var bx=n1x+n2x, bz=n1z+n2z, bl=Math.hypot(bx,bz);
    if(bl<1e-6){ out.push([p[0],p[1]]); continue; }
    bx/=bl; bz/=bl;
    var k=d/Math.max(0.3, bx*n1x+bz*n1z);
    out.push([p[0]+bx*k, p[1]+bz*k]);
  }
  return out;
}
/* d>0 thu vào trong, d<0 phình ra ngoài */
function offset(pts,d){
  var a=lech(pts,d,1), b=lech(pts,d,-1);
  return d>0 ? (dienTich(a)<dienTich(b)?a:b) : (dienTich(a)>dienTich(b)?a:b);
}
/* Phép co đa giác dùng đường phân giác VỠ ở góc lõm: đỉnh bị đẩy vượt qua
   cạnh đối diện, đa giác tự cắt, mái thành mớ tam giác lộn xộn. Nhà K có
   3 góc lõm, nhà thể chất 2 góc — đó là lý do mái hai toà này hỏng.
   Nay co xong PHẢI kiểm chứng, không đạt thì giảm dần cho tới khi hợp lệ. */
function trongDaGiac(pt, poly){
  var c=false;
  for(var i=0;i<poly.length;i++){
    var a=poly[i-1<0?poly.length-1:i-1], b=poly[i];
    if((a[1]>pt[1])!==(b[1]>pt[1]) &&
       pt[0] < (b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0]) c=!c;
  }
  return c;
}
function catNhau(p1,p2,p3,p4){
  function d(o,a,b){ return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]); }
  var d1=d(p3,p4,p1), d2=d(p3,p4,p2), d3=d(p1,p2,p3), d4=d(p1,p2,p4);
  return ((d1>0)!==(d2>0)) && ((d3>0)!==(d4>0));
}
function hopLe(q, goc){
  if(q.length<3 || dienTich(q) >= dienTich(goc)*0.98 || dienTich(q) < 1) return false;
  for(var i=0;i<q.length;i++) if(!trongDaGiac(q[i], goc)) return false;
  var n=q.length;
  for(var i=0;i<n;i++)
    for(var j=i+2;j<n;j++){
      if(i===0 && j===n-1) continue;
      if(catNhau(q[i],q[(i+1)%n],q[j],q[(j+1)%n])) return false;
    }
  return true;
}
/* co vào trong, giảm dần cho tới khi ra đa giác hợp lệ */
function coAnToan(pts, dMuon){
  var d=dMuon;
  for(var k=0;k<8;k++){
    var q=offset(pts,d);
    if(hopLe(q,pts)) return q;
    d*=0.6;
  }
  return null;
}
/* Mái trên mặt bằng chữ L: chia mảnh lồi cho ra mảnh tam giác chéo nên
   sống nóc chạy chéo, trông như bùi nhùi. Ảnh vệ tinh cho thấy mái thật là
   các THANH DÀI đơn giản gặp nhau. Nên: xoay mặt bằng về trục nhà, quét dọc
   trục dài, gom các lát cùng bề ngang thành thanh, mỗi thanh một mái như
   nhà B. */
function gocTrucNha(p){
  var best=0, g=0;
  for(var i=0;i<p.length;i++){
    var a=p[i], b=p[(i+1)%p.length];
    var L=Math.hypot(b[0]-a[0], b[1]-a[1]);
    if(L>best){ best=L; g=Math.atan2(b[1]-a[1], b[0]-a[0]); }
  }
  return g;
}
function xoayDiem(p, g){
  var c=Math.cos(-g), s=Math.sin(-g);
  return p.map(function(q){ return [q[0]*c-q[1]*s, q[0]*s+q[1]*c]; });
}
function xoayNguoc(q, g){
  var c=Math.cos(g), s=Math.sin(g);
  return [q[0]*c-q[1]*s, q[0]*s+q[1]*c];
}
function thanhMai(p){
  var xs=[]; p.forEach(function(q){ xs.push(Math.round(q[0]*100)/100); });
  xs=xs.filter(function(v,i,a){ return a.indexOf(v)===i; }).sort(function(a,b){return a-b;});
  var zs=p.map(function(q){return q[1];});
  var z0=Math.min.apply(null,zs), z1=Math.max.apply(null,zs), buoc=(z1-z0)/160;
  var lat=[];
  for(var i=0;i<xs.length-1;i++){
    if(xs[i+1]-xs[i] < 3) continue;                 // bỏ dải quá mỏng
    var cx=(xs[i]+xs[i+1])/2, tr=[];
    for(var k=0;k<=160;k++){
      var z=z0+k*buoc;
      if(trongDaGiac([cx,z], p)) tr.push(z);
    }
    if(!tr.length) continue;
    lat.push([xs[i], xs[i+1], Math.min.apply(null,tr), Math.max.apply(null,tr)]);
  }
  var ra=[];
  lat.forEach(function(d){
    var t=ra[ra.length-1];
    if(t && Math.abs(t[2]-d[2])<2.5 && Math.abs(t[3]-d[3])<2.5){
      t[1]=d[1]; t[2]=Math.min(t[2],d[2]); t[3]=Math.max(t[3],d[3]);
    } else ra.push(d.slice());
  });
  return ra;
}
function maiTheoThanh(mb, caoTuong, caoMai, vuon){
  var g=gocTrucNha(mb), q=xoayDiem(mb,g), ds=[], dsBo=[];
  var thanh=thanhMai(q);
  if(!thanh.length){                                  // không tách được
    var xs=q.map(function(a){return a[0];}), zs=q.map(function(a){return a[1];});
    thanh=[[Math.min.apply(null,xs),Math.max.apply(null,xs),
            Math.min.apply(null,zs),Math.max.apply(null,zs)]];
  }
  thanh.forEach(function(t){
    var x0=t[0]-vuon, x1=t[1]+vuon, z0=t[2]-vuon, z1=t[3]+vuon;
    var duoi=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(function(a){return xoayNguoc(a,g);});
    var ins=Math.min((x1-x0), (z1-z0))*0.45;
    var tren=[[x0+ins,z0+ins],[x1-ins,z0+ins],[x1-ins,z1-ins],[x0+ins,z1-ins]]
             .map(function(a){return xoayNguoc(a,g);});
    ds.push({g: maiGeo(duoi, tren, caoTuong, caoTuong+caoMai), p:[0,0,0]});
    dsBo.push({g: boMai(duoi, tren, caoTuong, caoTuong+caoMai, 0.55), p:[0,0,0]});
  });
  return {geo: gop(ds), bo: gop(dsBo), thanh: thanh, goc: g, vuon: vuon};
}
function canhNho(pts){
  var xs=pts.map(function(p){return p[0]}), zs=pts.map(function(p){return p[1]});
  return Math.min(Math.max.apply(null,xs)-Math.min.apply(null,xs),
                  Math.max.apply(null,zs)-Math.min.apply(null,zs));
}
/* Bờ nóc và bờ chảy: dải gờ nổi chạy dọc sống nóc và bốn đường xiên góc mái.
   Nhìn từ trên xuống, mái dốc trơn cho ra một mảng màu đều nên đọc ra "phẳng";
   mấy dải gờ này vạch rõ ranh giới giữa các mặt dốc. Mái nhà Bát Giác nổi rõ
   độ dốc chính vì nó là chóp bốn mặt, ranh giới tự hiện. */
function boMai(duoi, tren, yD, yT, day){
  duoi=theoKim(duoi); tren=theoKim(tren);
  var v=[], nr=[], n=duoi.length;
  function bar(p1,y1,p2,y2){
    var dx=p2[0]-p1[0], dz=p2[1]-p1[1], L=Math.hypot(dx,dz)||1;
    var nx=-dz/L*day/2, nz=dx/L*day/2, h=day*0.85;
    var A=[p1[0]+nx,y1,p1[1]+nz], B=[p2[0]+nx,y2,p2[1]+nz];
    var C=[p2[0]-nx,y2,p2[1]-nz], Dd=[p1[0]-nx,y1,p1[1]-nz];
    [[A,B,[B[0],B[1]+h,B[2]],[A[0],A[1]+h,A[2]]],
     [C,Dd,[Dd[0],Dd[1]+h,Dd[2]],[C[0],C[1]+h,C[2]]],
     [[A[0],A[1]+h,A[2]],[B[0],B[1]+h,B[2]],[C[0],C[1]+h,C[2]],[Dd[0],Dd[1]+h,Dd[2]]]
    ].forEach(function(q){
      [q[0],q[1],q[2], q[0],q[2],q[3]].forEach(function(p){
        v.push(p[0],p[1],p[2]); nr.push(0,1,0); });
    });
  }
  for(var i=0;i<n;i++){
    bar(tren[i], yT, tren[(i+1)%n], yT);          // bờ nóc
    bar(duoi[i], yD, tren[i], yT);                // bờ chảy ở góc
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nr,3));
  return g;
}
/* Mặt bằng OSM quay THEO chiều kim đồng hồ, còn hình chữ nhật t tự dựng
   trong maiTheoThanh lại quay NGƯỢC chiều — nên mặt trên của mái quay xuống
   đất, bị cắt bỏ, nhìn từ trên là xuyên thẳng vào trong nhà. Thống nhất
   chiều quay trước khi dựng là hết. */
function theoKim(p){
  var s=0;
  for(var i=0;i<p.length;i++){ var a=p[i], b=p[(i+1)%p.length];
    s += a[0]*b[1]-b[0]*a[1]; }
  return s < 0 ? p.slice() : p.slice().reverse();
}
function maiGeo(duoi, tren, yD, yT){
  duoi = theoKim(duoi);
  /* tren phải quay CÙNG chiều và CÙNG điểm bắt đầu với duoi, nếu không
     các mặt dốc sẽ xoắn chéo vào nhau */
  var dinhChung = tren.length && tren.every(function(p){
    return p[0]===tren[0][0] && p[1]===tren[0][1]; });
  if(!dinhChung) tren = theoKim(tren);
  /* Sinh kèm toạ độ trải ảnh để dán được ngói lặp: trục ngang chạy dọc mép
     mái, trục dọc chạy theo chiều dốc, mỗi viên ngói khoảng 0,32m. */
  var v=[], uv=[], n=duoi.length;
  var VIEN=0.32;
  function P(x,y,z,u,w){ v.push(x,y,z); uv.push(u,w); }
  var chay=0;
  for(var i=0;i<n;i++){
    var j=(i+1)%n, a=duoi[i], b=duoi[j], c=tren[j], e=tren[i];
    var Lm=Math.hypot(b[0]-a[0], b[1]-a[1]);
    var doc=Math.hypot(e[0]-a[0], e[1]-a[1], 0);
    var truot=Math.hypot(doc, yT-yD);
    var u0=chay/VIEN, u1=(chay+Lm)/VIEN, w1=truot/VIEN;
    P(a[0],yD,a[1], u0,0); P(b[0],yD,b[1], u1,0); P(c[0],yT,c[1], u1,w1);
    P(a[0],yD,a[1], u0,0); P(c[0],yT,c[1], u1,w1); P(e[0],yT,e[1], u0,w1);
    chay += Lm;
  }
  for(var i=1;i<n-1;i++){
    P(tren[0][0],yT,tren[0][1], tren[0][0]/VIEN, tren[0][1]/VIEN);
    P(tren[i][0],yT,tren[i][1], tren[i][0]/VIEN, tren[i][1]/VIEN);
    P(tren[i+1][0],yT,tren[i+1][1], tren[i+1][0]/VIEN, tren[i+1][1]/VIEN);
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  g.computeVertexNormals(); return g;
}
function tuongBao(diem, rong, cao){
  /* Vòng tường RỖNG: chỉ hai mặt đứng và nắp trên.
     ExtrudeGeometry trên đa giác khuôn viên sẽ ra KHỐI ĐẶC, nâng cả sân
     trường lên thành một tảng — đó là lỗi bản trước. */
  var v=[], nr=[];
  function d(x,y,z, nx,nz){ v.push(x,y,z); nr.push(nx||0, nz===undefined?1:0, nz||0); }
  for(var i=0;i<diem.length-1;i++){
    var a=diem[i], b=diem[i+1];
    var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1;
    var nx=-dz/L, nz=dx/L, hx=nx*rong/2, hz=nz*rong/2;
    var ax=a[0]+hx, az=a[1]+hz, bx=b[0]+hx, bz=b[1]+hz;   // mép ngoài
    var cx=a[0]-hx, cz=a[1]-hz, ex=b[0]-hx, ez=b[1]-hz;   // mép trong
    // mặt ngoài
    d(ax,0,az,nx,nz); d(bx,0,bz,nx,nz); d(bx,cao,bz,nx,nz);
    d(ax,0,az,nx,nz); d(bx,cao,bz,nx,nz); d(ax,cao,az,nx,nz);
    // mặt trong
    d(cx,0,cz,-nx,-nz); d(cx,cao,cz,-nx,-nz); d(ex,cao,ez,-nx,-nz);
    d(cx,0,cz,-nx,-nz); d(ex,cao,ez,-nx,-nz); d(ex,0,ez,-nx,-nz);
    // nắp trên
    d(ax,cao,az); d(bx,cao,bz); d(ex,cao,ez);
    d(ax,cao,az); d(ex,cao,ez); d(cx,cao,cz);
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nr,3));
  return g;
}
function vienNet(pts, y){
  var v=[];
  for(var i=0;i<pts.length;i++){
    var a=pts[i], b=pts[(i+1)%pts.length];
    v.push(a[0],y,a[1], b[0],y,b[1]);
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  return g;
}


/* ══════════════════════════════════════════════════════════════════
   NẮN DỮ LIỆU TRƯỚC KHI DỰNG
   OSM cắt đường và tường rào thành nhiều "way" rời rạc. Hai way kề nhau
   lệch nhau từ vài chục phân tới gần năm mét, nên dựng thẳng ra thì
   đường đứt khúc còn tường thì gãy — rõ nhất là hai bên cổng chính.
   Ba việc dưới đây làm sạch dữ liệu ngay trong bộ nhớ:
     A. vuốt cho tuyến đường bớt răng cưa;
     B. hàn đầu mút các tuyến về chung một nút, rồi bắt cả nút chữ T;
     C. dựng lại đoạn tường hai bên MỖI cổng cho khớp đúng trụ cổng,
        đồng thời xoay lại cổng cho vuông góc với tường.
   ══════════════════════════════════════════════════════════════════ */
(function nanDuLieu(){

  /* ── A. vuốt răng cưa ────────────────────────────────────────────
     Trung bình hoá mỗi đỉnh trong với hai đỉnh kề (trọng số 0,6/0,2/0,2).
     Hai đầu mút giữ nguyên để bước hàn phía dưới còn khớp được. */
  var duong = D.duong.filter(function(r){ return r.diem && r.diem.length >= 2; });
  duong.forEach(function(r){
    var p = r.diem;
    if(p.length < 5) return;
    var q = p.map(function(v){ return [v[0], v[1]]; });
    for(var i=1; i<p.length-1; i++){
      q[i][0] = p[i][0]*0.6 + (p[i-1][0] + p[i+1][0])*0.2;
      q[i][1] = p[i][1]*0.6 + (p[i-1][1] + p[i+1][1])*0.2;
    }
    r.diem = q;
  });

  /* ── B1. hàn đầu mút ────────────────────────────────────────────
     Gom mọi đầu mút nằm trong bán kính TOL về một nút chung. Không gom
     hai đầu của CÙNG một tuyến, kẻo tuyến ngắn co lại thành một điểm.
     Gom kiểu tham lam có tật: tâm cụm xê dịch dần theo từng đầu mút vừa
     nhận, nên đầu mút đến sau — dù chỉ cách đầu mút đến trước vài phân —
     lại rơi ra ngoài bán kính và tự lập cụm mới. Vì thế phải gom ĐI GOM
     LẠI trên vị trí đã nắn, tới khi không còn gì dịch chuyển nữa. */
  var TOL = 5.0;
  var mut = [];
  function viTri(m){ return m.cuoi ? m.r.diem.length-1 : 0; }
  duong.forEach(function(r){ mut.push({r:r, cuoi:false}); mut.push({r:r, cuoi:true}); });

  for(var vong=0; vong<6; vong++){
    var cum = [];
    mut.forEach(function(m){
      var p = m.r.diem[viTri(m)], tim = null;
      for(var k=0; k<cum.length; k++){
        var c = cum[k];
        if(Math.hypot(c.x-p[0], c.z-p[1]) >= TOL) continue;
        var trung = false;
        for(var j=0; j<c.ds.length; j++) if(c.ds[j].r === m.r) trung = true;
        if(trung) continue;
        tim = c; break;
      }
      if(!tim){ tim = {x:p[0], z:p[1], ds:[]}; cum.push(tim); }
      tim.ds.push(m);
      var sx=0, sz=0;
      tim.ds.forEach(function(q){ var v=q.r.diem[viTri(q)]; sx+=v[0]; sz+=v[1]; });
      tim.x = sx/tim.ds.length; tim.z = sz/tim.ds.length;
    });
    var doi = false;
    cum.forEach(function(c){
      if(c.ds.length < 2) return;
      c.ds.forEach(function(m){ m.han = true; });
      c.ds.forEach(function(m){
        var v = m.r.diem[viTri(m)];
        if(Math.abs(v[0]-c.x) > 1e-6 || Math.abs(v[1]-c.z) > 1e-6) doi = true;
        m.r.diem[viTri(m)] = [c.x, c.z];
      });
    });
    if(!doi) break;
  }

  /* ── B2. nút chữ T ──────────────────────────────────────────────
     Đầu mút rơi vào GIỮA một tuyến khác thì kéo về bám đúng lên tuyến
     ấy, đồng thời chèn một đỉnh vào tuyến kia cho hai bên dùng chung
     một điểm. Nếu không, ngã ba nào cũng hở một khe hình tam giác.
     CHỈ xét đầu mút còn bơ vơ. Một đầu mút vừa hàn ở B1 mà đem bắt tiếp
     vào tuyến khác thì nó bị kéo đi tới bốn mét, thế là mối vừa hàn xong
     lại toác ra — đúng lỗi làm hở mười một ngã ba quanh trường ở bản thử
     trước, trong đó có cả ngã ba ngay trước cổng chính. */
  var TOL_T = 4.0;
  mut.forEach(function(m){
    if(m.han) return;
    var p = m.r.diem[viTri(m)];
    var tot = null, dNhat = TOL_T;
    duong.forEach(function(s){
      if(s === m.r) return;
      for(var i=0; i<s.diem.length-1; i++){
        var a=s.diem[i], b=s.diem[i+1];
        var dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz;
        if(L2 < 1e-6) continue;
        var t = ((p[0]-a[0])*dx + (p[1]-a[1])*dz)/L2;
        if(t <= 0.03 || t >= 0.97) continue;
        var qx=a[0]+dx*t, qz=a[1]+dz*t;
        var d = Math.hypot(p[0]-qx, p[1]-qz);
        if(d < dNhat){ dNhat = d; tot = {s:s, i:i, q:[qx,qz]}; }
      }
    });
    if(!tot || dNhat < 0.02) return;
    m.r.diem[viTri(m)] = [tot.q[0], tot.q[1]];
    tot.s.diem.splice(tot.i+1, 0, [tot.q[0], tot.q[1]]);
    m.han = true;
  });

  /* ── B3. bắc nhịp nối ───────────────────────────────────────────
     Vẫn còn dăm cặp đầu mút cách nhau năm sáu mét, quá tầm hàn của B1.
     Hàn ép thì phải kéo nguyên một đầu tuyến đi ngần ấy mét, cong vẹo
     cả con đường. Rẻ hơn nhiều là bắc một NHỊP NGẮN nối hai đầu lại:
     hình tuyến giữ nguyên như dữ liệu gốc, mà khe hở thì biến mất.
     Chỉ bắc khi hai mép đường thật sự chưa chồng lên nhau — hai con
     đường mười lăm mét bề ngang chụm đầu cách nhau một mét thì mặt
     đường đã phủ kín nhau rồi, bắc thêm chỉ tổ thừa. */
  var TOL_C = 7.5;
  for(var iC=0; iC<mut.length; iC++){
    var m1 = mut[iC];
    if(m1.han) continue;
    var p1 = m1.r.diem[viTri(m1)];
    var banC = null, dC = TOL_C;
    for(var jC=0; jC<mut.length; jC++){
      var m2 = mut[jC];
      if(m2.r === m1.r || m2.han) continue;
      var p2 = m2.r.diem[viTri(m2)];
      var d = Math.hypot(p1[0]-p2[0], p1[1]-p2[1]);
      if(d < 0.001 || d >= dC) continue;
      if(d <= (m1.r.rong + m2.r.rong)/2) continue;
      dC = d; banC = m2;
    }
    if(!banC) continue;
    var q = banC.r.diem[viTri(banC)];
    if(m1.cuoi) m1.r.diem.push([q[0], q[1]]);
    else        m1.r.diem.unshift([q[0], q[1]]);
    m1.han = true; banC.han = true;
  }

  /* ── C. tường bao và cổng ───────────────────────────────────────
     Dữ liệu gốc để sẵn mấy đoạn tường cụt hai bên cổng, nhưng chúng
     không chạm được vào cung tường chính, cũng chẳng chạm vào trụ cổng
     — cổng chính hở tới hơn năm mét. Nay bỏ hết các đoạn cụt ấy rồi
     dựng lại theo khe hở thật giữa hai cung tường.

     HƯỚNG CỔNG lấy theo TIẾP TUYẾN CỦA TƯỜNG tại hai đầu khe, chứ không
     lấy theo dây cung nối hai đầu ấy. Chỗ cổng chính, ranh giới có một
     bậc thụt: đầu cung tường phía tây dừng ở z≈39 còn đầu cung phía đông
     lại bắt đầu ở z≈33, nên dây cung dốc hơn hẳn mặt phố. Đặt cổng vuông
     góc với dây cung thì cổng xoay chéo đi chừng hai mươi độ, nhìn ra
     không ăn nhập gì với đường Thuỵ Khuê. Lấy trung bình hai tiếp tuyến
     thì cánh cổng song song với mặt phố, đúng như ảnh chụp thực địa —
     còn bậc thụt kia để hai đoạn tường cụt xoè ra gánh. */
  if(D.tuongTruong && D.cong && D.cong.length){
    var cungChinh = D.tuongTruong.filter(function(c){ return c.length > 2; });

    var C=[0,0], nC=0;
    (D.ranhTruong || []).forEach(function(p){ C[0]+=p[0]; C[1]+=p[1]; nC++; });
    if(!nC) cungChinh.forEach(function(c){
      c.forEach(function(p){ C[0]+=p[0]; C[1]+=p[1]; nC++; }); });
    if(nC){ C[0]/=nC; C[1]/=nC; }

    /* tiếp tuyến của cung tường ngay tại đầu mút đang xét */
    /* Tiếp tuyến lấy trên một ĐOẠN DÀI chừng năm mét, không lấy một
       đoạn con duy nhất: dữ liệu OSM có chỗ đoạn cuối cùng chỉ dài tám
       mươi phân, hướng của nó là nhiễu chứ không phải hướng bức tường,
       mà cổng thì lại xoay theo. */
    function tiepTuyen(c, dauCuoi, tam){
      var n=c.length, b = dauCuoi ? c[n-1] : c[0], a = b;
      if(dauCuoi){
        for(var i=n-2;i>=0;i--){ a=c[i];
          if(Math.hypot(b[0]-a[0], b[1]-a[1]) >= tam) break; }
      } else {
        for(var i=1;i<n;i++){ a=c[i];
          if(Math.hypot(b[0]-a[0], b[1]-a[1]) >= tam) break; }
      }
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1;
      return [dx/L, dz/L];
    }

    var tuongMoi = cungChinh.slice();
    D.cong.forEach(function(g){
      var ds = [];
      cungChinh.forEach(function(c, k){
        ds.push({p:c[0],             c:c, k:k, cuoi:false,
                 d:Math.hypot(c[0][0]-g.x, c[0][1]-g.z)});
        ds.push({p:c[c.length-1],    c:c, k:k, cuoi:true,
                 d:Math.hypot(c[c.length-1][0]-g.x, c[c.length-1][1]-g.z)});
      });
      ds.sort(function(a,b){ return a.d - b.d; });
      var e1 = ds[0], e2 = null;
      for(var i=1; i<ds.length; i++) if(ds[i].k !== e1.k){ e2 = ds[i]; break; }
      if(!e1 || !e2 || e2.d > 26) return;

      var mx = (e1.p[0]+e2.p[0])/2, mz = (e1.p[1]+e2.p[1])/2;
      var day = [e2.p[0]-e1.p[0], e2.p[1]-e1.p[1]];
      var khe = Math.hypot(day[0], day[1]) || 1;
      day[0]/=khe; day[1]/=khe;

      /* gộp hai tiếp tuyến, chỉnh cho cùng chiều với dây cung e1→e2 */
      var t1 = tiepTuyen(e1.c, e1.cuoi, 5), t2 = tiepTuyen(e2.c, e2.cuoi, 5);
      if(t1[0]*day[0] + t1[1]*day[1] < 0){ t1=[-t1[0],-t1[1]]; }
      if(t2[0]*day[0] + t2[1]*day[1] < 0){ t2=[-t2[0],-t2[1]]; }
      var ux = t1[0]+t2[0], uz = t1[1]+t2[1];
      var uL = Math.hypot(ux, uz);
      if(uL < 0.2){ ux = day[0]; uz = day[1]; }      // hai tiếp tuyến ngược nhau
      else { ux/=uL; uz/=uL; }

      var nx = -uz, nz = ux;
      if((C[0]-mx)*nx + (C[1]-mz)*nz < 0){ nx = -nx; nz = -nz; }

      /* ── CỔNG CHÍNH: ngả mặt về phía đông ────────────────────────
         Tường ở đây chạy gần đúng đông–tây nên pháp tuyến của tường chỉ
         thẳng về nam. Cổng thật lại ngoảnh chếch sang đông, nên lấy
         đường phân giác giữa pháp tuyến tường và hướng đông: mặt cổng
         xoay từ 72° xuống 36°, vẫn nhìn ra Thuỵ Khuê mà đã ngả hẳn về
         phía đông. Trục cổng bám theo, luôn vuông góc với mặt cổng. */
      if(g.loai === 'chinh'){
        var rx = -nx, rz = -nz;                 // pháp tuyến quay ra phố
        var bx = rx + 1, bz = rz + 0;           // cộng vectơ đơn vị hướng đông
        var bl = Math.hypot(bx, bz);
        if(bl > 0.15){
          rx = bx/bl; rz = bz/bl;
          nx = -rx;  nz = -rz;
          ux =  nz;  uz = -nx;                  // trục cổng ⊥ mặt cổng
        }
      }

      var lui = (g.x-mx)*nx + (g.z-mz)*nz;
      lui = Math.max(2.6, Math.min(6.0, lui));
      /* bề ngang cổng không được vượt hình chiếu của khe lên trục cổng,
         kẻo trụ cổng lại chồi ra ngoài hai đầu tường */
      var chieu = Math.abs(day[0]*ux + day[1]*uz) * khe;
      /* Cổng chính không chỉ là một lỗ trống: nó là cả một cụm gồm trụ
         đầu, mảng tường gắn biển, hai trụ lớn, lối xe, rồi cổng phụ đi
         bộ. Cụm ấy cần rộng hơn khe tường một chút, tường cụt xoè thêm
         là ôm được. */
      var rong = g.loai === "chinh"
        ? Math.min(11.6, Math.max(8.0, chieu + 1.2))
        : Math.min(g.rong, Math.max(3.0, chieu - 1.4));

      g.rong = rong;
      g.x = mx + nx*lui;  g.z = mz + nz*lui;
      g.tiep = [ux, uz];
      g.phap = [nx, nz];

      var t1p = [g.x - ux*rong/2, g.z - uz*rong/2];
      var t2p = [g.x + ux*rong/2, g.z + uz*rong/2];
      /* đầu tường nào ứng với trụ nào: so theo trục cổng */
      if((e1.p[0]-mx)*ux + (e1.p[1]-mz)*uz > 0){ var tmp=t1p; t1p=t2p; t2p=tmp; }
      tuongMoi.push([[e1.p[0], e1.p[1]], t1p]);
      tuongMoi.push([[e2.p[0], e2.p[1]], t2p]);
      /* giữ lại hai đoạn tường cụt: biển tên trường phải gắn lên chúng,
         chứ tính theo trục cổng thì tấm biển treo lửng giữa không khí */
      g.tuongBen = [[[e1.p[0], e1.p[1]], t1p], [[e2.p[0], e2.p[1]], t2p]];
    });
    D.tuongTruong = tuongMoi;
  }

  /* ── D. đánh dấu toà dựng theo lối riêng ────────────────────────
     Đặt ở đây chứ không sửa vào khối DULIEU: khối ấy là một dòng dài
     1,8 triệu ký tự do tienxuly.py sinh ra, chạm vào là lần xuất dữ
     liệu sau ghi đè mất. */
  (D.nhaCVA||[]).forEach(function(b){
    if(b.ten === 'Hội trường Thăng Long'){ b.chiTiet = 'hoi-truong'; return; }
    /* Mái các dãy trong trường: một màu gạch bằng, nhạt hơn màu cũ.
       Hội trường mái bằng lợp tôn xám nên để nguyên, không nhuộm đỏ. */
    if(b.kieuMai !== 'bang'){ b.mauMai = 0xC65334; b.maiPhang = true; }
  });

  /* ── E. hạ tông bảng màu cho cũ đi ──────────────────────────────
     Vôi tường đang là 0xE3B961 — vàng chanh, sáng như nhà mới quét.
     Tường Trường Bưởi là vôi vàng đã bạc, ngả nâu gạch, mảng đậm mảng
     nhạt. Hạ độ sáng và kéo sắc về phía gạch cho ra tuổi công trình. */
  D.phongCach['thuoc-dia'].tuong = 0xC79A5B;   // vôi vàng đã bạc
  D.phongCach['thuoc-dia'].vien  = 0xE6DCC6;   // phào vôi trắng ngà
  D.phongCach['biet-thu'].tuong  = 0xD3B884;
  D.phongCach['biet-thu'].vien   = 0xEFE6D2;
  D.mau.truTuong  = 0xC9A25E;   // trụ tường bao, cùng tông với nhà
  D.mau.beTuong   = 0xB5A67F;   // bệ xây chân tường
  D.mau.boMai     = 0xA8452C;   // bờ nóc, sẫm hơn mặt ngói một bậc
  D.mau.hatMaiCVA = 0xA9674A;   // diềm hắt mái
  D.mau.truCong   = 0xC9A25E;   // trụ cổng, ăn với tường bao
})();
/* ── mặt nền khu vực ───────────────────────────────────────────────── */
var M = D.mau;
/* Thay mặt phẳng vô tận bằng ĐẾ SA BÀN có biên và bề dày. Nhìn từ góc
   thấp sẽ thấy cạnh đế như mô hình đặt trên bàn, thay vì nền trải ra
   vô tận trông trống hoác. */
function vienDeSaBan(x0,x1,z0,z1,b){
  var p=[], seg=8;
  function cung(cx,cz,a0){
    for(var i=0;i<=seg;i++){
      var a=a0+Math.PI/2*i/seg;
      p.push([cx+Math.cos(a)*b, cz+Math.sin(a)*b]);
    }
  }
  cung(x1-b,z1-b,0); cung(x0+b,z1-b,Math.PI/2);
  cung(x0+b,z0+b,Math.PI); cung(x1-b,z0+b,-Math.PI/2);
  return p;
}
var vienDe = vienDeSaBan(-1500, 1150, -1750, 700, 260);
var geoDe = new THREE.ExtrudeGeometry(shape(vienDe), {depth:30, bevelEnabled:false});
geoDe.rotateX(-Math.PI/2); geoDe.translate(0, -30.9, 0);
var de = new THREE.Mesh(geoDe, new THREE.MeshLambertMaterial({color:M.canhDe}));
scene.add(de);
var matDe = new THREE.ShapeGeometry(shape(vienDe));
matDe.rotateX(-Math.PI/2);
var nen = new THREE.Mesh(matDe, new THREE.MeshLambertMaterial({color:M.nen}));
nen.position.y=-0.3; nen.receiveShadow=true; scene.add(nen);

/* ── Hồ Tây ────────────────────────────────────────────────────────── */
D.nuoc.forEach(function(n){ phang(n.diem, M.nuoc, -0.10); });

/* ── đất trường ────────────────────────────────────────────────────── */
/* KHÔNG đổ nền trong khuôn viên: chỗ này để dành cho lối đi, cây cối,
   tượng sẽ dựng ở bước sau. Khuôn viên nhận ra nhờ tường bao, không nhờ màu. */

/* Nét đứt 1px luôn mờ khi camera lùi xa. Nên dựng TƯỜNG BAO đứng: mặt
   đứng hứng sáng nên đọc rõ ở mọi cự ly, mà cũng đúng thực tế. */
/* ── tường bao trường ──────────────────────────────────────────────
   Không phải dải xanh rêu đánh dấu ranh như bản đầu, mà là tường thật:
   bệ xây thấp, trụ vuông vôi vàng cách đều, song sắt xanh giữa các trụ,
   mũ trụ đỏ. Có khoảng hở sẵn tại mỗi cổng. */
var lopTuong = new THREE.Group(); scene.add(lopTuong);
if(D.tuongTruong){
  var dsBe=[], dsTru=[], dsMu=[], dsSong=[];
  var CAO_BE=0.85, CAO_TRU=2.5, BUOC_TRU=3.2;
  D.tuongTruong.forEach(function(cung){
    for(var i=0;i<cung.length-1;i++){
      var a=cung[i], b=cung[i+1];
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
      if(L<0.05) continue;
      dx/=L; dz/=L;
      var goc=Math.atan2(-dz,dx);
      /* bệ xây chạy liên tục */
      dsBe.push({g:new THREE.BoxGeometry(L+0.34,CAO_BE,0.42),
                 p:[(a[0]+b[0])/2, CAO_BE/2, (a[1]+b[1])/2], ry:goc});
      /* song sắt: một tấm mỏng cao, thay cho vẽ từng thanh cho nhẹ */
      dsSong.push({g:new THREE.BoxGeometry(L,CAO_TRU-CAO_BE-0.2,0.09),
                   p:[(a[0]+b[0])/2, CAO_BE+(CAO_TRU-CAO_BE-0.2)/2, (a[1]+b[1])/2], ry:goc});
    }
    /* trụ đặt đều dọc theo cung */
    var tich=0, moc=0;
    for(var i=0;i<cung.length-1;i++){
      var a=cung[i], b=cung[i+1];
      var L=Math.hypot(b[0]-a[0], b[1]-a[1]);
      var t=0;
      while(tich+L-t >= moc){
        var can=moc-tich+t, r=can/L;
        var px=a[0]+(b[0]-a[0])*r, pz=a[1]+(b[1]-a[1])*r;
        var goc=Math.atan2(-(b[1]-a[1]), b[0]-a[0]);
        dsTru.push({g:new THREE.BoxGeometry(0.46,CAO_TRU,0.46), p:[px,CAO_TRU/2,pz], ry:goc});
        dsMu.push({g:new THREE.BoxGeometry(0.62,0.20,0.62), p:[px,CAO_TRU+0.10,pz], ry:goc});
        moc+=BUOC_TRU;
      }
      tich+=L;
    }
  });
  function themTuong(ds, mau){
    if(!ds.length) return;
    var m=new THREE.Mesh(gop(ds), new THREE.MeshLambertMaterial({color:mau}));
    m.castShadow=true; m.receiveShadow=true; lopTuong.add(m);
  }
  themTuong(dsBe,  M.beTuong);
  themTuong(dsTru, M.truTuong);
  themTuong(dsMu,  M.muTuong);
  themTuong(dsSong,M.songSat);
}

/* (chú thích cũ) — khuôn viên nhận ra nhờ 5 cổng và
   nhờ lớp cây, không cần vòng tường. */

/* ── cổng ─────────────────────────────────────────────────────────
   Hai trụ nằm hai bên LỐI ĐI, tức là lệch theo TIẾP TUYẾN của tường,
   không phải theo pháp tuyến — lệch theo pháp tuyến thì cổng chắn ngang
   giữa đường. Hướng cổng chính đã nắn ở đầu tệp cho ngả về phía đông.

   CỔNG CHÍNH dựng theo đúng bố cục trong ảnh, đọc từ trái sang phải:
       trụ đầu · mảng tường gắn biển đá đen · trụ lớn ·
       LỐI XE hai cánh · trụ lớn · trụ nhỏ · CỔNG NGƯỜI ĐI một cánh ·
       trụ cuối
   Không có dầm ngang nối hai trụ: ảnh cho thấy trời thông thống phía
   trên cánh cổng. Trụ thì không phải hộp trơn — từ dưới lên là bệ, thân
   vàng có ô lõm, cổ trụ thắt lại, mũ đua ra, rồi chóp vát cụt sơn trắng.
   Cánh cổng là song đứng trong khung, phía trên có hàng hoa văn xoắn.

   Mọi khối gom theo vật liệu bằng gop() — cả cụm cổng chỉ tốn năm lệnh
   vẽ, thay vì hơn hai trăm nếu để rời từng viên.                       */
var nutCong = [];
D.cong.forEach(function(g){
  var G = new THREE.Group();
  var hx = g.tiep[0], hz = g.tiep[1];       // dọc theo mặt cổng
  var goc = Math.atan2(-hz, hx);
  var nx = g.phap ? g.phap[0] : -hz, nz = g.phap ? g.phap[1] : hx;  // vào sân
  var chinh = g.loai === 'chinh';
  var W = g.rong;

  var dsVang=[], dsTrang=[], dsSat=[], dsDa=[], dsChu=[];

  /* t: dọc mặt cổng, gốc ở giữa · r: xuyên mặt cổng, dương là vào sân */
  function P(t, r){ return [g.x + hx*t + nx*r, g.z + hz*t + nz*r]; }
  function hop(ds, w,h,d, t,y,r, xoay){
    var geo=new THREE.BoxGeometry(w,h,d);
    if(xoay) geo.rotateZ(xoay);
    var p=P(t,r); ds.push({g:geo, p:[p[0],y,p[1]], ry:goc});
  }
  function khoi(ds, geo, t,y,r){
    var p=P(t,r); ds.push({g:geo, p:[p[0],y,p[1]], ry:goc});
  }

  /* ── một cây trụ: bệ · thân có ô lõm · cổ · mũ · chóp vát ── */
  function truCong(t, to, cao, coO){
    hop(dsVang, to+0.20, 0.34, to+0.20, t, 0.17, 0);          // bệ
    hop(dsVang, to,      cao,  to,      t, 0.34+cao/2, 0);    // thân
    if(coO){
      /* ô lõm chạy dọc trên hai mặt trông thấy được */
      [[1,0],[0,1]].forEach(function(h){
        [-1,1].forEach(function(q){
          var ry = h[0] ? 0 : Math.PI/2;
          var w  = to-0.34;
          var geo=new THREE.BoxGeometry(w, cao-0.9, 0.06);
          geo.rotateY(ry);
          var off = h[0] ? [0, q*(to/2-0.02)] : [q*(to/2-0.02), 0];
          var p=P(t+off[0], off[1]);
          dsTrang.push({g:geo, p:[p[0], 0.34+cao/2, p[1]], ry:goc});
        });
      });
    }
    var y=0.34+cao;
    hop(dsTrang, to+0.10, 0.13, to+0.10, t, y+0.065, 0);      // cổ trụ
    hop(dsTrang, to+0.30, 0.22, to+0.30, t, y+0.24,  0);      // mũ đua
    /* chóp vát cụt: hình nón bốn cạnh, cắt ngọn */
    var chop=new THREE.CylinderGeometry(to*0.24, to*0.52, 0.62, 4);
    chop.rotateY(Math.PI/4);
    khoi(dsTrang, chop, t, y+0.66, 0);
    khoi(dsTrang, new THREE.SphereGeometry(to*0.17, 10, 8), t, y+1.03, 0);
  }

  /* ── cánh cổng sắt: khung, song đứng, hoa văn xoắn trên đỉnh ── */
  function canhCong(tBanLe, rongCanh, caoCanh, chieu){
    var K=[];
    function s(w,h,d, t,y, xoay){
      var geo=new THREE.BoxGeometry(w,h,d);
      if(xoay) geo.rotateZ(xoay);
      K.push({g:geo, t:t, y:y});
    }
    s(rongCanh, 0.15, 0.10, 0, 0.09);                   // đố dưới
    s(rongCanh, 0.13, 0.10, 0, caoCanh*0.66);           // đố giữa
    s(rongCanh, 0.16, 0.10, 0, caoCanh-0.08);           // đố trên
    [-1,1].forEach(function(q){ s(0.13, caoCanh, 0.13, q*rongCanh/2, caoCanh/2); });
    var soSong=Math.max(4, Math.round(rongCanh/0.30));
    for(var i=1;i<soSong;i++)
      s(0.062, caoCanh-0.16, 0.062, -rongCanh/2 + rongCanh*i/soSong, caoCanh/2);
    /* hoa văn: hàng thanh chéo hình chữ V giữa đố giữa và đố trên */
    var hV=caoCanh-0.08-caoCanh*0.66, soV=Math.max(2, Math.round(rongCanh/0.55));
    for(var i=0;i<soV;i++){
      var cx=-rongCanh/2 + rongCanh*(i+0.5)/soV, bw=rongCanh/soV*0.62;
      var ng=Math.atan2(hV*0.72, bw);
      [-1,1].forEach(function(q){
        s(bw/Math.cos(ng), 0.055, 0.055, cx + q*bw/4,
          caoCanh*0.66 + hV*0.5, -q*ng);
      });
    }
    /* xoay cả cánh quanh bản lề, mở hé vào sân */
    var mo = 0.55*chieu;
    var ga = goc - mo;
    var ex=Math.cos(mo), ez=Math.sin(mo);
    K.forEach(function(o){
      var lt = o.t + chieu*rongCanh/2;      // toạ độ so với bản lề
      var tt = tBanLe + lt*ex*chieu;
      var rr = lt*ez*chieu*chieu;
      var p=P(tt, rr);
      dsSat.push({g:o.g, p:[p[0], o.y, p[1]], ry:ga});
    });
  }

  if(!chinh){
    /* cổng phụ: hai trụ, một cánh song đứng mỗi bên */
    var to=0.85, cao=3.0;
    truCong(-W/2, to, cao, false);
    truCong( W/2, to, cao, false);
    var rc=(W-to)/2*0.94;
    canhCong(-W/2+to/2,  rc, cao-0.55,  1);
    canhCong( W/2-to/2,  rc, cao-0.55, -1);
  } else {
    /* ── bố cục cụm cổng chính, tính từ mép trái ── */
    var phan = [
      {loai:'tru',   w:0.85, cao:3.9, o:false},   // trụ đầu
      {loai:'tuong', w:2.10},                     // mảng tường gắn biển
      {loai:'tru',   w:1.05, cao:4.3, o:true },   // trụ lớn trái
      {loai:'xe',    w:4.10},                     // lối xe
      {loai:'tru',   w:1.05, cao:4.3, o:true },   // trụ lớn phải
      {loai:'tru',   w:0.62, cao:3.4, o:false},   // trụ nhỏ
      {loai:'bo',    w:1.20},                     // cổng người đi
      {loai:'tru',   w:0.62, cao:3.4, o:false}    // trụ cuối
    ];
    /* Danh sách trên xếp theo mắt người ĐỨNG NGOÀI PHỐ nhìn vào: biển
       tên bên trái, cổng người đi bên phải, đúng như ảnh chụp.
       Nhưng trục t lại chạy theo g.tiep, mà g.tiep chính là hướng TRÁI
       của người ấy — nên xếp từ t=-W/2 lên là đặt ngược, biển tên chạy
       sang phải. Lật danh sách một nhát là đúng chiều, và vẫn đúng dù
       sau này hướng cổng có bị nắn lại. */
    var trai = [g.phap[1], -g.phap[0]];
    if(hx*trai[0] + hz*trai[1] > 0) phan.reverse();

    var tong=0; phan.forEach(function(q){ tong+=q.w; });
    var he=W/tong; phan.forEach(function(q){ q.w*=he; });

    var t=-W/2;
    phan.forEach(function(q){
      var giua=t+q.w/2;
      if(q.loai==='tru'){
        truCong(giua, q.w, q.cao, q.o && q.w>0.75);
      } else if(q.loai==='tuong'){
        /* tường xây: bệ sẫm, thân vàng, mũ trắng, biển đá đen gắn ngoài */
        hop(dsDa,    q.w+0.10, 0.55, 0.62, giua, 0.275, 0);
        hop(dsVang,  q.w,      2.45, 0.48, giua, 1.775, 0);
        hop(dsTrang, q.w+0.16, 0.16, 0.60, giua, 3.08,  0);
        var wb=Math.min(q.w-0.30, 1.85);
        if(wb>0.6){
          hop(dsChu, wb, 1.05, 0.07, giua, 1.92, -0.30);
          /* mấy vạch trắng thay cho dòng chữ trên biển */
          [0.34, 0.12, -0.16].forEach(function(dy, k){
            hop(dsTrang, wb*(k===0?0.82:(k===1?0.52:0.66)), 0.075, 0.03,
                giua, 1.92+dy, -0.345);
          });
          /* tấm biển nhỏ màu xanh dưới chân tường, như trong ảnh */
          hop(dsSat, 0.46, 0.34, 0.05, giua+q.w*0.30, 0.92, -0.28);
        }
      } else if(q.loai==='xe' || q.loai==='bo'){
        var caoC = q.loai==='xe' ? 3.3 : 2.7;
        if(q.loai==='xe'){
          var rc=q.w/2*0.95;
          canhCong(t+0.04,      rc, caoC,  1);
          canhCong(t+q.w-0.04,  rc, caoC, -1);
        } else {
          canhCong(t+0.03, q.w*0.94, caoC, 1);
        }
        /* ngưỡng cổng lát đá */
        hop(dsDa, q.w+0.2, 0.10, 1.10, giua, 0.05, 0);
      }
      t += q.w;
    });
  }

  [[dsVang, M.truTuong],[dsTrang, 0xF4F0E4],[dsSat, 0x203A30],
   [dsDa, 0x6B6558],[dsChu, 0x14120E]].forEach(function(x){
    if(!x[0].length) return;
    var m=new THREE.Mesh(gop(x[0]), new THREE.MeshLambertMaterial({color:x[1]}));
    m.castShadow=true; m.receiveShadow=true; G.add(m);
  });

  scene.add(G);
  nutCong.push({d:g, tam:new THREE.Vector3(g.x, (chinh?6.2:4.4), g.z)});
});

/* ── đường: gờ viền sẫm dưới, mặt đường trắng trên ─────────────────── */
var lopDuong = new THREE.Group(); scene.add(lopDuong);
/* Dia tron dat tai moi dinh duong. Du lieu OSM chia duong thanh nhieu
   doan roi rac, hai doan ke nhau khong khop mep nen sinh khe ho -> nhin
   ra "duong dut net". Dat mot dia ban kinh = nua be rong tai moi dinh
   se vá kín mọi khe, kể cả chỗ hai way khác nhau gặp nhau. */
function diaTron(x, z, bk, y){
  /* Số cạnh chia theo BÁN KÍNH, đừng cào bằng mười cạnh cho mọi cỡ đĩa.
     Đường Thanh Niên rộng mười lăm mét: đĩa vá bán kính bảy mét rưỡi mà
     chỉ mười cạnh thì mỗi cạnh dài gần năm mét — ngã tư nào cũng hoá ra
     một hình mười cạnh nhìn thấy rõ mồn một. Lối đi bộ rộng một mét thì
     ngược lại, mười cạnh là quá thừa. */
  var v=[], nr=[], seg=Math.max(8, Math.min(28, Math.round(bk*5)));
  for(var i=0;i<seg;i++){
    var a1=Math.PI*2*i/seg, a2=Math.PI*2*(i+1)/seg;
    v.push(x, y, z);                       nr.push(0,1,0);
    v.push(x+Math.cos(a1)*bk, y, z+Math.sin(a1)*bk); nr.push(0,1,0);
    v.push(x+Math.cos(a2)*bk, y, z+Math.sin(a2)*bk); nr.push(0,1,0);
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nr,3));
  return g;
}
function themDuong(mau, y, congThem){
  var geos = [];
  D.duong.forEach(function(r){
    if(r.diem.length < 2) return;
    geos.push(daiDuong(r.diem, r.rong + congThem, y));
    var bk = (r.rong + congThem)/2;
    r.diem.forEach(function(p){ geos.push(diaTron(p[0], p[1], bk, y)); });
  });
  var pos = [], nor = [];
  geos.forEach(function(g){
    var p = g.attributes.position.array, n = g.attributes.normal.array;
    for(var i=0;i<p.length;i++) pos.push(p[i]);
    for(var i=0;i<n.length;i++) nor.push(n[i]);
  });
  var G = new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  G.setAttribute('normal', new THREE.Float32BufferAttribute(nor,3));
  var m = new THREE.Mesh(G, new THREE.MeshLambertMaterial({color:mau}));
  m.receiveShadow = true; lopDuong.add(m); return m;
}
themDuong(M.vienDuong, 0.14, 2.2);   // gờ viền
themDuong(M.duong,     0.26, 0);     // mặt đường

/* ══ SÂN THỂ THAO ══════════════════════════════════════════════════
   OSM chỉ tô màu khu này, không xuất được dữ liệu, nên vạch sân vẽ tay.
   Ba khối chữ nhật phía tây nằm sát nhau: trước đây mỗi khối viền trắng
   một vòng nên đọc ra "ba cái hộp", chứ không ra sân bóng. Nay gộp cả ba
   thành MỘT sân bóng đá, kẻ đủ bộ vạch theo tỉ lệ FIFA thu nhỏ vừa khổ
   sân: biên dọc, biên ngang, đường giữa, vòng tròn giữa, khu 16m50,
   khu 5m50, chấm phạt đền, cung phạt đền, cung phạt góc — thêm khung
   thành và cờ góc dựng nổi để nhìn nghiêng vẫn ra sân bóng.
   Khối thứ tư tách rời nên kẻ thành sân bóng rổ.
   ══════════════════════════════════════════════════════════════════ */
var lopSan = new THREE.Group(); scene.add(lopSan);
(function dungSan(){
  var VACH   = M.vienSan;
  var CO     = M.sanBong;
  var CO_SAM = 0x6FB78C;   // dải cỏ xén sẫm, xen kẽ cho mặt sân đỡ phẳng lì
  var SAN_RO = 0xC08457;   // mặt sân bóng rổ, màu bê tông nhuộm
  var TRANG  = 0xF7F7F2;   // khung thành
  var Y_NEN = 0.40, Y_SOC = 0.45, Y_VACH = 0.56, R_VACH = 0.30;

  function nen(x0,x1,z0,z1,mau,y){
    var m = phang([[x0,z0],[x1,z0],[x1,z1],[x0,z1]], mau, y);
    scene.remove(m); lopSan.add(m); return m;
  }
  function vach(pts, rong, mau){
    lopSan.add(new THREE.Mesh(daiDuong(pts, rong||R_VACH, Y_VACH),
      new THREE.MeshBasicMaterial({color:mau||VACH})));
  }
  function cham(cx,cz,bk){
    lopSan.add(new THREE.Mesh(diaTron(cx,cz,bk||0.30,Y_VACH),
      new THREE.MeshBasicMaterial({color:VACH})));
  }
  function hop(x,y,z, dx,dy,dz, mau){
    var m=new THREE.Mesh(new THREE.BoxGeometry(dx,dy,dz),
      new THREE.MeshLambertMaterial({color:mau}));
    m.position.set(x,y,z); m.castShadow=true; lopSan.add(m); return m;
  }

  /* ── gom các khối chữ nhật nằm liền nhau thành một sân ── */
  var o = D.sanBong.map(function(sb){
    var xs=sb.diem.map(function(p){return p[0];}),
        zs=sb.diem.map(function(p){return p[1];});
    return {x0:Math.min.apply(null,xs), x1:Math.max.apply(null,xs),
            z0:Math.min.apply(null,zs), z1:Math.max.apply(null,zs), sb:sb, n:-1};
  });
  var dem=0;
  o.forEach(function(a){ if(a.n<0) a.n=dem++; });
  for(var lan=0; lan<o.length; lan++){
    o.forEach(function(a){
      o.forEach(function(b){
        if(a===b || a.n===b.n) return;
        var kx = Math.min(a.x1,b.x1) - Math.max(a.x0,b.x0);
        var kz = Math.min(a.z1,b.z1) - Math.max(a.z0,b.z0);
        if(!((kx > 2 && kz > -1.8) || (kz > 2 && kx > -1.8))) return;
        var cu = Math.max(a.n, b.n), moi = Math.min(a.n, b.n);
        o.forEach(function(c){ if(c.n===cu) c.n=moi; });
      });
    });
  }
  var bang = {};
  o.forEach(function(a){ (bang[a.n] = bang[a.n] || []).push(a); });
  var ds = Object.keys(bang).map(function(k){ return bang[k]; });
  ds.sort(function(a,b){ return b.length - a.length; });
  if(!ds.length) return;

  /* ── mặt sân: giữ nguyên từng khối như dữ liệu gốc ── */
  ds.forEach(function(gr, gi){
    gr.forEach(function(a){
      nen(a.x0, a.x1, a.z0, a.z1, gi===0 ? CO : SAN_RO, Y_NEN);
    });
  });

  function baoNhom(gr){
    var b={x0:1e9,x1:-1e9,z0:1e9,z1:-1e9};
    gr.forEach(function(a){
      b.x0=Math.min(b.x0,a.x0); b.x1=Math.max(b.x1,a.x1);
      b.z0=Math.min(b.z0,a.z0); b.z1=Math.max(b.z1,a.z1);
    });
    return b;
  }

  /* ══ 1. SÂN BÓNG ĐÁ ═════════════════════════════════════════════
     Kẻ trong hệ toạ độ (u dọc sân, v ngang sân) rồi mới đổi về (x,z),
     nhờ vậy công thức không phải viết hai lần cho hai chiều đặt sân. */
  (function sanBongDa(){
    var b = baoNhom(ds[0]);
    var doc = (b.z1-b.z0) >= (b.x1-b.x0);
    var u0 = doc ? b.z0 : b.x0, u1 = doc ? b.z1 : b.x1;
    var v0 = doc ? b.x0 : b.z0, v1 = doc ? b.x1 : b.z1;
    var LE = 1.6;                              // lề chạy đà quanh sân
    u0 += LE; u1 -= LE; v0 += LE; v1 -= LE;
    var L = u1-u0, W = v1-v0;
    if(L < 24 || W < 16) return;
    var uc = (u0+u1)/2, vc = (v0+v1)/2;
    var k = W/68;                              // thu nhỏ theo bề ngang sân

    function P(u,v){ return doc ? [v,u] : [u,v]; }
    function duong(list, rong){
      vach(list.map(function(q){ return P(q[0],q[1]); }), rong);
    }
    function cungUV(cu,cv,bk,a0,a1,rong){
      var p=[], seg=Math.max(6, Math.round(Math.abs(a1-a0)/0.18));
      for(var i=0;i<=seg;i++){
        var a=a0+(a1-a0)*i/seg;
        p.push(P(cu+Math.cos(a)*bk, cv+Math.sin(a)*bk));
      }
      vach(p, rong);
    }
    function chamUV(cu,cv,bk){ var q=P(cu,cv); cham(q[0],q[1],bk); }

    /* dải cỏ xén xen kẽ, cắt ngang sân */
    var soSoc = 10, buoc = (u1-u0)/soSoc;
    for(var i=0;i<soSoc;i+=2){
      var a=u0+buoc*i, c=Math.min(u1, a+buoc);
      var q1=P(a,v0), q2=P(c,v1);
      nen(Math.min(q1[0],q2[0]), Math.max(q1[0],q2[0]),
          Math.min(q1[1],q2[1]), Math.max(q1[1],q2[1]), CO_SAM, Y_SOC);
    }

    duong([[u0,v0],[u1,v0],[u1,v1],[u0,v1],[u0,v0]]);   // biên sân
    duong([[uc,v0],[uc,v1]]);                            // đường giữa
    cungUV(uc, vc, 9.15*k, 0, Math.PI*2);                // vòng tròn giữa
    chamUV(uc, vc, 0.34);

    var sauP = 16.5*k, rongP = 40.32*k;
    var sauG = 5.5*k,  rongG = 18.32*k;
    var chamP = 11*k,  bkVong = 9.15*k;
    var rongKT = 7.32*k, caoKT = 2.44*k;

    [[u0, 1], [u1, -1]].forEach(function(e){
      var ub = e[0], s = e[1];
      duong([[ub, vc-rongP/2],[ub+s*sauP, vc-rongP/2],
             [ub+s*sauP, vc+rongP/2],[ub, vc+rongP/2]]);
      duong([[ub, vc-rongG/2],[ub+s*sauG, vc-rongG/2],
             [ub+s*sauG, vc+rongG/2],[ub, vc+rongG/2]]);
      chamUV(ub+s*chamP, vc, 0.32);
      /* cung phạt đền: chỉ phần vòng tròn nhô ra NGOÀI khu 16m50 */
      var xa = sauP - chamP;
      if(xa < bkVong){
        var gc = Math.acos(xa/bkVong);
        var g0 = s>0 ? -gc : Math.PI-gc;
        var g1 = s>0 ?  gc : Math.PI+gc;
        cungUV(ub+s*chamP, vc, bkVong, g0, g1);
      }
      /* bốn cung phạt góc */
      [[v0,1],[v1,-1]].forEach(function(f){
        var vb=f[0], sv=f[1];
        var a0 = s>0 ? 0 : Math.PI;
        var a1 = a0 + (s*sv>0 ? Math.PI/2 : -Math.PI/2);
        cungUV(ub, vb, 1.2, a0, a1, 0.24);
      });

      /* khung thành: hai cột, xà ngang, khối lưới mờ xiên ra sau */
      [-1,1].forEach(function(sg){
        var q = P(ub, vc + sg*rongKT/2);
        hop(q[0], caoKT/2, q[1], 0.17, caoKT, 0.17, TRANG);
      });
      var qc = P(ub, vc);
      hop(qc[0], caoKT+0.08, qc[1],
          doc ? rongKT+0.17 : 0.17, 0.17, doc ? 0.17 : rongKT+0.17, TRANG);
      var sau = 1.8, qs = P(ub - s*sau*0.5, vc);
      var luoi = new THREE.Mesh(
        new THREE.BoxGeometry(doc ? rongKT : sau, caoKT*0.9, doc ? sau : rongKT),
        new THREE.MeshLambertMaterial({color:TRANG, transparent:true,
          opacity:0.30, side:THREE.DoubleSide}));
      luoi.position.set(qs[0], caoKT*0.45, qs[1]);
      lopSan.add(luoi);
    });

    /* bốn cờ góc */
    [[u0,v0],[u0,v1],[u1,v0],[u1,v1]].forEach(function(q){
      var p=P(q[0],q[1]);
      hop(p[0], 0.75, p[1], 0.09, 1.5, 0.09, 0xF2EEE0);
      hop(p[0]+0.24, 1.30, p[1], 0.46, 0.30, 0.05, 0xC0392B);
    });
  })();

  /* ══ 2. SÂN BÓNG RỔ trên các khối tách rời ═══════════════════ */
  for(var gi=1; gi<ds.length; gi++){
    (function(gr){
      var b = baoNhom(gr);
      var doc = (b.z1-b.z0) >= (b.x1-b.x0);
      var u0 = doc ? b.z0 : b.x0, u1 = doc ? b.z1 : b.x1;
      var v0 = doc ? b.x0 : b.z0, v1 = doc ? b.x1 : b.z1;
      var L = Math.min(28, (u1-u0) - 2.6), W = Math.min(15, (v1-v0) - 1.6);
      if(L < 14 || W < 8) return;
      var uc=(u0+u1)/2, vc=(v0+v1)/2;
      u0 = uc-L/2; u1 = uc+L/2; v0 = vc-W/2; v1 = vc+W/2;
      var k2 = W/15;

      function P(u,v){ return doc ? [v,u] : [u,v]; }
      function duong(list){
        vach(list.map(function(q){ return P(q[0],q[1]); }), 0.22);
      }
      function cungUV(cu,cv,bk,a0,a1){
        var p=[], seg=Math.max(6, Math.round(Math.abs(a1-a0)/0.18));
        for(var i=0;i<=seg;i++){
          var a=a0+(a1-a0)*i/seg;
          p.push(P(cu+Math.cos(a)*bk, cv+Math.sin(a)*bk));
        }
        vach(p, 0.22);
      }

      duong([[u0,v0],[u1,v0],[u1,v1],[u0,v1],[u0,v0]]);
      duong([[uc,v0],[uc,v1]]);
      cungUV(uc, vc, 1.8*k2, 0, Math.PI*2);

      [[u0,1],[u1,-1]].forEach(function(e){
        var ub=e[0], s=e[1];
        var sauL=5.8*k2, rongL=4.9*k2, ro=1.575*k2, bk3=6.4*k2;
        duong([[ub, vc-rongL/2],[ub+s*sauL, vc-rongL/2],
               [ub+s*sauL, vc+rongL/2],[ub, vc+rongL/2]]);
        cungUV(ub+s*sauL, vc, 1.8*k2, 0, Math.PI*2);
        cungUV(ub + s*ro, vc, bk3,
               s>0 ? -Math.PI/2 : Math.PI/2,
               s>0 ?  Math.PI/2 : Math.PI*1.5);
        /* trụ, bảng rổ, vành rổ */
        var qt=P(ub - s*0.9, vc), qb=P(ub + s*0.30, vc), qr=P(ub + s*0.72, vc);
        hop(qt[0], 1.55, qt[1], 0.22, 3.1, 0.22, 0x5C6660);
        hop(qb[0], 2.95, qb[1], doc?1.8:0.10, 1.05, doc?0.10:1.8, 0xF2F2EC);
        hop(qr[0], 2.62, qr[1], doc?0.9:0.08, 0.07, doc?0.08:0.9, 0xD9622B);
      });
    })(ds[gi]);
  }
})();

/* ── nhà NGOÀI trường: thêm mái và cửa sổ cho đỡ thô ───────────────
   Nhà TRONG trường vẫn để khối trơn, sẽ dựng riêng ở bước sau. */
function khoiNha(ds, mauTuong, mauMai, caoThem){
  var posT=[], norT=[], posM=[], norM=[];
  ds.forEach(function(b){
    var cao = b.cao + (caoThem||0);
    var g = new THREE.ExtrudeGeometry(shape(b.matBang), {depth:cao, bevelEnabled:false});
    g.rotateX(-Math.PI/2);
    var p=g.attributes.position.array, n=g.attributes.normal.array;
    for(var i=0;i<p.length;i++) posT.push(p[i]);
    for(var i=0;i<n.length;i++) norT.push(n[i]);
    // nắp mái hơi loe, tạo đường viền tối ở đỉnh
    var gm = new THREE.ExtrudeGeometry(shape(b.matBang), {depth:0.5, bevelEnabled:false});
    gm.rotateX(-Math.PI/2); gm.translate(0, cao, 0);
    var pm=gm.attributes.position.array, nm=gm.attributes.normal.array;
    for(var i=0;i<pm.length;i++) posM.push(pm[i]);
    for(var i=0;i<nm.length;i++) norM.push(nm[i]);
  });
  function lam(pos,nor,mau){
    var G=new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    G.setAttribute('normal', new THREE.Float32BufferAttribute(nor,3));
    var m=new THREE.Mesh(G, new THREE.MeshLambertMaterial({color:mau}));
    m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
  }
  return [lam(posT,norT,mauTuong), lam(posM,norM,mauMai)];
}
/* cửa sổ: rải đều theo bước cột trên từng mặt tường */
function cuaSoGeo(mb, tang, caoTang, y0goc){
  var v=[], nv=[], ph=offset(mb,-1);
  for(var f=0; f<tang; f++){
    var y0 = y0goc + f*caoTang + 1.15, cao = Math.min(1.9, caoTang-1.9);
    for(var i=0;i<mb.length;i++){
      var a=mb[i], b=mb[(i+1)%mb.length];
      var mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2;
      var pa=ph[i], pb=ph[(i+1)%ph.length];
      var nx=(pa[0]+pb[0])/2-mx, nz=(pa[1]+pb[1])/2-mz;
      var nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl;
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
      var so=Math.floor((L-1.4)/3.0); if(so<1) continue;
      var st=L/so, rw=1.25;
      for(var k=0;k<so;k++){
        var t=st*(k+0.5);
        var cx=a[0]+dx*t+nx*0.10, cz=a[1]+dz*t+nz*0.10;
        var hx=dx*rw/2, hz=dz*rw/2;
        function P(sx,sz,yy){ v.push(cx+sx,yy,cz+sz); nv.push(nx,0,nz); }
        P(-hx,-hz,y0); P(hx,hz,y0); P(hx,hz,y0+cao);
        P(-hx,-hz,y0); P(hx,hz,y0+cao); P(-hx,-hz,y0+cao);
      }
    }
  }
  if(!v.length) return null;
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nv,3));
  return g;
}

function dungNhaNgoai(ds){
  var gTuong=[], gMai=[], gCua=[], gHat=[];
  ds.forEach(function(b){
    var mb=b.matBang, cao=b.cao;
    var g=new THREE.ExtrudeGeometry(shape(mb),{depth:cao,bevelEnabled:false});
    g.rotateX(-Math.PI/2); gTuong.push({g:g,p:[0,0,0]});

    var caoTang=3.4, tang=Math.max(1, Math.round(cao/caoTang));
    var gc=cuaSoGeo(mb, tang, caoTang, 0.9);
    if(gc) gCua.push({g:gc,p:[0,0,0]});

    if(cao <= 13){
      /* nhà thấp: mái dốc có hắt mái */
      var duoi=offset(mb,-0.9);
      var ins=Math.max(0.9, canhNho(duoi)*0.42);
      var caoMai=Math.min(4.2, canhNho(duoi)*0.34+1.2);
      gMai.push({g:maiGeo(duoi, offset(duoi,ins), cao, cao+caoMai), p:[0,0,0]});
      var gh=new THREE.ExtrudeGeometry(shape(duoi),{depth:0.34,bevelEnabled:false});
      gh.rotateX(-Math.PI/2); gh.translate(0,cao,0); gHat.push({g:gh,p:[0,0,0]});
    } else {
      /* nhà cao: mái bằng có gờ chắn mái */
      var d1=offset(mb,-0.35);
      gMai.push({g:maiGeo(d1, offset(mb,0.1), cao, cao+0.9), p:[0,0,0]});
    }
  });
  var vatLieu=[];
  function lam(list, mau, bong){
    if(!list.length) return;
    var vl=new THREE.MeshLambertMaterial({color:mau});
    var m=new THREE.Mesh(gop(list), vl);
    m.castShadow=!!bong; m.receiveShadow=true; scene.add(m);
    vatLieu.push(vl);
  }
  lam(gTuong, M.nhaQuanh, true);
  lam(gHat,   M.hatMai,   true);
  lam(gMai,   M.maiQuanh, true);
  if(gCua.length){
    var vlc=new THREE.MeshLambertMaterial({color:M.cuaSo, side:THREE.DoubleSide});
    scene.add(new THREE.Mesh(gop(gCua), vlc));
    vatLieu.push(vlc);
  }
  return vatLieu;
}
/* nhà ngoài chia theo giai đoạn xuất hiện, để giai đoạn đầu phố xá thưa */
var lopNhaNgoai = {};
[1,4,5,6].forEach(function(g){
  var ds = D.nhaQuanh.filter(function(b){ return (b.tuGD||1) === g; });
  if(!ds.length) return;
  var truoc = scene.children.length;
  var vl = dungNhaNgoai(ds);
  var G = new THREE.Group();
  scene.children.slice(truoc).forEach(function(o){ G.add(o); });
  scene.add(G);
  /* gốc phép co đặt ở mặt đất để nhà mọc lên từ nền, không phải phình từ giữa */
  G.scale.y = 0.0001; G.visible = false;
  lopNhaNgoai[g] = {G:G, mats:vl, p:0, tuGD:g};
});

/* ── nhà Chu Văn An: dựng đầy đủ như bản mẫu ───────────────────────
   Bệ móng, tường, cửa sổ theo bước cột (có vòm và hành lang tầng trệt),
   đai phào ngăn tầng, mái theo kiểu khai báo, diềm hắt mái.
   Mỗi toà là một Group riêng để bấm chọn và để hiện/ẩn theo giai đoạn. */

function matTienCVA(b){
  var mt=b.matTien||{}, v=[], nv=[], ph=offset(b.matBang,-1);
  var buoc=mt.buocCot||3.4, rw=mt.rongCua||1.4, rh=mt.caoCua||2.2;
  function o(cx,cz,dx,dz,nx,nz,w,y0,y1,vom){
    var hx=dx*w/2, hz=dz*w/2;
    function P(sx,sz,y){ v.push(cx+sx,y,cz+sz); nv.push(nx,0,nz); }
    P(-hx,-hz,y0); P(hx,hz,y0); P(hx,hz,y1);
    P(-hx,-hz,y0); P(hx,hz,y1); P(-hx,-hz,y1);
    if(vom){
      var seg=7, r=w/2;
      for(var i=0;i<seg;i++){
        var a1=Math.PI*i/seg, a2=Math.PI*(i+1)/seg;
        var c1=Math.cos(a1)*r, s1=Math.sin(a1)*r;
        var c2=Math.cos(a2)*r, s2=Math.sin(a2)*r;
        P(0,0,y1); P(dx*c1,dz*c1,y1+s1); P(dx*c2,dz*c2,y1+s2);
      }
    }
  }
  for(var f=0; f<b.tang; f++){
    var treo=(f===0 && mt.hienLang)?0.9:1.15;
    var y0=f*b.caoTang+treo;
    var cao=(f===0 && mt.hienLang)?Math.min(b.caoTang-1.9, rh+1.1):rh;
    for(var i=0;i<b.matBang.length;i++){
      var a=b.matBang[i], bb=b.matBang[(i+1)%b.matBang.length];
      var mx=(a[0]+bb[0])/2, mz=(a[1]+bb[1])/2;
      var pa=ph[i], pb=ph[(i+1)%ph.length];
      var nx=(pa[0]+pb[0])/2-mx, nz=(pa[1]+pb[1])/2-mz;
      var nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl;
      var dx=bb[0]-a[0], dz=bb[1]-a[1], L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
      var so=Math.floor((L-1.6)/buoc); if(so<1) continue;
      var st=L/so;
      for(var k=0;k<so;k++){
        var t=st*(k+0.5);
        o(a[0]+dx*t+nx*0.09, a[1]+dz*t+nz*0.09, dx,dz, nx,nz, rw, y0, y0+cao,
          mt.vom && !(f===0 && mt.hienLang));
      }
    }
  }
  if(!v.length) return null;
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nv,3));
  return g;
}

/* ── HÀNH LANG CÓ CỘT: dựng thử cho nhà C ─────────────────────────
   Nét đặc trưng nhất của Trường Bưởi trong ảnh Naams gửi: một dãy cột
   vuông đỡ mái hiên chạy suốt mặt tiền, có thanh chống chéo bằng gỗ ở
   đỉnh mỗi cột, và cửa chớp hai cánh màu xanh giữa các cột.
   Đây là hình học thật, không phải ảnh dán. */
/* Hành lang VÒM tầng trệt — nét của nhà E, S, A, B trong ảnh: dãy cột
   vuông đỡ chuỗi vòm cuốn, phía trên là sàn tầng hai có lan can. */
function hienVom(b){
  var mb=b.matBang, ph=offset(mb,-1);
  var canhDai=0, dmax=0;
  for(var i=0;i<mb.length;i++){
    var a=mb[i], c=mb[(i+1)%mb.length];
    var L=Math.hypot(c[0]-a[0], c[1]-a[1]);
    if(L>dmax){ dmax=L; canhDai=i; }
  }
  var i=canhDai, a=mb[i], c=mb[(i+1)%mb.length];
  var mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2;
  var pa=ph[i], pb=ph[(i+1)%ph.length];
  var nx=(pa[0]+pb[0])/2-mx, nz=(pa[1]+pb[1])/2-mz;
  var nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl;
  var dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  var goc=Math.atan2(-dz,dx);
  var vuon=2.4, caoCot=b.caoTang-0.5, toCot=0.55;
  var so=Math.max(3, Math.round(L/(b.matTien.buocCot||3.5)));
  var st=L/so;

  var cot=[], vom=[], san=[];
  for(var k=0;k<=so;k++){
    var t=Math.min(L-toCot/2, Math.max(toCot/2, st*k));
    var px=a[0]+dx*t+nx*vuon, pz=a[1]+dz*t+nz*vuon;
    cot.push({g:new THREE.BoxGeometry(toCot,caoCot,toCot), p:[px,caoCot/2,pz], ry:goc});
  }
  /* chuỗi vòm cuốn giữa các cột */
  var v=[], nr=[];
  function d3(x,y,z){ v.push(x,y,z); nr.push(nx,0,nz); }
  for(var k=0;k<so;k++){
    var t0=st*k+toCot/2, t1=st*(k+1)-toCot/2;
    var w=(t1-t0), r=w/2, yc=caoCot-r-0.25;
    var seg=8;
    for(var q=0;q<seg;q++){
      var a1=Math.PI*q/seg, a2=Math.PI*(q+1)/seg;
      var t_1=t0+r-Math.cos(a1)*r, y1=yc+Math.sin(a1)*r;
      var t_2=t0+r-Math.cos(a2)*r, y2=yc+Math.sin(a2)*r;
      var x1=a[0]+dx*t_1+nx*vuon, z1=a[1]+dz*t_1+nz*vuon;
      var x2=a[0]+dx*t_2+nx*vuon, z2=a[1]+dz*t_2+nz*vuon;
      d3(x1,y1,z1); d3(x2,y2,z2); d3(x2,caoCot+0.35,z2);
      d3(x1,y1,z1); d3(x2,caoCot+0.35,z2); d3(x1,caoCot+0.35,z1);
    }
  }
  var gv=new THREE.BufferGeometry();
  gv.setAttribute('position', new THREE.Float32BufferAttribute(v,3));
  gv.setAttribute('normal', new THREE.Float32BufferAttribute(nr,3));

  san.push({g:new THREE.BoxGeometry(L,0.25,vuon),
            p:[mx+nx*vuon/2, 0.12, mz+nz*vuon/2], ry:goc});
  san.push({g:new THREE.BoxGeometry(L+0.4,0.42,vuon+0.3),
            p:[mx+nx*vuon/2, caoCot+0.55, mz+nz*vuon/2], ry:goc});
  san.push({g:new THREE.BoxGeometry(L+0.4,0.75,0.22),
            p:[mx+nx*(vuon+0.15), caoCot+1.13, mz+nz*(vuon+0.15)], ry:goc});
  return {cot:cot, vom:gv, san:san};
}

function hanhLang(b, pc){
  var ds=[], mb=b.matBang, ph=offset(mb,-1);
  var caoCot=b.caoTang-0.35, buoc=b.matTien.buocCot||3.4;
  var canhDai=null, dmax=0;
  for(var i=0;i<mb.length;i++){
    var a=mb[i], c=mb[(i+1)%mb.length];
    var L=Math.hypot(c[0]-a[0], c[1]-a[1]);
    if(L>dmax){ dmax=L; canhDai=i; }
  }
  /* chỉ làm hiên trên cạnh dài nhất, tức mặt tiền chính */
  var i=canhDai, a=mb[i], c=mb[(i+1)%mb.length];
  var mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2;
  var pa=ph[i], pb=ph[(i+1)%ph.length];
  var nx=(pa[0]+pb[0])/2-mx, nz=(pa[1]+pb[1])/2-mz;
  var nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl;
  var dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  var vuon=2.1, so=Math.max(2, Math.floor((L-1.2)/buoc));
  var st=L/so, goc=Math.atan2(-dz,dx);

  var cot=[], chong=[], san=[];
  for(var k=0;k<=so;k++){
    var t=Math.min(L-0.4, Math.max(0.4, st*k));
    var px=a[0]+dx*t+nx*vuon, pz=a[1]+dz*t+nz*vuon;
    var g=new THREE.BoxGeometry(0.34,caoCot,0.34);
    cot.push({g:g, p:[px, caoCot/2, pz], ry:goc});
    /* thanh chống chéo nối đầu cột vào tường */
    var gc=new THREE.BoxGeometry(0.16,0.16,vuon*1.05);
    chong.push({g:gc, p:[px-nx*vuon*0.5, caoCot-0.30, pz-nz*vuon*0.5], ry:goc});
  }
  /* sàn hiên và mái hiên */
  var sanG=new THREE.BoxGeometry(L, 0.22, vuon);
  san.push({g:sanG, p:[mx+nx*vuon/2, 0.11, mz+nz*vuon/2], ry:goc});
  var maiG=new THREE.BoxGeometry(L+0.5, 0.20, vuon+0.55);
  san.push({g:maiG, p:[mx+nx*(vuon+0.2)/2, caoCot+0.10, mz+nz*(vuon+0.2)/2], ry:goc});
  return {cot:cot, chong:chong, san:san, canh:i, huong:[dx,dz], phap:[nx,nz]};
}

/* ══ MẶT TIỀN CHI TIẾT ══════════════════════════════════════════════
   Mặt tường cũ phẳng tuyệt đối: ô cửa chỉ là mảng màu dán lên, không lõm,
   không gờ. Ánh sáng chiếu vào không sinh ra bóng nào nên mắt đọc ra
   "khối có hoa văn" chứ không phải nhà. Ba việc dưới đây đều nhằm TẠO BÓNG.
     1. Ô cửa LÕM vào tường, có khung phào trắng, bệ cửa, lanh tô cuốn vòm,
        hai cánh chớp xanh mở hé ra hai bên.
     2. Trụ lồi chia gian + dải phào ngang ở mỗi cao độ sàn và dưới chân mái.
     3. Đầu xà gỗ nhô ra dưới diềm mái, theo đúng nhịp cột.
   Trả về các hình học đã gộp, tách theo vật liệu.                      */
/* ══ HIÊN CỘT LỚN — HỘI TRƯỜNG THĂNG LONG ══════════════════════════
   Toà này không cùng lối với mấy dãy nhà Pháp, nên đắp phào cuốn vòm
   như các dãy kia là sai hẳn. Ảnh chụp cho thấy một hàng cột tròn mảnh
   cao suốt hai tầng, đội một tấm mái bằng phẳng lì; tầng dưới lùi vào
   sau hàng cột là mấy bộ cửa xanh, trên mỗi bộ có một vì kèo hình tam
   giác; tầng trên là mảng hoa gió bê tông đúc rỗng chạy kín các gian,
   giữa mặt tiền gắn tấm phù hiệu trường. Hai đầu hồi là trụ đặc bản to,
   mặt trụ có ô chạm.
   Dựng riêng cho cạnh dài nhất — cạnh quay ra sân — còn ba cạnh kia vẫn
   để bộ mặt tiền chung xử lí.

   Riêng mảng hoa gió ngốn hơn trăm khối con. Để rời thì một mình toà
   này thêm gần 170 lệnh vẽ, nên gom hết theo vật liệu bằng gop() —
   xuống còn năm. Hộp nào cần nghiêng thì xoay sẵn vào hình học trước
   khi gom, vì gop() chỉ nhận phép xoay quanh trục đứng.               */
function canhDaiNhat(mb){
  var iBest=0, dBest=-1;
  for(var i=0;i<mb.length;i++){
    var a=mb[i], c=mb[(i+1)%mb.length];
    var L=Math.hypot(c[0]-a[0], c[1]-a[1]);
    if(L>dBest){ dBest=L; iBest=i; }
  }
  return iBest;
}
function hoiTruong(b, G, mats, pc){
  var mb=b.matBang, i=(b.canhTruoc===undefined?canhDaiNhat(mb):b.canhTruoc);
  var a=mb[i], c=mb[(i+1)%mb.length];
  var ph=offset(mb,-1), pa=ph[i], pb=ph[(i+1)%ph.length];
  var mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2;
  var nx=(pa[0]+pb[0])/2-mx, nz=(pa[1]+pb[1])/2-mz;
  var nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl;                 // ra ngoài
  var dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
  var goc=Math.atan2(-dz,dx);
  var cao=b.tang*b.caoTang;

  var SAU=3.0;              // độ vươn của hiên
  var CAO_SAN=0.55;         // cốt sàn hiên
  var soGian=Math.max(4, Math.round(L/4.4));
  var buoc=L/soGian;

  var dsVoi=[], dsSan=[], dsCua=[], dsHoa=[], dsPhu=[];
  function P(t, ra){ return [a[0]+dx*t+nx*ra, a[1]+dz*t+nz*ra]; }
  /* hộp áp mặt tường: w dọc cạnh, h đứng, d xuyên tường */
  function hop(ds, w,h,d, t,y,ra, nghieng){
    var g=new THREE.BoxGeometry(w,h,d);
    if(nghieng) g.rotateZ(nghieng);
    var p=P(t,ra);
    ds.push({g:g, p:[p[0], y, p[1]], ry:goc});
  }
  function tru(ds, g, t, y, ra){
    var p=P(t,ra); ds.push({g:g, p:[p[0], y, p[1]], ry:goc});
  }

  /* ── sàn hiên và bậc thềm ── */
  hop(dsSan, L+1.2, CAO_SAN, SAU+0.9, L/2, CAO_SAN/2, SAU/2-0.2);
  for(var s=0;s<3;s++)
    hop(dsSan, L+0.4-s*0.5, 0.17, 0.46, L/2, CAO_SAN-0.085-s*0.17, SAU+0.30+s*0.46);

  /* ── hàng cột tròn, mảnh, cao suốt hai tầng ── */
  var gCot=new THREE.CylinderGeometry(0.29,0.34,cao-CAO_SAN,14);
  var gMuCot=new THREE.CylinderGeometry(0.42,0.30,0.30,14);
  for(var k=0;k<=soGian;k++){
    var t=Math.min(L-0.35, Math.max(0.35, buoc*k));
    tru(dsVoi, gCot,   t, CAO_SAN+(cao-CAO_SAN)/2, SAU-0.35);
    tru(dsVoi, gMuCot, t, cao-0.15,                SAU-0.35);
  }

  /* ── hai trụ đặc ở hai đầu hồi, mặt trụ có ô chạm ── */
  [0.55, L-0.55].forEach(function(t){
    hop(dsVoi, 1.10, cao-CAO_SAN, 1.10, t, CAO_SAN+(cao-CAO_SAN)/2, SAU-0.35);
    [0.32, 0.62].forEach(function(f){
      hop(dsHoa, 0.66, (cao-CAO_SAN)*0.20, 0.06, t, CAO_SAN+(cao-CAO_SAN)*f, SAU+0.22);
    });
  });

  /* ── mái bằng: tấm dày đội trên hàng cột, đua ra bốn phía ── */
  hop(dsVoi, L+1.9, 0.52, SAU+1.1, L/2, cao+0.26, SAU/2-0.15);
  hop(dsSan, L+2.1, 0.16, SAU+1.3, L/2, cao+0.60, SAU/2-0.15);

  /* ── tầng dưới: cửa xanh, trên mỗi bộ một vì kèo tam giác ── */
  var yCua=CAO_SAN+0.05, caoCua=Math.min(3.6, b.caoTang-1.5);
  var rongCua=Math.min(2.6, buoc*0.62);
  var nghieng=Math.atan2(0.62, rongCua/2);
  for(var k=0;k<soGian;k++){
    var t=buoc*(k+0.5);
    hop(dsCua, rongCua, caoCua, 0.16, t, yCua+caoCua/2, 0.10);
    hop(dsVoi, rongCua, 0.10, 0.20, t, yCua+caoCua*0.72, 0.12);
    hop(dsVoi, 0.11, caoCua, 0.20, t, yCua+caoCua/2, 0.12);
    for(var q=-1;q<=1;q+=2)
      hop(dsCua, rongCua/2/Math.cos(nghieng), 0.13, 0.14,
          t + q*rongCua/4, yCua+caoCua+0.47, 0.16, -q*nghieng);
  }

  /* ── tầng trên: mảng hoa gió đúc rỗng giữa các gian ── */
  var yH0=b.caoTang+0.55, yH1=cao-1.15, caoH=yH1-yH0;
  if(caoH > 1.2) for(var k=0;k<soGian;k++){
    var t=buoc*(k+0.5), w=buoc-0.95;
    if((soGian%2===1) && (k===(soGian-1)/2)){
      /* phù hiệu trường thay cho hoa gió ở gian chính giữa */
      hop(dsVoi, Math.min(2.6,w), caoH*0.66, 0.14, t, yH0+caoH*0.5, 0.10);
      hop(dsPhu, Math.min(2.1,w-0.5), caoH*0.48, 0.08, t, yH0+caoH*0.5, 0.17);
      continue;
    }
    hop(dsCua, w, caoH, 0.10, t, yH0+caoH/2, -0.02);   // lòng tối phía sau
    hop(dsHoa, w, 0.16, 0.13, t, yH0+0.08, 0.09);
    hop(dsHoa, w, 0.16, 0.13, t, yH1-0.08, 0.09);
    var oN=3, oD=Math.max(2, Math.round(w/0.75));
    for(var q=1;q<oN;q++) hop(dsHoa, w, 0.12, 0.12, t, yH0+caoH*q/oN, 0.09);
    for(var q=0;q<=oD;q++)
      hop(dsHoa, 0.12, caoH, 0.12, t - w/2 + w*q/oD, yH0+caoH/2, 0.09);
  }

  [[dsVoi,0xF2EFE6],[dsSan,0xD8D2C4],[dsCua,0x1F6B5E],
   [dsHoa,0xE6E2D6],[dsPhu,0x2E7FA8]].forEach(function(x){
    if(!x[0].length) return;
    var m=new THREE.MeshLambertMaterial({color:x[1], transparent:true});
    var msh=new THREE.Mesh(gop(x[0]), m);
    msh.castShadow=msh.receiveShadow=true; G.add(msh); mats.push(m);
  });
}

function matTienChiTiet(b){
  var mt=b.matTien||{}, mb=b.matBang, ph=offset(mb,-1);
  var buoc=mt.buocCot||3.4, rw=mt.rongCua||1.4, rh=mt.caoCua||2.2, vom=!!mt.vom;
  var vT=[], nT=[], vO=[], nO=[], vC=[], nC=[], vG=[], nG=[], vGa=[], nGa=[];

  function quad(V,N, p1,p2,p3,p4, nx,ny,nz){
    [p1,p2,p3, p1,p3,p4].forEach(function(p){ V.push(p[0],p[1],p[2]); N.push(nx,ny,nz); });
  }
  /* tấm phẳng nằm trên mặt tường, tâm (cx,cz), rộng w cao từ y0..y1, đẩy ra d */
  function tam(V,N, cx,cz, dx,dz, nx,nz, w, y0,y1, d){
    var hx=dx*w/2, hz=dz*w/2, ox=nx*d, oz=nz*d;
    quad(V,N,
      [cx-hx+ox,y0,cz-hz+oz], [cx+hx+ox,y0,cz+hz+oz],
      [cx+hx+ox,y1,cz+hz+oz], [cx-hx+ox,y1,cz-hz+oz], nx,0,nz);
  }
  /* hộp chữ nhật xoay theo hướng tường: dùng cho trụ lồi, bệ cửa, đầu xà */
  function hop(V,N, cx,cy,cz, dx,dz, nx,nz, w,h,sau, d){
    var hx=dx*w/2, hz=dz*w/2, ox=nx*d, oz=nz*d, sx=nx*sau, sz=nz*sau;
    var y0=cy-h/2, y1=cy+h/2;
    var A=[cx-hx+ox+sx,y0,cz-hz+oz+sz], B=[cx+hx+ox+sx,y0,cz+hz+oz+sz];
    var C=[cx+hx+ox+sx,y1,cz+hz+oz+sz], Dd=[cx-hx+ox+sx,y1,cz-hz+oz+sz];
    var E=[cx-hx+ox,y0,cz-hz+oz], F=[cx+hx+ox,y0,cz+hz+oz];
    var G=[cx+hx+ox,y1,cz+hz+oz], H=[cx-hx+ox,y1,cz-hz+oz];
    quad(V,N,A,B,C,Dd, nx,0,nz);              // mặt trước
    quad(V,N,B,F,G,C,  dx,0,dz);              // cạnh phải
    quad(V,N,E,A,Dd,H, -dx,0,-dz);            // cạnh trái
    quad(V,N,Dd,C,G,H, 0,1,0);                // mặt trên
    quad(V,N,E,F,B,A,  0,-1,0);               // mặt dưới
  }

  /* Cạnh quay ra sân của Hội trường Thăng Long do hoiTruong() lo trọn,
     bộ mặt tiền chung mà chạy chồng lên đó thì cửa chớp với phào cuốn
     vòm sẽ đâm xuyên qua hàng cột. */
  var canhBoQua = (b.chiTiet==='hoi-truong')
    ? (b.canhTruoc===undefined ? canhDaiNhat(mb) : b.canhTruoc) : -1;
  for(var i=0;i<mb.length;i++){
    if(i === canhBoQua) continue;
    var a=mb[i], c=mb[(i+1)%mb.length];
    var mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2;
    var pa=ph[i], pb=ph[(i+1)%ph.length];
    var nx=(pa[0]+pb[0])/2-mx, nz=(pa[1]+pb[1])/2-mz;
    var nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl;
    var dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
    /* ── 4. ĐÁ GÓC GIẬT CẤP ─────────────────────────────────────
       Hai bức tường gặp nhau ở một cạnh đứng sắc lẻm: nhìn nghiêng chỉ
       thấy một đường gãy, đúng chỗ đáng ra phải là nét mạnh nhất của
       toà nhà. Cả hai ảnh tư liệu đều xử lí góc theo lối đá giật cấp —
       từng viên vôi trắng dài ngắn xen kẽ, viên của mặt tường này ăn
       khớp vào chỗ hụt của mặt kia. Dựng bằng hộp nhỏ nên có gờ đổ bóng
       thật, nhận ra hình khối cả khi lùi camera ra xa.
       Đầu cạnh (dau=0) bắt đầu bằng viên DÀI, cuối cạnh (dau=1) bắt đầu
       bằng viên NGẮN, nhờ vậy hai mặt của cùng một góc luôn so le. */
    var caoDa=0.55, sauDa=0.135, daiDai=1.02, daiNgan=0.58;
    var yDa0=1.52, yDa1=b.tang*b.caoTang-1.05;
    var soDa=Math.floor((yDa1-yDa0)/caoDa);
    if(L > 2.4 && soDa > 1){
      for(var dau=0; dau<2; dau++){
        for(var k=0;k<soDa;k++){
          /* Viên DÀI chạy thẳng ra tới mép góc và trùm qua bề dày viên
             của mặt bên; viên NGẮN thì thụt vào đúng bề dày ấy. Nhờ vậy
             ở mỗi cao độ chỉ MỘT trong hai mặt lộ ra ngoài cùng, hai mặt
             cài răng lược vào nhau đúng lối xây đá góc — chứ không phải
             hai viên cùng đâm ra rồi cắm vào giữa nhau. */
          var daiQ=((k+dau)%2===0), dQ = daiQ ? daiDai : daiNgan;
          if(dQ > L*0.38) dQ = L*0.38;
          var thut = daiQ ? 0 : sauDa + 0.02;
          var tQ = dau===0 ? thut + dQ/2 : L - thut - dQ/2;
          hop(vT,nT, a[0]+dx*tQ, yDa0+caoDa*(k+0.5), a[1]+dz*tQ,
              dx,dz, nx,nz, dQ, caoDa*0.88, sauDa, 0.012);
        }
      }
    }

    var so=Math.floor((L-1.6)/buoc);
    if(so<1) continue;
    var st=L/so;

    /* ── 3. đầu xà gỗ và con sơn đỡ diềm mái ────────────────────
       Ảnh Nhà truyền thống: dưới diềm mái là một hàng con sơn gỗ sẫm,
       dày, nhô hẳn ra khỏi tường. Chính hàng bóng đổ ấy mới tách được
       mái khỏi tường khi nhìn từ xa — một thanh xà mảnh như bản trước
       thì lùi ra mươi mét là mất. Mỗi con sơn nay dựng hai bậc: bậc
       trên dài đỡ lấy diềm, bậc dưới ngắn và thụt vào. */
    for(var k=0;k<=so;k++){
      var t=Math.min(L-0.3, Math.max(0.3, st*k));
      hop(vG,nG, a[0]+dx*t, b.tang*b.caoTang-0.40, a[1]+dz*t,
          dx,dz, nx,nz, 0.25, 0.30, 0.64, 0.02);
      hop(vG,nG, a[0]+dx*t, b.tang*b.caoTang-0.78, a[1]+dz*t,
          dx,dz, nx,nz, 0.21, 0.46, 0.36, 0.02);
    }

    for(var f=0; f<b.tang; f++){
      var yS = f*b.caoTang;
      /* ── 2. trụ lồi chia gian, chạy suốt chiều cao tầng ── */
      for(var k=0;k<=so;k++){
        var t=Math.min(L-0.25, Math.max(0.25, st*k));
        hop(vT,nT, a[0]+dx*t, yS+b.caoTang/2, a[1]+dz*t,
            dx,dz, nx,nz, 0.5, b.caoTang-0.34, 0.13, 0.01);
      }
      /* ── 5. ô gạch nung trang trí trên đầu mỗi trụ ──────────────
         Ảnh dãy ba tầng: ngay dưới dải phào ngăn tầng, đầu mỗi trụ có
         một ô gạch đỏ nhỏ lồng trong khung vôi trắng, lặp đều suốt mặt
         tiền. Chi tiết bé nhưng chính nó phá cái đơn điệu của mảng
         tường vàng, và là nét dễ nhận ra nhất của lối xây thuộc địa. */
      if(f >= 1 && b.caoTang > 3.1){
        var yG = yS + b.caoTang - 0.78;
        for(var k=0;k<=so;k++){
          var t=Math.min(L-0.25, Math.max(0.25, st*k));
          var gx2=a[0]+dx*t, gz2=a[1]+dz*t;
          tam(vT,nT, gx2,gz2, dx,dz, nx,nz, 0.62, yG-0.29, yG+0.29, 0.145);
          tam(vGa,nGa, gx2,gz2, dx,dz, nx,nz, 0.38, yG-0.18, yG+0.18, 0.158);
        }
      }
      /* ── 1. ô cửa ── */
      var treo=(f===0 && mt.hienLang)?0.95:1.2;
      var y0=yS+treo, cao=(f===0 && mt.hienLang)?Math.min(b.caoTang-1.9, rh+1.0):rh;
      var y1=y0+cao;
      for(var k=0;k<so;k++){
        var t=st*(k+0.5);
        var cx=a[0]+dx*t, cz=a[1]+dz*t;
        /* khung phào trắng, to hơn ô cửa mỗi bề 26 phân */
        tam(vT,nT, cx,cz, dx,dz, nx,nz, rw+0.52, y0-0.20, y1+0.30, 0.055);
        /* ô cửa lõm vào 16 phân */
        tam(vO,nO, cx,cz, dx,dz, nx,nz, rw, y0, y1, -0.16);
        /* bốn mặt hồi của hốc cửa, cho thấy chiều sâu */
        var hx=dx*rw/2, hz=dz*rw/2;
        quad(vT,nT,
          [cx-hx+nx*0.03,y0,cz-hz+nz*0.03],[cx-hx-nx*0.16,y0,cz-hz-nz*0.16],
          [cx-hx-nx*0.16,y1,cz-hz-nz*0.16],[cx-hx+nx*0.03,y1,cz-hz+nz*0.03], dx,0,dz);
        quad(vT,nT,
          [cx+hx-nx*0.16,y0,cz+hz-nz*0.16],[cx+hx+nx*0.03,y0,cz+hz+nz*0.03],
          [cx+hx+nx*0.03,y1,cz+hz+nz*0.03],[cx+hx-nx*0.16,y1,cz+hz-nz*0.16], -dx,0,-dz);
        quad(vT,nT,
          [cx-hx+nx*0.03,y1,cz-hz+nz*0.03],[cx+hx+nx*0.03,y1,cz+hz+nz*0.03],
          [cx+hx-nx*0.16,y1,cz+hz-nz*0.16],[cx-hx-nx*0.16,y1,cz-hz-nz*0.16], 0,-1,0);
        /* bệ cửa nhô ra */
        hop(vT,nT, cx, y0-0.13, cz, dx,dz, nx,nz, rw+0.62, 0.16, 0.17, 0.02);
        /* lanh tô cuốn vòm trắng */
        if(vom){
          var seg=7, r=(rw+0.52)/2;
          for(var q=0;q<seg;q++){
            var A1=Math.PI*q/seg, A2=Math.PI*(q+1)/seg;
            var c1=Math.cos(A1)*r, s1=Math.sin(A1)*r;
            var c2=Math.cos(A2)*r, s2=Math.sin(A2)*r;
            var ox=nx*0.055, oz=nz*0.055;
            quad(vT,nT,
              [cx+ox,y1+0.30,cz+oz],
              [cx+dx*c1+ox,y1+0.30+s1,cz+dz*c1+oz],
              [cx+dx*c2+ox,y1+0.30+s2,cz+dz*c2+oz],
              [cx+ox,y1+0.30,cz+oz], nx,0,nz);
          }
        }
        /* hai cánh chớp xanh mở hé ra hai bên */
        var wc=rw*0.5, mo=0.42;
        [-1,1].forEach(function(sg){
          var bx=cx+dx*(rw/2)*sg, bz=cz+dz*(rw/2)*sg;
          var ex=bx+dx*wc*sg*Math.cos(mo)+nx*wc*Math.sin(mo);
          var ez=bz+dz*wc*sg*Math.cos(mo)+nz*wc*Math.sin(mo);
          quad(vC,nC, [bx,y0,bz],[ex,y0,ez],[ex,y1,ez],[bx,y1,bz],
               nx*Math.cos(mo)-dx*sg*Math.sin(mo), 0,
               nz*Math.cos(mo)-dz*sg*Math.sin(mo));
        });
      }
    }
  }
  function lam(V,N){
    if(!V.length) return null;
    var g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(V,3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N,3));
    return g;
  }
  return { trang:lam(vT,nT), oCua:lam(vO,nO), chop:lam(vC,nC),
           go:lam(vG,nG), gach:lam(vGa,nGa) };
}

var meshCVA = [];
D.nhaCVA.forEach(function(b){
  var G=new THREE.Group(), mats=[];
  var caoTuong=b.tang*b.caoTang;
  var pc = D.phongCach[b.phongCach] || D.phongCach['thuoc-dia'];
  var mauTuong = pc.tuong;

  var mBe=new THREE.MeshLambertMaterial({color:M.beMong, transparent:true});
  var gBe=new THREE.ExtrudeGeometry(shape(offset(b.matBang,-0.5)),
    {depth:1.2,bevelEnabled:false});
  gBe.rotateX(-Math.PI/2);
  var be=new THREE.Mesh(gBe,mBe); be.castShadow=be.receiveShadow=true;
  G.add(be); mats.push(mBe);

  var mTuong=new THREE.MeshLambertMaterial({color:mauTuong, transparent:true});
  var gTuong=new THREE.ExtrudeGeometry(shape(b.matBang),
    {depth:caoTuong,bevelEnabled:false});
  gTuong.rotateX(-Math.PI/2);
  var tuong=new THREE.Mesh(gTuong,mTuong);
  tuong.castShadow=tuong.receiveShadow=true; G.add(tuong); mats.push(mTuong);

  /* mặt tiền chi tiết: khung phào, hốc cửa, bệ, vòm, cánh chớp, trụ, đầu xà */
  var ct = matTienChiTiet(b);
  function themCT(geo, mau, haiMat){
    if(!geo) return;
    var m=new THREE.MeshLambertMaterial({color:mau,
      side: haiMat ? THREE.DoubleSide : THREE.FrontSide});
    var msh=new THREE.Mesh(geo,m);
    msh.castShadow=msh.receiveShadow=true; G.add(msh); mats.push(m);
  }
  themCT(ct.trang, pc.vien, true);
  themCT(ct.oCua,  M.oCuaSau, true);
  themCT(ct.chop,  pc.cua,   true);
  themCT(ct.go,    M.xaGo,   false);
  themCT(ct.gach,  M.muTuong, true);   // ô gạch nung trang trí

  /* dải phào ngang: chân tường, mỗi cao độ sàn, và dải lớn dưới chân mái */
  var day=[];
  function dai(y, nho, day2){
    var gd=new THREE.ExtrudeGeometry(shape(offset(b.matBang,-nho)),
      {depth:day2,bevelEnabled:false});
    gd.rotateX(-Math.PI/2); gd.translate(0, y, 0);
    day.push({g:gd,p:[0,0,0]});
  }
  dai(1.15, 0.34, 0.30);                       // chân tường
  for(var f=1; f<b.tang; f++) dai(f*b.caoTang-0.20, 0.30, 0.36);
  dai(caoTuong-0.95, 0.40, 0.50);              // dải lớn dưới chân mái
  if(day.length){
    var mDay=new THREE.MeshLambertMaterial({color:pc.vien, transparent:true});
    var d1=new THREE.Mesh(gop(day),mDay); d1.castShadow=true; G.add(d1); mats.push(mDay);
  }

  var mMai=new THREE.MeshLambertMaterial({color:b.mauMai, transparent:true});
  /* Ảnh ngói dán lên mái là ảnh TƯƠNG PHẢN RẤT CAO: đo ra 33% điểm ảnh
     là mặt viên ngói (178,76,57), còn 40% là mạch vữa tối om (43,14,8).
     Chính mảng tối ấy kéo cả mái xuống, nên nhìn từ xa mái ra màu nâu
     sẫm chứ không ra đỏ gạch. Nhân sáng ảnh lên cho đúng màu gạch thì
     39% điểm ảnh vượt ngưỡng, cháy trắng mất hoa văn.
     Nên các dãy nhà trong trường nay dùng MÀU BẰNG, đúng màu gạch mẫu.
     Muốn trả lại ảnh ngói thì bỏ "&& !b.maiPhang" ở dòng dưới. */
  if(texNgoi && b.phongCach!=='hien-dai' && !b.maiPhang){
    mMai.map=texNgoi; mMai.color=new THREE.Color(0xFFFFFF);
  }
  var gMai, duoi;
  if(b.kieuMai==='bang'){
    duoi=offset(b.matBang,-0.6);
    if(dienTich(duoi) <= dienTich(b.matBang)) duoi=b.matBang;
    gMai=maiGeo(duoi, offset(b.matBang,-0.25), caoTuong, caoTuong+b.caoMai);
  } else if(b.kieuMai==='chop'){
    duoi=offset(b.matBang,-1.6);
    if(dienTich(duoi) <= dienTich(b.matBang)) duoi=b.matBang;
    var tm=[0,0]; b.matBang.forEach(function(p){tm[0]+=p[0];tm[1]+=p[1];});
    tm=[tm[0]/b.matBang.length, tm[1]/b.matBang.length];
    var dinh=duoi.map(function(){ return tm; });
    gMai=maiGeo(duoi, dinh, caoTuong, caoTuong+b.caoMai);
  } else {
    /* mỗi thanh một mái dốc đơn giản, đúng như mái nhà B */
    var kq = maiTheoThanh(b.matBang, caoTuong, b.caoMai*1.25, 0.85);
    gMai = kq.geo;
    if(kq.bo){
      var mBo=new THREE.MeshLambertMaterial({color:M.boMai});
      var mshBo=new THREE.Mesh(kq.bo, mBo);
      mshBo.castShadow=true; G.add(mshBo); mats.push(mBo);
    }
    duoi = offset(b.matBang, -1.4);
    if(dienTich(duoi) <= dienTich(b.matBang)) duoi = b.matBang;
  }
  var mai=new THREE.Mesh(gMai,mMai);
  mai.castShadow=mai.receiveShadow=true; G.add(mai); mats.push(mMai);

  var mHat=new THREE.MeshLambertMaterial({color:M.hatMaiCVA, transparent:true});
  var gHat=new THREE.ExtrudeGeometry(shape(duoi),{depth:0.42,bevelEnabled:false});
  gHat.rotateX(-Math.PI/2); gHat.translate(0,caoTuong,0);
  var hat=new THREE.Mesh(gHat,mHat); hat.castShadow=true; G.add(hat); mats.push(mHat);

  /* hành lang cột — hiện chỉ bật cho nhà C để Naams duyệt */
  /* THỬ NGHIỆM dán ảnh thật: ốp tấm ảnh mặt đầu hồi lên cạnh NGẮN nhất
     của toà được đánh dấu, để so sánh trực tiếp với cách dựng hình học. */
  if(false && b.danAnh && D.texMatNha){
    var mbn=b.matBang, iNgan=0, nho=1e9;
    for(var q=0;q<mbn.length;q++){
      var a1=mbn[q], b1=mbn[(q+1)%mbn.length];
      var L1=Math.hypot(b1[0]-a1[0], b1[1]-a1[1]);
      if(L1<nho && L1>6){ nho=L1; iNgan=q; }
    }
    var a2=mbn[iNgan], b2=mbn[(iNgan+1)%mbn.length];
    var mx2=(a2[0]+b2[0])/2, mz2=(a2[1]+b2[1])/2;
    var ph2=offset(mbn,-1), pa2=ph2[iNgan], pb2=ph2[(iNgan+1)%ph2.length];
    var nx2=(pa2[0]+pb2[0])/2-mx2, nz2=(pa2[1]+pb2[1])/2-mz2;
    var nl2=Math.hypot(nx2,nz2)||1; nx2/=nl2; nz2/=nl2;
    var caoAnh=caoTuong+b.caoMai*0.85, rongAnh=nho;
    var gA=new THREE.PlaneGeometry(rongAnh, caoAnh);
    var texA=new THREE.TextureLoader().load(D.texMatNha['dau-hoi']);
    var mA=new THREE.Mesh(gA, new THREE.MeshLambertMaterial({map:texA}));
    mA.position.set(mx2+nx2*0.14, caoAnh/2, mz2+nz2*0.14);
    mA.rotation.y=Math.atan2(nx2, nz2);
    G.add(mA);
  }

  if(b.chiTiet==='hien-cot'){
    var hl=hanhLang(b, pc);
    var mGo=new THREE.MeshLambertMaterial({color:M.goHien, transparent:true});
    var mSan=new THREE.MeshLambertMaterial({color:M.sanHien, transparent:true});
    var mc=new THREE.Mesh(gop(hl.cot.concat(hl.chong)), mGo);
    mc.castShadow=true; G.add(mc); mats.push(mGo);
    var ms=new THREE.Mesh(gop(hl.san), mSan);
    ms.castShadow=ms.receiveShadow=true; G.add(ms); mats.push(mSan);
  } else if(b.chiTiet==='hien-vom'){
    var hv=hienVom(b);
    var mVoi=new THREE.MeshLambertMaterial({color:pc.vien, transparent:true});
    var mc2=new THREE.Mesh(gop(hv.cot), mVoi);
    mc2.castShadow=true; G.add(mc2); mats.push(mVoi);
    var mv=new THREE.Mesh(hv.vom, new THREE.MeshLambertMaterial(
      {color:pc.tuong, transparent:true, side:THREE.DoubleSide}));
    mv.castShadow=true; G.add(mv); mats.push(mv.material);
    var ms2=new THREE.Mesh(gop(hv.san), mVoi);
    ms2.castShadow=ms2.receiveShadow=true; G.add(ms2); mats.push(mVoi);
  } else if(b.chiTiet==='hoi-truong'){
    hoiTruong(b, G, mats, pc);
  }

  G.scale.y=0.0001; G.visible=false; scene.add(G);
  var c=[0,0]; b.matBang.forEach(function(p){c[0]+=p[0];c[1]+=p[1];});
  c=[c[0]/b.matBang.length, c[1]/b.matBang.length];
  meshCVA.push({d:b, G:G, mats:mats, tuong:mTuong, p:0,
                mo:0,   /* trước đây hạ độ đục để tỏ ý "chưa chắc", nhưng nền
                           nhợt lọt qua tường làm cả toà trông như xác sống.
                           Mức chắc chắn nay chỉ thể hiện bằng dấu ? trên nhãn. */
                tam:new THREE.Vector3(c[0], caoTuong+b.caoMai+7, c[1])});
});

/* ── cây xanh ─────────────────────────────────────────────────────
   Trong khuôn viên: mô hình 3D thật, nhân bản bằng InstancedMesh nên dù
   bao nhiêu cây cũng chỉ tốn 2 lệnh vẽ. Ngoài phố: tấm phẳng dán ảnh cho
   nhẹ — mỗi cây 3D tốn 12.400 tam giác, nhân 386 cây là 4,8 triệu, quá sức
   máy tính để bàn thường. */
function giaiMa(b64, Kieu){
  var s=atob(b64), n=s.length, u=new Uint8Array(n);
  for(var i=0;i<n;i++) u[i]=s.charCodeAt(i);
  return new Kieu(u.buffer);
}
var tai=new THREE.TextureLoader();
var texNgoi=null;
if(D.texNgoi){
  texNgoi=tai.load(D.texNgoi);
  texNgoi.wrapS=texNgoi.wrapT=THREE.RepeatWrapping;
}
function napTex(src){ var t=tai.load(src); return t; }

var CM=D.cayModel;
function hinhCay(p){
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(giaiMa(p.V, Float32Array),3));
  g.setAttribute('normal',   new THREE.BufferAttribute(giaiMa(p.N, Float32Array),3));
  g.setAttribute('uv',       new THREE.BufferAttribute(giaiMa(p.UV, Float32Array),2));
  g.setIndex(new THREE.BufferAttribute(giaiMa(p.F, Uint32Array),1));
  return g;
}


var nutPhu = [];   /* công trình nhỏ có bảng thông tin riêng: tượng, tháp */

/* ── TƯỢNG CỤ CHU VĂN AN ───────────────────────────────────────────
   Dựng lại theo ảnh chụp thực địa. Bản trước sai ba điểm cơ bản:
     · cụ ĐỨNG, trong khi tượng thật là cụ NGỒI trên khối đá, chân
       chống, một tay đặt lên gối;
     · tượng đúc màu đồng, trong khi tượng thật tạc bằng đá xám;
     · mặt tượng quay lung tung, nay xoay hẳn về phía cổng chính.
   Bệ là khối đá chữ nhật cao, mặt trước khắc tên. Quanh sân có vành
   cây cảnh cắt thấp, đúng như bồn cây ôm lấy bệ tượng trong ảnh.
   Vẫn dựng bằng khối xoay tròn chứ không mô phỏng người thật: ở cỡ sa
   bàn này một hình bóng đúng dáng đọc ra rõ hơn hẳn mô hình chi li. */
var TUONG = { x:-21.0, z:13.0, huong:0.30, donCay:9.0 };
(function dungTuong(){
  /* quay mặt về cổng chính: hướng trước của tượng là (sin h, cos h) */
  var gc=(D.cong||[]).filter(function(c){ return c.loai==='chinh'; })[0];
  if(gc) TUONG.huong = Math.atan2(gc.x - TUONG.x, gc.z - TUONG.z);

  var G=new THREE.Group();
  var mDa   = new THREE.MeshLambertMaterial({color:0xC6C0B4});  // bệ đá
  var mDaSam= new THREE.MeshLambertMaterial({color:0xADA695});  // bậc dưới
  var mTuong= new THREE.MeshLambertMaterial({color:0xD3CEC4});  // đá tạc tượng
  var mChu  = new THREE.MeshLambertMaterial({color:0x6E6558});
  var mLa   = new THREE.MeshLambertMaterial({color:0x4E8A3A});

  function dat(o, y){ o.position.set(TUONG.x, y, TUONG.z);
    o.castShadow=true; o.receiveShadow=true; G.add(o); return o; }

  /* sân lát quanh chân tượng */
  var san=new THREE.Mesh(new THREE.CylinderGeometry(4.6,4.6,0.14,32),
    new THREE.MeshLambertMaterial({color:0xE2DCCB}));
  dat(san, 0.07);

  /* vành cây cảnh cắt thấp ôm lấy bệ */
  var dsBui=[];
  for(var i=0;i<26;i++){
    var a=Math.PI*2*i/26;
    var r=4.05 + (i%2)*0.10;
    dsBui.push({g:new THREE.SphereGeometry(0.42,7,5),
      p:[TUONG.x+Math.cos(a)*r, 0.34, TUONG.z+Math.sin(a)*r], s:1, sy:0.72});
  }
  var buiV=new THREE.Mesh(gop(dsBui), mLa);
  buiV.castShadow=true; buiV.receiveShadow=true; G.add(buiV);

  /* bệ: bậc dưới, thân cao, mũ */
  dat(new THREE.Mesh(new THREE.BoxGeometry(3.00,0.30,2.50), mDaSam), 0.29);
  dat(new THREE.Mesh(new THREE.BoxGeometry(2.50,0.26,2.10), mDa),    0.57);
  dat(new THREE.Mesh(new THREE.BoxGeometry(1.95,1.90,1.60), mDa),    1.65);
  dat(new THREE.Mesh(new THREE.BoxGeometry(2.15,0.18,1.80), mDa),    2.69);

  /* tên khắc trên mặt trước bệ */
  var sh=Math.sin(TUONG.huong), ch=Math.cos(TUONG.huong);
  var bien=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.34,0.06), mChu);
  bien.position.set(TUONG.x + sh*0.82, 1.72, TUONG.z + ch*0.82);
  bien.rotation.y=TUONG.huong; G.add(bien);

  /* ── thân tượng: cụ ngồi ── */
  var T=new THREE.Group();
  T.position.set(TUONG.x, 2.78, TUONG.z);
  T.rotation.y=TUONG.huong;
  function t(o,x,y,z){ o.position.set(x||0,y,z||0);
    o.castShadow=true; T.add(o); return o; }

  /* khối đá làm chỗ ngồi, nhô cao phía sau lưng */
  var da1=t(new THREE.Mesh(new THREE.BoxGeometry(1.55,0.95,1.05), mTuong), 0, 0.42, -0.30);
  da1.rotation.y=0.10;
  var da2=t(new THREE.Mesh(new THREE.BoxGeometry(1.15,1.30,0.55), mTuong), 0.05, 0.72, -0.62);
  da2.rotation.y=-0.14;

  /* đùi và gối đưa ra trước, phủ vạt áo */
  var dui=t(new THREE.Mesh(new THREE.BoxGeometry(1.15,0.62,1.05), mTuong), 0, 1.10, 0.34);
  dui.rotation.x=-0.12;
  /* cẳng chân buông xuống trước bệ */
  [-1,1].forEach(function(s){
    var cg=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.17,0.92,10), mTuong);
    cg.position.set(s*0.30, 0.50, 0.70); cg.rotation.x=0.10;
    cg.castShadow=true; T.add(cg);
    var ba=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.16,0.44), mTuong);
    ba.position.set(s*0.30, 0.08, 0.84); ba.castShadow=true; T.add(ba);
  });

  /* thân trên: áo thụng loe, hơi ngả ra sau */
  var than=t(new THREE.Mesh(new THREE.CylinderGeometry(0.44,0.62,1.16,14), mTuong), 0, 1.92, 0.06);
  than.rotation.x=0.10;
  /* vai */
  t(new THREE.Mesh(new THREE.CylinderGeometry(0.40,0.46,0.26,14), mTuong), 0, 2.48, 0.02);

  /* tay phải đặt lên gối, tay trái gấp trước bụng */
  var tayP=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.20,0.98,10), mTuong);
  tayP.position.set(0.44, 1.94, 0.34); tayP.rotation.set(0.62, 0, -0.16);
  tayP.castShadow=true; T.add(tayP);
  t(new THREE.Mesh(new THREE.SphereGeometry(0.17,10,8), mTuong), 0.40, 1.46, 0.66);
  var tayT=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.19,0.78,10), mTuong);
  tayT.position.set(-0.40, 2.02, 0.24); tayT.rotation.set(0.95, 0, 0.22);
  tayT.castShadow=true; T.add(tayT);
  t(new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8), mTuong), -0.20, 1.76, 0.46);

  /* cổ, đầu, búi tóc */
  t(new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.15,0.16,10), mTuong), 0, 2.66, 0.02);
  var dau=t(new THREE.Mesh(new THREE.SphereGeometry(0.27,16,12), mTuong), 0, 2.95, 0.02);
  dau.scale.set(0.90,1.12,0.96);
  t(new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.19,0.22,12), mTuong), 0, 3.28, -0.02);
  t(new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8), mTuong), 0, 3.42, -0.02);

  /* râu dài buông trước ngực — nét nhận ra cụ đồ ngay từ xa */
  var rau=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.78,10), mTuong);
  rau.position.set(0, 2.50, 0.24); rau.rotation.x=Math.PI-0.10;
  rau.castShadow=true; T.add(rau);

  G.add(T);
  scene.add(G);
  nutPhu.push({G:G, tam:new THREE.Vector3(TUONG.x, 9.4, TUONG.z), d:{
    id:'tuong-chu-van-an', ten:'Tượng cụ Chu Văn An', laPhu:true,
    chacChan:'uoc', tuGD:5, nhom:'di-tich',
    ghiChu:'Tượng cụ Chu Văn An ngồi trên khối đá, tạc bằng đá xám, đặt giữa khoảng sân phía nam dãy S và quay mặt về phía cổng chính. Cụ là nhà giáo đời Trần, người mà trường mang tên từ năm 1945.'
  }});
})();

/* ══ THÁP ĐỒNG HỒ ══════════════════════════════════════════════════
   Dựng giữa khoảng sân rộng nhất khuôn viên — chỗ trống giữa nhà A, C,
   B và H, cách chân nhà gần nhất hai mươi lăm mét, cách lối đi mười bảy
   mét, nên đứng đâu trong sân cũng nhìn thấy.
   Thân tháp thu dần lên trên bằng khối bốn cạnh xoay 45°, bốn góc có
   trụ lồi chạy suốt; trên là tầng đồng hồ bốn mặt, mũ đua, rồi chóp
   ngói bốn dốc.
   Bốn mặt đồng hồ dựng bằng hình học: đĩa trắng, vành sẫm, mười hai
   vạch giờ, kim giờ kim phút. Kim đặt cố định ở 8 giờ 20 — vị trí hai
   kim xoè cân hai bên, nhìn từ xa vẫn đọc ra "đây là đồng hồ" chứ không
   thành cái chấm trắng.                                                */
var THAP = { x:70.0, z:17.0, huong:-0.30, donCay:8.0 };
(function dungThap(){
  var G=new THREE.Group();
  var mThan  = new THREE.MeshLambertMaterial({color:M.truTuong});   // vôi vàng đã bạc
  var mTrang = new THREE.MeshLambertMaterial({color:0xF4EFE0});
  var mMai   = new THREE.MeshLambertMaterial({color:0xC65334});   // cùng màu gạch với mái các dãy nhà
  var mSam   = new THREE.MeshLambertMaterial({color:0x2E2A22});
  var mKinh  = new THREE.MeshLambertMaterial({color:0xFAF7EE});

  var dsThan=[], dsTrang=[], dsMai=[], dsSam=[], dsKinh=[];
  /* P() xoay điểm quanh trục đứng theo chiều LƯỢNG GIÁC trong mặt (x,z),
     còn gop() lại xoay hình học bằng phép quay quanh +Y của three.js —
     hai chiều NGƯỢC nhau. Bản trước cộng cùng một THAP.huong vào cả hai
     nên vị trí lệch một góc, hướng lệch một góc nữa, cộng lại thành hai
     lần: bốn mặt số không nằm giữa bốn bức tường của chúng. Nay ry mang
     dấu âm để hai phép quay khớp nhau. */
  function P(dx,dz){
    var c=Math.cos(THAP.huong), s=Math.sin(THAP.huong);
    return [THAP.x + dx*c - dz*s, THAP.z + dx*s + dz*c];
  }
  function hop(ds, w,h,d, dx,y,dz, xoayY){
    var p=P(dx,dz);
    ds.push({g:new THREE.BoxGeometry(w,h,d), p:[p[0],y,p[1]],
             ry:-THAP.huong + (xoayY||0)});
  }
  function khoi(ds, geo, dx,y,dz, xoayY){
    var p=P(dx,dz);
    ds.push({g:geo, p:[p[0],y,p[1]], ry:-THAP.huong + (xoayY||0)});
  }

  /* sân lát quanh chân tháp */
  khoi(dsTrang, new THREE.CylinderGeometry(4.2,4.2,0.14,28), 0, 0.07, 0);

  /* bệ ba cấp */
  hop(dsTrang, 3.60, 0.34, 3.60, 0, 0.31, 0);
  hop(dsThan,  3.10, 0.62, 3.10, 0, 0.79, 0);
  hop(dsTrang, 3.24, 0.16, 3.24, 0, 1.18, 0);

  /* thân thu dần: khối bốn cạnh, đáy 2,5 m thu lên 2,0 m */
  var CAO_THAN=8.6, y0=1.26;
  var than=new THREE.CylinderGeometry(2.00/Math.SQRT2, 2.50/Math.SQRT2, CAO_THAN, 4);
  than.rotateY(Math.PI/4);
  khoi(dsThan, than, 0, y0+CAO_THAN/2, 0);

  /* bốn trụ góc lồi, cũng thu dần theo thân */
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(q){
    var tr=new THREE.CylinderGeometry(0.20, 0.26, CAO_THAN, 4);
    tr.rotateY(Math.PI/4);
    khoi(dsTrang, tr, q[0]*1.08, y0+CAO_THAN/2, q[1]*1.08);
  });
  /* hai dải phào ngang chia thân */
  [0.34, 0.68].forEach(function(f){
    var w=2.50 - (2.50-2.00)*f + 0.22;
    hop(dsTrang, w, 0.18, w, 0, y0+CAO_THAN*f, 0);
  });
  /* khe thoáng hẹp trên mỗi mặt thân, cho đỡ đặc */
  for(var q=0;q<4;q++){
    var a=Math.PI/2*q, r=1.06;
    hop(dsSam, 0.34, 1.9, 0.10, Math.cos(a)*r, y0+CAO_THAN*0.24, Math.sin(a)*r, -a);
  }

  /* ── tầng đồng hồ ── */
  var yD = y0+CAO_THAN;
  hop(dsTrang, 2.72, 0.24, 2.72, 0, yD+0.12, 0);        // đua đỡ
  hop(dsThan,  2.46, 2.40, 2.46, 0, yD+1.44, 0);        // hộp đồng hồ
  var yM = yD+1.44;                                      // tâm mặt đồng hồ

  var gDia   = new THREE.CylinderGeometry(0.86,0.86,0.06,28);
  gDia.rotateX(Math.PI/2);
  var gVanh  = new THREE.TorusGeometry(0.88,0.09,7,28);
  for(var q=0;q<4;q++){
    /* Mặt số quay ĐÚNG RA NGOÀI bức tường nó gắn lên.
       Đĩa dựng bằng hình trụ xoay 90° quanh X nên pháp tuyến của nó nằm
       dọc trục Z. Muốn pháp tuyến ấy trỏ theo hướng (cos a, sin a) thì
       phải xoay quanh trục đứng một góc π/2 − a, chứ không phải −a như
       bản trước: −a làm cả bốn mặt số lệch đúng 90°, mỗi mặt đứng úp
       vào bức tường bên cạnh thay vì bức tường của chính nó. */
    var a=Math.PI/2*q;                      // 0=+x, quay quanh trục đứng
    var quayMat = Math.PI/2 - a;
    var cx=Math.cos(a)*1.30, cz=Math.sin(a)*1.30;
    khoi(dsKinh,  gDia.clone(),  cx, yM, cz, quayMat);
    khoi(dsTrang, gVanh.clone(), cx, yM, cz, quayMat);
    /* mười hai vạch giờ */
    for(var k=0;k<12;k++){
      var b=Math.PI*2*k/12;
      var dai=(k%3===0)?0.20:0.11, r=0.72;
      var v=new THREE.BoxGeometry(0.055, dai, 0.05);
      v.rotateZ(-b);
      v.translate(Math.sin(b)*r, Math.cos(b)*r, 0);
      var p=P(cx + Math.cos(a)*0.06, cz + Math.sin(a)*0.06);
      dsSam.push({g:v, p:[p[0], yM, p[1]], ry:-THAP.huong + quayMat});
    }
    /* kim giờ và kim phút, đặt cố định ở 8 giờ 20 */
    [[0.44, 0.075, -Math.PI*2*(8/12 + 20/720)],
     [0.64, 0.055, -Math.PI*2*(20/60)]].forEach(function(kim){
      var g2=new THREE.BoxGeometry(kim[1], kim[0], 0.05);
      g2.translate(0, kim[0]/2 - 0.06, 0);
      g2.rotateZ(kim[2]);
      var p=P(cx + Math.cos(a)*0.09, cz + Math.sin(a)*0.09);
      dsSam.push({g:g2, p:[p[0], yM, p[1]], ry:-THAP.huong + quayMat});
    });
  }

  /* ── mũ và chóp ngói bốn dốc ── */
  var yT = yD + 2.64;
  hop(dsTrang, 2.86, 0.22, 2.86, 0, yT+0.11, 0);
  hop(dsTrang, 3.10, 0.18, 3.10, 0, yT+0.31, 0);
  var chop=new THREE.CylinderGeometry(0.06, 3.10/Math.SQRT2, 2.30, 4);
  chop.rotateY(Math.PI/4);
  khoi(dsMai, chop, 0, yT+0.40+1.15, 0);
  khoi(dsTrang, new THREE.SphereGeometry(0.20,12,10), 0, yT+2.72, 0);
  khoi(dsSam, new THREE.CylinderGeometry(0.045,0.045,0.9,6), 0, yT+3.15, 0);

  [[dsThan,mThan],[dsTrang,mTrang],[dsMai,mMai],[dsSam,mSam],[dsKinh,mKinh]]
  .forEach(function(x){
    if(!x[0].length) return;
    var m=new THREE.Mesh(gop(x[0]), x[1]);
    m.castShadow=true; m.receiveShadow=true; G.add(m);
  });
  scene.add(G);

  nutPhu.push({G:G, tam:new THREE.Vector3(THAP.x, 19.5, THAP.z), d:{
    id:'thap-dong-ho', ten:'Tháp đồng hồ', laPhu:true,
    chacChan:'uoc', tuGD:5, nhom:'chuc-nang',
    ghiChu:'Tháp đồng hồ giữa sân trường, nằm trong khoảng sân lớn giữa '+
      'nhà A, nhà C, nhà B và nhà H. Vị trí và hình dáng dựng theo yêu cầu '+
      'của người làm sa bàn; chưa đối chiếu được với tư liệu ảnh.'
  }});
})();
/* ── TRỒNG THÊM CÂY TRONG KHUÔN VIÊN ───────────────────────────────
   Đối chiếu ảnh vệ tinh: trong trường gần như kín tán. Một vành cổ thụ
   chạy sát tường bao, hai hàng cây ôm lấy mọi lối đi, và khoảng sân
   giữa các dãy nhà chỗ nào cũng có cây. Bản trước chỉ 78 cây nên nhìn
   từ trên xuống khuôn viên trống trải hơn thực tế rất nhiều.
   Cây thêm vào gieo bằng bộ sinh số giả ngẫu nhiên CỐ ĐỊNH, nên lần
   dựng nào cũng ra đúng một kết quả — sa bàn không "nhảy" giữa hai lần
   mở trang. Số cây có trần cứng: mỗi cây 12.400 tam giác, vượt trần thì
   máy yếu tụt khung hình.                                            */
(function trongThemCay(){
  var ranh = D.ranhTruong;
  if(!ranh || ranh.length < 3) return;

  /* ── dọn quang quanh tượng cụ Chu Văn An và tháp đồng hồ ────────
     Nhổ cả cây có sẵn trong dữ liệu gốc lẫn cây mới gieo. Không dọn thì
     vành cổ thụ trồng dày ở dưới trùm kín, tượng chỉ còn là một chấm
     đồng lấp ló giữa tán lá. */
  [TUONG, THAP].forEach(function(o){
    if(!o) return;
    D.cay = D.cay.filter(function(c){
      return !(c.trong && Math.hypot(c.x-o.x, c.z-o.z) < o.donCay);
    });
  });

  var TRAN = 240;            // trần tổng số cây 3D trong khuôn viên
  var CACH_CAY = 5.4;        // hai gốc cây không được gần nhau hơn ngần này
  var CACH_NHA = 4.2;        // chừa quanh chân tường nhà
  var CACH_DUONG = 1.2;      // chừa thêm ngoài mép đường
  var CACH_SAN = 4.0;        // chừa quanh sân thể thao

  var _h = 20260826;
  function ng(){ _h = (_h*1664525 + 1013904223) % 4294967296; return _h/4294967296; }

  /* bao chữ nhật của khuôn viên, để quét lưới cho nhanh */
  var bx0=1e9, bx1=-1e9, bz0=1e9, bz1=-1e9;
  ranh.forEach(function(p){
    bx0=Math.min(bx0,p[0]); bx1=Math.max(bx1,p[0]);
    bz0=Math.min(bz0,p[1]); bz1=Math.max(bz1,p[1]);
  });

  /* vùng cấm: chân nhà, sân thể thao */
  var cam = [];
  (D.nhaCVA||[]).forEach(function(b){
    if(b.matBang && b.matBang.length>2) cam.push(offset(b.matBang, -CACH_NHA));
  });
  (D.sanBong||[]).forEach(function(sb){
    if(sb.diem && sb.diem.length>2) cam.push(offset(sb.diem, -CACH_SAN));
  });

  /* đường đi bên trong khuôn viên: giữ lòng đường thông thoáng */
  var loi = [];
  (D.duong||[]).forEach(function(r){
    if(!r.diem || r.diem.length<2) return;
    var co=false;
    for(var i=0;i<r.diem.length;i++) if(trongDaGiac(r.diem[i], ranh)){ co=true; break; }
    if(co) loi.push(r);
  });

  function xaDuong(x,z){
    for(var i=0;i<loi.length;i++){
      var r=loi[i], nua=r.rong/2 + CACH_DUONG;
      for(var j=0;j<r.diem.length-1;j++){
        var a=r.diem[j], b=r.diem[j+1];
        var dx=b[0]-a[0], dz=b[1]-a[1], L2=dx*dx+dz*dz;
        var t = L2<1e-6 ? 0 : Math.max(0, Math.min(1,
                ((x-a[0])*dx + (z-a[1])*dz)/L2));
        var qx=a[0]+dx*t, qz=a[1]+dz*t;
        if((x-qx)*(x-qx) + (z-qz)*(z-qz) < nua*nua) return false;
      }
    }
    return true;
  }

  /* lưới băm để dò khoảng cách giữa các gốc cây cho khỏi quét toàn bộ */
  var O = 6, luoi = {};
  function khoa(x,z){ return Math.floor(x/O) + ':' + Math.floor(z/O); }
  function ghi(x,z){ (luoi[khoa(x,z)] = luoi[khoa(x,z)] || []).push([x,z]); }
  function thoang(x,z,d){
    var gx=Math.floor(x/O), gz=Math.floor(z/O), d2=d*d;
    for(var i=gx-1;i<=gx+1;i++) for(var j=gz-1;j<=gz+1;j++){
      var o=luoi[i+':'+j];
      if(!o) continue;
      for(var k=0;k<o.length;k++)
        if((o[k][0]-x)*(o[k][0]-x) + (o[k][1]-z)*(o[k][1]-z) < d2) return false;
    }
    return true;
  }
  D.cay.forEach(function(c){ ghi(c.x, c.z); });

  var them = [];
  function dat(x, z, d){
    if(!trongDaGiac([x,z], ranh)) return false;
    if(TUONG && Math.hypot(x-TUONG.x, z-TUONG.z) < TUONG.donCay) return false;
    if(THAP && Math.hypot(x-THAP.x, z-THAP.z) < THAP.donCay) return false;
    for(var i=0;i<cam.length;i++) if(trongDaGiac([x,z], cam[i])) return false;
    if(!xaDuong(x,z)) return false;
    if(!thoang(x, z, d || CACH_CAY)) return false;
    var r = ng();
    var loai = r < 0.70 ? 'co-thu' : (r < 0.90 ? 'cau' : 'bui');
    var cao = loai === 'co-thu' ? 8.4 + ng()*6.4
            : loai === 'cau'    ? 6.0 + ng()*3.2
                                : 2.0 + ng()*1.2;
    them.push({x:x, z:z, loai:loai, cao:Math.round(cao*10)/10, trong:1});
    ghi(x, z);
    return true;
  }

  /* ── 1. vành cổ thụ men theo tường bao, lùi vào trong 6m ── */
  var trong6 = offset(ranh, 6.0);
  if(trong6 && trong6.length === ranh.length){
    var du = 0;
    for(var i=0;i<trong6.length;i++){
      var a=trong6[i], b=trong6[(i+1)%trong6.length];
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
      if(L < 0.01) continue;
      var t = du;
      while(t < L){
        var r = t/L;
        dat(a[0]+dx*r + (ng()-0.5)*2.4, a[1]+dz*r + (ng()-0.5)*2.4);
        t += 7.2 + ng()*2.6;
      }
      du = t - L;
    }
  }

  /* ── 2. hai hàng cây kèm lối đi trong trường ── */
  loi.forEach(function(r){
    var lech = r.rong/2 + 3.4;
    var du = 0;
    for(var i=0;i<r.diem.length-1;i++){
      var a=r.diem[i], b=r.diem[i+1];
      var dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz);
      if(L < 0.01) continue;
      var nx=-dz/L, nz=dx/L;
      var t=du;
      while(t < L){
        var rr=t/L, cx=a[0]+dx*rr, cz=a[1]+dz*rr;
        dat(cx + nx*lech, cz + nz*lech);
        dat(cx - nx*lech, cz - nz*lech);
        t += 8.4 + ng()*2.0;
      }
      du = t - L;
    }
  });

  /* ── 3. rải nốt các khoảng sân còn trống ── */
  for(var gz=bz0; gz<bz1; gz+=8.6){
    for(var gx=bx0; gx<bx1; gx+=8.6){
      dat(gx + ng()*6.0, gz + ng()*6.0, 6.4);
    }
  }

  /* ── giữ trần: bỏ bớt cây thêm nếu vượt, ưu tiên giữ cây rải đều ── */
  var daCo = D.cay.filter(function(c){ return c.trong; }).length;
  var conCho = Math.max(0, TRAN - daCo);
  if(them.length > conCho){
    var giu = [], buoc = them.length / conCho;
    for(var i=0;i<conCho;i++) giu.push(them[Math.floor(i*buoc)]);
    them = giu;
  }
  D.cay = D.cay.concat(them);
})();

var cayTrong = D.cay.filter(function(c){ return c.trong; });
var cayNgoai = D.cay.filter(function(c){ return !c.trong; });

if(CM && CM.vo && CM.la && cayTrong.length){
  var vlVo=new THREE.MeshLambertMaterial({map:napTex(CM.tex.vo)});
  var vlLa=new THREE.MeshLambertMaterial({map:napTex(CM.tex.la),
    alphaTest:0.4, side:THREE.DoubleSide});

  /* Một mô hình nhân ra vài trăm bản dễ lộ ra là ĐỒ SAO CHÉP: cùng dáng,
     cùng bề cao, cùng một sắc lá. Ba mẹo dưới đây phá cái đều ấy mà không
     thêm lấy một tam giác nào — vẫn đúng hai lệnh vẽ như cũ:
       · xoay quanh trục đứng, mỗi cây một góc;
       · bóp nhẹ bề ngang so với bề cao, và nghiêng thân vài độ;
       · đổi sắc tán từng cây bằng instanceColor, non tới già.
     Sắc lá nhân THÊM vào ảnh tán vốn đã xanh, nên phải chỉnh quanh mức 1
     thôi: lệch nhiều là cả rặng cây hoá xanh lét như nhựa.
     Tham số lấy từ một bộ sinh số CỐ ĐỊNH gieo theo chỉ số cây, nên hai
     lớp vỏ và lá của cùng một cây luôn nhận đúng cùng một dáng. */
  [[CM.vo, vlVo, false],[CM.la, vlLa, true]].forEach(function(x){
    var im=new THREE.InstancedMesh(hinhCay(x[0]), x[1], cayTrong.length);
    im.castShadow=true; im.receiveShadow=true;
    var Mx=new THREE.Matrix4(), Qy=new THREE.Quaternion(), Qn=new THREE.Quaternion(),
        V=new THREE.Vector3(), S=new THREE.Vector3(), C=new THREE.Color();
    var _t=20260825;
    function tr(){ _t=(_t*1664525+1013904223)%4294967296; return _t/4294967296; }
    cayTrong.forEach(function(c,k){
      var h=c.cao*(c.loai==='bui'?0.5:1);
      var quay=tr()*Math.PI*2, ngh=(tr()-0.5)*0.10, huong=tr()*Math.PI*2;
      var beo=0.86+tr()*0.30;
      var sR=0.84+tr()*0.30, sG=0.92+tr()*0.18, sB=0.76+tr()*0.30;
      Qy.setFromAxisAngle(new THREE.Vector3(0,1,0), quay);
      Qn.setFromAxisAngle(new THREE.Vector3(Math.cos(huong),0,Math.sin(huong)), ngh);
      Qy.premultiply(Qn);
      V.set(c.x, 0, c.z); S.set(h*beo, h, h*beo);
      Mx.compose(V,Qy,S); im.setMatrixAt(k,Mx);
      if(x[2] && im.setColorAt){ C.setRGB(sR, sG, sB); im.setColorAt(k, C); }
    });
    im.instanceMatrix.needsUpdate=true;
    if(im.instanceColor) im.instanceColor.needsUpdate=true;
    scene.add(im);
  });
}

/* ══ CÂY NGOÀI PHỐ — DỰNG BẰNG HÌNH HỌC ════════════════════════════
   Bản trước là ba tấm phẳng cắt nhau dán ảnh tán. Rẻ thật, nhưng nhìn
   nghiêng là lộ ngay: tán cây mỏng như tờ bìa, xoay camera thì thấy nó
   xoay theo, mà mép ảnh cắt bằng alphaTest nên rìa lá răng cưa.
   Nay dựng khối thật. Mỗi tán là mấy BỚU CẦU chồng lên nhau — bướu to
   thấp, bướu nhỏ cao, lệch tâm mỗi bướu một kiểu — gộp thành một hình
   rồi TÍNH LẠI PHÁP TUYẾN cho cả khối. Chính bước tính lại ấy làm mặt
   cắt giữa các bướu liền thành một mặt cong trơn, không còn thấy từng
   quả cầu riêng lẻ, cũng không thấy cạnh đa giác.
   Ba dáng tán khác nhau, mỗi dáng một InstancedMesh, cộng thân cây là
   sáu lệnh vẽ cho toàn bộ cây ngoài phố. Mỗi cây chừng 450 tam giác,
   so với 12.400 của mô hình cây trong trường — nhân vài trăm cây vẫn
   nhẹ hơn hẳn.                                                        */
(function cayHinhHoc(){
  if(!cayNgoai.length) return;

  var _c = 20260901;
  function nn(){ _c=(_c*1664525+1013904223)%4294967296; return _c/4294967296; }

  /* gộp một danh sách bướu thành một hình tán duy nhất */
  function tanLa(buou){
    var pos=[], idx=[], dinh=0;
    buou.forEach(function(b){
      var q=new THREE.IcosahedronGeometry(b.r, 1);
      q.scale(b.sx||1, b.sy||1, b.sz||b.sx||1);
      q.translate(b.x||0, b.y, b.z||0);
      var p=q.attributes.position.array;
      for(var i=0;i<p.length;i++) pos.push(p[i]);
      if(q.index){ var ix=q.index.array;
        for(var i=0;i<ix.length;i++) idx.push(ix[i]+dinh); }
      else for(var i=0;i<p.length/3;i++) idx.push(dinh+i);
      dinh += p.length/3;
    });
    var g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    g.setIndex(idx);
    /* pháp tuyến trung bình tại mỗi đỉnh: chỗ hai bướu giao nhau được
       vuốt trơn, khối đọc ra như một tán liền chứ không phải chùm cầu */
    g.computeVertexNormals();
    return g;
  }

  /* ba dáng tán, quy về cây cao 1 đơn vị rồi mới phóng theo từng cây */
  var DANG = [
    /* tán xoè rộng, nhiều tầng — dáng xà cừ, phượng */
    tanLa([{r:0.30, y:0.66, sy:0.80, x:-0.10, z: 0.06},
           {r:0.26, y:0.74, sy:0.78, x: 0.16, z:-0.10},
           {r:0.24, y:0.62, sy:0.74, x: 0.08, z: 0.18},
           {r:0.22, y:0.60, sy:0.72, x:-0.16, z:-0.15},
           {r:0.21, y:0.86, sy:0.76, x: 0.02, z: 0.02}]),
    /* tán dựng cao, thuôn — dáng bàng, sấu non */
    tanLa([{r:0.27, y:0.60, sy:0.86, x: 0.05, z:-0.05},
           {r:0.24, y:0.78, sy:0.84, x:-0.09, z: 0.08},
           {r:0.20, y:0.92, sy:0.82, x: 0.06, z: 0.04},
           {r:0.17, y:1.02, sy:0.80, x:-0.02, z:-0.04}]),
    /* BỤI THẤP — không có thân, nên bướu phải hạ sát đất. Dùng chung
       dáng tán cao như hai dáng trên thì bụi lơ lửng gần một mét trên
       không: cây có thân thì phần hụt ấy được thân che, bụi thì không. */
    tanLa([{r:0.42, y:0.40, sy:0.78, x: 0.00, z: 0.00},
           {r:0.32, y:0.53, sy:0.74, x: 0.24, z: 0.14},
           {r:0.30, y:0.50, sy:0.72, x:-0.22, z:-0.16},
           {r:0.26, y:0.60, sy:0.70, x: 0.04, z:-0.20}])
  ];
  var gThan = new THREE.CylinderGeometry(0.035, 0.058, 0.72, 7);
  gThan.translate(0, 0.36, 0);

  var vlThan = new THREE.MeshLambertMaterial({color:M.thanCay});
  var vlLa   = new THREE.MeshLambertMaterial({color:0xFFFFFF});

  /* chia cây theo dáng; bụi thấp thì dùng dáng tròn, bỏ thân */
  var nhom = [[],[],[]];
  cayNgoai.forEach(function(c){
    var k = c.loai==='bui' ? 2 : Math.floor(nn()*2);
    nhom[k].push(c);
  });

  var Mx=new THREE.Matrix4(), Qy=new THREE.Quaternion(), Qn=new THREE.Quaternion(),
      V=new THREE.Vector3(), S=new THREE.Vector3(), Cl=new THREE.Color();

  nhom.forEach(function(ds, k){
    if(!ds.length) return;
    [[DANG[k], vlLa, true], [gThan, vlThan, false]].forEach(function(x){
      var bui = ds.filter(function(c){ return c.loai==='bui'; }).length;
      if(!x[2] && bui === ds.length) return;      // bụi không có thân
      var im=new THREE.InstancedMesh(x[0], x[1], ds.length);
      im.castShadow=true; im.receiveShadow=true;
      ds.forEach(function(c, i){
        var h=c.cao*(c.loai==='bui'?0.55:1);
        var la = c.loai==='bui';
        if(!x[2] && la){ Mx.makeScale(0.0001,0.0001,0.0001); im.setMatrixAt(i,Mx); return; }
        var beo = 0.84 + nn()*0.38;
        Qy.setFromAxisAngle(new THREE.Vector3(0,1,0), nn()*Math.PI*2);
        Qn.setFromAxisAngle(new THREE.Vector3(1,0,0), (nn()-0.5)*0.08);
        Qy.premultiply(Qn);
        V.set(c.x, 0, c.z);
        S.set(h*beo, h, h*beo);
        Mx.compose(V,Qy,S); im.setMatrixAt(i,Mx);
        if(x[2] && im.setColorAt){
          Cl.setRGB(0.30 + nn()*0.22, 0.52 + nn()*0.22, 0.20 + nn()*0.16);
          im.setColorAt(i, Cl);
        }
      });
      im.instanceMatrix.needsUpdate=true;
      if(im.instanceColor) im.instanceColor.needsUpdate=true;
      scene.add(im);
    });
  });
})();

/* ── nhãn nổi ─────────────────────────────────────────────────────── */
var lblBox = document.getElementById('labels');

var nhanCVA = meshCVA.map(function(t){
  if(t.d.khongNhan || !t.d.ten) return {el:null, v:t.tam};
  var el=document.createElement('div');
  el.className='lbl'; el.style.fontSize='10.5px'; el.style.padding='3px 9px';
  el.innerHTML = t.d.ten + (t.d.chacChan==='chua-ro'
    ? '<span style="margin-left:5px;font-size:9.5px;color:#B5713F">?</span>' : '');
  lblBox.appendChild(el);
  return {el:el, v:t.tam};
});

var nhanCong = D.cong.map(function(g){
  var el=document.createElement('div');
  el.className='lbl'; el.style.fontSize='10px'; el.style.padding='3px 8px';
  el.style.background = g.loai==='chinh' ? '#8B1E1E' : '#FDF3DC';
  el.style.color = g.loai==='chinh' ? '#fff' : '#6B5A2E';
  el.textContent = g.loai==='chinh' ? 'CỔNG CHÍNH' : 'Cổng phụ';
  lblBox.appendChild(el);
  return {el:el, v:new THREE.Vector3(g.x, g.loai==='chinh'?11:7, g.z)};
});


/* nhãn cho tượng và tháp đồng hồ */
var nhanPhu = nutPhu.map(function(t){
  var el=document.createElement('div');
  el.className='lbl'; el.style.fontSize='10.5px'; el.style.padding='3px 9px';
  el.style.background='#EFE7F7'; el.style.color='#4A3A63';
  el.textContent=t.d.ten;
  lblBox.appendChild(el);
  return {el:el, v:t.tam, t:t};
});
var cxS=0, czS=0, nS=0;
D.sanBong.forEach(function(sb){ sb.diem.forEach(function(p){cxS+=p[0];czS+=p[1];nS++;}); });
var elSan=document.createElement('div');
elSan.className='lbl'; elSan.style.background='#E7FAF0'; elSan.textContent='Sân thể thao';
lblBox.appendChild(elSan);
var tamSan=new THREE.Vector3(cxS/nS, 10, czS/nS);
/* Nhãn hai con phố chỉ bật từ giai đoạn dự án trường chất lượng cao trở
   đi. Muốn lùi sang giai đoạn cuối thì đổi 5 thành 6 ở dòng dưới. */
var GD_PHO = 5;

var nhanDuong = [];
['Đường Thụy Khuê','Phố Nguyễn Đình Thi'].forEach(function(ten){
  var tot=null, daiNhat=0;
  D.duong.forEach(function(r){
    if(r.ten!==ten) return;
    var dd=0;
    for(var i2=0;i2<r.diem.length-1;i2++)
      dd+=Math.hypot(r.diem[i2+1][0]-r.diem[i2][0], r.diem[i2+1][1]-r.diem[i2][1]);
    if(dd>daiNhat){ daiNhat=dd; tot=r; }
  });
  if(!tot) return;
  var giua = tot.diem[Math.floor(tot.diem.length/2)];
  var el=document.createElement('div');
  el.className='lbl'; el.style.background='#FFF3D6'; el.textContent=ten;
  lblBox.appendChild(el);
  nhanDuong.push({el:el, v:new THREE.Vector3(giua[0], 6, giua[1])});
});

/* ── camera ───────────────────────────────────────────────────────
   Ngoài xoay và phóng, nay thêm KÉO MÀN (chuột phải, hoặc giữ Shift, hoặc
   hai ngón): trước đây camera luôn ngắm vào tâm khuôn viên nên không tài
   nào lại gần Nhà Bát Giác ở rìa bắc được. */
var GOC={th:-0.42, ph:0.82, r:560};
var cam={th:GOC.th, ph:GOC.ph, r:GOC.r};
var tgt={th:GOC.th, ph:GOC.ph, r:GOC.r};
var cxT=0, czT=0;
D.ranhTruong.forEach(function(p){ cxT+=p[0]; czT+=p[1]; });
cxT/=D.ranhTruong.length; czT/=D.ranhTruong.length;
var tamGoc=new THREE.Vector3(cxT,0,czT);
var tam=new THREE.Vector3(cxT,0,czT), ranhCh=0;

function dat(){
  cam.th+=(tgt.th-cam.th)*0.12; cam.ph+=(tgt.ph-cam.ph)*0.12; cam.r+=(tgt.r-cam.r)*0.12;
  camera.position.set(tam.x+cam.r*Math.sin(cam.ph)*Math.sin(cam.th),
                      tam.y+cam.r*Math.cos(cam.ph),
                      tam.z+cam.r*Math.sin(cam.ph)*Math.cos(cam.th));
  camera.lookAt(tam);
}
function cham(){ ranhCh=Date.now(); }
function ghim(){   /* giữ tâm ngắm trong phạm vi bản đồ */
  tam.x=Math.max(-560, Math.min(700, tam.x));
  tam.z=Math.max(-700, Math.min(420, tam.z));
}

var keo=false, keoMan=false, px=0, py=0, pinch=0, pinchX=0, pinchY=0;
cv.addEventListener('contextmenu', function(e){ e.preventDefault(); });
cv.addEventListener('pointerdown', function(e){
  keoMan = (e.button===2 || e.button===1 || e.shiftKey);
  keo=true; px=e.clientX; py=e.clientY;
  cv.classList.add('drag'); cv.setPointerCapture(e.pointerId); cham();
});
cv.addEventListener('pointermove', function(e){
  if(!keo) return;
  var dx=e.clientX-px, dy=e.clientY-py;
  if(keoMan){
    var k=cam.r*0.0016;
    var s=Math.sin(cam.th), c=Math.cos(cam.th);
    tam.x -= ( c*dx - s*dy)*k;
    tam.z -= ( s*dx + c*dy)*k;
    ghim();
  } else {
    tgt.th -= dx*0.006;
    tgt.ph  = Math.max(0.10, Math.min(1.30, tgt.ph - dy*0.005));
  }
  px=e.clientX; py=e.clientY; cham();
});
function thoi(){ keo=false; keoMan=false; cv.classList.remove('drag'); }
cv.addEventListener('pointerup', thoi);
cv.addEventListener('pointercancel', thoi);
cv.addEventListener('wheel', function(e){
  e.preventDefault();
  tgt.r = Math.max(22, Math.min(1400, tgt.r*(1 + e.deltaY*0.0012)));
  cham();
}, {passive:false});
cv.addEventListener('touchmove', function(e){
  if(e.touches.length===2){
    var t0=e.touches[0], t1=e.touches[1];
    var d=Math.hypot(t0.clientX-t1.clientX, t0.clientY-t1.clientY);
    var mx=(t0.clientX+t1.clientX)/2, my=(t0.clientY+t1.clientY)/2;
    if(pinch){
      tgt.r=Math.max(22, Math.min(1400, tgt.r*(pinch/d)));
      var k=cam.r*0.0016;
      var s=Math.sin(cam.th), c=Math.cos(cam.th);
      tam.x -= ( c*(mx-pinchX) - s*(my-pinchY))*k;
      tam.z -= ( s*(mx-pinchX) + c*(my-pinchY))*k;
      ghim();
    }
    pinch=d; pinchX=mx; pinchY=my; keo=false; cham();
  }
}, {passive:true});
cv.addEventListener('touchend', function(){ pinch=0; });

function ve(){
  tgt.th=GOC.th; tgt.ph=GOC.ph; tgt.r=GOC.r;
  tam.copy(tamGoc); cham();
}
var kim=document.getElementById('needle');
document.getElementById('bHome').onclick=ve;
document.getElementById('compass').onclick=function(){
  tgt.th=Math.round(cam.th/(Math.PI*2))*Math.PI*2; cham(); };
document.getElementById('bIn').onclick=function(){ tgt.r=Math.max(22,tgt.r*0.72); cham(); };
document.getElementById('bOut').onclick=function(){ tgt.r=Math.min(1400,tgt.r*1.38); cham(); };

/* ── bảng thông tin: bấm vào toà nhà hoặc cổng ──────────────────────── */
var ray=new THREE.Raycaster(), chuot=new THREE.Vector2(), chon=null;
var panel=document.getElementById('panel');
function esc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

function tab(i){
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function(b){
    b.classList.toggle('on', +b.dataset.p===i); });
  for(var k=0;k<3;k++) document.getElementById('pane'+k).classList.toggle('on', k===i);
}
Array.prototype.forEach.call(document.querySelectorAll('.tab'), function(b){
  b.onclick=function(){ tab(+b.dataset.p); }; });

var MAU_CC={'chac':['#2F5A45','#E4EDE7'],'uoc':['#9A6B25','#F7EBD6'],
            'chua-ro':['#A0522D','#F6E3D8']};
/* ══ KHO NỘI DUNG TRÊN GITHUB ══════════════════════════════════════
   Bài viết và ảnh KHÔNG nhúng cứng vào tệp này nữa. Đẩy một tệp .txt
   lên repo là bảng thông tin của công trình tương ứng tự đọc được.

   ĐẶT TÊN TỆP — lấy tên công trình bỏ dấu, thay khoảng trắng bằng gạch
   ngang. Cổng thì lấy thẳng mã cổng:
       B                     ->  noidung/b.txt
       Nhà Bát Giác          ->  noidung/nha-bat-giac.txt
       Hội trường Thăng Long ->  noidung/hoi-truong-thang-long.txt
       Cổng chính            ->  noidung/cong-chinh.txt
   Muốn đặt tên khác thì thêm khoá "tep" vào công trình trong DULIEU.
   Ảnh thì thêm hậu tố -anh:   noidung/b-anh.txt

   ĐỊNH DẠNG b.txt — chỉ vài quy ước, viết bằng Notepad cũng xong:
       # Tên bài viết
       @ Nguyễn Văn A · lớp 12 Toán · 2024
       Xuống dòng trống là sang đoạn mới.
       ## Tiểu mục
       ![chú thích ảnh](https://.../anh.jpg)
       ---            <- ba gạch: hết bài này, sang bài khác

   ĐỊNH DẠNG b-anh.txt — mỗi dòng một ảnh, ngăn bằng dấu |
       https://.../sanTruong.jpg | 1998 | Sân trường nhìn từ nhà B

   TUYỆT ĐỐI KHÔNG dán token GitHub vào tệp này. Tệp HTML chạy trên máy
   người xem, ai mở công cụ nhà phát triển cũng đọc được. Để repo ở chế
   độ public là raw.githubusercontent.com cho đọc thoải mái, không cần
   xác thực gì hết.                                                    */
var KHO = {
  chu:    'ShostaKid',           // tên tài khoản GitHub
  repo:   'CVA-project',         // tên repo
  nhanh:  'main',                // nhánh
  thuMuc: 'noidung'              // thư mục chứa .txt trong repo
};
function khoBat(){
  return KHO.chu && KHO.repo && KHO.chu.indexOf('DOI-TEN') < 0;
}
function khoURL(tep){
  return 'https://raw.githubusercontent.com/' + KHO.chu + '/' + KHO.repo +
         '/' + KHO.nhanh + '/' + (KHO.thuMuc ? KHO.thuMuc + '/' : '') + tep;
}
/* bỏ dấu tiếng Việt rồi rút thành tên tệp */
function rutTen(s){
  return String(s).normalize('NFD')
    .replace(/[̀-ͯ]/g,'')      // tách dấu ra rồi bỏ
    .replace(/đ/g,'d').replace(/Đ/g,'D')   // đ Đ không có dạng tách
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

var khoCache = {};
function khoTai(tep){
  if(khoCache[tep]) return khoCache[tep];
  if(!khoBat()){ khoCache[tep] = Promise.resolve(null); return khoCache[tep]; }
  khoCache[tep] = fetch(khoURL(tep), {cache:'no-cache'})
    .then(function(r){ return r.ok ? r.text() : null; })
    .catch(function(){ return null; });   // chưa có tệp, hoặc đang ngoại tuyến
  return khoCache[tep];
}

/* chỉ nhận đường dẫn ảnh http(s), chặn javascript: và data: */
function anhHopLe(u){ return /^https?:\/\/[^\s"'<>]+$/i.test(String(u).trim()); }

/* ── dịch .txt sang HTML ────────────────────────────────────────────
   Cố ý làm mỏng: mấy quy ước ở trên là đủ cho một bài viết của học
   sinh, mà cũng không kéo theo cả thư viện markdown vào tệp. */
function khoDich(vb){
  return vb.replace(/\r/g,'').split(/\n-{3,}\n/).map(function(bai){
    var d = bai.split('\n');
    var tieuDe = '', tacGia = '', than = [], doan = [];
    function xong(){
      if(!doan.length) return;
      than.push('<div class="bvn">' + esc(doan.join(' ')) + '</div>');
      doan = [];
    }
    d.forEach(function(l){
      var t = l.trim();
      if(!t){ xong(); return; }
      var mAnh = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if(mAnh){
        xong();
        if(anhHopLe(mAnh[2])){
          than.push('<img class="bvAnh" alt="' + esc(mAnh[1]) +
            '" src="' + esc(mAnh[2]).replace(/"/g,'&quot;') + '">');
          if(mAnh[1]) than.push('<div class="cap">' + esc(mAnh[1]) + '</div>');
        }
        return;
      }
      if(/^##\s+/.test(t)){ xong();
        than.push('<div class="bvh">' + esc(t.replace(/^##\s+/,'')) + '</div>'); return; }
      if(/^#\s+/.test(t)){ xong(); tieuDe = t.replace(/^#\s+/,''); return; }
      if(/^@\s+/.test(t)){ xong(); tacGia = t.replace(/^@\s+/,''); return; }
      doan.push(t);
    });
    xong();
    if(!tieuDe && !than.length) return '';
    return '<div class="bv">' +
      (tieuDe ? '<div class="bvt">' + esc(tieuDe) + '</div>' : '') +
      (tacGia ? '<div class="bva">' + esc(tacGia) + '</div>' : '') +
      than.join('') + '</div>';
  }).join('');
}
function khoDichAnh(vb){
  return vb.replace(/\r/g,'').split('\n').map(function(l){
    var t=l.trim(); if(!t || t.charAt(0)==='#') return '';
    var p=t.split('|');
    var u=(p[0]||'').trim();
    if(!anhHopLe(u)) return '';
    var nam=(p[1]||'').trim(), ct=(p[2]||'').trim();
    return '<img class="bvAnh" alt="' + esc(ct) + '" src="' +
      esc(u).replace(/"/g,'&quot;') + '">' +
      ((nam||ct) ? '<div class="cap">' + esc([nam,ct].filter(Boolean).join(' · ')) +
        '</div>' : '');
  }).join('');
}

var luotPanel = 0;      // chống nội dung tải chậm đè lên bảng vừa mở sau
function moPanel(b, laCong){
  chon=b;
  var luot = ++luotPanel;
  document.getElementById('pn').textContent=b.ten;
  var cc=(D.chacChan[b.chacChan]||{ten:'Chưa rõ'}).ten;
  var mc=MAU_CC[b.chacChan]||MAU_CC['chua-ro'];
  var dong;
  if(laCong){
    dong='Cổng ra vào'+(b.loai==='chinh'?' · cổng chính':' · cổng phụ')+
         ' · rộng '+(+b.rong).toFixed(1)+' m';
  } else if(b.laPhu){
    /* tượng, tháp: không có số tầng, cũng chẳng có mặt bằng */
    var gp=D.giaiDoan[b.tuGD]||D.giaiDoan[0];
    dong='Công trình trong sân · có mặt từ giai đoạn <b>'+esc(gp.ten)+
         '</b> ('+gp.tu+'–'+gp.den+')';
  } else {
    var g0=D.giaiDoan[b.tuGD]||D.giaiDoan[0];
    dong='Có mặt từ giai đoạn <b>'+esc(g0.ten)+'</b> ('+g0.tu+'–'+g0.den+')'+
         (b.tang?' · '+b.tang+' tầng':'')+
         ' · '+esc((D.nhom[b.nhom]||{ten:''}).ten);
  }
  document.getElementById('py').innerHTML=dong+
    '<div><span class="huy" style="color:'+mc[0]+';background:'+mc[1]+'">'+
    esc(cc).toUpperCase()+'</span></div>';
  document.getElementById('pnote').textContent=b.ghiChu||'Chưa có phần giới thiệu.';

  /* nội dung dựng sẵn trong DULIEU — dùng ngay, khỏi chờ mạng */
  var sanAnh = (b.anh&&b.anh.length)
    ? b.anh.map(function(a){ return '<div class="photo">Ảnh '+esc(a.file)+
        '<br>sẽ hiện ở đây</div><div class="cap">'+a.nam+' · '+esc(a.chuThich)+'</div>'; }).join('')
    : '';
  var sanBai = (b.baiViet&&b.baiViet.length)
    ? b.baiViet.map(function(v){ return '<div class="bv"><div class="bvt">'+esc(v.tieuDe)+
        '</div><div class="bva">'+esc(v.tacGia)+' · lớp '+esc(v.lop)+
        '</div><div class="bvn">'+esc(v.noiDung)+'</div></div>'; }).join('')
    : '';

  /* ── nội dung lấy từ kho GitHub ──────────────────────────────────
     Đặt SAU phần dựng sẵn, không ghi đè: tệp trên repo là phần bổ
     sung, mất mạng thì bảng vẫn còn nguyên nội dung gốc. */
  /* Tượng và tháp đã có sẵn mã id, dùng luôn làm tên tệp cho gọn:
     noidung/tuong-chu-van-an.txt · noidung/thap-dong-ho.txt */
  var ten = b.tep || rutTen((laCong || b.laPhu) ? (b.id || b.ten) : b.ten);
  var doi = khoBat()
    ? '<div class="cap" id="dangTai">Đang lấy nội dung từ kho…</div>' : '';
  var trong1 = '<div class="cap">Chưa sưu tầm được ảnh cho mục này.'+
    (khoBat()?' Đẩy tệp <b>'+esc(ten)+'-anh.txt</b> lên repo là ảnh hiện ở đây.':'')+'</div>';
  var trong2 = '<div class="cap">Chưa có bài viết. '+
    (khoBat()?'Đẩy tệp <b>'+esc(ten)+'.txt</b> lên repo là bài hiện ở đây.'
            :'Học sinh có thể đóng góp cho mục này.')+'</div>';

  document.getElementById('pane1').innerHTML = sanAnh + (sanAnh?'':doi) || trong1;
  document.getElementById('pane2').innerHTML = sanBai + (sanBai?'':doi) || trong2;

  function dat(paneId, san, trong, html){
    if(luot !== luotPanel) return;                 // bảng đã đổi, bỏ qua
    var el = document.getElementById(paneId);
    if(html) el.innerHTML = san + html;
    else if(!san) el.innerHTML = trong;
    else el.innerHTML = san;
  }
  khoTai(ten + '.txt').then(function(vb){
    dat('pane2', sanBai, trong2, vb ? khoDich(vb) : '');
  });
  khoTai(ten + '-anh.txt').then(function(vb){
    dat('pane1', sanAnh, trong1, vb ? khoDichAnh(vb) : '');
  });

  tab(0); panel.classList.add('show'); panel.scrollTop=0;
  meshCVA.forEach(function(x){
    x.tuong.emissive=new THREE.Color(x.d===b?0x2A2410:0x000000); });
}
function dongPanel(){
  chon=null; panel.classList.remove('show');
  meshCVA.forEach(function(x){ x.tuong.emissive=new THREE.Color(0x000000); });
}
document.getElementById('px').onclick=dongPanel;

cv.addEventListener('click', function(e){
  var r=cv.getBoundingClientRect();
  chuot.x=((e.clientX-r.left)/r.width)*2-1;
  chuot.y=-((e.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(chuot, camera);
  /* tượng và tháp: bắn tia thẳng vào khối, trúng đâu mở bảng đó */
  var hitP=ray.intersectObjects(nutPhu.filter(function(t){ return t.G.visible; })
    .map(function(t){return t.G;}), true);
  if(hitP.length){
    var op=hitP[0].object;
    while(op && nutPhu.every(function(t){ return t.G!==op; })) op=op.parent;
    var tp=nutPhu.find(function(t){ return t.G===op; });
    if(tp){ moPanel(tp.d, false); cham(); return; }
  }
  var hien=meshCVA.filter(function(x){ return x.G.visible; });
  var hit=ray.intersectObjects(hien.map(function(x){return x.G;}), true);
  if(hit.length){
    var o=hit[0].object;
    while(o && hien.every(function(x){ return x.G!==o; })) o=o.parent;
    var t=hien.find(function(x){ return x.G===o; });
    if(t && t.d.ten){ moPanel(t.d, false); cham(); return; }
    if(t){ dongPanel(); cham(); return; }
  }
  /* không trúng nhà thì thử xem có bấm gần cổng nào không */
  var gan=null, minD=1e9;
  nutCong.forEach(function(c){
    var v=c.tam.clone().project(camera);
    var px=(v.x*0.5+0.5)*cv.clientWidth, py=(-v.y*0.5+0.5)*cv.clientHeight;
    var d=Math.hypot(px-(e.clientX-r.left), py-(e.clientY-r.top));
    if(d<minD){ minD=d; gan=c; }
  });
  if(gan && minD<46){ moPanel(gan.d, true); cham(); return; }
  dongPanel(); cham();
});

/* ── trục thời gian ────────────────────────────────────────────────── */
var gd = D.giaiDoan.length-1, choi = null;
var sl=document.getElementById('yr'), nl=document.getElementById('yl');
var elEvt=document.getElementById('evt');
sl.min=0; sl.max=D.giaiDoan.length-1; sl.value=gd;

document.getElementById('marks').innerHTML = D.giaiDoan.map(function(g,i){
  return '<button class="mk" data-g="'+i+'" title="'+g.tu+'–'+g.den+'">'+g.ten+'</button>';
}).join('');
Array.prototype.forEach.call(document.querySelectorAll('.mk'), function(b){
  b.onclick=function(){ dungChay(); datGD(+b.dataset.g); cham(); }; });

function conTonTai(b, g){
  return g >= b.tuGD && (b.denGD===null || b.denGD===undefined || g <= b.denGD);
}
function datGD(i){
  gd=i; sl.value=i;
  var g=D.giaiDoan[i];
  nl.innerHTML='<b>'+g.ten+'</b><i>'+g.tu+' – '+g.den+'</i>';
  Array.prototype.forEach.call(document.querySelectorAll('.mk'), function(b){
    b.classList.toggle('on', +b.dataset.g===i); });
  var e=[g.tomTat];
  D.suKien.forEach(function(sk){ if(sk.gd===i) e.push(sk.tieuDe); });
  D.nhaCVA.forEach(function(b){ if(b.tuGD===i) e.push('▲ '+b.ten); });
  elEvt.innerHTML = e.map(function(x,k){
    return k===0 ? '<span style="color:#5B5648">'+esc(x)+'</span>' : esc(x);
  }).join('  ·  ');
  if(chon && chon.tuGD!==undefined && !conTonTai(chon, i)) dongPanel();
}
sl.oninput=function(){ dungChay(); datGD(+sl.value); cham(); };

var bp=document.getElementById('bPlay');
function dungChay(){ if(choi){ clearInterval(choi); choi=null; bp.textContent='▶'; } }
bp.onclick=function(){
  cham(); if(choi){ dungChay(); return; }
  bp.textContent='❙❙';
  if(gd >= D.giaiDoan.length-1) datGD(0);
  choi=setInterval(function(){
    if(gd >= D.giaiDoan.length-1){ dungChay(); return; } datGD(gd+1); }, 2600);
};

/* ── thu gọn / mở lại dòng thời gian ───────────────────────────────── */
var oTime=document.getElementById('time'), nMo=document.getElementById('tMo');
document.getElementById('tGon').onclick=function(){
  oTime.classList.add('thu'); nMo.classList.add('hien');
};
nMo.onclick=function(){
  oTime.classList.remove('thu'); nMo.classList.remove('hien');
};

/* ── vòng lặp ──────────────────────────────────────────────────────── */
var v3=new THREE.Vector3();
function datNhan(el, vec){
  v3.copy(vec).project(camera);
  var hien = v3.z<1;
  el.style.opacity = hien?1:0;
  if(hien){
    el.style.left=((v3.x*0.5+0.5)*cv.clientWidth)+'px';
    el.style.top=((-v3.y*0.5+0.5)*cv.clientHeight)+'px';
  }
}
function khung(){
  requestAnimationFrame(khung);
  if(!keo && ranhCh && Date.now()-ranhCh>20000){
    if(Math.abs(tgt.th-GOC.th)>0.01||Math.abs(tgt.ph-GOC.ph)>0.01||Math.abs(tgt.r-GOC.r)>1) ve();
    ranhCh=0;
  }
  dat();
  kim.style.transform='rotate('+(cam.th*180/Math.PI).toFixed(1)+'deg)';
  var w=cv.clientWidth,h=cv.clientHeight,pr=renderer.getPixelRatio();
  if(cv.width!==Math.floor(w*pr)||cv.height!==Math.floor(h*pr)){
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  /* sân thể thao, tường bao, nhà ngoài phố hiện dần theo giai đoạn */
  /* Sân thể thao chỉ có từ giai đoạn dự án trường chất lượng cao. Trước
     đó KHÔNG được để lại cái nhãn nổi lửng lơ giữa bãi đất trống — bản
     trước quên tắt nhãn nên kéo trục thời gian về 1908 vẫn thấy chữ
     "Sân thể thao" trôi trên nền cỏ. */
  lopSan.visible = gd >= (D.sanBong[0].tuGD||0);
  elSan.style.display = lopSan.visible ? '' : 'none';
  lopTuong.visible = gd >= 4;
  /* nhà ngoài phố cũng MỌC LÊN thay vì hiện ra như ma */
  Object.keys(lopNhaNgoai).forEach(function(k){
    var L=lopNhaNgoai[k];
    var muc = gd >= L.tuGD ? 1 : 0;
    if(Math.abs(muc-L.p) > 0.002) L.p += (muc-L.p)*0.11; else L.p = muc;
    if(L.p <= 0.002){ L.G.visible=false; return; }
    L.G.visible=true;
    var e = L.p<0.5 ? 4*L.p*L.p*L.p : 1-Math.pow(-2*L.p+2,3)/2;
    L.G.scale.y = Math.max(0.0001, e);
    var dangMoc2 = e < 0.999;
    L.mats.forEach(function(m){
      if(m.transparent !== dangMoc2){ m.transparent = dangMoc2; m.needsUpdate = true; }
      m.opacity = dangMoc2 ? (0.15+0.85*e) : 1;
    });
  });

  /* nhà mọc lên / lún xuống theo giai đoạn */
  meshCVA.forEach(function(t){
    var muc = conTonTai(t.d, gd) ? 1 : 0;
    if(Math.abs(muc-t.p) > 0.002) t.p += (muc-t.p)*0.13; else t.p = muc;
    if(t.p <= 0.002){ t.G.visible=false; return; }
    t.G.visible=true;
    var e = t.p<0.5 ? 4*t.p*t.p*t.p : 1-Math.pow(-2*t.p+2,3)/2;
    t.G.scale.y = Math.max(0.0001, e);
    var dangMoc = e < 0.999;
    for(var i=0;i<t.mats.length;i++){
      var m=t.mats[i];
      /* transparent:true luôn bật khiến mặt sau lọt qua mặt trước.
         Chỉ bật khi nhà đang mọc, xong thì tắt hẳn cho khối đặc. */
      if(m.transparent !== dangMoc){ m.transparent = dangMoc; m.needsUpdate = true; }
      m.opacity = dangMoc ? (0.2+0.8*e) : 1;
    }
  });
  nhanCVA.forEach(function(x, i){
    if(!x.el) return;
    var t = meshCVA[i];
    if(t && t.p < 0.72){ x.el.style.opacity = 0; return; }
    datNhan(x.el, x.v);
  });
  if(lopSan.visible) datNhan(elSan, tamSan);
  nhanCong.forEach(function(x){ datNhan(x.el, x.v); });
  /* tượng và tháp mọc lên theo giai đoạn như các công trình khác */
  nhanPhu.forEach(function(x){
    var hienP = gd >= (x.t.d.tuGD||0);
    x.t.G.visible = hienP;
    x.el.style.display = hienP ? '' : 'none';
    if(hienP) datNhan(x.el, x.v);
  });
  nhanDuong.forEach(function(x){
    var hienPho = gd >= GD_PHO;
    x.el.style.display = hienPho ? '' : 'none';
    if(hienPho) datNhan(x.el, x.v);
  });
  renderer.render(scene,camera);
}
ve(); khung();
})();
