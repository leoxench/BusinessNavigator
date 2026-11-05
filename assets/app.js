(function(){
  const themeKey = 'businessnavigator-theme-v2';
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(themeKey);
  root.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';

  function syncThemeButton(button){
    const isDark = root.dataset.theme === 'dark';
    button.textContent = isDark ? '☀' : '☾';
    button.setAttribute('aria-label', isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему');
    button.setAttribute('title', isDark ? 'Світла тема' : 'Темна тема');
  }

  document.querySelectorAll('.site-nav').forEach(nav=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='theme-toggle';
    button.setAttribute('data-theme-toggle','');
    syncThemeButton(button);
    const navActions=nav.querySelector('.nav-actions');
    nav.insertBefore(button,navActions||nav.querySelector('.hamburger'));
    button.addEventListener('click',()=>{
      root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';
      localStorage.setItem(themeKey,root.dataset.theme);
      document.querySelectorAll('[data-theme-toggle]').forEach(syncThemeButton);
    });
  });

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

  document.querySelectorAll('[data-formspree-form]').forEach(form=>{
    form.addEventListener('submit',async (event)=>{
      event.preventDefault();
      if(!form.reportValidity()) return;

      const note=form.querySelector('[data-form-note]');
      const submit=form.querySelector('[type="submit"]');
      const idleText=submit?.textContent||'НАДІСЛАТИ';
      if(note){note.textContent='Надсилаємо повідомлення...';note.dataset.state='';}
      if(submit){submit.disabled=true;submit.textContent='НАДСИЛАЄМО...';}
      form.setAttribute('aria-busy','true');

      try{
        const response=await fetch(form.action,{
          method:'POST',
          body:new FormData(form),
          headers:{Accept:'application/json'}
        });
        const payload=await response.json().catch(()=>({}));
        if(!response.ok){
          const message=Array.isArray(payload.errors)
            ? payload.errors.map(error=>error.message).filter(Boolean).join(' ')
            : '';
          throw new Error(message||'Не вдалося надіслати повідомлення. Спробуйте ще раз.');
        }
        form.reset();
        if(note){note.textContent='Дякуємо! Повідомлення надіслано. Ми зв’яжемося з вами найближчим часом.';note.dataset.state='success';}
      }catch(error){
        if(note){note.textContent=error.message||'Не вдалося надіслати повідомлення. Спробуйте ще раз.';note.dataset.state='error';}
      }finally{
        if(submit){submit.disabled=false;submit.textContent=idleText;}
        form.removeAttribute('aria-busy');
      }
    });
  });

  import('./firebase-auth.js').catch((error)=>{
    console.error('Firebase Auth initialization failed',error);
  });
})();
