function jsonp(url, callbackParam='callback'){
  return new Promise((resolve, reject)=>{
    const cbName = `__jsonp_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window[cbName] = (data)=>{ resolve(data); cleanup(); };
    const s = document.createElement('script');
    s.src = url + (url.includes('?')?'&':'?') + `${callbackParam}=${cbName}`;
    s.onerror = ()=>{ reject(new Error('JSONP load error')); cleanup(); };
    document.head.appendChild(s);
    function cleanup(){ try{ delete window[cbName]; }catch{} s.remove(); }
  });
}
