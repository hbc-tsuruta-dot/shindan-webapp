(function(){
  var c = document.getElementById('stars');
  if(!c) return;
  function resize(){
    var p = c.parentElement;
    if(p){ c.width = p.offsetWidth || 390; c.height = p.offsetHeight || 844; }
    else { c.width = innerWidth; c.height = innerHeight; }
  }
  resize(); window.addEventListener('resize', resize);

  var N = 200, stars = [];
  for(var i=0; i<N; i++){
    var t = Math.random();
    var col = t < .12 ? [255,240,185] : t < .22 ? [170,210,255] : [255,255,255];
    stars.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 2.0 + .25,
      base: Math.random() * .65 + .15,
      speed: Math.random() * .016 + .003,
      phase: Math.random() * 6.283,
      col: col
    });
  }

  function draw(){
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    var now = Date.now() / 1000;
    stars.forEach(function(s){
      var x = s.x * c.width, y = s.y * c.height;
      var a = s.base * (.5 + .5 * Math.sin(now * s.speed * 60 + s.phase));
      var cr = 'rgba(' + s.col.join(',') + ',';
      if(s.r > 1.2){
        var g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 4.0);
        g.addColorStop(0,   cr + a.toFixed(3) + ')');
        g.addColorStop(.40, cr + (a*.30).toFixed(3) + ')');
        g.addColorStop(1,   cr + '0)');
        ctx.beginPath(); ctx.arc(x, y, s.r * 4.0, 0, 6.2832);
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.2832);
      ctx.fillStyle = cr + Math.min(a + .25, 1).toFixed(3) + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();
