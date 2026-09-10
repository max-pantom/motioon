---
title: Cosmos — more context
width: 1080
height: 1080
fps: 25
duration: 20.04
background: "#f4f3f2"
audio: ./assets/soundtrack.m4a
---

# Direction
Recreation of the supplied 83-0.mp4 Cosmos promo. Preserve the square canvas,
warm white, restrained black typography, contextual pills, photo cuts, phone
zoom and closing wordmark. Photos, interface crops and audio are extracted from
the supplied reference. Typography, placement, transitions and scrolling are
authored in HTML and seekable JavaScript. This is a close reconstruction, not a
pixel-identical restoration; cropped source imagery retains source compression.

## Scene: cosmos (0s-20.04s)
<style>
  @font-face { font-family:CosmosInter; src:url('./assets/InterVariable.woff2'); font-weight:100 900; }
  .cosmos { position:absolute; inset:0; overflow:hidden; background:#f4f3f2; color:#080808; font-family:CosmosInter,Arial,sans-serif; font-optical-sizing:none; }
  .shot { position:absolute; inset:0; display:none; }
  .center { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); white-space:nowrap; font-size:48px; font-weight:400; }
  .pill { display:inline-block; background:#fcfbf8; border:1.5px solid #deddd9; border-radius:25px; padding:8px 13px; }
  #cards img { position:absolute; object-fit:cover; }
  #cards { background:#f4f3f2; }
  #cards .labels { position:absolute; inset:0; font-size:48px; color:white; mix-blend-mode:difference; }
  #cards .labels span { position:absolute; top:515px; }
  #cards .labels span:nth-child(1) { left:8px; }
  #cards .labels span:nth-child(2) { left:230px; }
  #cards .labels span:nth-child(3) { left:630px; }
  #cards .labels span:nth-child(4) { left:942px; }
  #detailPhoto { position:absolute; left:127px; top:0; width:790px; height:488px; object-fit:cover; }
  #caption { position:absolute; top:506px; width:1080px; text-align:center; font-size:28px; line-height:1.98; transform:translateX(-18px); }
  #caption .pill { border-radius:16px; padding:0 12px; line-height:1.65; }
  #actions { position:absolute; left:311px; top:746px; display:flex; gap:42px; align-items:center; transform-origin:50% 50%; }
  #actions b { width:82px; height:82px; display:grid; place-items:center; border-radius:50%; background:#1c1c1c; color:white; font-size:32px; font-weight:400; }
  #actions b:nth-child(2) { width:208px; background:white; color:#111; border-radius:50px; font-size:42px; }
  #phonePhoto { position:absolute; width:394px; height:852px; left:343px; top:114px; border-radius:32px; transform-origin:50% 50%; }
  #phoneTouch { position:absolute; width:30px; height:30px; border:5px solid white; border-radius:50%; box-shadow:0 0 0 3px #ffffff55; transform:translate(-50%,-50%); }
  #searchPhone { position:absolute; left:250px; top:138px; width:580px; height:1256px; background:#090909; color:#eee; border-radius:42px; overflow:hidden; transform-origin:50% 0; }
  .status { height:98px; padding:28px 76px 0; display:flex; justify-content:space-between; font-size:25px; }
  .search { margin:5px 48px 15px; height:68px; padding:22px; box-sizing:border-box; border-radius:16px; background:#242424; font-size:21px; }
  .tabs { height:56px; display:flex; justify-content:space-around; align-items:center; border-bottom:2px solid #222; font-size:21px; }
  .tabs span:first-child { color:white; }
  #searchHeader { position:absolute; left:0; top:0; width:580px; height:228px; z-index:2; }
  #queryCover { position:absolute; left:69px; top:121px; width:300px; height:34px; background:#242424; z-index:3; }
  .gridwindow { position:absolute; top:228px; bottom:128px; left:22px; right:22px; overflow:hidden; }
  #gridContent { position:absolute; left:0; top:0; display:flex; gap:23px; }
  .gridcolumn { width:256px; display:flex; flex-direction:column; gap:25px; }
  .gridcolumn img { display:block; width:256px; flex:none; object-fit:fill; }
  #searchFooter { position:absolute; left:0; bottom:0; width:580px; height:128px; z-index:2; }
  #wordmark { font-size:88px; letter-spacing:-7px; }
  #wordmark sup { font-size:24px; letter-spacing:0; vertical-align:top; position:relative; top:13px; margin-left:4px; }
  #opening { position:absolute; inset:0; width:1080px; height:1080px; transform:none; font-size:48px; overflow:visible; }
  #opening text { font-family:CosmosInter,Arial,sans-serif; font-size:48px; font-weight:400; font-variation-settings:'opsz' 14; }
  #logoArt { position:absolute; left:332px; top:500px; width:416px; height:74px; }
  .logo-letter { position:absolute; top:0; height:74px; overflow:hidden; }
  .logo-letter img { position:absolute; top:0; width:416px; height:74px; max-width:none; }
</style>
<div class="cosmos">
  <div style="position:absolute;visibility:hidden"><img src="./assets/dress.png"><img src="./assets/pearls.png"><img src="./assets/flower.png"><img src="./assets/room-detail.png"><img src="./assets/room-full.png"></div>
  <div id="intro" class="shot"><svg id="opening" viewBox="0 0 1080 1080" data-motion="opening" aria-label="What if we had more context?">
    <text id="introWhat">What</text><text id="introIf">if</text><text id="introWe">we</text><text id="introHad">had</text>
    <g id="introContext"><rect x="-15" y="-54" width="324" height="72" rx="27" fill="#fcfbf8" stroke="#deddd9" stroke-width="1.5"/><text>more context</text></g><text id="introQuestion">?</text>
  </svg></div>
  <div id="cards" class="shot" data-motion="photo-cards">
    <img id="dressCard" src="./assets/clean-dress.png" style="left:48px;top:324px;width:288px;height:356px">
    <img id="chairCard" src="./assets/clean-chair.png" style="left:370px;top:306px;width:346px;height:446px">
    <img id="flowerCard" src="./assets/clean-flower.png" style="left:758px;top:324px;width:282px;height:356px">
    <div class="labels"><span>Year</span><span>Location</span><span>Object</span><span>Brand</span></div>
  </div>
  <div id="detail" class="shot"><img id="detailPhoto" src="./assets/chair.png" data-motion="featured-photo"><div id="caption" data-motion="photo-caption"></div><div id="actions"><b>↥</b><b>+</b><b>···</b></div></div>
  <div id="phoneShot" class="shot"><img id="phonePhoto" src="./assets/phone.png" data-motion="phone-preview"><div id="phoneTouch"></div></div>
  <div id="searchShot" class="shot"><div id="searchPhone" data-motion="search-phone">
    <img id="searchHeader" src="./assets/search-header.png" alt="Cosmos search: Iker Ochotorena; Elements, Clusters, Humans">
    <div id="queryCover"></div>
    <div class="gridwindow"><div id="gridContent" data-motion="scrolling-images">
      <div class="gridcolumn">
        <img src="./assets/tile-stair.png" alt="Spiral staircase" style="height:272px">
        <img src="./assets/tile-dining.png" alt="Dining room" style="height:320px">
        <img src="./assets/tile-room.png" alt="Living room" style="height:318px">
        <img src="./assets/tile-bath.png" alt="Stone bathroom" style="height:320px">
        <img src="./assets/tile-sink.png" alt="Stone sink" style="height:318px">
        <img src="./assets/tile-kitchen.png" alt="Kitchen doorway" style="height:287px">
      </div>
      <div class="gridcolumn">
        <img src="./assets/tile-alcove.png" alt="Alcove" style="height:315px">
        <img src="./assets/tile-hall.png" alt="Amber corridor" style="height:254px">
        <img src="./assets/tile-wall.png" alt="Plaster wall" style="height:255px">
        <img src="./assets/tile-stairs.png" alt="Stairwell" style="height:257px">
        <img src="./assets/tile-house.png" alt="House exterior" style="height:179px">
        <img src="./assets/tile-corridor.png" alt="White corridor" style="height:318px">
        <img src="./assets/tile-white-stair.png" alt="White staircase" style="height:237px">
      </div>
    </div></div>
    <img id="searchFooter" src="./assets/search-footer.png" alt="Home, search, add, activity, profile">
  </div></div>
  <div id="outro" class="shot"><div id="closing" class="center" data-motion="closing"></div></div>
  <div id="logoShot" class="shot"><div id="logoArt" data-motion="wordmark" aria-label="COSMOS®"></div></div>
</div>
<script>
(() => {
 const $ = id => document.getElementById(id);
 const clamp = x => Math.max(0,Math.min(1,x));
 const ease = x => 1-Math.pow(1-clamp(x),4);
 const p = (t,a,b) => ease((t-a)/(b-a));
 const track = (t, stops) => {
  if(t<=stops[0][0]) return stops[0][1];
  for(let i=1;i<stops.length;i++) if(t<=stops[i][0]) {
   const [a,x]=stops[i-1], [b,y]=stops[i];
   return x+(y-x)*(t-a)/(b-a);
  }
  return stops[stops.length-1][1];
 };
 const pill = s => '<span class="pill">'+s+'</span>';
 const shots = ['intro','cards','detail','phoneShot','searchShot','outro','logoShot'];
 const assets = ['chair','dress','pearls','flower','room-detail'];
 const captions = [
  'Redirect Chair by '+pill('Earshot Studios')+' (2024)<br>Photo by '+pill('A. Snyder'),
  'The Noir Gown shown by '+pill('Tracy Jones')+'<br>during '+pill('Paris Fashion Week')+' (2015)',
  'Earrings from the “By the Sea” collection by '+pill('Lacy Sweet')+'<br>Designed in Sydney, Australia',
  'Photograph from '+pill('Unformen der Kunst')+'<br>(1928) by '+pill('Karl Blossfeldt'),
  'The '+pill('OOAA Arquitectura Studio')+' in Madrid, Spain.<br>Designed by '+pill('Iker Ochotorena')
 ];
 const logoStops=[0,68,139,213,279,348,416];
 const cardFrames=[
  [3.36,[122,273,265,324],[361,244,363,468],[724,273,242,323]],
  [3.44,[122,273,265,324],[361,261,363,468],[724,273,242,323]],
  [3.6,[65,300,285,350],[363,283,359,457],[747,300,276,349]],
  [3.8,[47,322,291,359],[369,304,347,444],[758,323,282,357]],
  [4,[53,342,286,352],[377,321,331,425],[756,342,278,351]],
  [4.2,[63,354,280,347],[383,333,318,408],[751,354,272,346]],
  [4.4,[73,364,277,340],[388,340,309,395],[745,364,268,339]],
  [4.6,[81,370,273,336],[391,345,303,389],[740,370,265,335]],
  [4.8,[87,373,270,333],[393,348,299,383],[737,373,262,332]],
  [5,[90,375,270,331],[394,350,296,380],[735,375,261,330]],
  [5.2,[92,373,267,329],[393,346,298,378],[735,373,259,328]],
  [5.4,[85,347,267,329],[382,310,318,407],[738,347,260,328]],
  [5.6,[58,251,267,329],[332,143,411,529],[753,251,260,328]]
 ];
 logoStops.slice(0,-1).forEach((left,i)=>{
  const el=document.createElement('span');el.className='logo-letter';el.id='logoLetter'+i;
  el.style.left=left+'px';el.style.width=(logoStops[i+1]-left)+'px';
  const img=document.createElement('img');img.src='./assets/cosmos-wordmark.png';img.alt='';img.style.left=-left+'px';el.append(img);$('logoArt').append(el);
 });
 motion.onFrame(({time:t}) => {
  const active = t<3.36?'intro':t<5.64?'cards':t<9.56?'detail':t<12.32?'phoneShot':t<15.32?'searchShot':t<17.72?'outro':'logoShot';
  shots.forEach(id => $(id).style.display=id===active?'block':'none');
  const handoff=t>9.48&&t<9.56;
  if(handoff) $('phoneShot').style.display='block';
  $('phoneShot').style.opacity=handoff?String(clamp((t-9.48)/.08)):'1';
  if(active==='intro') {
   const x=track(t,[[0,441],[.2,441],[.4,439],[.6,422],[.8,398],[1,385],[1.2,376],[1.4,360],[1.6,292],[1.8,220],[2,200],[2.2,182],[2.4,155]]);
   const words=[['introWhat',0,.04,[[0,640],[.2,580],[.4,565],[.6,560],[.8,558]]],['introIf',129,.28,[[.28,640],[.4,576],[.6,564],[.8,559],[1,558]]],['introWe',169,.48,[[.48,640],[.6,595],[.8,570],[1,562],[1.2,558]]],['introHad',244,.64,[[.64,640],[.8,587],[1,568],[1.2,561],[1.4,558]]]];
   words.forEach(([id,offset,start,ys],i)=>{
    const el=$(id),v=p(t,start,start+.12)*(1-p(t,2.02+i*.10,2.18+i*.10));
    el.setAttribute('x',x+offset-1);el.setAttribute('y',track(t,ys)-1);el.style.opacity=String(v);
    el.style.filter='blur('+(4*(1-p(t,start,start+.2)))+'px)';
   });
   const cx=track(t,[[1.48,660],[1.6,640],[1.8,570],[2,558],[2.2,540],[2.4,509],[2.6,410],[2.8,401],[3,401],[3.2,401],[3.36,401]]);
   const cy=track(t,[[1.48,610],[1.8,590],[2,563],[2.2,557],[2.4,556],[2.6,545],[2.8,524],[3,521],[3.2,530],[3.36,557]]);
   $('introContext').setAttribute('transform','translate('+(cx-3)+' '+(cy-1)+')');
   $('introContext').style.opacity=String(p(t,1.48,1.72));
   $('introContext').querySelector('text').style.filter='blur('+(8*(1-p(t,1.76,2.12)))+'px)';
   $('introContext').querySelector('text').style.opacity=String(p(t,1.8,2));
   $('introQuestion').setAttribute('x',cx+319);$('introQuestion').setAttribute('y',track(t,[[1.8,620],[2,579],[2.2,563],[2.4,558]]));
   $('introQuestion').style.opacity=String(p(t,1.92,2.12)*(1-p(t,2.4,2.56)));
  }
  if(active==='cards') {
   ['dressCard','chairCard','flowerCard'].forEach((id,i)=>{
    ['left','top','width','height'].forEach((key,k)=>$(id).style[key]=track(t,cardFrames.map(row=>[row[0],row[i+1][k]]))+'px');
    $(id).style.opacity=i===1?'1':String(p(t,3.4,3.44));
   });
   const labels=$('cards').querySelectorAll('.labels span');
   const yy=track(t,[[3.36,515],[5.1,515],[5.2,511],[5.4,480],[5.6,403]]);
   labels.forEach((el,i)=>{
    el.style.top=yy+'px';
    el.style.left=track(t,[[3.36,[65,277,568,844][i]],[3.44,[65,260,590,844][i]],[3.8,[8,230,630,942][i]],[5,[54,253,622,901][i]],[5.6,[40,236,610,914][i]]])+'px';
    el.style.opacity=(i===0||i===3)?String(p(t,3.4,3.44)):'1';
   });
  }
  if(active==='detail') {
   const index=t<7.56?0:t<8.12?1:t<8.44?2:t<8.76?3:4;
   $('detailPhoto').src='./assets/'+assets[index]+'.png';
   $('detailPhoto').style.objectPosition=index===4?'center bottom':'center';
   Object.assign($('detailPhoto').style,{left:'127px',width:'790px',height:'488px'});
   $('caption').style.top='506px';$('caption').style.fontSize='28px';
   $('caption').innerHTML=captions[index];
   $('caption').style.opacity='1';
   if(index===0) {
    $('caption').innerHTML='Redirect Chair by '+(t>=5.88?pill('Earshot Studios'):'')+(t>=6.12?' (2024)':'')+(t>=6.28?'<br>Photo by ':'')+(t>=6.52?pill('A. Snyder'):'');
    $('caption').style.transform='translateX(-18px) translateY('+(30*(1-p(t,5.64,6.28)))+'px)';
   } else $('caption').style.transform='translateX(0)';
   $('actions').style.display=index===4?'flex':'none';
   if(index===4) {
    const width=track(t,[[8.76,794],[9,794],[9.12,788],[9.2,780],[9.24,774],[9.28,766],[9.32,758],[9.36,746],[9.4,730],[9.44,708],[9.48,671],[9.52,604]]);
    const height=track(t,[[8.76,486],[9,487],[9.12,492],[9.2,498],[9.24,501],[9.28,506],[9.32,512],[9.36,520],[9.4,531],[9.44,546],[9.48,572],[9.52,616]]);
    $('detailPhoto').src='./assets/room-full.png';
    Object.assign($('detailPhoto').style,{left:(540-width/2)+'px',width:width+'px',height:height+'px'});
    $('caption').style.top=(height+22)+'px';$('caption').style.fontSize=(28*Math.sqrt(width/794))+'px';
    $('actions').style.top=(746+(height-486)*.2)+'px';$('actions').style.transform='scale('+Math.sqrt(width/794)+')';
    $('actions').querySelectorAll('b').forEach((el,i)=>{
     const v=p(t,9.02+i*.14,9.3+i*.14);el.style.opacity=String(v);el.style.transform='translateY('+(70*(1-v))+'px)';
    });
    if(handoff) $('caption').style.opacity='0';
    $('actions').style.visibility=handoff?'hidden':'visible';
   }
  }
  if(active==='phoneShot'||handoff) {
   const width=track(t,[[9.48,671],[9.52,604],[9.56,546],[9.6,514],[9.64,492],[9.68,476],[9.72,464],[9.76,452],[9.8,444],[10,416],[10.2,400],[10.4,394],[10.6,394],[10.8,424],[11,570],[11.2,582],[12,580],[12.32,580]]);
   const bottom=track(t,[[9.48,928],[9.52,934],[9.56,940],[9.6,946],[9.8,958],[10,962],[10.2,964],[10.4,966],[10.6,966],[10.8,960],[11,938],[11.2,936],[12,936],[12.2,942],[12.32,954]]);
   const scale=width/394,top=bottom-852*scale,left=540-width/2;
   Object.assign($('phonePhoto').style,{width:width+'px',height:852*scale+'px',left:left+'px',top:top+'px',transform:'none',borderRadius:32*scale+'px'});
   $('phonePhoto').style.filter=t>12.04?'brightness('+(1-.4*p(t,12.04,12.28))+')':'none';
   $('phoneTouch').style.left=left+236*scale+'px';$('phoneTouch').style.top=top+695*scale+'px';
   $('phoneTouch').style.opacity=String(p(t,11.2,11.36)*(1-p(t,12.08,12.28)));
  }
  if(active==='searchShot') {
   const width=track(t,[[12.32,580],[13.4,580],[13.6,578],[13.8,574],[14,568],[14.2,560],[14.4,548],[14.6,534],[14.8,514],[15,486],[15.2,444],[15.24,434]]);
   const top=track(t,[[12.32,-110],[12.4,-44],[12.6,56],[12.8,112],[13,134],[13.2,138],[13.6,138],[13.8,136],[14,136],[14.2,134],[14.4,132],[14.6,130],[14.8,126],[15,122],[15.2,114],[15.24,112]]);
   $('searchPhone').style.top=top+'px';
   $('searchPhone').style.transform='scale('+(width/580)+')';
   $('queryCover').style.clipPath='inset(0 0 0 '+(100*p(t,12.55,12.85))+'%)';
   $('gridContent').style.opacity=String(p(t,12.94,13.08));
   const scroll=track(t,[[12.94,-40],[13.08,-10],[13.3,0],[13.5,0],[13.8,35],[14,70],[14.2,120],[14.4,200],[14.5,243],[14.6,302],[14.8,430],[15,635],[15.16,905],[15.24,1043]]);
   $('gridContent').style.transform='translateY('+(-scroll)+'px)';
  }
  if(active==='outro') {
   $('closing').innerHTML=t<15.44?'Now':t<15.72?'Now live':t<16.08?'Now live on':'Now live on '+pill('cosmos.so');
   $('closing').style.top=track(t,[[15.32,586],[15.4,568],[15.6,552],[15.8,545],[16,540],[16.08,560],[16.2,553],[16.4,544],[16.8,540]])+'px';
  }
  if(active==='logoShot') {
   for(let i=0;i<6;i++) {
    const v=p(t,17.72+i*.045,18.45+i*.045);
    $('logoLetter'+i).style.transform='translateY('+(94*(1-v))+'px)';
    $('logoLetter'+i).style.opacity=String(p(t,17.72+i*.045,17.84+i*.045));
   }
  }
 });
})();
</script>
