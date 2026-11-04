(function(){
  const videos = Array.from(document.querySelectorAll('video[data-autoplay]'));

  function safePlay(video){
    if(!video) return;
    video.muted = true;
    const p = video.play();
    if(p && typeof p.catch === 'function') p.catch(()=>{});
  }

  function playAll(){videos.forEach(safePlay)}
  videos.forEach(v=>{v.muted=true;v.setAttribute('muted','');safePlay(v)});
  setInterval(playAll,1000);
  ['click','touchstart'].forEach(evt=>document.addEventListener(evt,playAll,{once:true,passive:true}));

  document.querySelectorAll('[data-menu-toggle]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const menu=document.querySelector('.mobile-menu');
      if(!menu) return;
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded',menu.classList.contains('open')?'true':'false');
    });
  });

  document.querySelectorAll('[data-demo-form]').forEach(form=>{
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const note=form.querySelector('[data-form-note]');
      if(note){note.textContent='Дякуємо! MVP-форма працює локально. Підключіть ваш API або Firebase/Supabase для продакшну.';}
    });
  });
})();
