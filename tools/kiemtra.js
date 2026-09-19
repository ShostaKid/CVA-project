/* Bộ đo sa bàn: chụp "vân tay" của bản đang chạy rồi so với mẫu tools/mau.json.

   Vân tay gồm:
     · dulieu  băm từng khoá của DULIEU SAU KHI app đã nắn dữ liệu xong
     · canh    số mesh, số tam giác, băm cả cảnh 3D
     · hang    băm riêng từng mesh theo đúng thứ tự dựng: khi lệch thì chỉ ra
               ĐÚNG mesh nào đổi đầu tiên, khỏi phải dò cả cảnh
     · dom     số id, số mốc thời gian, số nhãn nổi, nội dung nhãn
     · css     số luật, và style tính toán của mười phần tử mẫu

   Cảnh dựng hoàn toàn xác định (code không có Math.random), nên hai lần chạy
   cùng một mã nguồn ra cùng một vân tay. Đó là điều kiện để phép so có nghĩa.

   Cần trang được mở với ?debug thì app mới lộ ra window.SABAN_DEBUG. */
(function(root){
  function fnv(s){
    var h = 0x811c9dc5;
    for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16);
  }
  /* stringify có sắp khoá: hai đối tượng cùng nội dung luôn ra cùng chuỗi,
     bất kể thứ tự khoá (tainguyen.js gán thêm khoá vào cuối DULIEU) */
  function stable(v){
    if(v === null || typeof v !== 'object') return JSON.stringify(v);
    if(Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function(k){
      return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }

  var MAU_CSS = ['#title','.card','#lop','#time','#panel','.mk','#bPlay','#compass','.pill button','#credit'];

  /* W là window của trang sa bàn (iframe hoặc chính trang) */
  function layVanTay(W){
    var D = W.DULIEU, S = W.SABAN_DEBUG;
    if(!D) throw new Error('Không thấy DULIEU: dulieu.js chưa nạp được.');
    if(!S) throw new Error('Không thấy SABAN_DEBUG: trang phải mở với ?debug, và app.js phải chạy hết không lỗi.');
    var out = {ver: 1};

    out.dulieu = {};
    Object.keys(D).sort().forEach(function(k){ out.dulieu[k] = fnv(stable(D[k])); });

    var rows = [], nMesh = 0, tri = 0;
    S.scene.traverse(function(o){
      if(!o.isMesh) return;
      nMesh++;
      var g = o.geometry, p = g.attributes.position, a = p.array, s = 0, i;
      for(i = 0; i < a.length; i++) s += a[i] * ((i % 7) + 1);
      var im = 0;
      if(o.isInstancedMesh){
        var m = o.instanceMatrix.array;
        for(i = 0; i < m.length; i++) im += m[i] * ((i % 5) + 1);
      }
      var n = g.index ? g.index.count : p.count;
      tri += n / 3 * (o.isInstancedMesh ? o.count : 1);
      var mau = o.material && o.material.color ? o.material.color.getHex() : -1;
      rows.push([o.isInstancedMesh ? 'I' : 'M', p.count, g.index ? g.index.count : 0,
        Math.round(s * 1000), Math.round(im * 1000), mau,
        o.material ? o.material.type : '-',
        +o.position.x.toFixed(3), +o.position.y.toFixed(3), +o.position.z.toFixed(3)].join('|'));
    });
    out.canh = {mesh: nMesh, tamGiac: Math.round(tri), bam: fnv(rows.join('\n'))};
    out.hang = rows.map(fnv);

    var doc = W.document;
    var nhan = [].map.call(doc.querySelectorAll('#labels .lbl'), function(e){ return e.textContent; });
    out.dom = {
      soId: doc.querySelectorAll('[id]').length,
      moc: doc.querySelectorAll('#marks .mk').length,
      nhan: nhan.length, nhanBam: fnv(nhan.join('|')),
      tieuDe: doc.title, lang: doc.documentElement.lang,
      yl: doc.getElementById('yl').innerHTML
    };

    var cs = [];
    MAU_CSS.forEach(function(q){
      var e = doc.querySelector(q);
      if(!e){ cs.push(q + ':THIẾU'); return; }
      var c = W.getComputedStyle(e);
      cs.push([q, c.backgroundColor, c.color, c.fontSize, c.fontWeight,
               c.borderRadius, c.boxShadow, c.position, c.padding].join('|'));
    });
    out.css = {tamLop: [].map.call(doc.styleSheets, function(s){ return s.cssRules.length; }),
               mau: fnv(cs.join('\n')), dong: cs};

    out._hangChu = rows;      // chỉ để chẩn đoán, không lưu vào mẫu
    return out;
  }

  /* danh sách chỗ khác giữa mẫu và bản đang chạy; rỗng nghĩa là giống hệt */
  function soVoi(mau, now){
    var d = [];
    Object.keys(mau.dulieu).forEach(function(k){
      if(!(k in now.dulieu)) d.push('DULIEU.' + k + ' MẤT');
      else if(mau.dulieu[k] !== now.dulieu[k]) d.push('DULIEU.' + k + ' đổi nội dung');
    });
    Object.keys(now.dulieu).forEach(function(k){
      if(!(k in mau.dulieu)) d.push('DULIEU.' + k + ' MỚI (mẫu không có)'); });

    ['mesh', 'tamGiac'].forEach(function(k){
      if(mau.canh[k] !== now.canh[k]) d.push('cảnh.' + k + ': ' + mau.canh[k] + ' → ' + now.canh[k]); });
    if(mau.canh.bam !== now.canh.bam){
      var n = Math.max(mau.hang.length, now.hang.length), i;
      for(i = 0; i < n; i++){
        if(mau.hang[i] !== now.hang[i]){
          d.push('cảnh: mesh đầu tiên lệch là #' + i + ' trên ' + n +
                 (now._hangChu && now._hangChu[i] ? ' — hiện là ' + now._hangChu[i] : ' — mesh này không còn'));
          break;
        }
      }
    }
    Object.keys(mau.dom).forEach(function(k){
      if(mau.dom[k] !== now.dom[k]) d.push('dom.' + k + ': ' + JSON.stringify(mau.dom[k]) + ' → ' + JSON.stringify(now.dom[k])); });
    if(JSON.stringify(mau.css.tamLop) !== JSON.stringify(now.css.tamLop))
      d.push('css: số luật ' + mau.css.tamLop + ' → ' + now.css.tamLop);
    if(mau.css.mau !== now.css.mau){
      for(var j = 0; j < mau.css.dong.length; j++){
        if(mau.css.dong[j] !== now.css.dong[j]){
          d.push('css tính toán lệch:\n      mẫu: ' + mau.css.dong[j] + '\n      nay: ' + now.css.dong[j]); break; }
      }
    }
    return d;
  }

  /* bỏ các trường chẩn đoán trước khi lưu thành mẫu */
  function chuanHoaMau(v){
    var r = {};
    Object.keys(v).forEach(function(k){ if(k.charAt(0) !== '_') r[k] = v[k]; });
    return r;
  }

  root.KiemTra = {layVanTay: layVanTay, soVoi: soVoi, chuanHoaMau: chuanHoaMau, fnv: fnv, stable: stable};
})(window);
