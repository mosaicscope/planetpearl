/* ------------------------------------------------------------------
   Planet Pearl — the one place to edit links and contact details.
   ------------------------------------------------------------------ */
window.PP_CONFIG = {
  links: {
    youtube:   'https://www.youtube.com/@planetpearl',
    subscribe: 'https://www.youtube.com/@planetpearl?sub_confirmation=1',
    videos:    'https://www.youtube.com/@planetpearl/videos',
    playlists: 'https://www.youtube.com/@planetpearl/playlists',
    blog:      'https://planetpearlliving.com',
    instagram: 'https://www.instagram.com/planetpearlliving/',
    facebook:  'https://www.facebook.com/PlanetPearl',
    shop:      'https://planetpearl.felt.co.nz',
    craftclub: 'https://www.craftclubco.com/pearlinnz'
  },
  discountCode: 'PEARLINJACOB10',

  /* Put your email here (e.g. 'hello@planetpearlliving.com') and every
     "get in touch" button becomes an email link. While it is empty the
     buttons open an Instagram message to you instead. */
  email: 'pearlinjacob@gmail.com',
  instagramDM: 'https://ig.me/m/planetpearlliving'
};

/* The hero film rendered in Blender (frames in assets/hero/) */
window.PP_CONFIG.film = { frames: 90, dir: 'assets/hero/f_', pad: 4, ext: 'webp', w: 840, h: 980, tailXFrac: 0.6155, useFrames: 52 };

/* Things the locket (dev panel) can plug in. Visitors see them once they are
   saved in the locket on your own browser, or pasted in here for everyone. */
window.PP_CONFIG.social = {
  instagramHandle: 'planetpearlliving',
  instagramPosts: [],      // newest first, e.g. ['https://www.instagram.com/p/XXXXXXXX/']
  pinterestBoard: '',      // e.g. 'https://www.pinterest.com/yourname/your-board/'
  soundcloud: '',          // a SoundCloud playlist or track link
  announcement: ''         // one friendly line shown above the title
};
window.PP_CONFIG.passcode = '1974';
