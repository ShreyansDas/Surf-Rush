(()=>{
'use strict';
const $=id=>document.getElementById(id);
const rand=(a=0,b=1)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rand(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, damp=(k,dt)=>1-Math.exp(-k*dt);
const TAU=Math.PI*2, LANES=[-3.2,0,3.2], SPAWN=175;
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const hex=n=>'#'+n.toString(16).padStart(6,'0');
const isFine=matchMedia('(pointer:fine)').matches;

if(!window.THREE){ $('loading').textContent='Could not load the 3D engine. Check your connection and reload.'; return; }

/* ================= DATA ================= */
// Unlock requirements are configurable here.
const UNLOCKS={
  tropical:null, sunset:{t:'coins',v:500}, abyss:{t:'dist',v:2000}, volcano:{t:'dist',v:5000},
  arctic:{t:'coins',v:2000}, storm:{t:'dist',v:10000}, bio:{t:'runs',v:10}, neon:{t:'coins',v:5000},
  coral:{t:'dist',v:3000}, pirate:{t:'runs',v:20}, canyon:{t:'dist',v:15000}, cosmic:{t:'pb',v:5}
};
const DIFF_NAMES=['','Easy','Easy–Medium','Medium','Medium–Hard','Hard','Very Hard'];
const MAPS=[
 {id:'tropical',name:'Tropical Paradise',diff:1,sky:[0x2a86de,0xc4ecff,0x8fd8e8],fog:0xc4ecff,fogN:70,fogF:330,water:[0x0a7f9e,0x2fe0cf,0xf2fffd],sun:[0xfff1cf,1.15,[0.4,0.75,-0.5]],hemi:[0xd9f3ff,0x3a9a8a,0.75],chop:0.32,swell:0.35,face:2.7,glow:0,stars:0,neb:0,aur:0,
  pal:{rock:0x6b6f73,rock2:0x8a8f8f,wood:0x8b5a2b,acc:0xff4a3d,acc2:0xffffff,metal:0x9aa4ad},scen:'tropical',back:'isles',backCol:[0x5f9a8a,0x7fb5a0],weather:'none',
  obs:{block:['rock','buoy','npc'],low:['log','barrel'],high:['net']},event:'islandPass',coll:null,music:{root:60,mode:'maj',tempo:112},amb:'calm',
  blurb:'Turquoise water, palm islands and distant waterfalls.'},
 {id:'sunset',name:'Sunset Coast',diff:2,sky:[0x3d2470,0xff9550,0xd06a50],fog:0xf08c62,fogN:60,fogF:300,water:[0x2d2552,0xe0864f,0xffe6c4],sun:[0xffb070,1.0,[0.05,0.16,-1]],hemi:[0xffc9a0,0x4a2a50,0.7],chop:0.38,swell:0.4,face:2.9,glow:0,stars:0,neb:0,aur:0,
  shift:{sky:[0x140c33,0x8a3f8e,0x4a2050],fog:0x6a3a7a,water:[0x150f30,0x7a3f7a,0xf0c8e8],sun:0xff6a8a,stars:0.6},
  pal:{rock:0x3a2a3a,rock2:0x5a3a48,wood:0x6a4a3a,acc:0xff7a3a,acc2:0xffe0b0,metal:0x8a7a8a},scen:'sunset',back:'isles',backCol:[0x3a2440,0x4a2a50],weather:'none',
  obs:{block:['rock','buoy','npc'],low:['drift','debris'],high:['net']},event:'goldenHour',coll:null,music:{root:57,mode:'maj',tempo:104},amb:'calm',
  blurb:'The sky burns gold, then deepens to purple as you ride.'},
 {id:'abyss',name:'Blue Abyss',diff:4,sky:[0x13305e,0x7b9cbc,0x2a4a6a],fog:0x6f8fae,fogN:45,fogF:240,water:[0x021632,0x0b4d8f,0xd6ecff],sun:[0xdde9ff,0.9,[-0.3,0.6,-0.6]],hemi:[0xa8c8ff,0x0a2040,0.7],chop:0.7,swell:0.9,face:3.6,glow:0,stars:0,neb:0,aur:0,
  pal:{rock:0x2e3a48,rock2:0x46566a,wood:0x5a4632,acc:0xffb000,acc2:0xffffff,metal:0x6a7a8a,glow:0x2affd0},scen:'abyss',back:null,weather:'mist',
  obs:{block:['bigrock','rock'],low:['barrel','whirl','breaker'],high:['lip']},event:'giantWave',coll:null,music:{root:50,mode:'min',tempo:120},amb:'deep',
  blurb:'Open ocean, enormous rolling swells and whirlpools.'},
 {id:'volcano',name:'Volcano Bay',diff:5,sky:[0x1c0b0b,0xa8452a,0x3a1510],fog:0x5e2416,fogN:40,fogF:250,water:[0x170c10,0x5e2a1c,0xffa070],sun:[0xff7a40,1.0,[0.2,0.35,-1]],hemi:[0xff9a70,0x200808,0.6],chop:0.5,swell:0.5,face:3.1,glow:0.15,stars:0,neb:0,aur:0,
  pal:{rock:0x231a1a,rock2:0x3a2a26,wood:0x3a2a20,acc:0xff5a1a,acc2:0xffb050,metal:0x4a3a3a,glow:0xff4a10},scen:'volcano',back:'volcano',weather:'ash',
  obs:{block:['volrock'],low:['debris','ember'],high:['arch']},event:'eruption',coll:null,music:{root:52,mode:'min',tempo:128},amb:'volcano',
  blurb:'Lava cliffs, falling ash and eruption-driven surges.'},
 {id:'arctic',name:'Arctic Waves',diff:4,sky:[0x0b1736,0x86bfdc,0x5a8aa8],fog:0xa9cfe4,fogN:50,fogF:290,water:[0x0b3653,0x5cb6d6,0xffffff],sun:[0xdff2ff,0.9,[-0.5,0.4,-0.7]],hemi:[0xd8f0ff,0x2a4a6a,0.85],chop:0.35,swell:0.4,face:2.8,glow:0,stars:0.5,neb:0,aur:1,
  pal:{rock:0x5a6a7a,rock2:0x7a8a9a,ice:0xdaf3ff,ice2:0x9fd8f0,acc:0xff4a3d,wood:0x6a5a4a,metal:0x9aa4ad},scen:'arctic',back:'mountains',weather:'snow',
  obs:{block:['berg'],low:['icechunk'],high:['icearch'],move:['driftberg']},event:'driftBergs',coll:null,music:{root:55,mode:'min',tempo:100},amb:'wind',
  blurb:'Icebergs, falling snow and the northern lights.'},
 {id:'storm',name:'Stormbreaker Ocean',diff:6,sky:[0x161b22,0x46525c,0x20282e],fog:0x38424a,fogN:30,fogF:200,water:[0x0c171c,0x284049,0xdfe9ec],sun:[0xc8d4dc,0.55,[0,0.8,-0.3]],hemi:[0xa8b8c4,0x101820,0.85],chop:1.0,swell:1.1,face:3.6,glow:0,stars:0,neb:0,aur:0,
  pal:{rock:0x3a4046,rock2:0x52585e,wood:0x5a4a3a,acc:0xff8a1a,acc2:0xffffff,metal:0x7a8288,vis:0x2a2014},scen:'storm',back:null,weather:'rain',
  obs:{block:['rock','buoy'],low:['debris','whirl','barrel'],high:['net']},event:'surge',coll:null,music:{root:50,mode:'min',tempo:136},amb:'storm',
  blurb:'Rain, lightning and turbulent, towering waves.'},
 {id:'bio',name:'Bioluminescent Ocean',diff:3,sky:[0x02040e,0x0b1c3a,0x020812],fog:0x061428,fogN:40,fogF:260,water:[0x01080f,0x053a52,0x6ffcff],sun:[0x9fd8ff,0.35,[-0.3,0.5,-0.8]],hemi:[0x5a8aff,0x001018,0.5],chop:0.4,swell:0.4,face:2.8,glow:1,stars:1,neb:0,aur:0,
  pal:{rock:0x101a24,rock2:0x18283a,glow:0x2affe0,acc:0xff4af0,acc2:0x2affe0,metal:0x2a3a4a},scen:'bio',back:'moon',weather:'sparks',
  obs:{block:['jelly','glowrock'],low:['glowreef'],high:['glowarch']},event:'glowBloom',coll:'pearl',music:{root:54,mode:'maj',tempo:92},amb:'night',
  blurb:'Glowing waves, luminous jellyfish and a bright moon.'},
 {id:'neon',name:'Neon City Coast',diff:4,sky:[0x0a0420,0x5a1a7a,0x10061e],fog:0x2a0f4a,fogN:40,fogF:270,water:[0x070316,0x2a1060,0xff6af0],sun:[0xff4ad8,0.6,[0.5,0.3,-0.8]],hemi:[0x7a5aff,0x10002a,0.7],chop:0.3,swell:0.3,face:2.8,glow:0.6,stars:0.4,neb:0,aur:0,
  pal:{metal:0x2a2a3a,metal2:0x4a4a5e,acc:0x00f0ff,acc2:0xff3ad0,rock:0x22222e,rock2:0x33334a,wood:0x33334a},scen:'neon',back:'skyline',weather:'none',
  obs:{block:['robobuoy'],low:['scrap'],high:['gate'],move:['platform']},event:'holoRings',coll:'ring',music:{root:53,mode:'min',tempo:118},amb:'city',
  blurb:'Skyscrapers, neon reflections and holographic channels.'},
 {id:'coral',name:'Coral Kingdom',diff:3,sky:[0x2a9ae8,0xc8f2ff,0x9fe8e0],fog:0xc8f2ff,fogN:70,fogF:330,water:[0x0a8aa0,0x5ff0dc,0xffffff],sun:[0xfff4d8,1.15,[0.3,0.8,-0.4]],hemi:[0xe0faff,0x3aa090,0.8],chop:0.3,swell:0.3,face:2.6,glow:0,stars:0,neb:0,aur:0,
  pal:{rock:0x7a6a5a,rock2:0x9a8a7a,c1:0xff5a7a,c2:0xff9a3a,c3:0xb05aff,acc:0xffd23f,wood:0x8b5a2b,metal:0x9aa4ad},scen:'coral',back:'isles',backCol:[0x3f8f5a,0x5aa86a],weather:'none',
  obs:{block:['coral','rock'],low:['reef'],high:['coralarch']},event:'reefChannel',coll:'pearl',music:{root:62,mode:'maj',tempo:108},amb:'calm',
  blurb:'Colourful reefs, sea turtles and narrow reef channels.'},
 {id:'pirate',name:"Pirate's Cove",diff:4,sky:[0x4a6a80,0xa8b8b8,0x6a7a80],fog:0x9aa8a8,fogN:35,fogF:230,water:[0x0f3a48,0x3a7a80,0xe8f0ea],sun:[0xffe8c0,0.8,[-0.4,0.5,-0.7]],hemi:[0xc8d8d8,0x2a3a3a,0.75],chop:0.45,swell:0.5,face:3.0,glow:0,stars:0,neb:0,aur:0,
  pal:{rock:0x4a4a48,rock2:0x6a6a64,wood:0x5a3a20,wood2:0x3a2614,acc:0xc8a040,sail:0x1a1a1a,metal:0x6a6a6a},scen:'pirate',back:'isles',backCol:[0x5a6a6a,0x6a7676],weather:'fog',
  obs:{block:['wreck','rock'],low:['barrel','debris'],high:['mast']},event:'treasure',coll:null,music:{root:57,mode:'min',tempo:110},amb:'calm',
  blurb:'Shipwrecks, ancient ruins and hidden treasure routes.'},
 {id:'canyon',name:'Giant Wave Canyon',diff:6,sky:[0x3a6a9a,0xb8c8d0,0x5a6a70],fog:0x9aaab4,fogN:40,fogF:240,water:[0x0c3a4a,0x2a8a98,0xf4fbff],sun:[0xfff0d8,1.0,[0.6,0.7,-0.3]],hemi:[0xc8dce8,0x3a3028,0.7],chop:0.55,swell:0.4,face:3.4,glow:0,stars:0,neb:0,aur:0,
  pal:{rock:0x6a5a4a,rock2:0x8a7560,wood:0x5a4030,acc:0xff6a3a,metal:0x8a8a8a},scen:'canyon',back:null,weather:'mist',
  obs:{block:['stack','rock'],low:['debris','log'],high:['arch']},event:'canyonRush',coll:null,music:{root:55,mode:'min',tempo:132},amb:'canyon',
  blurb:'Towering cliffs funnel massive waves through a narrow gorge.'},
 {id:'cosmic',name:'Cosmic Ocean',diff:5,sky:[0x05031a,0x2a1a5a,0x0a0620],fog:0x1a1040,fogN:50,fogF:290,water:[0x07051e,0x3a2a8a,0x9ff4ff],sun:[0xd8b0ff,0.7,[-0.4,0.4,-0.8]],hemi:[0x9a7aff,0x100830,0.75],chop:0.45,swell:0.5,face:3.0,glow:0.7,stars:1,neb:1,aur:0,
  pal:{crystal:0x8a5aff,crystal2:0x3af0ff,acc:0xffd84a,rock:0x2a2240,rock2:0x3a3060,wood:0x3a3060,metal:0x4a4a6a},scen:'cosmic',back:'planets',weather:'stardust',
  obs:{block:['crystal'],low:['shard'],high:['halo'],move:['meteor']},event:'lowGravity',coll:'energy',music:{root:56,mode:'maj',tempo:96},amb:'space',
  blurb:'Galaxies overhead, crystal hazards and low-gravity waves.'},
];
const MAP=Object.fromEntries(MAPS.map(m=>[m.id,m]));
const ADVENTURE=['tropical','sunset','abyss','coral','storm'], STAGE_LEN=1500;

const EVENTS={
 islandPass:{name:'WATERFALL PASS',sub:'Ride close to the falls',dur:8,mods:{}},
 goldenHour:{name:'GOLDEN HOUR',sub:'Coins are worth double',dur:9,mods:{coin2:1}},
 giantWave:{name:'GIANT WAVE!',sub:'Hold your line',dur:7,mods:{face:3.0,speed:1.12,chop:0.3}},
 eruption:{name:'ERUPTION!',sub:'Watch for falling rocks',dur:8,mods:{face:2.2,speed:1.1},pattern:'fall'},
 driftBergs:{name:'ICE DRIFT',sub:'Icebergs crossing your path',dur:9,mods:{},pattern:'drift'},
 surge:{name:'STORM SURGE',sub:'The sea is rising',dur:7,mods:{face:2.4,chop:0.6,speed:1.08}},
 glowBloom:{name:'GLOW BLOOM',sub:'Glowing pearls are rising',dur:9,mods:{glow:1.2},pattern:'pearls'},
 holoRings:{name:'HOLO CHANNEL',sub:'Surf through the rings',dur:10,mods:{},pattern:'rings'},
 reefChannel:{name:'REEF CHANNEL',sub:'Thread the gap',dur:10,mods:{},pattern:'reef'},
 treasure:{name:'TREASURE ROUTE!',sub:'Riches ahead, danger too',dur:10,mods:{},pattern:'treasure'},
 canyonRush:{name:'CANYON RUSH',sub:'Massive wave incoming',dur:7,mods:{face:3.2,speed:1.18}},
 lowGravity:{name:'LOW GRAVITY',sub:'Jump big, trick bigger',dur:9,mods:{grav:0.45}},
};
const SPECIAL={islandPass:'Pass close to waterfall islands',goldenHour:'Golden hour doubles coin value; the sky shifts to purple',giantWave:'Giant waves rise from the deep',eruption:'Eruptions send surges and falling rocks',driftBergs:'Icebergs drift across the route',surge:'Storm surges and lightning',glowBloom:'Glow trails on every turn; pearl blooms',holoRings:'Holographic ring channels',reefChannel:'Narrow reef channels',treasure:'Treasure routes with chests',canyonRush:'Massive canyon waves',lowGravity:'Low-gravity jump zones'};

const SURFERS=[
 {id:'kai',name:'Kai',desc:'Classic tropical surfer',cost:0,skin:0xc68642,suit:0x1e88e5,accent:0xffd54f,hair:0x2b1b0e,acc:'shorts'},
 {id:'maya',name:'Maya',desc:'Athlete in colourful gear',cost:500,skin:0xe0ac69,suit:0xff4081,accent:0x00e5ff,hair:0x1a0f0a,acc:'ponytail'},
 {id:'wave',name:'Wave',desc:'Relaxed, ocean-themed outfit',cost:700,skin:0xf1c27d,suit:0x26c6da,accent:0xe0f7fa,hair:0xe8d29a,acc:'shades'},
 {id:'blaze',name:'Blaze',desc:'Bold surfer in a fiery suit',cost:900,skin:0x8d5524,suit:0xff5722,accent:0xffc107,hair:0x2a0a00,acc:'headband'},
 {id:'shadow',name:'Shadow',desc:'Mysterious dark wetsuit',cost:1300,skin:0xc68642,suit:0x15151a,accent:0x6a5acd,hair:0x0a0a0a,acc:'hood'},
 {id:'tide',name:'Tide',desc:'Professional with premium gear',cost:1800,skin:0xffdbac,suit:0xeceff1,accent:0x1565c0,hair:0x5a3a1a,acc:'premium'},
 {id:'neon',name:'Neon',desc:'Futuristic, glowing details',cost:2500,skin:0xe0ac69,suit:0x1a1a2e,accent:0x00ffd5,hair:0xff3ad0,acc:'visor',glow:1},
 {id:'captain',name:'Captain Reef',desc:'Adventurous ocean explorer',cost:0,ach:'treasure3',skin:0xc68642,suit:0x5d4037,accent:0xffb300,hair:0xdcdcdc,acc:'hat'},
];
const BOARDS=[
 {id:'classic',name:'Classic Board',cost:0,design:'stripe',c:['#fdf6e3','#d84315','#1e3a5f']},
 {id:'sunset',name:'Sunset Board',cost:300,design:'gradient',c:['#ffcf5a','#ff6a48','#7a2a8a']},
 {id:'ocean',name:'Ocean Blue',cost:400,design:'wave',c:['#1565c0','#e3f6ff','#4fc3f7']},
 {id:'coral',name:'Coral Reef',cost:600,design:'dots',c:['#ff7a8a','#ffd166','#7b2cbf']},
 {id:'flame',name:'Flame Rider',cost:800,design:'flame',c:['#1a0d08','#ff5a1a','#ffd23f'],trail:[1,0.5,0.1],glowTrail:1},
 {id:'arctic',name:'Arctic Rush',cost:900,design:'frost',c:['#f4fbff','#9fd8f0','#4aa8d8'],trail:[0.85,0.95,1],glowTrail:1},
 {id:'neon',name:'Neon Glide',cost:1200,design:'neon',c:['#0d0a1f','#00f0ff','#ff3ad0'],glow:1,trail:[0,0.9,1],glowTrail:1},
 {id:'shark',name:'Shark Fin',cost:1500,design:'shark',c:['#6b7a86','#e8eef2','#c0392b'],fin:1},
 {id:'cosmic',name:'Cosmic Surf',cost:2200,design:'stars',c:['#1a0b3a','#5a2a9a','#ffe27a'],trail:[0.8,0.5,1],glowTrail:1},
 {id:'golden',name:'Golden Wave',cost:0,ach:'longride',design:'gold',c:['#f9d976','#c8961e','#fff6d0'],trail:[1,0.85,0.3],glowTrail:1,sh:120},
];
const POWERS={
 magnet:{name:'Coin Magnet',color:'#ff4d6d',dur:10}, shield:{name:'Wave Shield',color:'#4dabff',dur:0},
 boost:{name:'Speed Boost',color:'#ffb020',dur:5}, mult:{name:'Score x2',color:'#b56dff',dur:10},
 bonus:{name:'Coin Bonus',color:'#ffd23f',dur:0}, jump:{name:'Super Jump',color:'#39d98a',dur:10},
 perfect:{name:'Perfect Wave',color:'#3fe0d0',dur:8},
};
const SHOP=[
 {id:'shield',name:'Head-Start Shield',desc:'Start your next run protected by a Wave Shield.',cost:150},
 {id:'magnet',name:'Magnet Start',desc:'Start your next run with a 12-second Coin Magnet.',cost:120},
 {id:'score',name:'Score Booster',desc:'Start your next run with 15 seconds of Score x2.',cost:200},
 {id:'doubler',name:'Coin Doubler',desc:'Double every coin you collect in your next run.',cost:300},
];
const MISSION_POOL=[
 {id:'coins100',text:'Collect 100 coins in one run',m:'coins',goal:100,mode:'run',reward:150},
 {id:'jumps15',text:'Perform 15 successful jumps in one run',m:'jumps',goal:15,mode:'run',reward:120},
 {id:'dist5000',text:'Travel 5,000 meters in one run',m:'dist',goal:5000,mode:'run',reward:300},
 {id:'dist2000',text:'Travel 2,000 meters in one run',m:'dist',goal:2000,mode:'run',reward:150},
 {id:'avoid30',text:'Avoid 30 obstacles in one run',m:'avoided',goal:30,mode:'run',reward:150},
 {id:'pearls20',text:'Collect 20 glowing pearls',m:'pearls',goal:20,mode:'day',reward:250,need:()=>isUnlocked('bio')||isUnlocked('coral')},
 {id:'treasure',text:'Find a treasure route',m:'treasures',goal:1,mode:'day',reward:250,need:()=>isUnlocked('pirate')},
 {id:'storm',text:'Complete a run in Stormbreaker Ocean',m:'storm',goal:1,mode:'day',reward:300,need:()=>isUnlocked('storm')},
 {id:'pb3',text:'Beat a personal record on three different maps',m:'pbMaps',goal:3,mode:'set',reward:400,need:()=>SAVE.unlockedMaps.length>=3},
 {id:'tricks10',text:'Land 10 tricks in one run',m:'tricks',goal:10,mode:'run',reward:180},
 {id:'power4',text:'Collect 4 power-ups in one run',m:'power',goal:4,mode:'run',reward:150},
 {id:'combo25',text:'Reach a 25-dodge combo',m:'combo',goal:25,mode:'run',reward:200},
 {id:'coins300',text:'Collect 300 coins today',m:'coins',goal:300,mode:'day',reward:200},
];
const ACHIEVEMENTS=[
 {id:'first',name:'First Wave',text:'Finish your first run',test:s=>s.runs>=1,reward:50},
 {id:'coin1k',name:'Coin Collector',text:'Collect 1,000 coins in total',test:s=>s.lifetimeCoins>=1000,reward:200},
 {id:'longride',name:'Long Rider',text:'Reach 8,000 m in one run',test:s=>s.bestDist>=8000,reward:0,item:'Golden Wave board'},
 {id:'treasure3',name:'Treasure Hunter',text:'Find 3 treasure routes',test:s=>s.stats.treasures>=3,reward:0,item:'Captain Reef surfer'},
 {id:'tricks100',name:'Trickster',text:'Land 100 tricks in total',test:s=>s.stats.tricks>=100,reward:300},
 {id:'maps6',name:'Globetrotter',text:'Unlock 6 maps',test:s=>s.unlockedMaps.length>=6,reward:500},
 {id:'combo50',name:'Untouchable',text:'Reach a 50-dodge combo',test:s=>s.stats.maxCombo>=50,reward:300},
 {id:'storm3k',name:'Storm Chaser',text:'Ride 3,000 m in Stormbreaker Ocean',test:s=>(s.maps.storm&&s.maps.storm.dist>=3000),reward:500},
 {id:'records3',name:'Record Breaker',text:'Beat records on 3 different maps',test:s=>s.stats.pbMapsAll.length>=3,reward:400},
];
const DAILY=[50,75,100,150,200,300,500];

/* ================= SAVE ================= */
const KEY='surf-rush-save-v1';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const defaults=()=>({coins:0,best:0,bestDist:0,lifetimeCoins:0,runs:0,pbCount:0,maps:{},unlockedMaps:['tropical'],surfers:['kai'],boards:['classic'],
  surfer:'kai',board:'classic',map:'tropical',adventure:false,introSeen:false,
  settings:{music:true,sfx:true,quality:'auto',cursor:isFine,skipIntro:false},
  daily:{date:'',list:[],pbMaps:[]},ach:{},stats:{tricks:0,treasures:0,maxCombo:0,pbMapsAll:[],dist:0},
  reward:{last:'',streak:0},boosts:{shield:0,magnet:0,score:0,doubler:0}});
function merge(a,b){ for(const k in b){ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])) merge(a[k],b[k]); else a[k]=b[k]; } return a; }
let SAVE=defaults();
try{ const raw=localStorage.getItem(KEY); if(raw) SAVE=merge(defaults(),JSON.parse(raw)); }catch(e){}
function persist(){ try{ localStorage.setItem(KEY,JSON.stringify(SAVE)); }catch(e){} }
const isUnlocked=id=>SAVE.unlockedMaps.includes(id);
function mapRec(id){ return SAVE.maps[id]||(SAVE.maps[id]={best:0,dist:0}); }

/* ================= AUDIO ================= */
const Snd={ctx:null,
 init(){
  if(this.ctx){ if(this.ctx.state==='suspended') this.ctx.resume(); return; }
  try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  const c=this.ctx;
  this.master=c.createGain(); this.master.gain.value=0.75; this.master.connect(c.destination);
  this.music=c.createGain(); this.music.connect(this.master);
  this.sfx=c.createGain(); this.sfx.connect(this.master);
  this.ambBus=c.createGain(); this.ambBus.connect(this.master);
  const len=c.sampleRate*2, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  this.noise=buf;
  const src=c.createBufferSource(); src.buffer=buf; src.loop=true;
  this.ambF=c.createBiquadFilter(); this.ambF.type='lowpass'; this.ambF.frequency.value=500;
  this.ambG=c.createGain(); this.ambG.gain.value=0.12;
  const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=0.13; lg.gain.value=0.06; lfo.connect(lg); lg.connect(this.ambG.gain); lfo.start();
  src.connect(this.ambF); this.ambF.connect(this.ambG); this.ambG.connect(this.ambBus); src.start();
  this.applySettings();
  this.next=c.currentTime+0.1; this.step=0;
  setInterval(()=>this.tick(),30);
  this.setTheme(curMap||MAPS[0]);
 },
 applySettings(){ if(!this.ctx) return; const t=this.ctx.currentTime;
  this.music.gain.setTargetAtTime(SAVE.settings.music?0.32:0,t,0.1);
  this.sfx.gain.setTargetAtTime(SAVE.settings.sfx?0.9:0,t,0.05);
  this.ambBus.gain.setTargetAtTime(SAVE.settings.sfx?1:0,t,0.2); },
 setTheme(m){ this.mus=m.music; if(!this.ctx) return; const t=this.ctx.currentTime, a=m.amb;
  const f={calm:520,deep:380,volcano:300,wind:1400,storm:900,night:420,city:260,canyon:700,space:200}[a]||500;
  const g={calm:0.13,deep:0.16,volcano:0.15,wind:0.1,storm:0.22,night:0.08,city:0.07,canyon:0.17,space:0.05}[a]||0.12;
  this.ambF.type=a==='wind'?'bandpass':'lowpass';
  this.ambF.frequency.setTargetAtTime(f,t,0.5); this.ambG.gain.setTargetAtTime(g,t,0.5); },
 env(node,t,a,peak,dec){ node.gain.setValueAtTime(0.0001,t); node.gain.exponentialRampToValueAtTime(peak,t+a); node.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); },
 tone(f,dur,type='sine',vol=0.2,t,to,dest){ if(!this.ctx) return; const c=this.ctx; t=t||c.currentTime;
  const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(to) o.frequency.exponentialRampToValueAtTime(to,t+dur);
  this.env(g,t,0.008,vol,dur); o.connect(g); g.connect(dest||this.sfx); o.start(t); o.stop(t+dur+0.05); },
 hiss(dur,vol,type,freq,t,to,dest,q=1){ if(!this.ctx) return; const c=this.ctx; t=t||c.currentTime;
  const s=c.createBufferSource(); s.buffer=this.noise; s.playbackRate.value=rand(0.8,1.2);
  const f=c.createBiquadFilter(); f.type=type; f.frequency.setValueAtTime(freq,t); f.Q.value=q; if(to) f.frequency.exponentialRampToValueAtTime(to,t+dur);
  const g=c.createGain(); this.env(g,t,0.01,vol,dur); s.connect(f); f.connect(g); g.connect(dest||this.sfx); s.start(t,rand(0,1)); s.stop(t+dur+0.1); },
 coin(){ this.tone(1318,0.08,'square',0.06); this.tone(1760,0.16,'square',0.06,this.ctx&&this.ctx.currentTime+0.06); },
 pearl(){ [1046,1318,1568,2093].forEach((f,i)=>this.tone(f,0.25,'sine',0.08,this.ctx&&this.ctx.currentTime+i*0.05)); },
 jump(){ this.hiss(0.3,0.25,'bandpass',600,0,2400,0,2); },
 land(){ this.hiss(0.35,0.3,'lowpass',1800,0,300); },
 swish(){ this.hiss(0.18,0.12,'bandpass',1200,0,500,0,3); },
 power(){ if(!this.ctx) return; const t=this.ctx.currentTime; [523,659,784,1046].forEach((f,i)=>this.tone(f,0.18,'triangle',0.12,t+i*0.06)); },
 trick(){ this.tone(440,0.25,'sawtooth',0.05,0,880); this.hiss(0.25,0.12,'bandpass',900,0,2600,0,2); },
 crash(){ this.hiss(0.9,0.6,'lowpass',2600,0,200); this.tone(110,0.6,'sine',0.5,0,40); },
 smash(){ this.hiss(0.4,0.4,'lowpass',1600,0,200); this.tone(180,0.25,'square',0.12,0,60); },
 shield(){ this.tone(300,0.4,'sine',0.25,0,900); this.hiss(0.3,0.2,'highpass',2000); },
 thunder(){ if(!this.ctx) return; const t=this.ctx.currentTime+rand(0.2,0.8); this.hiss(2.2,0.55,'lowpass',400,t,60); this.hiss(0.4,0.3,'lowpass',2400,t,300); },
 rumble(){ this.hiss(2.5,0.6,'lowpass',200,0,40); this.tone(55,2,'sine',0.35); },
 fanfare(){ if(!this.ctx) return; const t=this.ctx.currentTime; [523,659,784,1046,1318].forEach((f,i)=>{this.tone(f,0.35,'square',0.08,t+i*0.09); this.tone(f/2,0.35,'triangle',0.1,t+i*0.09);}); },
 click(){ this.tone(900,0.05,'square',0.05); },
 tick(){
  if(!this.ctx||!this.mus) return; const c=this.ctx;
  while(this.next<c.currentTime+0.15){ this.play(this.step,this.next); this.next+=60/this.mus.tempo/4; this.step=(this.step+1)%64; }
 },
 play(i,t){
  const m=this.mus, sc=m.mode==='maj'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10], prog=m.mode==='maj'?[0,4,5,3]:[0,5,2,6];
  const bar=Math.floor(i/16)%4, deg=prog[bar];
  const note=(d,oct)=>{ const o=Math.floor(d/7); return m.root+12*(oct+o)+sc[((d%7)+7)%7]; };
  const hz=n=>440*Math.pow(2,(n-69)/12);
  const live=state==='play'||state==='intro', M=this.music;
  if(i%16===0){ [0,2,4].forEach(k=>this.tone(hz(note(deg+k,0)),60/m.tempo*3.6,'triangle',0.05,t,0,M)); }
  if(i%2===0 && Math.random()<(live?0.75:0.45)){ const k=pick([0,2,4,7]); this.tone(hz(note(deg+k,1)),0.2,live?'square':'sine',live?0.025:0.04,t,0,M); }
  if(!live) return;
  if(i%4===0){ this.tone(140,0.18,'sine',0.35,t,45,M); }
  if(i%4===2){ this.hiss(0.05,0.06,'highpass',7000,t,0,M); }
  if(i%16===4||i%16===12){ this.hiss(0.14,0.14,'bandpass',1800,t,0,M,0.8); }
  if(i%8===0||i%8===3||i%8===6){ this.tone(hz(note(deg,-1)),0.16,'sawtooth',0.06,t,0,M); }
 }
};

/* ================= THREE SETUP ================= */
const canvas=$('c');
let quality=SAVE.settings.quality==='auto'?(isFine?((navigator.hardwareConcurrency||4)>=8?'high':'med'):((navigator.hardwareConcurrency||4)>=8?'med':'low')):SAVE.settings.quality;
const renderer=new THREE.WebGLRenderer({canvas,antialias:quality!=='low',powerPreference:'high-performance'});
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(62,1,0.1,1600);
scene.fog=new THREE.Fog(0xffffff,60,300);
const hemi=new THREE.HemisphereLight(0xffffff,0x336666,0.8); scene.add(hemi);
const sunL=new THREE.DirectionalLight(0xffffff,1); sunL.position.set(30,60,-40); scene.add(sunL);
const amb=new THREE.AmbientLight(0xffffff,0.15); scene.add(amb);
function pr(){ return quality==='low'?1:quality==='med'?Math.min(devicePixelRatio,1.5):Math.min(devicePixelRatio,2); }
let VW=1,VH=1;
function resize(){ VW=innerWidth; VH=innerHeight; renderer.setPixelRatio(pr()); renderer.setSize(VW,VH,false); camera.aspect=VW/VH; camera.fov=VW<VH?72:62; camera.updateProjectionMatrix();
  if(sprayPS){ sprayPS.mat.uniforms.uScale.value=VH*pr()*0.6; glowPS.mat.uniforms.uScale.value=VH*pr()*0.6; weather.mat.uniforms.uScale.value=VH*pr()*0.6; } }

/* ---- theme (lerped render params) ---- */
const C=()=>new THREE.Color();
const TH={top:C(),hor:C(),bot:C(),deep:C(),shal:C(),foam:C(),fog:C(),sunC:C(),hS:C(),hG:C(),sunDir:new THREE.Vector3(0,1,0),sunI:1,hI:0.8,fogN:60,fogF:300,chop:0.3,swell:0.3,face:2.7,glow:0,stars:0,neb:0,aur:0};
const TT=JSON.parse(JSON.stringify({sunI:1,hI:0.8,fogN:60,fogF:300,chop:0.3,swell:0.3,face:2.7,glow:0,stars:0,neb:0,aur:0}));
['top','hor','bot','deep','shal','foam','fog','sunC','hS','hG'].forEach(k=>TT[k]=C()); TT.sunDir=new THREE.Vector3();
const COLK=['top','hor','bot','deep','shal','foam','fog','sunC','hS','hG'], NUMK=['sunI','hI','fogN','fogF','chop','swell','face','glow','stars','neb','aur'];
function setTarget(m,shift=0){
  const s=m.shift;
  const mix=(a,b)=>s&&shift>0?new THREE.Color(a).lerp(new THREE.Color(b),shift):new THREE.Color(a);
  TT.top.copy(mix(m.sky[0],s&&s.sky[0])); TT.hor.copy(mix(m.sky[1],s&&s.sky[1])); TT.bot.copy(mix(m.sky[2],s&&s.sky[2]));
  TT.deep.copy(mix(m.water[0],s&&s.water[0])); TT.shal.copy(mix(m.water[1],s&&s.water[1])); TT.foam.copy(mix(m.water[2],s&&s.water[2]));
  TT.fog.copy(mix(m.fog,s&&s.fog)); TT.sunC.copy(mix(m.sun[0],s&&s.sun)); TT.hS.set(m.hemi[0]); TT.hG.set(m.hemi[1]);
  TT.sunDir.set(...m.sun[2]).normalize(); TT.sunI=m.sun[1]*(1-shift*0.4); TT.hI=m.hemi[2]*(1-shift*0.3);
  TT.fogN=m.fogN; TT.fogF=m.fogF; TT.chop=m.chop; TT.swell=m.swell; TT.face=m.face; TT.glow=m.glow; TT.stars=s?lerp(m.stars,s.stars,shift):m.stars; TT.neb=m.neb; TT.aur=m.aur;
}
function lerpTheme(k){ for(const c of COLK) TH[c].lerp(TT[c],k); for(const n of NUMK) TH[n]+=(TT[n]-TH[n])*k; TH.sunDir.lerp(TT.sunDir,k).normalize(); }

/* ---- wave function (shared JS / GLSL) ---- */
const W={faceH:0,faceZ:40,chop:0.3,swell:0.3,ph:[0,0,0,0,0,0],travel:0,time:0};
const PK=[0.21,0.37,-0.5,0.93], PW=[1.3,1.7,2.3,3.1];
function updatePhases(){ for(let i=0;i<4;i++) W.ph[i]=(PK[i]*W.travel+PW[i]*W.time)%TAU; W.ph[4]=(0.8*W.time)%TAU; W.ph[5]=(0.055*W.travel+0.5*W.time)%TAU; }
function waveH(x,z){
  const dz=z-W.faceZ, w=dz>0?3.2:6.5;
  const face=W.faceH*Math.exp(-(dz*dz)/(w*w))*(1+0.18*Math.sin(x*0.22+W.ph[4]));
  const p=W.ph;
  const c=0.55*Math.sin(0.32*x+0.21*z-p[0])+0.35*Math.sin(-0.27*x+0.37*z-p[1])+0.22*Math.sin(0.61*x-0.5*z-p[2])+0.12*Math.sin(1.13*x+0.93*z-p[3]);
  return face+W.chop*c+W.swell*Math.sin(0.055*z-p[5]);
}
const GLSL_WAVE=`
uniform float uFaceH,uFaceZ,uChop,uSwell; uniform vec4 uPh; uniform vec2 uPh2;
float waveH(vec2 q){ float x=q.x, z=q.y; float dz=z-uFaceZ; float w=dz>0.0?3.2:6.5;
 float face=uFaceH*exp(-(dz*dz)/(w*w))*(1.0+0.18*sin(x*0.22+uPh2.x));
 float c=0.55*sin(0.32*x+0.21*z-uPh.x)+0.35*sin(-0.27*x+0.37*z-uPh.y)+0.22*sin(0.61*x-0.5*z-uPh.z)+0.12*sin(1.13*x+0.93*z-uPh.w);
 return face+uChop*c+uSwell*sin(0.055*z-uPh2.y); }`;

/* ---- water ---- */
const waterU={uFaceH:{value:0},uFaceZ:{value:40},uChop:{value:0.3},uSwell:{value:0.3},uPh:{value:new THREE.Vector4()},uPh2:{value:new THREE.Vector2()},
  uDeep:{value:TH.deep},uShal:{value:TH.shal},uFoam:{value:TH.foam},uSky:{value:TH.hor},uSunDir:{value:TH.sunDir},uSunC:{value:TH.sunC},uFog:{value:TH.fog},
  uFogN:{value:60},uFogF:{value:300},uGlow:{value:0},uTrav:{value:0},uTime:{value:0},uFoamLvl:{value:1}};
const waterMat=new THREE.ShaderMaterial({uniforms:waterU,extensions:{derivatives:true},
 vertexShader:GLSL_WAVE+`
 varying vec3 vWP; varying float vH;
 void main(){ vec3 p=position; float h=waveH(p.xz); p.y+=h; vWP=p; vH=h; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0); }`,
 fragmentShader:`
 uniform vec3 uDeep,uShal,uFoam,uSky,uSunDir,uSunC,uFog; uniform float uFogN,uFogF,uGlow,uTrav,uTime,uFoamLvl,uFaceH;
 varying vec3 vWP; varying float vH;
 void main(){
  vec3 n=normalize(cross(dFdx(vWP),dFdy(vWP))); if(n.y<0.0) n=-n;
  vec3 V=normalize(cameraPosition-vWP);
  float t=clamp(vH*0.2+0.42,0.0,1.0);
  vec3 col=mix(uDeep,uShal,t);
  float dif=max(dot(n,uSunDir),0.0);
  col*=0.6+0.55*dif;
  float fr=pow(1.0-max(dot(n,V),0.0),3.0);
  col=mix(col,uSky,fr*0.55);
  vec3 R=reflect(-uSunDir,n); col+=uSunC*pow(max(dot(R,V),0.0),70.0)*0.9;
  float wz=vWP.z-uTrav;
  float streak=sin(vWP.x*0.597+wz*0.345575+sin(wz*0.188496)*1.5)*sin(vWP.x*0.31-wz*0.596903);
  float foam=smoothstep(uFoamLvl,uFoamLvl+0.55,vH)+smoothstep(0.72,0.98,streak)*0.4;
  float crest=uFaceH*(1.0-smoothstep(0.0,1.4,abs(vWP.z-4.2)))*smoothstep(uFaceH*0.55,uFaceH*0.9+0.01,vH);
  foam=clamp(foam+crest,0.0,1.0);
  col=mix(col,uFoam,foam*0.9);
  col+=uFoam*uGlow*(foam*0.9+smoothstep(0.86,1.0,streak)*0.5);
  float d=length(cameraPosition-vWP); col=mix(col,uFog,smoothstep(uFogN,uFogF,d));
  gl_FragColor=vec4(col,1.0);
 }`});
function buildWater(q){
  const base=q==='low'?1.0:q==='med'?0.75:0.6, grow=q==='low'?1.11:q==='med'?1.09:1.08;
  const side=[0]; let x=0, st=base; while(x<380){ if(x<7) x+=base; else { st*=grow; x+=st; } side.push(x); }
  const xs=side.slice(1).reverse().map(v=>-v).concat(side);
  const zs=[45]; let z=45; st=base; while(z>-760){ if(z>-35) z-=base; else { st*=grow; z-=st; } zs.push(z); }
  const nx=xs.length, nz=zs.length, pos=new Float32Array(nx*nz*3); let k=0;
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ pos[k++]=xs[i]; pos[k++]=0; pos[k++]=zs[j]; }
  const idx=[]; for(let j=0;j<nz-1;j++) for(let i=0;i<nx-1;i++){ const a=j*nx+i,b=a+1,c=a+nx,d=c+1; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return g;
}
const water=new THREE.Mesh(buildWater(quality),waterMat); water.frustumCulled=false; scene.add(water);

/* ---- sky ---- */
const skyU={uTop:{value:TH.top},uHor:{value:TH.hor},uBot:{value:TH.bot},uSunC:{value:TH.sunC},uSunDir:{value:TH.sunDir},uStars:{value:0},uNeb:{value:0},uAur:{value:0},uFlash:{value:new THREE.Color(0,0,0)},uTime:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:`varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
 fragmentShader:`uniform vec3 uTop,uHor,uBot,uSunC,uSunDir,uFlash; uniform float uStars,uNeb,uAur,uTime; varying vec3 vDir;
 float hash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
 void main(){ vec3 d=normalize(vDir); float y=d.y;
  vec3 col= y>0.0 ? mix(uHor,uTop,pow(clamp(y,0.0,1.0),0.55)) : mix(uHor,uBot,clamp(-y*5.0,0.0,1.0));
  float s=max(dot(d,uSunDir),0.0);
  col+=uSunC*(pow(s,8.0)*0.22+pow(s,120.0)*0.6+smoothstep(0.9975,0.9986,s)*1.4);
  if(uStars>0.0){ vec3 g=floor(d*300.0); float h=hash(g); float st=step(0.988,h)*smoothstep(0.02,0.25,y); col+=vec3(st)*uStars*(0.55+0.45*sin(uTime*3.0+h*60.0)); }
  if(uNeb>0.0){ float n=sin(d.x*5.0+sin(d.z*3.0)*1.5)*sin(d.z*4.0+d.y*6.0+1.3); n=smoothstep(0.0,1.0,n*0.5+0.5);
    col+=mix(vec3(0.55,0.12,0.6),vec3(0.1,0.45,0.85),n)*uNeb*n*smoothstep(-0.05,0.45,y)*0.6; }
  if(uAur>0.0){ float a=sin(d.x*6.0+uTime*0.3+sin(d.z*3.0+uTime*0.2)*2.0); float band=smoothstep(0.12,0.32,y)*(1.0-smoothstep(0.38,0.75,y));
    col+=vec3(0.2,1.0,0.6)*uAur*band*(0.5+0.5*a)*0.55+vec3(0.5,0.2,0.9)*uAur*band*(0.5-0.5*a)*0.22; }
  col+=uFlash;
  gl_FragColor=vec4(col,1.0); }`}));
sky.renderOrder=-1; scene.add(sky);

/* ---- particles ---- */
const PS_VS=`attribute float aSize; attribute float aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC; uniform float uScale;
 void main(){ vC=aColor; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uScale/max(-mv.z,0.1); gl_Position=projectionMatrix*mv; }`;
const PS_FS=`varying float vA; varying vec3 vC; void main(){ vec2 c=gl_PointCoord-0.5; float a=(1.0-smoothstep(0.12,0.5,length(c)))*vA; if(a<0.01) discard; gl_FragColor=vec4(vC,a); }`;
function psMat(add){ return new THREE.ShaderMaterial({uniforms:{uScale:{value:400}},vertexShader:PS_VS,fragmentShader:PS_FS,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}); }
class PS{
  constructor(n,add){ this.n=n; this.i=0;
    this.p=new Float32Array(n*3); this.v=new Float32Array(n*3); this.c=new Float32Array(n*3); this.s=new Float32Array(n); this.a=new Float32Array(n);
    this.l=new Float32Array(n); this.m=new Float32Array(n); this.g=new Float32Array(n); this.sc=new Float32Array(n);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(this.p,3)); g.setAttribute('aColor',new THREE.BufferAttribute(this.c,3));
    g.setAttribute('aSize',new THREE.BufferAttribute(this.s,1)); g.setAttribute('aAlpha',new THREE.BufferAttribute(this.a,1));
    this.geo=g; this.mat=psMat(add); this.pts=new THREE.Points(g,this.mat); this.pts.frustumCulled=false; scene.add(this.pts); }
  emit(x,y,z,vx,vy,vz,life,size,r,gg,b,grav=-14,scroll=1){ const i=this.i, j=i*3; this.i=(i+1)%this.n;
    this.p[j]=x; this.p[j+1]=y; this.p[j+2]=z; this.v[j]=vx; this.v[j+1]=vy; this.v[j+2]=vz; this.c[j]=r; this.c[j+1]=gg; this.c[j+2]=b;
    this.s[i]=size; this.l[i]=life; this.m[i]=life; this.g[i]=grav; this.sc[i]=scroll; this.a[i]=1; }
  update(dt,spd){ const p=this.p,v=this.v;
    for(let i=0;i<this.n;i++){ if(this.l[i]<=0){ if(this.a[i]!==0) this.a[i]=0; continue; }
      this.l[i]-=dt; const j=i*3; v[j+1]+=this.g[i]*dt; const dr=1-dt*1.2; v[j]*=dr; v[j+2]*=dr;
      p[j]+=v[j]*dt; p[j+1]+=v[j+1]*dt; p[j+2]+=v[j+2]*dt+this.sc[i]*spd*dt;
      const f=this.l[i]/this.m[i]; this.a[i]=Math.max(0,Math.min(1,f*1.6)); }
    this.geo.attributes.position.needsUpdate=true; this.geo.attributes.aAlpha.needsUpdate=true; this.geo.attributes.aColor.needsUpdate=true; this.geo.attributes.aSize.needsUpdate=true; }
  clear(){ this.l.fill(0); this.a.fill(0); }
}
const PN=quality==='low'?700:quality==='med'?1200:1800;
let sprayPS=null, glowPS=null;
sprayPS=new PS(PN,false); glowPS=new PS(Math.floor(PN*0.6),true);

class Weather{
  constructor(n){ this.n=n; this.type='none'; this.p=new Float32Array(n*3); this.c=new Float32Array(n*3); this.s=new Float32Array(n); this.a=new Float32Array(n); this.ph=new Float32Array(n);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.p,3)); g.setAttribute('aColor',new THREE.BufferAttribute(this.c,3));
    g.setAttribute('aSize',new THREE.BufferAttribute(this.s,1)); g.setAttribute('aAlpha',new THREE.BufferAttribute(this.a,1));
    this.geo=g; this.mat=psMat(false); this.pts=new THREE.Points(g,this.mat); this.pts.frustumCulled=false; scene.add(this.pts); }
  set(type){ if(type===this.type) return; this.type=type; this.mat.blending=(type==='sparks'||type==='stardust')?THREE.AdditiveBlending:THREE.NormalBlending; this.mat.needsUpdate=true;
    for(let i=0;i<this.n;i++) this.spawn(i,true); for(const k of ['position','aColor','aSize','aAlpha']) this.geo.attributes[k].needsUpdate=true; }
  spawn(i,init){ const j=i*3, t=this.type, cx=camera.position.x, cz=camera.position.z;
    this.p[j]=cx+rand(-35,35); this.p[j+2]=cz+rand(-110,8); this.ph[i]=rand(0,TAU);
    let y=rand(0,28), col=[1,1,1], s=0.2, a=0.6;
    if(t==='none'){ a=0; }
    else if(t==='rain'){ col=[0.75,0.82,0.88]; s=0.16; a=0.55; if(!init) y=28; }
    else if(t==='snow'){ col=[1,1,1]; s=0.32; a=0.9; if(!init) y=26; }
    else if(t==='ash'){ col=pick([[0.35,0.3,0.3],[1,0.45,0.15]]); s=col[0]>0.5?0.22:0.3; a=0.8; if(!init) y=26; }
    else if(t==='sparks'){ col=pick([[0.2,1,0.9],[0.4,0.8,1],[0.9,0.4,1]]); s=0.22; a=0.9; y=rand(0,6); }
    else if(t==='stardust'){ col=pick([[1,0.9,0.6],[0.7,0.6,1],[0.5,1,1]]); s=0.25; a=0.9; y=rand(1,22); }
    else if(t==='mist'||t==='fog'){ col=t==='fog'?[0.85,0.88,0.88]:[0.9,0.95,1]; s=t==='fog'?9:6; a=t==='fog'?0.12:0.07; y=rand(0,4); }
    this.p[j+1]=y; this.c[j]=col[0]; this.c[j+1]=col[1]; this.c[j+2]=col[2]; this.s[i]=s; this.a[i]=a; }
  update(dt,spd,t){ if(this.type==='none'){ return; } const p=this.p, cx=camera.position.x, cz=camera.position.z, ty=this.type;
    for(let i=0;i<this.n;i++){ const j=i*3;
      if(ty==='rain'){ p[j+1]-=34*dt; p[j]+=4*dt; p[j+2]+=spd*0.4*dt; }
      else if(ty==='snow'){ p[j+1]-=2.6*dt; p[j]+=Math.sin(t+this.ph[i])*1.2*dt; p[j+2]+=spd*0.7*dt; }
      else if(ty==='ash'){ p[j+1]-=1.6*dt; p[j]+=Math.sin(t*0.7+this.ph[i])*0.8*dt; p[j+2]+=spd*0.8*dt; }
      else if(ty==='sparks'){ p[j+1]+=0.5*dt; p[j+2]+=spd*dt; this.a[i]=0.5+0.5*Math.sin(t*3+this.ph[i]); }
      else if(ty==='stardust'){ p[j+2]+=spd*0.9*dt; this.a[i]=0.45+0.45*Math.sin(t*2+this.ph[i]); }
      else { p[j+2]+=spd*dt; p[j]+=Math.sin(t*0.3+this.ph[i])*0.4*dt; }
      if(p[j+1]<0||p[j+1]>30||p[j+2]>cz+10||p[j+2]<cz-120||Math.abs(p[j]-cx)>40) this.spawn(i,ty==='sparks'||ty==='mist'||ty==='fog'||ty==='stardust');
    }
    this.geo.attributes.position.needsUpdate=true; this.geo.attributes.aAlpha.needsUpdate=true; this.geo.attributes.aColor.needsUpdate=true; this.geo.attributes.aSize.needsUpdate=true; }
}
const weather=new Weather(quality==='low'?250:quality==='med'?500:800);

/* ================= GEOMETRY HELPERS ================= */
const _mc={}, _gc={};
function mat(color,o={}){ const k=[color,o.e||0,o.ei==null?1:o.ei,o.op||1,o.flat===false?0:1,o.sh||14,o.add?1:0,o.side||0].join('|'); if(_mc[k]) return _mc[k];
  return _mc[k]=new THREE.MeshPhongMaterial({color,flatShading:o.flat!==false,shininess:o.sh||14,emissive:o.e||0,emissiveIntensity:o.ei==null?1:o.ei,
    transparent:(o.op||1)<1||!!o.add,opacity:o.op||1,depthWrite:!o.add,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,side:o.side?THREE.DoubleSide:THREE.FrontSide}); }
function bmat(color,o={}){ const k='b|'+[color,o.op||1,o.add?1:0,o.fog===false?0:1,o.side?1:0].join('|'); if(_mc[k]) return _mc[k];
  return _mc[k]=new THREE.MeshBasicMaterial({color,transparent:(o.op||1)<1||!!o.add,opacity:o.op||1,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:!o.add,fog:o.fog!==false,side:o.side?THREE.DoubleSide:THREE.FrontSide}); }
const geo=(k,f)=>_gc[k]||(_gc[k]=f());
const box=(w,h,d)=>geo('b'+w+h+d,()=>new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s=8)=>geo('c'+a+'_'+b+'_'+h+'_'+s,()=>new THREE.CylinderGeometry(a,b,h,s));
const ico=(r,d=0)=>geo('i'+r+'_'+d,()=>new THREE.IcosahedronGeometry(r,d));
const oct=r=>geo('o'+r,()=>new THREE.OctahedronGeometry(r,0));
const cone=(r,h,s=7)=>geo('k'+r+'_'+h+'_'+s,()=>new THREE.ConeGeometry(r,h,s));
const sph=(r,a=10,b=8)=>geo('s'+r+'_'+a+'_'+b,()=>new THREE.SphereGeometry(r,a,b));
const tor=(r,t,a=8,b=20,arc=TAU)=>geo('t'+r+'_'+t+'_'+a+'_'+b+'_'+arc,()=>new THREE.TorusGeometry(r,t,a,b,arc));
function add(parent,g,m,x=0,y=0,z=0,s,r){ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); if(s!=null){ if(typeof s==='number') o.scale.setScalar(s); else o.scale.set(s[0],s[1],s[2]); } if(r) o.rotation.set(r[0]||0,r[1]||0,r[2]||0); parent.add(o); return o; }
const grp=()=>new THREE.Group();
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); return t; }

/* ================= BOARDS & SURFERS ================= */
function drawBoard(b,x,W,H){
  const [c1,c2,c3]=b.c; x.fillStyle=c1; x.fillRect(0,0,W,H);
  const lg=(stops)=>{ const g=x.createLinearGradient(0,0,0,H); stops.forEach((s,i)=>g.addColorStop(i/(stops.length-1),s)); return g; };
  switch(b.design){
   case 'stripe': x.fillStyle=c2; x.fillRect(W/2-10,0,20,H); x.fillRect(0,70,W,14); x.fillStyle=c3; x.fillRect(W/2-3,0,6,H); break;
   case 'gradient': x.fillStyle=lg([c1,c2,c3]); x.fillRect(0,0,W,H); x.fillStyle='rgba(255,240,200,.85)'; x.beginPath(); x.arc(W/2,H*0.42,30,0,TAU); x.fill();
     x.fillStyle=c3; for(let i=0;i<5;i++) x.fillRect(0,H*0.42+i*12,W,4); break;
   case 'wave': x.strokeStyle=c2; x.lineWidth=7; for(let k=0;k<7;k++){ x.beginPath(); for(let y=0;y<=W;y+=4){ const yy=60+k*66+Math.sin(y*0.09+k)*12; y?x.lineTo(y,yy):x.moveTo(y,yy);} x.stroke(); } x.strokeStyle=c3; x.lineWidth=3; x.beginPath(); x.moveTo(W/2,0); x.lineTo(W/2,H); x.stroke(); break;
   case 'dots': for(let i=0;i<70;i++){ x.fillStyle=i%2?c2:c3; x.beginPath(); x.arc(rand(0,W),rand(0,H),rand(4,12),0,TAU); x.fill(); } break;
   case 'flame': for(let i=0;i<9;i++){ const cx=rand(8,W-8), h=rand(H*0.35,H*0.8); x.fillStyle=c2; x.beginPath(); x.moveTo(cx-18,H); x.quadraticCurveTo(cx-24,H-h*0.5,cx,H-h); x.quadraticCurveTo(cx+24,H-h*0.5,cx+18,H); x.fill();
       x.fillStyle=c3; x.beginPath(); x.moveTo(cx-8,H); x.quadraticCurveTo(cx-10,H-h*0.3,cx,H-h*0.6); x.quadraticCurveTo(cx+10,H-h*0.3,cx+8,H); x.fill(); } break;
   case 'neon': x.lineWidth=6; x.shadowBlur=12; x.strokeStyle=c2; x.shadowColor=c2; x.strokeRect(10,14,W-20,H-28); x.strokeStyle=c3; x.shadowColor=c3; x.beginPath(); x.moveTo(W/2,30); x.lineTo(W/2,H-30); x.stroke();
     for(let i=0;i<6;i++){ x.strokeStyle=i%2?c2:c3; x.shadowColor=x.strokeStyle; x.beginPath(); x.moveTo(24,90+i*60); x.lineTo(W-24,120+i*60); x.stroke(); } x.shadowBlur=0; break;
   case 'gold': { const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,c1); g.addColorStop(0.5,c2); g.addColorStop(1,c1); x.fillStyle=g; x.fillRect(0,0,W,H);
     x.fillStyle='rgba(255,255,240,.55)'; x.save(); x.translate(W/2,H/2); x.rotate(-0.4); x.fillRect(-W,-14,W*2,10); x.fillRect(-W,10,W*2,4); x.restore(); x.strokeStyle=c3; x.lineWidth=4; x.strokeRect(12,16,W-24,H-32); break; }
   case 'shark': x.fillStyle=lg([c1,c1,'#4a5660']); x.fillRect(0,0,W,H); x.fillStyle=c3; x.beginPath(); x.ellipse(W/2,46,40,18,0,0,TAU); x.fill(); x.fillStyle=c2;
     for(let i=0;i<8;i++){ x.beginPath(); x.moveTo(W/2-40+i*10,34); x.lineTo(W/2-35+i*10,46); x.lineTo(W/2-30+i*10,34); x.fill(); x.beginPath(); x.moveTo(W/2-40+i*10,58); x.lineTo(W/2-35+i*10,47); x.lineTo(W/2-30+i*10,58); x.fill(); }
     x.strokeStyle='#2a333a'; x.lineWidth=4; for(let i=0;i<3;i++){ x.beginPath(); x.moveTo(20,160+i*20); x.quadraticCurveTo(34,170+i*20,20,180+i*20); x.stroke(); x.beginPath(); x.moveTo(W-20,160+i*20); x.quadraticCurveTo(W-34,170+i*20,W-20,180+i*20); x.stroke(); }
     x.fillStyle='#fff'; x.beginPath(); x.arc(30,110,7,0,TAU); x.arc(W-30,110,7,0,TAU); x.fill(); break;
   case 'frost': x.fillStyle=lg([c1,c2,c3]); x.fillRect(0,0,W,H); x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=3;
     for(let k=0;k<6;k++){ const cx=rand(20,W-20), cy=rand(40,H-40), r=rand(12,24); for(let a=0;a<6;a++){ x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a*TAU/6)*r,cy+Math.sin(a*TAU/6)*r); x.stroke(); } } break;
   case 'stars': x.fillStyle=lg([c1,c2,c1]); x.fillRect(0,0,W,H); for(let i=0;i<80;i++){ x.fillStyle=i%5?'#fff':c3; x.beginPath(); x.arc(rand(0,W),rand(0,H),rand(0.8,2.6),0,TAU); x.fill(); }
     x.fillStyle='#ff9ad5'; x.beginPath(); x.arc(W/2,H*0.55,22,0,TAU); x.fill(); x.strokeStyle=c3; x.lineWidth=4; x.beginPath(); x.ellipse(W/2,H*0.55,42,10,-0.3,0,TAU); x.stroke(); break;
  }
}
const boardCanvas={};
function boardCanvasFor(b){ if(boardCanvas[b.id]) return boardCanvas[b.id]; const c=document.createElement('canvas'); c.width=128; c.height=512; drawBoard(b,c.getContext('2d'),128,512); return boardCanvas[b.id]=c; }
let boardShapeGeo=null;
function boardGeo(){ if(boardShapeGeo) return boardShapeGeo;
  const s=new THREE.Shape(); s.moveTo(0,1.85); s.quadraticCurveTo(0.44,1.4,0.5,0.3); s.quadraticCurveTo(0.52,-1.0,0.32,-1.7); s.lineTo(-0.32,-1.7); s.quadraticCurveTo(-0.52,-1.0,-0.5,0.3); s.quadraticCurveTo(-0.44,1.4,0,1.85);
  const g=new THREE.ExtrudeGeometry(s,{depth:0.06,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.035,bevelSegments:2,curveSegments:10});
  g.rotateX(-Math.PI/2); g.translate(0,0.03,0); return boardShapeGeo=g; }
const boardMats={};
function makeBoard(b){
  const g=grp(); let m=boardMats[b.id];
  if(!m){ const tex=new THREE.CanvasTexture(boardCanvasFor(b)); tex.repeat.set(1/1.1,1/3.7); tex.offset.set(0.5,0.5);
    m=boardMats[b.id]=new THREE.MeshPhongMaterial({map:tex,shininess:b.sh||60,specular:0x666666,emissive:b.glow?0xffffff:0,emissiveMap:b.glow?tex:null,emissiveIntensity:b.glow?0.7:1}); }
  const deck=new THREE.Mesh(boardGeo(),m); g.add(deck);
  const fm=mat(0x222831,{sh:40}); add(g,box(0.03,0.22,0.24),fm,0,-0.06,1.4); add(g,box(0.03,0.16,0.18),fm,0.24,-0.04,1.3,null,[0,0,0.3]); add(g,box(0.03,0.16,0.18),fm,-0.24,-0.04,1.3,null,[0,0,-0.3]);
  if(b.fin){ const f=add(g,cone(0.2,0.55,3),mat(0x6b7a86),0,0.32,-0.2,[0.25,1,1.4]); f.rotation.set(0,0,0); }
  return g;
}
const _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), UP=new THREE.Vector3(0,1,0);
function makeSurfer(c){
  const root=grp(), o={root};
  const skin=mat(c.skin,{sh:20}), suit=mat(c.suit,{sh:35,e:c.glow?c.accent:0,ei:c.glow?0.12:1}), acc=mat(c.accent,{sh:40,e:c.glow?c.accent:0,ei:c.glow?0.9:1}), hair=mat(c.hair,{sh:10});
  const legGeo=geo('leg',()=>{ const g=new THREE.CylinderGeometry(0.085,0.1,1,7); g.translate(0,0.5,0); return g; });
  o.legs=[-1,1].map(s=>{ const m=new THREE.Mesh(legGeo,c.acc==='shorts'?skin:suit); root.add(m); const foot=new THREE.Vector3(0,0.1,s*0.42); add(root,box(0.16,0.07,0.26),mat(0x222222),0.02,0.12,s*0.42); return {m,foot,s}; });
  if(c.acc==='shorts'){ o.shorts=add(root,box(0.3,0.26,0.42),suit,0,0.9,0); }
  const chest=grp(); root.add(chest); o.chest=chest;
  add(chest,cyl(0.17,0.2,0.62,8),c.acc==='shorts'?skin:suit,0,0.33,0);
  add(chest,cyl(0.205,0.205,0.1,8),acc,0,0.42,0);
  if(c.acc==='premium'){ add(chest,box(0.05,0.5,0.06),mat(0xffc400,{sh:90}),0.19,0.35,0); }
  const head=grp(); head.position.set(0,0.78,0); chest.add(head); o.head=head;
  add(head,cyl(0.06,0.07,0.14,6),skin,0,-0.1,0);
  add(head,sph(0.16,10,8),skin,0,0.08,0);
  add(head,sph(0.17,10,8),hair,-0.03,0.14,0,[1,0.62,1]);
  if(c.acc==='ponytail') add(head,sph(0.08,6,6),hair,-0.2,0.08,0,[1.4,0.7,0.7]);
  if(c.acc==='shades') add(head,box(0.06,0.06,0.26),mat(0x111111,{sh:100}),0.15,0.1,0);
  if(c.acc==='visor') add(head,box(0.06,0.07,0.3),bmat(c.accent),0.15,0.1,0);
  if(c.acc==='headband') add(head,cyl(0.168,0.168,0.06,10),acc,0,0.15,0);
  if(c.acc==='hood') add(head,sph(0.2,10,8),suit,-0.04,0.1,0,[1,1.05,1.05]);
  if(c.acc==='hat'){ add(head,cyl(0.3,0.3,0.03,12),mat(0x3e2723),0,0.24,0); add(head,cyl(0.15,0.17,0.18,10),mat(0x3e2723),0,0.33,0); add(head,cyl(0.172,0.172,0.04,10),acc,0,0.27,0); }
  head.rotation.y=1.15;
  const armGeo=geo('arm',()=>{ const g=new THREE.CylinderGeometry(0.055,0.06,0.58,6); g.translate(0,-0.29,0); return g; });
  o.arms=[-1,1].map(s=>{ const a=grp(); a.position.set(0,0.6,s*0.22); chest.add(a); add(a,armGeo,c.acc==='premium'||c.acc==='hood'||c.glow?suit:skin); add(a,sph(0.07,6,6),skin,0,-0.6,0); return {a,s}; });
  o.pose=(cr,sw=0)=>{ const hy=lerp(0.98,0.62,cr);
    chest.position.set(0.05*cr,hy,0); chest.rotation.z=-0.1-cr*0.38;
    if(o.shorts){ o.shorts.position.y=hy-0.06; }
    for(const L of o.legs){ _v1.set(0.03*cr,hy,L.s*0.13); _v2.copy(_v1).sub(L.foot); const len=_v2.length(); L.m.position.copy(L.foot); L.m.quaternion.setFromUnitVectors(UP,_v2.normalize()); L.m.scale.set(1,len,1); }
    for(const A of o.arms){ A.a.rotation.x=-A.s*(1.2+cr*0.2)+sw*0.35; A.a.rotation.z=0.25+cr*0.3; }
  };
  o.pose(0.2); return o;
}

/* ================= POWER-UP ICONS ================= */
const ICON={};
function drawIcon(type){
  const c=document.createElement('canvas'); c.width=c.height=96; const x=c.getContext('2d'); const col=POWERS[type].color;
  x.fillStyle='#051b25'; x.beginPath(); x.arc(48,48,46,0,TAU); x.fill(); x.lineWidth=7; x.strokeStyle=col; x.fillStyle=col; x.lineCap='round'; x.lineJoin='round';
  if(type==='magnet'){ x.lineWidth=14; x.beginPath(); x.arc(48,46,18,Math.PI,0,true); x.stroke(); x.beginPath(); x.moveTo(30,46); x.lineTo(30,66); x.moveTo(66,46); x.lineTo(66,66); x.stroke(); x.strokeStyle='#fff'; x.beginPath(); x.moveTo(30,64); x.lineTo(30,70); x.moveTo(66,64); x.lineTo(66,70); x.stroke(); }
  if(type==='shield'){ x.beginPath(); x.moveTo(48,18); x.lineTo(74,28); x.quadraticCurveTo(74,62,48,78); x.quadraticCurveTo(22,62,22,28); x.closePath(); x.fill(); x.strokeStyle='#fff'; x.lineWidth=5; x.beginPath(); x.moveTo(34,48); x.quadraticCurveTo(48,38,62,48); x.stroke(); }
  if(type==='boost'){ x.beginPath(); x.moveTo(54,14); x.lineTo(28,54); x.lineTo(46,54); x.lineTo(40,82); x.lineTo(68,40); x.lineTo(50,40); x.closePath(); x.fill(); }
  if(type==='mult'){ x.font='900 40px Arial Black, Impact, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('x2',48,50); }
  if(type==='bonus'){ for(let i=0;i<3;i++){ x.beginPath(); x.ellipse(48,64-i*12,20,8,0,0,TAU); x.fill(); x.strokeStyle='#8a5a00'; x.lineWidth=3; x.stroke(); } }
  if(type==='jump'){ x.beginPath(); x.moveTo(48,16); x.lineTo(70,44); x.lineTo(56,44); x.lineTo(56,62); x.lineTo(40,62); x.lineTo(40,44); x.lineTo(26,44); x.closePath(); x.fill(); x.lineWidth=5; x.beginPath(); x.moveTo(30,74); x.lineTo(66,74); x.stroke(); }
  if(type==='perfect'){ x.lineWidth=8; x.beginPath(); x.moveTo(16,56); x.bezierCurveTo(30,30,44,30,48,48); x.bezierCurveTo(52,66,66,66,80,40); x.stroke(); x.strokeStyle='#fff'; x.lineWidth=4; x.beginPath(); x.moveTo(20,70); x.lineTo(76,70); x.stroke(); }
  return c;
}
for(const k in POWERS){ const c=drawIcon(k); ICON[k]={canvas:c,url:c.toDataURL()}; }

/* ================= OBSTACLE BUILDERS ================= */
let curMap=MAPS[0];
const vis=p=>p.vis?{e:p.vis}:{};
function netTex(color){ return canvasTex(64,64,(x,w,h)=>{ x.strokeStyle=color; x.lineWidth=3; for(let i=0;i<=w;i+=12){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(w,i); x.stroke(); } }); }
const _nt={};
function arch(p,col,col2,o={}){ const g=grp(); const m=mat(col,o), m2=mat(col2,o);
  add(g,box(0.6,4.2,0.8),m,-1.5,1.3,0); add(g,box(0.6,4.2,0.8),m,1.5,1.3,0);
  add(g,box(3.8,1.3,1.0),m2,0,2.0,0); add(g,ico(0.6,0),m2,-1.5,3.3,0); add(g,ico(0.5,0),m,1.4,2.9,0.2); return g; }
const KINDS={
 rock:{t:'block',b:p=>{ const g=grp(); add(g,ico(1.2,0),mat(p.rock,vis(p)),0,0.3,0,[1,1.3,0.95]); add(g,ico(0.7,0),mat(p.rock2,vis(p)),0.75,0,0.45); add(g,ico(0.55,0),mat(p.rock2,vis(p)),-0.8,-0.05,-0.3); return g; }},
 bigrock:{t:'block',b:p=>{ const g=grp(); add(g,ico(1.45,0),mat(p.rock),0,0.6,0,[1,1.6,1]); add(g,ico(0.8,0),mat(p.rock2),0.9,0.1,0.3); add(g,ico(0.6,0),mat(p.glow||p.rock2,p.glow?{e:p.glow,ei:0.4}:{}),-0.7,1.6,0.6,0.5); return g; }},
 buoy:{t:'block',b:p=>{ const g=grp(); const r=mat(p.acc,vis(p)); add(g,cyl(0.75,0.85,0.8,10),r,0,0.2,0); add(g,cyl(0.5,0.72,1.2,10),mat(p.acc2||0xffffff,vis(p)),0,1.2,0); add(g,cone(0.5,0.9,10),r,0,2.2,0); add(g,sph(0.2,8,6),bmat(0xfff2a0),0,2.75,0); return g; }},
 npc:{t:'block',npc:1,b:()=>{ const s=makeSurfer({skin:pick([0xc68642,0xe0ac69,0x8d5524]),suit:pick([0x43a047,0xfb8c00,0x8e24aa,0x00897b]),accent:0xffffff,hair:0x2b1b0e,acc:'none'}); const g=grp(); const nb=ri(0,2); g.add(makeBoard({id:'npc'+nb,design:'stripe',c:['#ffffff',['#43a047','#fb8c00','#8e24aa'][nb],'#222222']})); s.root.position.y=0.1; s.root.rotation.y=Math.PI; s.pose(0.3); g.add(s.root); return g; }},
 log:{t:'low',b:p=>{ const g=grp(); add(g,cyl(0.34,0.34,2.5,7),mat(p.wood,vis(p)),0,0.15,0,null,[0,0,Math.PI/2]); add(g,cyl(0.26,0.26,0.02,7),mat(0xd9b07a),1.26,0.15,0,null,[0,0,Math.PI/2]); return g; }},
 drift:{t:'low',b:p=>{ const g=grp(); const m=mat(0x8a7a6a); add(g,cyl(0.3,0.36,2.4,6),m,0,0.15,0,null,[0.2,0,Math.PI/2]); add(g,cyl(0.08,0.12,0.9,5),m,0.4,0.5,0.2,null,[0.4,0,-0.6]); add(g,cyl(0.08,0.12,0.7,5),m,-0.6,0.45,-0.2,null,[-0.3,0,0.7]); return g; }},
 barrel:{t:'low',b:p=>{ const g=grp(); add(g,cyl(0.48,0.48,0.95,10),mat(p.wood,vis(p)),0,0.28,0); add(g,cyl(0.5,0.5,0.08,10),mat(p.metal||0x777777),0,0.6,0); add(g,cyl(0.5,0.5,0.08,10),mat(p.metal||0x777777),0,0.0,0); add(g,cyl(0.4,0.4,0.9,10),mat(p.wood,vis(p)),0.95,0.2,0,null,[Math.PI/2,0,0.3]); return g; }},
 debris:{t:'low',b:p=>{ const g=grp(); add(g,box(0.9,0.6,0.9),mat(p.wood,vis(p)),-0.5,0.2,0,null,[0.2,0.4,0.1]); add(g,box(1.6,0.12,0.35),mat(p.wood,vis(p)),0.5,0.25,0.1,null,[0,0.6,0.2]); add(g,box(0.6,0.45,0.6),mat(p.rock2||p.wood),0.7,0.15,-0.2,null,[0.3,0.2,0]); return g; }},
 ember:{t:'low',b:p=>{ const g=grp(); add(g,ico(0.6,0),mat(p.rock),-0.5,0.2,0); add(g,ico(0.5,0),mat(p.rock2),0.4,0.15,0.1); add(g,ico(0.32,0),mat(p.glow,{e:p.glow,ei:0.9}),0,0.45,0); return g; }},
 net:{t:'high',b:p=>{ const g=grp(); const post=mat(p.acc,vis(p)); add(g,cyl(0.12,0.12,3.4,6),post,-1.45,1.4,0); add(g,cyl(0.12,0.12,3.4,6),post,1.45,1.4,0);
   add(g,sph(0.35,8,6),post,-1.45,0,0); add(g,sph(0.35,8,6),post,1.45,0,0); add(g,cyl(0.07,0.07,3.1,6),mat(0xd8c9a0),0,2.95,0,null,[0,0,Math.PI/2]);
   const nt=_nt[p.acc2]||(_nt[p.acc2]=netTex('#e8dcc0')); nt.wrapS=nt.wrapT=THREE.RepeatWrapping; nt.repeat.set(4,2);
   add(g,new THREE.PlaneGeometry(2.9,1.65),new THREE.MeshBasicMaterial({map:nt,transparent:true,side:THREE.DoubleSide,alphaTest:0.3}),0,2.1,0);
   for(let i=-1;i<=1;i+=0.5) add(g,sph(0.11,6,4),mat(0xff8a1a,{e:0x401800}),i*1.3,1.28,0); return g; }},
 whirl:{t:'low',y:0.35,b:p=>{ const g=grp(); const t=canvasTex(128,128,(x,w)=>{ const c=w/2; for(let i=0;i<60;i++){ x.strokeStyle=`rgba(255,255,255,${0.2+0.6*Math.random()})`; x.lineWidth=rand(2,5); x.beginPath(); const r=rand(8,60); x.arc(c,c,r,rand(0,TAU),rand(0,TAU)); x.stroke(); } x.fillStyle='rgba(0,10,30,.7)'; x.beginPath(); x.arc(c,c,14,0,TAU); x.fill(); });
   const m=add(g,new THREE.CircleGeometry(1.5,24),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}),0,0.12,0,null,[-Math.PI/2,0,0]); m.name='spin'; return g; }},
 breaker:{t:'low',b:p=>{ const g=grp(); const f=mat(0xf2fbff,{sh:30}); add(g,ico(0.9,1),f,0,0,0,[1.5,0.75,0.8]); add(g,ico(0.5,0),f,-0.9,0.3,0.1); add(g,ico(0.5,0),f,0.9,0.25,-0.1); g.userData.foam=1; return g; }},
 lip:{t:'high',b:p=>{ const g=grp(); const m=mat(0x9fd8ff,{op:0.85,sh:80}); const t=add(g,tor(1.75,0.42,6,16,Math.PI),m,0,0,0); add(g,tor(1.75,0.22,5,16,Math.PI),mat(0xffffff),0,0.25,0.15); g.userData.foam=1; return g; }},
 volrock:{t:'block',b:p=>{ const g=grp(); add(g,ico(1.25,0),mat(p.rock),0,0.4,0,[1,1.35,1]); add(g,ico(0.7,0),mat(p.rock2),0.8,0,0.3);
   const gm=bmat(p.glow); add(g,box(0.12,1.6,0.12),gm,0.3,0.7,-1.0,null,[0,0,0.3]); add(g,box(0.1,1.1,0.1),gm,-0.5,0.9,-0.95,null,[0,0,-0.4]); add(g,ico(0.28,0),gm,0,1.9,0); return g; }},
 arch:{t:'high',b:p=>arch(p,p.rock,p.rock2)},
 berg:{t:'block',b:p=>{ const g=grp(); add(g,ico(1.4,0),mat(p.ice,{sh:80}),0,0.7,0,[1,1.4,1]); add(g,ico(0.8,0),mat(p.ice2,{sh:80}),0.8,0.1,0.4); add(g,ico(0.6,0),mat(p.ice2,{sh:80}),-0.9,0,-0.2); return g; }},
 icechunk:{t:'low',b:p=>{ const g=grp(); add(g,box(2.2,0.5,1.0),mat(p.ice,{sh:80}),0,0.15,0,null,[0,0.15,0.05]); add(g,box(0.9,0.4,0.6),mat(p.ice2,{sh:80}),0.6,0.45,0.1,null,[0,0.5,0.1]); return g; }},
 icearch:{t:'high',b:p=>arch(p,p.ice2,p.ice,{sh:80})},
 driftberg:{t:'block',move:1,b:p=>{ const g=KINDS.berg.b(p); return g; }},
 jelly:{t:'block',b:p=>{ const g=grp(); add(g,sph(1.15,12,8),mat(p.acc,{e:p.acc,ei:0.6,op:0.75}),0,0.5,0,[1,0.8,1]); add(g,sph(0.6,8,6),bmat(0xffffff,{op:0.6}),0,0.6,0);
   for(let i=0;i<6;i++){ const a=i/6*TAU; add(g,cyl(0.05,0.02,1.4,4),bmat(p.acc2),Math.cos(a)*0.8,-0.2,Math.sin(a)*0.8); } return g; }},
 glowrock:{t:'block',b:p=>{ const g=KINDS.rock.b(p); add(g,ico(0.35,0),bmat(p.glow),0.3,1.4,-0.5); add(g,ico(0.25,0),bmat(p.acc),-0.6,0.8,-0.7); return g; }},
 glowreef:{t:'low',b:p=>{ const g=grp(); for(let i=0;i<5;i++) add(g,cone(0.2,rand(0.5,0.85),5),mat(i%2?p.glow:p.acc,{e:i%2?p.glow:p.acc,ei:0.8}),-0.9+i*0.45,0.25,rand(-0.3,0.3)); add(g,box(2.2,0.3,0.8),mat(p.rock),0,0,0); return g; }},
 glowarch:{t:'high',b:p=>{ const g=arch(p,p.rock,p.rock2); add(g,box(3.8,0.1,1.05),bmat(p.glow),0,1.36,0); add(g,box(0.1,3.4,0.85),bmat(p.acc),-1.18,1.4,0); add(g,box(0.1,3.4,0.85),bmat(p.acc),1.18,1.4,0); return g; }},
 robobuoy:{t:'block',b:p=>{ const g=grp(); const m=mat(p.metal,{sh:90}); add(g,cyl(0.9,1.0,0.7,12),m,0,0.2,0); add(g,cyl(0.55,0.75,1.6,12),mat(p.metal2,{sh:90}),0,1.3,0); add(g,cyl(0.78,0.78,0.12,16),bmat(p.acc),0,0.85,0);
   add(g,sph(0.35,10,8),m,0,2.25,0); add(g,box(0.3,0.12,0.12),bmat(p.acc2),0,2.25,-0.32); return g; }},
 scrap:{t:'low',b:p=>{ const g=grp(); const m=mat(p.metal2,{sh:90}); add(g,box(1.4,0.35,0.9),m,-0.3,0.15,0,null,[0.1,0.5,0.15]); add(g,cyl(0.2,0.2,1.6,8),mat(p.metal,{sh:90}),0.5,0.3,0.2,null,[0,0.4,Math.PI/2]); add(g,box(1.2,0.06,0.06),bmat(p.acc),-0.3,0.35,-0.46,null,[0,0.5,0]); return g; }},
 gate:{t:'high',b:p=>{ const g=grp(); const m=mat(p.metal,{sh:90}); add(g,box(0.4,3.6,0.4),m,-1.5,1.3,0); add(g,box(0.4,3.6,0.4),m,1.5,1.3,0); add(g,box(3.4,0.5,0.5),mat(p.metal2,{sh:90}),0,2.9,0);
   add(g,box(3.0,0.14,0.14),bmat(p.acc2),0,1.35,0); add(g,box(3.0,0.14,0.14),bmat(p.acc),0,1.7,0); add(g,box(3.0,1.0,0.05),bmat(p.acc,{op:0.25,add:1}),0,2.2,0); return g; }},
 platform:{t:'block',move:1,b:p=>{ const g=grp(); add(g,box(2.2,0.9,2.2),mat(p.metal,{sh:90}),0,0.4,0); add(g,box(2.3,0.1,2.3),bmat(p.acc),0,0.9,0); add(g,box(1.0,1.4,1.0),mat(p.metal2,{sh:90}),0,1.5,0); add(g,box(1.05,0.1,1.05),bmat(p.acc2),0,1.9,0); return g; }},
 coral:{t:'block',b:p=>{ const g=grp(); add(g,ico(0.9,0),mat(p.rock),0,0,0,[1.3,0.8,1]); const cs=[p.c1,p.c2,p.c3];
   for(let i=0;i<7;i++){ const c=cs[i%3]; const b=add(g,cyl(0.12,0.2,rand(1.2,2.4),6),mat(c),rand(-0.8,0.8),0.8,rand(-0.5,0.5)); b.rotation.set(rand(-0.4,0.4),0,rand(-0.4,0.4)); add(g,sph(0.22,6,5),mat(c),b.position.x,b.position.y+0.9,b.position.z); } return g; }},
 reef:{t:'low',b:p=>{ const g=grp(); add(g,ico(0.8,0),mat(p.rock2),0,-0.2,0,[1.6,0.6,0.9]); const cs=[p.c1,p.c2,p.c3]; for(let i=0;i<6;i++) add(g,sph(rand(0.2,0.32),6,5),mat(cs[i%3]),rand(-1,1),0.3,rand(-0.4,0.4)); return g; }},
 coralarch:{t:'high',b:p=>{ const g=arch(p,p.rock2,p.c1); for(let i=0;i<5;i++) add(g,sph(0.3,6,5),mat([p.c2,p.c3][i%2]),-1.6+i*0.8,2.75,rand(-0.3,0.3)); return g; }},
 wreck:{t:'block',b:p=>{ const g=grp(); const w=mat(p.wood), w2=mat(p.wood2); add(g,box(2.2,1.6,1.4),w,0,0.4,0,null,[0.3,0.2,0.25]); add(g,box(2.3,0.2,1.5),w2,0,1.2,0.2,null,[0.3,0.2,0.25]);
   add(g,cyl(0.1,0.12,3,6),w2,0.4,2.0,0,null,[0,0,-0.4]); add(g,box(0.06,1.2,1.0),mat(p.sail),0.9,2.3,0,null,[0,0,-0.4]); return g; }},
 mast:{t:'high',b:p=>{ const g=grp(); const w2=mat(p.wood2); add(g,cyl(0.18,0.2,4.4,7),w2,0,1.95,0,null,[0,0,Math.PI/2+0.06]); add(g,box(0.5,3.2,0.5),mat(p.wood),-1.5,0.7,0,null,[0,0,0.1]); add(g,box(0.5,3.2,0.5),mat(p.rock),1.55,0.6,0,null,[0,0,-0.08]);
   add(g,new THREE.PlaneGeometry(2.6,0.75),mat(0x3a3a3a,{side:1}),0.1,1.55,0,null,[0,0,0.06]); return g; }},
 stack:{t:'block',fixed:1,b:p=>{ const g=grp(); add(g,cyl(0.9,1.3,7,7),mat(p.rock),0,2.5,0); add(g,cyl(0.7,0.95,2,6),mat(p.rock2),0.1,6.8,0); add(g,ico(0.8,0),mat(0x5a7a3a),0,7.9,0,[1,0.4,1]); return g; }},
 crystal:{t:'block',b:p=>{ const g=grp(); add(g,oct(1.0),mat(p.crystal,{e:p.crystal,ei:0.5,sh:90}),0,1.0,0,[0.8,1.8,0.8]); add(g,oct(0.6),mat(p.crystal2,{e:p.crystal2,ei:0.6,sh:90}),0.8,0.4,0.3,[0.7,1.5,0.7]); add(g,oct(0.5),mat(p.crystal2,{e:p.crystal2,ei:0.6}),-0.8,0.3,-0.2,[0.7,1.4,0.7]); return g; }},
 shard:{t:'low',b:p=>{ const g=grp(); for(let i=0;i<4;i++) add(g,oct(0.35),mat(i%2?p.crystal:p.crystal2,{e:i%2?p.crystal:p.crystal2,ei:0.7}),-0.9+i*0.6,0.25,rand(-0.3,0.3),[0.8,1.3,0.8]); return g; }},
 halo:{t:'high',b:p=>{ const g=grp(); add(g,tor(1.65,0.2,6,24,Math.PI),bmat(p.crystal2),0,1.25,0); add(g,tor(1.65,0.1,6,24,Math.PI),bmat(p.acc),0,1.25,0.25); add(g,box(3.3,0.12,0.12),bmat(p.crystal2),0,1.35,0); add(g,oct(0.5),mat(p.crystal,{e:p.crystal,ei:0.6}),-1.65,0.4,0); add(g,oct(0.5),mat(p.crystal,{e:p.crystal,ei:0.6}),1.65,0.4,0); return g; }},
 meteor:{t:'block',move:1,b:p=>{ const g=grp(); add(g,ico(1.0,0),mat(0x3a2a2a),0,0.7,0); add(g,ico(1.15,0),bmat(0xff8a3a,{op:0.35,add:1}),0,0.7,0); add(g,ico(0.3,0),bmat(0xffd84a),0.5,1.3,-0.6); return g; }},
};
const DIMS={block:{hw:1.05,hd:1.0,y0:-1,y1:5},low:{hw:1.15,hd:0.6,y0:-1,y1:0.85},high:{hw:1.2,hd:0.4,y0:1.15,y1:6}};
const protoCache={};
function buildKind(kind,m){ const key=m.id+'|'+kind; if(KINDS[kind].npc) return KINDS[kind].b(m.pal); if(!protoCache[key]) protoCache[key]=KINDS[kind].b(m.pal); return protoCache[key].clone(); }

/* ---- collectibles ---- */
const coinMat=new THREE.MeshPhongMaterial({color:0xffc93c,emissive:0x6a4200,shininess:90,specular:0xffffcc,flatShading:true});
const coinGeo=new THREE.CylinderGeometry(0.42,0.42,0.1,14); coinGeo.rotateX(Math.PI/2);
const COLL={
 coin:()=>new THREE.Mesh(coinGeo,coinMat),
 pearl:()=>{ const g=grp(); add(g,sph(0.3,12,8),new THREE.MeshPhongMaterial({color:0xfff0ff,emissive:0xff9aff,emissiveIntensity:0.6,shininess:120})); add(g,sph(0.55,10,8),bmat(0xff9aff,{op:0.25,add:1})); return g; },
 energy:()=>{ const g=grp(); add(g,oct(0.38),bmat(0xffe27a)); add(g,sph(0.6,8,6),bmat(0xffd84a,{op:0.25,add:1})); return g; },
 ring:()=>{ const g=grp(); add(g,tor(1.05,0.12,6,24),bmat(0x00f0ff,{op:0.9,add:1})); add(g,tor(0.9,0.05,4,24),bmat(0xff3ad0,{op:0.9,add:1})); return g; },
 chest:()=>{ const g=grp(); add(g,box(0.9,0.55,0.6),mat(0x6d3b17),0,0,0); add(g,box(0.94,0.25,0.64),mat(0x8b5a2b),0,0.38,0); add(g,box(0.96,0.08,0.2),mat(0xffc93c,{sh:80}),0,0.15,0); add(g,box(0.2,0.2,0.66),mat(0xffc93c,{sh:80}),0,0.25,0); add(g,sph(0.9,8,6),bmat(0xffd84a,{op:0.18,add:1}),0,0.2,0); return g; },
};
function makePU(type){ const g=grp(); add(g,sph(0.75,14,10),new THREE.MeshPhongMaterial({color:new THREE.Color(POWERS[type].color),transparent:true,opacity:0.35,shininess:120,emissive:new THREE.Color(POWERS[type].color),emissiveIntensity:0.3,depthWrite:false}));
  const s=new THREE.Sprite(ICON[type].sm||(ICON[type].sm=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(ICON[type].canvas),transparent:true}))); s.scale.set(1.05,1.05,1); g.add(s); return g; }

/* ================= SCENERY ================= */
function palm(h=rand(4,6.5)){ const g=grp(); const tm=mat(0x8b6b45); let y=0, x=0; for(let i=0;i<5;i++){ add(g,cyl(0.2-i*0.02,0.24-i*0.02,h/5,6),tm,x,y+h/10,0,null,[0,0,-0.06*i]); y+=h/5; x+=0.09*i; }
  const lm=mat(0x2e9e48,{side:1}), lm2=mat(0x3fbf5a,{side:1}); for(let i=0;i<7;i++){ const l=add(g,cone(0.5,3,4),i%2?lm:lm2,x,y,0,[1,1,0.25]); l.rotation.set(0,i/7*TAU,1.9); l.translateY(1.3); } add(g,sph(0.25,6,5),mat(0x6b4a2a),x,y-0.2,0); return g; }
function island(r,cols){ const g=grp(); add(g,cyl(r,r*1.25,1.2,9),mat(cols[0]),0,-0.2,0); add(g,sph(r*0.75,9,6),mat(cols[1]),0,0.2,0,[1,0.55,1]); return g; }
function silhouette(col,r=rand(6,14),nf){ const g=grp(); const m=bmat(col,nf?{fog:false}:{}); add(g,cone(r,r*rand(0.6,1.2),7),m,0,r*0.25,0); add(g,cone(r*0.6,r*0.7,6),m,r*0.7,r*0.1,r*0.3); return g; }
function windowsTex(){ return canvasTex(64,128,(x,w,h)=>{ x.fillStyle='#0b0820'; x.fillRect(0,0,w,h); for(let yy=4;yy<h;yy+=8) for(let xx=4;xx<w;xx+=8) if(Math.random()<0.45){ x.fillStyle=pick(['#ff3ad0','#00f0ff','#ffe27a','#8a6aff','#ffffff']); x.fillRect(xx,yy,4,4); } }); }
let _wt=null;
const SCEN={
 tropical:()=>{ const r=Math.random(); if(r<0.5){ const g=island(rand(4,8),[0xf2d9a0,0x3faa55]); for(let i=0;i<ri(1,3);i++){ const p=palm(); p.position.set(rand(-3,3),0.2,rand(-3,3)); g.add(p);} return {o:g,x:[22,70]}; }
   if(r<0.8){ const p=palm(); const g=island(2,[0xf2d9a0,0x55b866]); p.position.y=0.2; g.add(p); return {o:g,x:[14,40]}; }
   return {o:gulls(),x:[0,30],air:1}; },
 sunset:()=>{ const r=Math.random(); if(r<0.55) return {o:silhouette(pick([0x2a1530,0x3a1a3a]),rand(5,12)),x:[24,80]}; if(r<0.85) return {o:sailboat(0x1a0d20),x:[18,60]}; return {o:gulls(0x1a0d20),x:[0,30],air:1}; },
 abyss:()=>{ const r=Math.random(); if(r<0.5){ const g=grp(); add(g,sph(rand(0.6,1.4),10,8),bmat(0x2affd0,{op:0.5,add:1}),0,0.2,0,[1,0.4,1]); add(g,sph(0.3,6,6),bmat(0xffffff,{op:0.7}),0,0.25,0); return {o:g,x:[9,30],glow:1}; }
   const g=grp(); add(g,ico(rand(3,6),0),mat(0x26364a),0,0,0,[1,rand(1,2),1]); return {o:g,x:[20,70]}; },
 volcano:()=>{ const g=grp(); add(g,ico(rand(2.5,6),0),mat(0x1f1616),0,0,0,[1,rand(0.8,1.8),1]); if(Math.random()<0.5) add(g,ico(0.8,0),bmat(0xff5a1a),rand(-1,1),rand(1,3),0); return {o:g,x:[16,70]}; },
 arctic:()=>{ const g=grp(); const s=rand(2.5,7); add(g,ico(s,0),mat(0xe8f6ff,{sh:80}),0,s*0.3,0,[1,rand(0.9,1.8),1]); add(g,ico(s*0.6,0),mat(0xa8daf0,{sh:80}),s*0.7,0,s*0.3); return {o:g,x:[15,70]}; },
 storm:()=>{ const r=Math.random(); if(r<0.6){ const g=grp(); add(g,ico(rand(3,7),0),mat(0x22282e),0,0,0,[1,rand(1,2.2),1]); return {o:g,x:[18,70]}; } return {o:sailboat(0x1a1f24,true),x:[18,50]}; },
 bio:()=>{ const r=Math.random(); if(r<0.55){ const g=grp(); const c=pick([0x2affe0,0xff4af0,0x5a8aff]); add(g,sph(rand(0.5,1),10,8),bmat(c,{op:0.55,add:1}),0,0.3,0,[1,0.7,1]); for(let i=0;i<5;i++) add(g,cyl(0.03,0.01,1.2,3),bmat(c,{op:0.6,add:1}),Math.cos(i)*0.4,-0.3,Math.sin(i)*0.4); return {o:g,x:[8,26],bob:1}; }
   if(r<0.8){ const g=grp(); for(let i=0;i<6;i++) add(g,cone(0.25,rand(0.8,2),5),bmat(pick([0x2affe0,0xff4af0])),rand(-1.5,1.5),0.4,rand(-1.5,1.5)); add(g,ico(1.5,0),mat(0x0b1520),0,-0.4,0,[1.4,0.5,1.2]); return {o:g,x:[10,30]}; }
   return {o:silhouette(0x050a14,rand(6,12)),x:[30,80]}; },
 neon:()=>{ const r=Math.random(); if(r<0.75){ const g=grp(); const h=rand(14,60), w=rand(5,10); _wt=_wt||windowsTex(); const t=_wt.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(w/6,h/10);
     add(g,box(w,h,w),new THREE.MeshBasicMaterial({map:t}),0,h/2-1,0); add(g,box(w+0.2,0.4,w+0.2),bmat(pick([0xff3ad0,0x00f0ff,0x8a6aff])),0,h-1,0);
     if(Math.random()<0.5) add(g,box(0.3,rand(3,6),rand(3,5)),bmat(pick([0xff3ad0,0x00f0ff,0xffe27a])),-w/2-0.3,h*rand(0.3,0.7),0); return {o:g,x:[26,70],both:1}; }
   const g=grp(); add(g,box(5,0.6,5),mat(0x2a2a3a,{sh:90}),0,0.2,0); add(g,box(5.1,0.1,5.1),bmat(0x00f0ff),0,0.55,0); return {o:g,x:[10,24]}; },
 coral:()=>{ const r=Math.random(); if(r<0.45){ const g=grp(); const cs=[0xff5a7a,0xff9a3a,0xb05aff,0xffd23f]; for(let i=0;i<8;i++){ const b=add(g,cyl(0.1,0.18,rand(0.6,1.6),5),mat(pick(cs)),rand(-1.5,1.5),0.3,rand(-1.5,1.5)); b.rotation.z=rand(-0.5,0.5); } add(g,ico(1.4,0),mat(0x9a8a7a),0,-0.5,0,[1.4,0.5,1.2]); return {o:g,x:[8,22]}; }
   if(r<0.65){ const g=grp(); add(g,sph(0.7,8,6),mat(0x3a7a3a),0,0,0,[1,0.45,1.2]); add(g,sph(0.2,6,5),mat(0x9a8a5a),0,0.05,-0.85); return {o:g,x:[8,18],bob:1}; }
   const g=island(rand(4,9),[0xf2e0b0,0x2f9f50]); for(let i=0;i<ri(2,4);i++){ const p=palm(); p.position.set(rand(-3,3),0.2,rand(-3,3)); g.add(p);} return {o:g,x:[24,70]}; },
 pirate:()=>{ const r=Math.random(); if(r<0.35) return {o:pirateShip(),x:[18,50]};
   if(r<0.65){ const g=grp(); add(g,cyl(4,5,1.4,8),mat(0x5a5a50),0,-0.2,0); for(let i=0;i<4;i++) add(g,cyl(0.35,0.4,rand(2,5),6),mat(0xb0a890),-2+i*1.3,1.5,rand(-1,1)); add(g,box(4,0.6,0.9),mat(0xb0a890),-0.6,4.2,0); return {o:g,x:[18,50]}; }
   const g=grp(); add(g,ico(rand(3,7),0),mat(0x4a4a46),0,0,0,[1,rand(1,2),1]); return {o:g,x:[16,60]}; },
 canyon:()=>({o:cliff(),x:[11,13],cliff:1}),
 cosmic:()=>{ const r=Math.random(); const g=grp(); if(r<0.6){ const c=pick([0x8a5aff,0x3af0ff,0xff6ad5]); add(g,oct(rand(1,2.5)),mat(c,{e:c,ei:0.5,sh:90}),0,rand(3,9),0,[0.7,1.6,0.7]); return {o:g,x:[10,40],float:1}; }
   add(g,ico(rand(1.5,4),0),mat(0x2a2240),0,rand(6,14),0); return {o:g,x:[15,50],float:1}; },
};
function gulls(col=0xffffff){ const g=grp(); const m=mat(col,{side:1}); for(let i=0;i<3;i++){ const b=grp(); b.position.set(rand(-4,4),rand(12,18),rand(-4,4)); const l=add(b,box(1.1,0.04,0.3),m,-0.5,0,0); const r=add(b,box(1.1,0.04,0.3),m,0.5,0,0); b.userData.w=[l,r]; b.userData.ph=rand(0,TAU); g.add(b); } g.userData.gulls=1; return g; }
function sailboat(col,dark){ const g=grp(); add(g,box(1.4,0.7,4),mat(col),0,0.2,0); add(g,cyl(0.08,0.08,6,5),mat(col),0,3.4,0); const s=new THREE.Shape(); s.moveTo(0,0); s.lineTo(0,5); s.lineTo(2.6,0.2); add(g,new THREE.ShapeGeometry(s),mat(dark?0x5a6066:col,{side:1}),0.05,0.8,0,null,[0,Math.PI/2,0]); return g; }
function pirateShip(){ const g=grp(); const w=mat(0x3a2614); add(g,box(3,2,10),w,0,0.4,0); add(g,box(3.2,1.4,3),mat(0x2a1a0c),0,1.8,3.5); for(let i=0;i<3;i++){ add(g,cyl(0.15,0.18,9,6),w,0,5,-3+i*3); add(g,box(0.05,3.2,3.4),mat(0x161616,{side:1}),0.1,5.5,-3+i*3); } add(g,box(0.05,0.8,1.2),mat(0x111111,{side:1}),0,9.8,0); return g; }
function cliff(){ const g=grp(); const h=rand(26,46); add(g,box(rand(5,9),h,rand(14,22)),mat(pick([0x6a5a4a,0x7a6650,0x5a4a3c])),0,h/2-2,0); add(g,box(4,rand(4,10),8),mat(0x8a7560),rand(-1,1),h-1,rand(-4,4));
  if(Math.random()<0.35){ add(g,box(0.4,h-2,2.6),bmat(0xeaf6ff,{op:0.75}),-3.2,h/2-1,rand(-4,4)); g.userData.fall=1; } add(g,box(9,1.2,22),mat(0x4a6a3a),0,h-1.5,0); return g; }

/* ---- backdrops (follow camera, unfogged) ---- */
function makeBackdrop(m){ const g=grp(); const k=m.back; if(!k) return g;
  if(k==='isles'){ for(let i=0;i<9;i++){ const a=rand(-1.3,1.3)-Math.PI/2, d=rand(420,560); const s=silhouette(pick(m.backCol),rand(20,45),1); s.position.set(Math.cos(a)*d,-4,Math.sin(a)*d); g.add(s);} }
  if(k==='volcano'){ const v=grp(); add(v,cone(150,120,10),bmat(0x2a1210,{fog:false}),0,50,0); add(v,cyl(30,32,6,10),bmat(0xff5a1a,{fog:false}),0,108,0); for(let i=0;i<6;i++){ const st=add(v,box(4,70,4),bmat(0xff6a20,{fog:false}),rand(-20,20),70,rand(-10,10)); st.rotation.z=rand(-0.6,0.6); }
    v.position.set(-170,-10,-520); g.add(v); g.userData.smoke=v; for(let i=0;i<6;i++){ const s=silhouette(0x1a0c0a,rand(20,40),1); s.position.set(rand(-500,500),-4,-rand(420,560)); g.add(s);} }
  if(k==='mountains'){ for(let i=0;i<12;i++){ const mg=grp(); const h=rand(80,170); add(mg,cone(h*0.8,h,6),bmat(0x6a8aa8,{fog:false}),0,h/2,0); add(mg,cone(h*0.36,h*0.45,6),bmat(0xf4fbff,{fog:false}),0,h*0.78,0); const a=rand(-1.4,1.4)-Math.PI/2, d=rand(520,650); mg.position.set(Math.cos(a)*d,-8,Math.sin(a)*d); g.add(mg);} }
  if(k==='moon'){ add(g,sph(38,24,16),bmat(0xf4f8ff,{fog:false}),120,210,-620); add(g,sph(70,20,14),bmat(0x6fa8ff,{fog:false,op:0.12,add:1}),120,210,-622); for(let i=0;i<6;i++){ const s=silhouette(0x040810,rand(20,40),1); s.position.set(rand(-500,500),-4,-rand(420,560)); g.add(s);} }
  if(k==='skyline'){ _wt=_wt||windowsTex(); for(let i=0;i<40;i++){ const h=rand(40,180), w=rand(14,30); const t=_wt.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(w/8,h/12); add(g,box(w,h,w),new THREE.MeshBasicMaterial({map:t,fog:false}),-480+i*24+rand(-6,6),h/2-6,-rand(470,560)); } }
  if(k==='planets'){ add(g,sph(60,24,16),bmat(0xff8ad8,{fog:false}),-220,200,-600); add(g,tor(100,6,4,40),bmat(0xffd8f0,{fog:false,op:0.6}),-220,200,-600,null,[1.2,0.2,0]); add(g,sph(28,16,12),bmat(0x6ae0ff,{fog:false}),260,130,-560); add(g,sph(12,12,8),bmat(0xffe27a,{fog:false}),90,260,-640); }
  return g; }

/* ================= GAME STATE ================= */
let state='loading';
const player=grp(); scene.add(player);
const tilt=grp(); player.add(tilt);
let boardMesh=null, rider=null;
function equip(sid,bid){ if(boardMesh) tilt.remove(boardMesh); if(rider) tilt.remove(rider.root);
  const b=BOARDS.find(x=>x.id===bid)||BOARDS[0], s=SURFERS.find(x=>x.id===sid)||SURFERS[0];
  boardMesh=makeBoard(b); tilt.add(boardMesh); rider=makeSurfer(s); rider.root.position.y=0.1; tilt.add(rider.root); P.boardCfg=b; }
const shieldBubble=new THREE.Mesh(new THREE.SphereGeometry(1.5,16,12),new THREE.MeshPhongMaterial({color:0x4dabff,emissive:0x2266aa,transparent:true,opacity:0.28,shininess:120,depthWrite:false}));
shieldBubble.position.y=1; shieldBubble.visible=false; player.add(shieldBubble);

const P={lane:1,x:0,px:0,jy:0,vy:0,air:false,duck:0,trick:null,shield:false,inv:0,pu:{},boardCfg:null,yaw:0,menuYaw:-0.55,userYaw:0,spin:0,flip:0,fall:0};
const G={speed:0,toRow:30,toPU:400,toScen:0,shake:0,ts:1,crashT:0,introT:0,map:MAPS[0],nextStage:STAGE_LEN,pbShown:false,lightT:5,flash:0,flashCol:new THREE.Color(),reefLane:1,prevPass:[0,1,2],stageIdx:0,menuView:'menu'};
let R={};
let obstacles=[], colls=[], pus=[], rows=[], scen=[];
const EV={active:null,def:null,t:0,next:20,mods:{}};
let backdrop=grp(), oldBack=null; scene.add(backdrop);

function clearWorld(){ for(const o of obstacles) scene.remove(o.mesh); for(const c of colls) scene.remove(c.mesh); for(const p of pus) scene.remove(p.mesh); for(const s of scen) scene.remove(s.o); obstacles=[]; colls=[]; pus=[]; rows=[]; scen=[]; sprayPS.clear(); glowPS.clear(); }
function setMap(m,instant){
  curMap=m; G.map=m; setTarget(m); if(instant){ lerpTheme(1); W.chop=TH.chop; W.swell=TH.swell; }
  weather.set(m.weather); Snd.setTheme(m);
  if(oldBack) scene.remove(oldBack);
  oldBack=backdrop; backdrop=makeBackdrop(m); scene.add(backdrop);
  if(instant){ scene.remove(oldBack); oldBack=null; backdrop.position.y=0; } else backdrop.position.y=-160;
}
function fillScenery(){ for(let z=-420; z<30; z+=rand(14,28)) spawnScenery(z); }
function spawnScenery(z,force){
  const m=G.map, fn=SCEN[m.scen]; if(!fn) return;
  const s=force||fn(); const side=Math.random()<0.5?-1:1;
  const place=(sd)=>{ const o=s.o===undefined?null:(sd===side?s.o:s.o.clone()); const x=sd*rand(s.x[0],s.x[1]); o.position.set(x,s.air?0:-0.2,z); if(!s.cliff) o.rotation.y=rand(0,TAU); scene.add(o); scen.push({o,z,x,bob:s.bob,float:s.float,air:s.air,base:o.position.y,ph:rand(0,TAU)}); };
  place(side); if(s.both||s.cliff) place(-side);
}

/* ================= RUN CONTROL ================= */
function diffNow(){ const m=G.map; return clamp(1-Math.exp(-(R.dist||0)/5200)+(m.diff-1)*0.045,0,1); }
function baseSpeed(d){ return 15.5+(G.map.diff-1)*0.7+23*d; }
function resetRun(){
  clearWorld(); EV.active=null; EV.def=null; EV.next=rand(16,24); EV.mods={};
  R={score:0,dist:0,coins:0,jumps:0,tricks:0,avoided:0,combo:0,maxCombo:0,pearls:0,treasures:0,power:0,events:0,rings:0,storm:0,visited:new Set(),perfectStreak:0,prevBest:SAVE.best,doubler:false};
  P.lane=1; P.x=0; P.px=0; P.jy=0; P.vy=0; P.air=false; P.duck=0; P.trick=null; P.shield=false; P.inv=0; P.pu={magnet:0,boost:0,mult:0,jump:0,perfect:0}; P.spin=0; P.flip=0; P.fall=0;
  G.toRow=60; G.toPU=rand(260,380); G.toScen=0; G.shake=0; G.ts=1; G.pbShown=false; G.nextStage=STAGE_LEN; G.stageIdx=0; G.prevPass=[0,1,2]; G.reefLane=1; G.lightT=rand(3,7);
  const m=SAVE.adventure?MAP.tropical:MAP[SAVE.map]; setMap(m,true); R.visited.add(m.id); fillScenery();
  // boosts
  const b=SAVE.boosts; if(b.shield>0){ b.shield--; P.shield=true; } if(b.magnet>0){ b.magnet--; P.pu.magnet=12; } if(b.score>0){ b.score--; P.pu.mult=15; } if(b.doubler>0){ b.doubler--; R.doubler=true; }
  persist();
  equip(SAVE.surfer,SAVE.board); rider.root.rotation.set(0,0,0);
  $('hBest').textContent='BEST '+fmt(SAVE.best);
}
function startRun(skipCine){
  Snd.init(); hideAll(); resetRun();
  $('hud').hidden=false; $('pus').innerHTML='';
  state='intro'; G.introT=0; G.introFast=!!skipCine; G.speed=0;
  W.faceH=0; W.faceZ=skipCine?14:42; P.menuYaw=-0.55;
  const boosts=[]; if(P.shield) boosts.push('Wave Shield'); if(P.pu.magnet) boosts.push('Coin Magnet'); if(P.pu.mult) boosts.push('Score x2'); if(R.doubler) boosts.push('Coin Doubler');
  if(boosts.length) toast('Boosts active: <em>'+boosts.join(', ')+'</em>');
  $('skip').hidden=!(SAVE.introSeen&&!skipCine);
  if(SAVE.settings.skipIntro&&SAVE.introSeen&&!skipCine){ G.introFast=true; W.faceZ=14; $('skip').hidden=true; }
}
function beginPlay(){
  state='play'; $('skip').hidden=true; SAVE.introSeen=true; persist();
  G.speed=Math.max(G.speed,baseSpeed(diffNow())*0.6);
  showTut();
}
function showTut(){ const t=$('tut'); $('tutU').textContent=isFine?(SAVE.settings.cursor?'Move the cursor to steer · Click to jump · Right-click to duck':'Drag with the mouse to swipe · or use the arrow keys'):'Swipe left or right to move · Up to jump · Down to duck';
  t.classList.add('on'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('on'),2800); }

/* ================= INPUT ================= */
function act(dir){
  if(state!=='play') return;
  if(dir==='left'){ if(P.lane>0){ P.lane--; Snd.swish(); } }
  else if(dir==='right'){ if(P.lane<2){ P.lane++; Snd.swish(); } }
  else if(dir==='up'){ doJump(); }
  else if(dir==='down'){ if(P.air){ P.vy=Math.min(P.vy,-18); } else { P.duck=0.8; Snd.swish(); } }
}
function doJump(){
  if(P.air){ if(P.trick&&!P.trick.dbl){ P.trick.dbl=true; P.trick.total+=TAU; P.vy+=3.5; P.trick.name='DOUBLE '+P.trick.name; Snd.trick(); } return; }
  const sj=P.pu.jump>0, g=gravity();
  P.vy=(sj?15.5:11.2)*(g<20?0.82:1); P.air=true; P.duck=0; R.jumps++; Snd.jump();
  const tr=pick([{n:'360',a:'spin',total:TAU},{n:'BACKFLIP',a:'flip',total:-TAU},{n:'720',a:'spin',total:TAU*2},{n:'FRONTFLIP',a:'flip',total:TAU},{n:'CORK',a:'both',total:TAU}]);
  const dur=2*P.vy/g;
  P.trick={name:(sj?'SUPER ':'')+tr.n,a:tr.a,total:tr.total*(sj?2:1),t:0,dur,dbl:false};
  for(let i=0;i<14;i++) sprayPS.emit(P.x+rand(-0.6,0.6),waveH(P.x,0.9)+0.1,0.9,rand(-2,2),rand(2,5),rand(1,4),0.7,rand(0.3,0.6),0.95,0.98,1,-12);
  if(G.map.id==='bio'||G.map.glow>0.5) for(let i=0;i<20;i++){ const c=pick([[0.2,1,0.9],[0.9,0.4,1]]); glowPS.emit(P.x,waveH(P.x,0)+0.3,0,rand(-3,3),rand(1,6),rand(-3,3),1,rand(0.3,0.6),c[0],c[1],c[2],-4); }
}
function gravity(){ return 32*(EV.mods.grav||1); }

let ptr=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerdown',e=>{
  if(e.target&&e.target.closest&&e.target.closest('button,.pbody,.sheet,#panel,.overlay')) return;
  Snd.init();
  if(state==='intro'&&SAVE.introSeen&&!G.introFast){ skipIntro(); return; }
  ptr={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),fired:false,type:e.pointerType,btn:e.button,id:e.pointerId};
  if(state==='play'&&e.pointerType==='mouse'&&SAVE.settings.cursor){ if(e.button===2){ act('down'); ptr.fired=true; } }
});
addEventListener('pointermove',e=>{
  if(state==='play'&&e.pointerType==='mouse'&&SAVE.settings.cursor&&!(ptr&&ptr.fired&&ptr.btn===0)){
    const l=e.clientX<VW/3?0:e.clientX>VW*2/3?2:1; if(l!==P.lane){ P.lane=l; Snd.swish(); }
  }
  if(!ptr||ptr.id!==e.pointerId) return;
  const dx=e.clientX-ptr.x, dy=e.clientY-ptr.y;
  if(state==='menu'&&G.menuView!=='menu'){ P.userYaw+=(e.clientX-ptr.sx)*0.012; ptr.sx=e.clientX; return; }
  const th=Math.max(24,Math.min(VW,VH)*0.045);
  if(Math.abs(dx)>th||Math.abs(dy)>th){
    if(Math.abs(dx)>Math.abs(dy)) act(dx<0?'left':'right'); else act(dy<0?'up':'down');
    ptr.x=e.clientX; ptr.y=e.clientY; ptr.fired=true;
  }
});
addEventListener('pointerup',e=>{
  if(ptr&&ptr.id===e.pointerId){
    if(!ptr.fired&&state==='play'&&ptr.type==='mouse'&&SAVE.settings.cursor&&ptr.btn===0&&performance.now()-ptr.t<400) act('up');
    ptr=null; }
});
addEventListener('pointercancel',()=>{ptr=null;});
let wheelT=0;
addEventListener('wheel',e=>{ if(state!=='play') return; const n=performance.now(); if(n-wheelT<250) return; wheelT=n; act(e.deltaY<0?'up':'down'); },{passive:true});
addEventListener('keydown',e=>{
  const k=e.key;
  if(state==='play'){
    if(k==='ArrowLeft'||k==='a'||k==='A') act('left');
    else if(k==='ArrowRight'||k==='d'||k==='D') act('right');
    else if(k==='ArrowUp'||k==='w'||k==='W'||k===' ') act('up');
    else if(k==='ArrowDown'||k==='s'||k==='S') act('down');
    else if(k==='Escape'||k==='p'||k==='P') pause();
    if(k.startsWith('Arrow')||k===' ') e.preventDefault();
  } else if(state==='paused'&&(k==='Escape'||k==='p'||k==='P')){ resume(); }
  else if(state==='intro'&&SAVE.introSeen&&!G.introFast){ skipIntro(); }
  else if(state==='menu'&&k==='Enter'&&$('panel').hidden){ startRun(); }
});
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&state==='play') pause(); });
function skipIntro(){ G.introFast=true; G.introT=Math.max(G.introT,0); W.faceZ=14; $('skip').hidden=true; }
$('skip').onclick=()=>skipIntro();

/* ================= SPAWNING ================= */
function laneTypes(m){ const t=['block','low']; if(m.obs.high) t.push('high'); return t; }
function pickKind(m,type,n){ let list=m.obs[type]; if(type==='block'&&n>1) list=list.filter(k=>!KINDS[k].npc); if(!list||!list.length) list=m.obs.block.filter(k=>!KINDS[k].npc); return pick(list.length?list:['rock']); }
function addObstacle(kind,lane,z,extra={}){
  const m=G.map, K=KINDS[kind], type=K.t, D=DIMS[type];
  const mesh=buildKind(kind,m); if(!K.fixed) mesh.rotation.y=type==='block'?rand(0,TAU):rand(-0.12,0.12);
  scene.add(mesh);
  const o={mesh,kind,type,lane,x:LANES[lane],z,hw:D.hw,hd:D.hd,y0:D.y0,y1:K.y!=null?K.y:D.y1,vz:K.npc?-0.3:0,fixed:!!K.fixed,move:null,fall:null,ph:rand(0,TAU),...extra};
  if(o.move){ o.x=LANES[o.move.a]; }
  o.spin=mesh.getObjectByName('spin');
  if(o.fall){ o.ring=new THREE.Mesh(tor(1.3,0.1,4,24),bmat(0xff6a20,{add:1,op:0.9})); o.ring.rotation.x=Math.PI/2; scene.add(o.ring); }
  obstacles.push(o); return o;
}
function addColl(kind,x,z,cy){ const mesh=COLL[kind](); scene.add(mesh); const c={mesh,kind,x,z,cy,ph:rand(0,TAU)}; colls.push(c); return c; }
function coinLine(lane,z,n,kind='coin'){ for(let i=0;i<n;i++) addColl(kind,LANES[lane],z+i*2.6,0.85); }
function coinArc(lane,z){ for(let i=-3;i<=3;i++) addColl('coin',LANES[lane],z+i*1.7,0.85+2.0*(1-(i*i)/9)); }
function spawnRow(){
  const m=G.map, d=diffNow(), z=-SPAWN, pat=EV.active&&EV.def.pattern;
  let gap=lerp(30,16,d);
  if(P.pu.perfect>0){ const l=ri(0,2); coinLine(l,z,6); return 18; }
  if(pat==='reef'){ const nl=clamp(G.reefLane+ri(-1,1),0,2); G.reefLane=nl; for(let l=0;l<3;l++) if(l!==nl) addObstacle(pick(m.obs.block.filter(k=>!KINDS[k].npc)),l,z); coinLine(nl,z-4,3); rows.push({z,n:2,done:false,hit:false}); G.prevPass=[nl]; return Math.max(15,G.speed*0.55); }
  if(pat==='rings'){ const ls=[0,1,2].sort(()=>Math.random()-0.5); addColl('ring',LANES[ls[0]],z,1.3); if(Math.random()<0.6) addColl('ring',LANES[ls[1]],z-6,1.3); if(Math.random()<0.4){ addObstacle(pick(m.obs.low),ls[2],z); rows.push({z,n:1,done:false,hit:false}); } G.prevPass=[0,1,2]; return Math.max(16,G.speed*0.6); }
  if(pat==='drift'&&m.obs.move){ const a=ri(0,1), b=a+1, free=a===0?2:0; addObstacle(pick(m.obs.move),a,z,{move:{a,b,sp:rand(0.9,1.4)}}); coinLine(free,z,4); rows.push({z,n:1,done:false,hit:false}); G.prevPass=[free]; return Math.max(22,G.speed*0.75); }
  if(pat==='treasure'){ const ls=[0,1,2].sort(()=>Math.random()-0.5); const types=laneTypes(m); addObstacle(pickKind(m,pick(types),2),ls[0],z); addObstacle(pickKind(m,pick(['low','high'].filter(t=>m.obs[t])),2),ls[1],z); addColl('chest',LANES[ls[2]],z,0.5); coinLine(ls[2],z+4,3); rows.push({z,n:2,done:false,hit:false}); G.prevPass=[ls[2]]; return Math.max(lerp(20,15,d),G.speed*0.5); }
  if(pat==='fall'&&Math.random()<0.7){ const l=ri(0,2); const o=addObstacle(pickKind(m,'block',1),l,z,{fall:{y:38}}); rows.push({z,n:1,done:false,hit:false}); const fl=(l+ri(1,2))%3; coinLine(fl,z,4); G.prevPass=[0,1,2].filter(x=>x!==l); return Math.max(gap,G.speed*0.6); }
  // normal row
  let n; const r=Math.random(); const p2=clamp(0.15+d*0.9,0,0.72), p3=d>0.45?clamp((d-0.45)*0.55,0,0.22):0;
  n=r<p3?3:r<p3+p2?2:1; if(Math.random()<0.1&&d<0.6) n=0;
  const lanes=[0,1,2].sort(()=>Math.random()-0.5).slice(0,n), types=[];
  const pool=laneTypes(m);
  for(let i=0;i<n;i++){ const w=Math.random(); types.push(w<0.5?'block':w<0.8?'low':pool.includes('high')?'high':'low'); }
  if(n===3){ let blocks=types.filter(t=>t==='block').length; while(blocks>1){ const i=types.indexOf('block'); types[i]=pool.includes('high')&&Math.random()<0.4?'high':'low'; blocks--; } }
  let moving=false;
  if(n===1&&m.obs.move&&Math.random()<0.1+0.25*d){ moving=true; }
  const pass=[0,1,2].filter(l=>{ const i=lanes.indexOf(l); return i<0||types[i]!=='block'; });
  const reachable=pass.some(l=>G.prevPass.some(p=>Math.abs(p-l)<=1));
  if(!reachable) gap*=1.5;
  const npcOk=n===1;
  lanes.forEach((l,i)=>{
    if(moving){ const a=l===2?1:l, b=a+1; addObstacle(pick(m.obs.move),a,z,{move:{a,b,sp:rand(0.8,1.3)}}); return; }
    addObstacle(pickKind(m,types[i],npcOk?1:2),l,z);
  });
  if(n) rows.push({z,n,done:false,hit:false});
  G.prevPass=moving?[0,1,2].filter(x=>x!==lanes[0]&&x!==(lanes[0]===2?1:lanes[0]+1)):pass;
  if(moving&&!G.prevPass.length) G.prevPass=[0,1,2];
  // collectibles
  const free=moving?G.prevPass.slice():[0,1,2].filter(l=>!lanes.includes(l));
  if(G.toPU<=0&&free.length){ const l=pick(free); const type=pick(Object.keys(POWERS)); const mesh=makePU(type); scene.add(mesh); pus.push({mesh,type,x:LANES[l],z,ph:0}); G.toPU=rand(300,520); }
  else if(Math.random()<0.7){
    const lowLane=lanes.find((l,i)=>types[i]==='low');
    if(lowLane!=null&&Math.random()<0.45) coinArc(lowLane,z);
    else if(free.length){ const l=pick(free); const ck=(m.coll==='pearl'||m.coll==='energy')&&Math.random()<(EV.def&&EV.def.pattern==='pearls'?0.8:0.18)?m.coll:'coin'; coinLine(l,z+(ck==='coin'?0:2),ck==='coin'?ri(4,8):3,ck); }
  }
  if(m.coll==='ring'&&Math.random()<0.08&&free.length) addColl('ring',LANES[pick(free)],z-8,1.3);
  return Math.max(gap*(n===0?0.7:1),G.speed*0.42);
}

/* ================= EVENTS ================= */
function startEvent(){
  const def=EVENTS[G.map.event]; if(!def) return;
  EV.active=G.map.event; EV.def=def; EV.t=def.dur; EV.mods=def.mods||{};
  banner(def.name,def.sub,true);
  if(G.map.event==='eruption'){ G.flash=0.6; G.flashCol.set(0xff5a1a); G.shake=0.5; Snd.rumble(); }
  if(G.map.event==='islandPass'){ const side=Math.random()<0.5?-1:1; const g=grp(); add(g,cyl(5,6,12,8),mat(0x6a6050),0,5,0); add(g,sph(5.4,9,6),mat(0x3faa55),0,11,0,[1,0.5,1]); add(g,box(0.4,11,3),bmat(0xf2fbff,{op:0.8}),-side*5.2,5,0); const p=palm(); p.position.set(1,12,1); g.add(p);
    g.position.set(side*15,-0.3,-SPAWN-40); scene.add(g); scen.push({o:g,z:-SPAWN-40,x:side*15,base:-0.3,mist:side}); }
  if(G.map.event==='treasure'){ R.treasures++; }
  if(G.map.event==='surge'||G.map.event==='giantWave'||G.map.event==='canyonRush') Snd.rumble();
}
function endEvent(){ R.events++; R.score+=500; banner('EVENT CLEARED','+500',false); EV.active=null; EV.def=null; EV.mods={}; EV.next=rand(22,36); }

/* ================= UPDATE ================= */
let last=performance.now(), T=0;
const camPos=new THREE.Vector3(5,3,-7), camLook=new THREE.Vector3(0,1,0), _cp=new THREE.Vector3(), _cl=new THREE.Vector3();
const viewOff={x:0,y:0,tx:0,ty:0};
function loop(now){
  requestAnimationFrame(loop);
  let rdt=Math.min(0.05,(now-last)/1000); last=now;
  if(state==='paused'||state==='loading'){ renderer.render(scene,camera); return; }
  const dt=rdt*G.ts; T+=rdt; W.time+=dt;
  if(state==='menu') updateMenu(rdt);
  else if(state==='intro') updateIntro(rdt);
  else if(state==='play') updatePlay(dt);
  else if(state==='crash') updateCrash(rdt,dt);
  else if(state==='over') updateMenuOcean(rdt);
  common(dt,rdt);
  renderer.render(scene,camera);
}
function common(dt,rdt){
  // theme + wave params
  if(curMap.shift&&state==='play'){ setTarget(curMap,clamp((R.dist||0)/3000,0,1)); }
  lerpTheme(damp(state==='menu'?3:0.9,rdt));
  const flash=G.flash>0?G.flash:0; G.flash=Math.max(0,G.flash-rdt*2.5);
  skyU.uFlash.value.copy(G.flashCol).multiplyScalar(flash*0.8);
  skyU.uStars.value=TH.stars; skyU.uNeb.value=TH.neb; skyU.uAur.value=TH.aur; skyU.uTime.value=T;
  scene.fog.color.copy(TH.fog); scene.fog.near=TH.fogN; scene.fog.far=TH.fogF;
  hemi.color.copy(TH.hS); hemi.groundColor.copy(TH.hG); hemi.intensity=TH.hI+flash*1.2; sunL.color.copy(TH.sunC); sunL.intensity=TH.sunI; sunL.position.copy(TH.sunDir).multiplyScalar(100);
  const tChop=(state==='menu'||state==='over')?Math.min(0.25,TH.chop):(P.pu.perfect>0?0.08:TH.chop+(EV.mods.chop||0));
  W.chop+=(tChop-W.chop)*damp(1.2,rdt); W.swell+=(((state==='menu'||state==='over')?0.15:TH.swell)-W.swell)*damp(1,rdt);
  updatePhases();
  const u=waterU; u.uFaceH.value=W.faceH; u.uFaceZ.value=W.faceZ; u.uChop.value=W.chop; u.uSwell.value=W.swell;
  u.uPh.value.set(W.ph[0],W.ph[1],W.ph[2],W.ph[3]); u.uPh2.value.set(W.ph[4],W.ph[5]);
  u.uFogN.value=TH.fogN; u.uFogF.value=TH.fogF; u.uGlow.value=TH.glow+(EV.mods.glow||0); u.uTrav.value=W.travel%200; u.uTime.value=W.time;
  u.uFoamLvl.value=Math.max(0.95,W.faceH*0.78);
  sky.position.copy(camera.position);
  backdrop.position.x=camera.position.x; backdrop.position.z=camera.position.z; backdrop.position.y+=(0-backdrop.position.y)*damp(1.2,rdt);
  if(oldBack){ oldBack.position.x=camera.position.x; oldBack.position.z=camera.position.z; oldBack.position.y-=rdt*60; if(oldBack.position.y<-200){ scene.remove(oldBack); oldBack=null; } }
  if(backdrop.userData.smoke&&Math.random()<rdt*6){ const v=backdrop.userData.smoke; glowPS.emit(backdrop.position.x+v.position.x+rand(-20,20),110+backdrop.position.y,backdrop.position.z+v.position.z,rand(-3,3),rand(6,12),0,3,rand(18,30),0.5,0.18,0.08,2,0); }
  weather.update(rdt,state==='play'?G.speed:2,T);
  const scroll=state==='play'?G.speed:(state==='crash'?G.speed*0.3:0);
  sprayPS.update(dt,scroll); glowPS.update(dt,scroll);
  // view offset for panels
  viewOff.x+=(viewOff.tx-viewOff.x)*damp(6,rdt); viewOff.y+=(viewOff.ty-viewOff.y)*damp(6,rdt);
  if(Math.abs(viewOff.x)>0.5||Math.abs(viewOff.y)>0.5) camera.setViewOffset(VW,VH,viewOff.x,viewOff.y,VW,VH); else if(camera.view&&camera.view.enabled) camera.clearViewOffset();
}
function placePlayer(rdt,crouch,swing){
  const sy=waveH(P.x,0);
  player.position.set(P.x,sy+0.08+P.jy,0);
  const hN=waveH(P.x,-0.9), hT=waveH(P.x,0.9), hL=waveH(P.x-0.6,0), hR=waveH(P.x+0.6,0);
  const lat=(P.x-P.px)/Math.max(rdt,1e-3); P.px=P.x;
  const pitch=Math.atan2(hN-hT,1.8), roll=Math.atan2(hR-hL,1.2)*-0.6+clamp(-lat*0.045,-0.55,0.55);
  if(P.air&&P.trick&&P.trick.a!=='spin') tilt.rotation.x=pitch+P.flip;
  else { let cx=tilt.rotation.x; cx=((cx+Math.PI)%TAU+TAU)%TAU-Math.PI; tilt.rotation.x=cx+(pitch-cx)*damp(10,rdt); }
  tilt.rotation.z+= (roll-tilt.rotation.z)*damp(10,rdt);
  player.rotation.y=P.yaw+clamp(-lat*0.02,-0.3,0.3)+P.spin;
  if(rider) rider.pose(crouch,swing);
  return {sy,lat};
}
function updateMenuOcean(rdt){
  W.travel+=rdt*1.2; W.faceH+=(0-W.faceH)*damp(1.5,rdt); W.faceZ+=(42-W.faceZ)*damp(1,rdt);
  for(const s of scen){ s.z+=rdt*1.2; s.o.position.z=s.z; }
}
function updateMenu(rdt){
  updateMenuOcean(rdt);
  P.x+=(0-P.x)*damp(4,rdt); P.jy=0; P.spin=0; P.flip=0;
  const tYaw=P.menuYaw+P.userYaw; P.yaw+=(tYaw-P.yaw)*damp(6,rdt);
  placePlayer(rdt,0.15+0.05*Math.sin(T*1.3),Math.sin(T*1.1)*0.4);
  const v=G.menuView;
  if(v==='locker'){ _cp.set(2.4,1.7,-3.4); _cl.set(0,1.0,0); }
  else if(v==='maps'){ _cp.set(7,5.2,-11); _cl.set(0,1.5,-30); }
  else { _cp.set(4.8+Math.sin(T*0.2)*0.4,2.5,-6.2); _cl.set(0,1.25,0); }
  camPos.lerp(_cp,damp(3,rdt)); camLook.lerp(_cl,damp(3,rdt));
  camera.position.copy(camPos); camera.position.y+=player.position.y*0.6; camera.lookAt(camLook.x,camLook.y+player.position.y*0.6,camLook.z);
  if(Math.random()<rdt*8) sprayPS.emit(rand(-1,1),waveH(0,0),rand(-1.5,1.5),rand(-0.5,0.5),rand(0.5,1.5),rand(-0.5,0.5),0.8,0.25,0.95,0.98,1,-3,0);
}
function updateIntro(rdt){
  G.introT+=rdt; const t=G.introT, fast=G.introFast;
  const ft=fast?t*2.6:t;
  // wave approaches and rises
  if(ft<0.8){ W.travel+=rdt*1.5; }
  const rise=clamp((ft-0.6)/1.6,0,1), settle=clamp((ft-2.4)/0.8,0,1);
  W.faceZ=lerp(fast?14:42,5,rise*rise*(3-2*rise));
  W.faceH=lerp(0,7.2,Math.sin(rise*Math.PI*0.5))*(1-settle)+lerp(7.2,TH.face,1)*settle;
  if(settle>0) W.faceH=lerp(7.2,TH.face,settle);
  // surfer turns toward wave then catches
  const yaw=ft<1.0?lerp(-0.55,1.1,clamp(ft/1.0,0,1)):ft<2.3?1.1:lerp(1.1,0,clamp((ft-2.3)/0.5,0,1));
  P.yaw+=(yaw-P.yaw)*damp(6,rdt);
  if(rider) rider.head.rotation.y=ft<2.3?2.4:1.15;
  // crash spray
  if(!G.crashed&&ft>2.25){ G.crashed=true; G.shake=0.35; Snd.land(); Snd.hiss(1.4,0.5,'lowpass',3000,0,300);
    for(let i=0;i<(quality==='low'?180:400);i++){ const x=rand(-14,14); sprayPS.emit(x,W.faceH*rand(0.6,1.1),rand(3,7),rand(-1.5,1.5),rand(3,11),rand(-6,1),rand(1,1.8),rand(0.4,1.1),0.95,0.98,1,-9,0); } }
  if(ft<2.25) G.crashed=false;
  // speed ramps
  const go=clamp((ft-2.5)/1.2,0,1); G.speed=baseSpeed(0)*0.7*go; W.travel+=G.speed*rdt;
  for(const s of scen){ s.z+=G.speed*rdt+rdt*1.5; s.o.position.z=s.z; }
  // camera path
  const k=clamp((ft-0.0)/0.8,0,1), sw=clamp((ft-2.5)/1.3,0,1), e=sw*sw*(3-2*sw);
  const sy=waveH(P.x,0);
  _cp.set(lerp(lerp(4.8,3.0,k),0,e),lerp(lerp(2.5,2.2,k),sy+4.3,e),lerp(lerp(-6.2,-4.5,k),8.8,e));
  _cl.set(0,lerp(1.4+W.faceH*0.3,sy+1.1,e),lerp(lerp(0,3,clamp(ft-0.8,0,1)),-10,e));
  if(fast){ camPos.lerp(_cp,damp(5,rdt)); camLook.lerp(_cl,damp(5,rdt)); } else { camPos.copy(_cp); camLook.copy(_cl); }
  const shake=G.shake; G.shake=Math.max(0,G.shake-rdt*1.5);
  camera.position.set(camPos.x+rand(-1,1)*shake*0.4,camPos.y+rand(-1,1)*shake*0.4,camPos.z);
  camera.lookAt(camLook);
  placePlayer(rdt,ft<2.3?0.15:0.4,Math.sin(T*2)*0.5);
  emitBoardSpray(rdt,0);
  if(ft>3.9) beginPlay();
}
function emitBoardSpray(dt,lat){
  if(P.air) return; const sy=waveH(P.x,1.2); const amt=(G.speed*0.7+Math.abs(lat)*3)*dt;
  for(let i=0;i<amt;i++) sprayPS.emit(P.x+rand(-0.35,0.35),sy+0.05,1.4,rand(-1.5,1.5)-lat*0.25,rand(1.5,4),rand(2,5),rand(0.4,0.8),rand(0.25,0.55),TH.foam.r,TH.foam.g,TH.foam.b,-12,0.6);
  const b=P.boardCfg, bio=G.map.id==='bio';
  if((b&&b.glowTrail)||bio){ const c=bio&&!(b&&b.trail)?[0.2,1,0.9]:b.trail; const n=(bio?2.5:1.2)*(1+Math.abs(lat)*0.2)*dt*30;
    for(let i=0;i<n;i++) glowPS.emit(P.x+rand(-0.3,0.3),waveH(P.x,1.6)+0.12,1.6,rand(-0.3,0.3),rand(0,0.6),0,bio?1.6:0.8,rand(0.25,0.5),c[0],c[1],c[2],0,1); }
}
function updatePlay(dt){
  const d=diffNow();
  // power-up timers
  for(const k in P.pu) if(P.pu[k]>0) P.pu[k]=Math.max(0,P.pu[k]-dt);
  if(P.inv>0) P.inv-=dt;
  // speed
  const target=baseSpeed(d)*(P.pu.boost>0?1.55:1)*(EV.mods.speed||1);
  G.speed+=(target-G.speed)*damp(1.6,dt);
  const dz=G.speed*dt;
  W.travel+=dz; R.dist+=dz;
  const mult=scoreMult();
  R.score+=dz*mult+(P.pu.boost>0?40*dt:0);
  // wave face
  const tf=TH.face+(EV.mods.face||0)+(P.pu.perfect>0?-0.6:0);
  W.faceH+=(tf-W.faceH)*damp(0.8,dt); W.faceZ+=(5-W.faceZ)*damp(2,dt);
  // adventure stages
  if(SAVE.adventure&&R.dist>=G.nextStage){ G.stageIdx++; G.nextStage+=STAGE_LEN; const id=ADVENTURE[G.stageIdx%ADVENTURE.length]; const m=MAP[id]; EV.active=null; EV.def=null; EV.mods={}; EV.next=rand(18,26); setMap(m,false); R.visited.add(id); banner('ENTERING',m.name.toUpperCase(),false); }
  // events
  if(EV.active){ EV.t-=dt; if(EV.t<=0) endEvent(); } else if(R.dist>220){ EV.next-=dt; if(EV.next<=0) startEvent(); }
  if(G.map.id==='storm'){ G.lightT-=dt; if(G.lightT<=0){ G.lightT=rand(3,8)/(EV.active?2:1); G.flash=1; G.flashCol.set(0xdfe9ff); Snd.thunder(); setTimeout(()=>{ if(state==='play') G.flash=0.7; },120); } }
  if(G.map.id==='storm'||SAVE.adventure&&R.visited.has('storm')) R.storm=1;
  // spawn
  G.toRow-=dz; G.toPU-=dz; G.toScen-=dz;
  if(G.toRow<=0) G.toRow=spawnRow();
  if(G.toScen<=0){ spawnScenery(-430); G.toScen=G.map.scen==='canyon'?rand(13,18):G.map.scen==='neon'?rand(10,18):rand(16,32); }
  // player lateral
  const tx=LANES[P.lane]; P.x+=(tx-P.x)*damp(13,dt);
  // vertical
  if(P.air){ P.vy-=gravity()*dt; P.jy+=P.vy*dt; if(P.trick){ P.trick.t+=dt; const pr=clamp(P.trick.t/(P.trick.dur*0.85),0,1); const ang=P.trick.total*pr; if(P.trick.a==='spin') P.spin=ang; else if(P.trick.a==='flip') P.flip=ang; else { P.spin=ang; P.flip=Math.sin(pr*Math.PI)*0.9; } }
    if(P.jy<=0){ land(); } }
  if(P.duck>0) P.duck-=dt;
  const crouch=P.duck>0?1:P.air?0.55:0.3+Math.abs(P.x-tx)*0.08;
  const {sy,lat}=placePlayer(dt,crouch,Math.sin(T*2.2)*0.6);
  emitBoardSpray(dt,lat);
  shieldBubble.visible=P.shield||P.inv>0; shieldBubble.material.opacity=0.22+0.08*Math.sin(T*8);
  // crest spray
  if(Math.random()<dt*25) sprayPS.emit(rand(-16,16),W.faceH*0.95+waveH(0,5)*0.1,W.faceZ+rand(-0.5,1),rand(-1,1),rand(1,4),rand(0,2),1,rand(0.4,0.9),TH.foam.r,TH.foam.g,TH.foam.b,-6,0);
  // obstacles
  const pTop=P.jy+(P.duck>0?1.0:1.9), pBot=P.jy;
  for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i];
    o.z+=dz+o.vz*G.speed*dt;
    if(o.move){ o.move.t=(o.move.t||0)+dt*o.move.sp; o.x=lerp(LANES[o.move.a],LANES[o.move.b],0.5-0.5*Math.cos(o.move.t)); }
    let y=o.fixed?-0.3:waveH(o.x,o.z)-0.15+Math.sin(T*1.6+o.ph)*0.08;
    if(o.fall){ if(o.fall.y>0){ o.fall.y=Math.max(0,o.fall.y-G.speed*0.4*dt); if(o.fall.y===0){ for(let k=0;k<30;k++) sprayPS.emit(o.x+rand(-1,1),y,o.z,rand(-4,4),rand(4,9),rand(-3,3),1,rand(0.5,1),1,0.95,0.9,-12); Snd.hiss(0.5,0.2,'lowpass',900); if(o.ring){ scene.remove(o.ring); o.ring=null; } } }
      y+=o.fall.y; if(o.ring) o.ring.position.set(o.x,waveH(o.x,o.z)+0.1,o.z); }
    o.mesh.position.set(o.x,y,o.z);
    if(!o.fixed&&o.type!=='high') o.mesh.rotation.z=Math.sin(T*1.3+o.ph)*0.05;
    if(o.spin) o.spin.rotation.z+=dt*4;
    if(o.mesh.userData.foam&&Math.random()<dt*10) sprayPS.emit(o.x+rand(-1,1),y+0.6,o.z,rand(-1,1),rand(2,4),rand(0,2),0.7,0.5,1,1,1,-8);
    if(!o.dead&&Math.abs(o.z)<o.hd+0.85&&Math.abs(o.x-P.x)<o.hw+0.42&&!(o.fall&&o.fall.y>1)){
      if(pBot<o.y1&&pTop>o.y0) hit(o);
    }
    if(o.z>24){ scene.remove(o.mesh); if(o.ring) scene.remove(o.ring); obstacles.splice(i,1); }
  }
  for(const r of rows){ r.z+=dz; if(!r.done&&r.z>1.8){ r.done=true; if(!r.hit){ R.avoided+=r.n; R.combo+=1; R.maxCombo=Math.max(R.maxCombo,R.combo); R.score+=15*r.n*mult; if(R.combo%10===0) popText('COMBO x'+R.combo,'#ffc93c'); } } }
  rows=rows.filter(r=>r.z<10);
  // collectibles
  const pc=P.jy+(P.duck>0?0.5:0.95);
  for(let i=colls.length-1;i>=0;i--){ const c=colls[i]; c.z+=dz;
    if(P.pu.magnet>0&&c.kind!=='ring'&&c.kind!=='chest'){ const dx=P.x-c.x, ddz=-c.z; if(dx*dx+ddz*ddz<110&&c.z<3){ c.x+=dx*damp(9,dt); c.z+=ddz*damp(9,dt); c.cy+=(pc-c.cy)*damp(9,dt); } }
    const y=waveH(c.x,c.z)+c.cy+(c.kind==='coin'?Math.sin(T*3+c.ph)*0.08:0);
    c.mesh.position.set(c.x,y,c.z);
    if(c.kind==='coin') c.mesh.rotation.y+=dt*4; else if(c.kind!=='ring') c.mesh.rotation.y+=dt*1.5;
    const rad=c.kind==='ring'?1.2:0.95;
    if(Math.abs(c.z)<1.1&&Math.abs(c.x-P.x)<rad&&Math.abs(c.cy-pc)<(c.kind==='ring'?1.6:1.25)){ collect(c); scene.remove(c.mesh); colls.splice(i,1); continue; }
    if(c.z>12){ scene.remove(c.mesh); colls.splice(i,1); if(c.kind==='coin'&&P.pu.perfect>0) R.perfectStreak=0; }
  }
  for(let i=pus.length-1;i>=0;i--){ const p=pus[i]; p.z+=dz; p.ph+=dt; p.mesh.position.set(p.x,waveH(p.x,p.z)+1.1+Math.sin(p.ph*3)*0.15,p.z); p.mesh.rotation.y+=dt*2;
    if(Math.abs(p.z)<1.2&&Math.abs(p.x-P.x)<1.1&&P.jy<2.6){ gainPower(p.type,p.x); scene.remove(p.mesh); pus.splice(i,1); continue; }
    if(p.z>12){ scene.remove(p.mesh); pus.splice(i,1); } }
  // scenery
  for(let i=scen.length-1;i>=0;i--){ const s=scen[i]; s.z+=dz; const o=s.o; o.position.z=s.z;
    if(s.bob) o.position.y=waveH(s.x,s.z)-0.1; if(s.float) o.position.y=s.base+Math.sin(T+s.ph)*0.6;
    if(o.userData.gulls){ o.children.forEach(b=>{ const f=Math.sin(T*8+b.userData.ph)*0.5; b.userData.w[0].rotation.z=f; b.userData.w[1].rotation.z=-f; b.position.x+=dt*2; }); }
    if(s.mist&&Math.abs(s.z)<40&&Math.random()<dt*30) sprayPS.emit(s.x-s.mist*5,rand(0,2),s.z+rand(-2,2),rand(-1,1),rand(1,3),0,1.5,rand(1,2),1,1,1,-1);
    if(s.z>60){ scene.remove(o); scen.splice(i,1); } }
  // camera
  const sh=G.shake; G.shake=Math.max(0,G.shake-dt*2);
  _cp.set(P.x*0.55,sy+4.3+P.jy*0.35,8.8+(P.pu.boost>0?1.2:0)); _cl.set(P.x*0.75,sy+1.1+P.jy*0.5,-10);
  camPos.lerp(_cp,damp(6,dt)); camLook.lerp(_cl,damp(6,dt));
  camera.position.set(camPos.x+rand(-1,1)*sh*0.5,camPos.y+rand(-1,1)*sh*0.5,camPos.z);
  camera.lookAt(camLook);
  const fovT=(VW<VH?72:62)+(P.pu.boost>0?8:0)+d*4; if(Math.abs(camera.fov-fovT)>0.05){ camera.fov+=(fovT-camera.fov)*damp(3,dt); camera.updateProjectionMatrix(); }
  // PB during run
  if(!G.pbShown&&R.prevBest>0&&R.score>R.prevBest){ G.pbShown=true; banner('NEW PERSONAL BEST!','Keep riding',true); Snd.fanfare(); }
  hudUpdate();
}
function scoreMult(){ return (1+Math.min(4,Math.floor(R.combo/8)))*(P.pu.mult>0?2:1); }
function land(){
  P.jy=0; P.vy=0; P.air=false; Snd.land();
  for(let i=0;i<22;i++) sprayPS.emit(P.x+rand(-0.8,0.8),waveH(P.x,0)+0.1,rand(-1,1),rand(-4,4),rand(2,6),rand(-1,3),0.8,rand(0.35,0.7),TH.foam.r,TH.foam.g,TH.foam.b,-12);
  if(P.trick){ const tr=P.trick; const ok=tr.t>=tr.dur*0.6;
    if(ok){ const base=(Math.abs(tr.total)>=TAU*1.9?200:120)*(tr.dbl?1.8:1)*(P.pu.jump>0?2:1)*(EV.mods.grav?2:1); const pts=Math.round(base*scoreMult()); R.score+=pts; R.tricks++; popText(tr.name+' +'+fmt(pts),'#7ff6e6'); Snd.trick(); } }
  P.trick=null; P.spin=0; P.flip=0;
}
function hit(o){
  const row=rows.find(r=>!r.done&&Math.abs(r.z-o.z)<3); if(row) row.hit=true;
  if(P.pu.boost>0||P.inv>0||o.dead){ if(P.pu.boost>0&&!o.dead){ smash(o); R.score+=50; } return; }
  if(P.shield){ P.shield=false; P.inv=1.2; smash(o); Snd.shield(); popText('SHIELD SAVED YOU','#4dabff'); R.combo=0; return; }
  crash(o);
}
function smash(o){ o.dead=true; o.mesh.visible=false; for(let i=0;i<40;i++) sprayPS.emit(o.x+rand(-1,1),waveH(o.x,o.z)+rand(0,2),o.z,rand(-6,6),rand(3,10),rand(-4,4),1,rand(0.4,0.9),1,1,1,-14); G.shake=0.3; Snd.smash(); }
function collect(c){
  const mult=scoreMult();
  if(c.kind==='coin'){ const v=EV.mods.coin2?2:1; R.coins+=v; R.score+=10*mult*v; Snd.coin(); if(P.pu.perfect>0){ R.perfectStreak++; R.score+=5*R.perfectStreak; } for(let i=0;i<5;i++) glowPS.emit(c.x,waveH(c.x,c.z)+c.cy,c.z,rand(-2,2),rand(0,3),rand(-2,2),0.4,0.3,1,0.8,0.2,0); }
  else if(c.kind==='pearl'||c.kind==='energy'){ R.pearls+=c.kind==='pearl'?1:0; R.coins+=3; R.score+=25*mult; Snd.pearl(); popText(c.kind==='pearl'?'PEARL +25':'STAR ENERGY +25','#ff9aff'); }
  else if(c.kind==='ring'){ R.rings++; R.score+=40*mult; Snd.pearl(); popText('RING +'+40*mult,'#00f0ff'); for(let i=0;i<20;i++) glowPS.emit(c.x+Math.cos(i)*1.1,waveH(c.x,c.z)+c.cy+Math.sin(i)*1.1,c.z,Math.cos(i)*3,Math.sin(i)*3,0,0.6,0.4,0,0.9,1,0); }
  else if(c.kind==='chest'){ R.coins+=25; R.score+=100*mult; Snd.fanfare(); popText('TREASURE +25 COINS','#ffc93c'); for(let i=0;i<30;i++) glowPS.emit(c.x,waveH(c.x,c.z)+0.8,c.z,rand(-3,3),rand(2,7),rand(-3,3),1,0.4,1,0.8,0.2,-6); }
}
function gainPower(type,x){
  R.power++; R.score+=50; Snd.power(); popText(POWERS[type].name.toUpperCase(),POWERS[type].color);
  if(type==='shield') P.shield=true;
  else if(type==='bonus'){ R.coins+=50; for(let i=0;i<30;i++) glowPS.emit(x,waveH(x,0)+1,0,rand(-3,3),rand(2,6),rand(-3,3),0.8,0.4,1,0.85,0.2,-8); }
  else P.pu[type]=POWERS[type].dur;
}
function crash(o){
  state='crash'; G.crashT=0; G.ts=0.22; G.shake=0.9; Snd.crash(); P.air=false;
  for(let i=0;i<160;i++) sprayPS.emit(P.x+rand(-1,1),waveH(P.x,0)+rand(0,1.5),rand(-1,1),rand(-7,7),rand(4,13),rand(-6,4),rand(1,1.8),rand(0.4,1),TH.foam.r,TH.foam.g,TH.foam.b,-14);
}
function updateCrash(rdt,dt){
  G.crashT+=rdt; if(G.crashT>0.7) G.ts=Math.min(1,G.ts+rdt);
  G.speed*=Math.exp(-rdt*1.5);
  W.travel+=G.speed*dt; P.fall=Math.min(1,P.fall+rdt*1.4);
  tilt.rotation.z+=(1.4-tilt.rotation.z)*damp(4,rdt); tilt.rotation.x+=(-0.6-tilt.rotation.x)*damp(4,rdt);
  player.position.y=waveH(P.x,0)-P.fall*1.2; P.spin+=rdt*2;
  player.rotation.y=P.yaw+P.spin;
  for(const o of obstacles){ o.z+=G.speed*dt; o.mesh.position.z=o.z; }
  for(const c of colls){ c.z+=G.speed*dt; c.mesh.position.z=c.z; }
  for(const s of scen){ s.z+=G.speed*dt; s.o.position.z=s.z; }
  const sh=G.shake; G.shake=Math.max(0,G.shake-rdt*1.2);
  _cp.set(P.x*0.5+2,waveH(P.x,0)+5,8); camPos.lerp(_cp,damp(2,rdt)); camLook.lerp(player.position,damp(3,rdt));
  camera.position.set(camPos.x+rand(-1,1)*sh*0.5,camPos.y+rand(-1,1)*sh*0.5,camPos.z); camera.lookAt(camLook);
  if(G.crashT>1.5) gameOver();
}

/* ================= HUD ================= */
const hudCache={};
function setT(id,v){ if(hudCache[id]!==v){ hudCache[id]=v; $(id).textContent=v; } }
function hudUpdate(){
  setT('hScore',fmt(R.score)); setT('hCoins',fmt(R.coins)); setT('hDist',fmt(R.dist));
  const m=scoreMult(); setT('hMult','x'+m); setT('hCombo','COMBO '+R.combo); $('combo').style.opacity=R.combo>0||m>1?1:0.35;
  const act=[]; if(P.shield) act.push(['shield',1]); for(const k of ['magnet','boost','mult','jump','perfect']) if(P.pu[k]>0) act.push([k,P.pu[k]/POWERS[k].dur]);
  const key=act.map(a=>a[0]).join(); const box=$('pus');
  if(box.dataset.k!==key){ box.dataset.k=key; box.innerHTML=act.map(a=>`<div class="pu" data-t="${a[0]}" style="--c:${POWERS[a[0]].color};--p:1" title="${POWERS[a[0]].name}"><img alt="${POWERS[a[0]].name}" src="${ICON[a[0]].url}"></div>`).join(''); }
  for(const el of box.children){ const a=act.find(x=>x[0]===el.dataset.t); if(a) el.style.setProperty('--p',a[1].toFixed(3)); }
}
function banner(h,u,gold){ const b=$('banner'); $('banH').textContent=h; $('banU').textContent=u||''; b.classList.toggle('gold',!!gold); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
function popText(t,col){ const fx=$('fx'); if(fx.children.length>6) fx.firstChild.remove(); const d=document.createElement('div'); d.className='pop'; d.textContent=t; d.style.color=col||'#fff'; d.style.left='50%'; d.style.top=(46+rand(-4,4))+'%'; fx.appendChild(d); setTimeout(()=>d.remove(),1000); }
function toast(html){ const t=document.createElement('div'); t.className='toast'; t.innerHTML=html; $('toasts').appendChild(t); setTimeout(()=>t.remove(),3300); }

/* ================= PAUSE / OVER ================= */
function pause(){ if(state!=='play') return; state='paused'; $('pInfo').textContent=fmt(R.score)+' pts · '+fmt(R.dist)+' m · '+G.map.name; $('pause').hidden=false; $('pResume').focus(); }
function resume(){ $('pause').hidden=true; state='play'; last=performance.now(); }
$('pauseBtn').onclick=()=>{ Snd.click(); pause(); };
$('pResume').onclick=()=>{ Snd.click(); resume(); };
$('pRestart').onclick=()=>{ Snd.click(); $('pause').hidden=true; startRun(true); };
$('pMenu').onclick=()=>{ Snd.click(); $('pause').hidden=true; toMenu(); };
$('pSettings').onclick=()=>{ Snd.click(); openPanel('settings',true); };

const revealQ=[];
function gameOver(){
  state='over'; $('hud').hidden=true;
  const recKey=SAVE.adventure?'adventure':G.map.id, rec=mapRec(recKey), m=SAVE.adventure?null:G.map;
  const prevMap=rec.best, prevBest=SAVE.best;
  let coins=R.coins*(R.doubler?2:1);
  SAVE.coins+=coins; SAVE.lifetimeCoins+=coins; SAVE.runs++;
  SAVE.stats.tricks+=R.tricks; SAVE.stats.treasures+=R.treasures; SAVE.stats.maxCombo=Math.max(SAVE.stats.maxCombo,R.maxCombo); SAVE.stats.dist+=R.dist;
  const mapPB=R.score>prevMap;
  if(mapPB&&prevMap>0){ SAVE.pbCount++; if(!SAVE.stats.pbMapsAll.includes(recKey)) SAVE.stats.pbMapsAll.push(recKey); ensureDaily(); if(!SAVE.daily.pbMaps.includes(recKey)) SAVE.daily.pbMaps.push(recKey); }
  if(mapPB) rec.best=Math.floor(R.score); rec.dist=Math.max(rec.dist,Math.floor(R.dist));
  if(SAVE.adventure){ for(const id of R.visited){ const r2=mapRec(id); r2.dist=Math.max(r2.dist,0); } }
  const overallPB=R.score>prevBest;
  if(overallPB) SAVE.best=Math.floor(R.score); SAVE.bestDist=Math.max(SAVE.bestDist,Math.floor(R.dist));
  // missions & achievements
  const done=[];
  ensureDaily();
  const runVals={coins:R.coins,jumps:R.jumps,dist:R.dist,avoided:R.avoided,pearls:R.pearls,treasures:R.treasures,storm:R.storm&&R.dist>=300?1:0,tricks:R.tricks,power:R.power,combo:R.maxCombo};
  for(const it of SAVE.daily.list){ if(it.done) continue; const def=MISSION_POOL.find(x=>x.id===it.id); if(!def) continue;
    if(def.mode==='run') it.prog=Math.max(it.prog,Math.floor(runVals[def.m]||0)); else if(def.mode==='day') it.prog+=Math.floor(runVals[def.m]||0); else if(def.mode==='set') it.prog=SAVE.daily.pbMaps.length;
    if(it.prog>=def.goal){ it.done=true; SAVE.coins+=def.reward; done.push(['Mission: '+def.text,'+'+def.reward]); } }
  for(const a of ACHIEVEMENTS){ if(SAVE.ach[a.id]) continue; if(a.test(SAVE)){ SAVE.ach[a.id]=today(); SAVE.coins+=a.reward;
    if(a.id==='longride'&&!SAVE.boards.includes('golden')) SAVE.boards.push('golden'); if(a.id==='treasure3'&&!SAVE.surfers.includes('captain')) SAVE.surfers.push('captain');
    done.push(['Achievement: '+a.name,a.item?a.item:'+'+a.reward]); } }
  // map unlocks
  for(const mm of MAPS){ if(!isUnlocked(mm.id)&&unlockMet(mm.id)){ SAVE.unlockedMaps.push(mm.id); revealQ.push(mm); } }
  persist();
  $('oMap').textContent=(SAVE.adventure?'Adventure Mode':G.map.name).toUpperCase();
  $('oScore').textContent=fmt(R.score);
  $('oPB').innerHTML=overallPB&&prevBest>0||mapPB&&prevMap>0?'<span class="pb">NEW PERSONAL BEST!</span>':'';
  $('oCmp').textContent=(SAVE.adventure?'Adventure':'Map')+' record '+fmt(Math.max(prevMap,R.score))+(mapPB&&prevMap>0?' (was '+fmt(prevMap)+')':'')+' · Overall best '+fmt(SAVE.best);
  $('oDist').textContent=fmt(R.dist); $('oCoins').textContent='+'+fmt(coins)+(R.doubler?' (x2)':''); $('oTricks').textContent=R.tricks;
  $('oDone').innerHTML=done.map(d=>`<div><span>${d[0]}</span><span style="color:var(--sun)">${d[1]}</span></div>`).join('');
  $('over').hidden=false;
  if((overallPB&&prevBest>0)||(mapPB&&prevMap>0)){ Snd.fanfare(); confetti(); }
  $('oRestart').focus();
  if(revealQ.length) setTimeout(showReveal,900);
  refreshMenu();
}
function unlockMet(id){ const u=UNLOCKS[id]; if(!u) return true; return unlockProg(u)>=u.v; }
function unlockProg(u){ return u.t==='coins'?SAVE.lifetimeCoins:u.t==='dist'?SAVE.bestDist:u.t==='runs'?SAVE.runs:SAVE.pbCount; }
function unlockText(u){ return u.t==='coins'?`Collect ${fmt(u.v)} coins`:u.t==='dist'?`Reach ${fmt(u.v)} m`:u.t==='runs'?`Complete ${u.v} runs`:`Beat ${u.v} personal records`; }
function showReveal(){ const m=revealQ.shift(); if(!m) return; $('rCard').style.background=thumbBg(m); $('rName').textContent=m.name; $('rText').textContent=m.blurb+' Difficulty: '+DIFF_NAMES[m.diff]+'.';
  const r=$('reveal'); r.hidden=false; r.querySelector('.rcard').style.animation='none'; void r.offsetWidth; r.querySelector('.rcard').style.animation=''; Snd.fanfare(); confetti();
  $('rRide').onclick=()=>{ r.hidden=true; SAVE.map=m.id; SAVE.adventure=false; persist(); $('over').hidden=true; startRun(); };
  $('rLater').onclick=()=>{ r.hidden=true; if(revealQ.length) setTimeout(showReveal,200); }; }
function confetti(){ if(matchMedia('(prefers-reduced-motion:reduce)').matches) return; const cols=['#ff6a48','#ffc93c','#16c6c9','#f2fbff','#b56dff'];
  for(let i=0;i<60;i++){ const d=document.createElement('div'); d.className='conf'; d.style.left=rand(0,100)+'vw'; d.style.background=pick(cols); d.style.animationDuration=rand(1.8,3.4)+'s'; d.style.animationDelay=rand(0,0.5)+'s'; document.body.appendChild(d); setTimeout(()=>d.remove(),4200); } }
$('oRestart').onclick=()=>{ Snd.click(); $('over').hidden=true; startRun(true); };
$('oMenu').onclick=()=>{ Snd.click(); $('over').hidden=true; toMenu(); };

/* ================= MENU / PANELS ================= */
function hideAll(){ $('menu').hidden=true; $('panel').hidden=true; $('pause').hidden=true; $('over').hidden=true; $('reveal').hidden=true; }
function toMenu(){
  hideAll(); $('hud').hidden=true; $('skip').hidden=true; state='menu'; G.menuView='menu'; G.ts=1; G.speed=0;
  clearWorld(); setMap(SAVE.adventure?MAP.tropical:MAP[SAVE.map],false); fillScenery();
  equip(SAVE.surfer,SAVE.board); P.menuYaw=-0.55; P.userYaw=0; P.lane=1; P.x=0; P.jy=0; P.air=false; P.duck=0; P.spin=0; P.flip=0; P.fall=0; tilt.rotation.set(0,0,0); shieldBubble.visible=false;
  if(camera.fov!==(VW<VH?72:62)){ camera.fov=VW<VH?72:62; camera.updateProjectionMatrix(); }
  $('menu').hidden=false; refreshMenu();
}
function thumbBg(m){ return `linear-gradient(180deg,${hex(m.sky[0])} 0%,${hex(m.sky[1])} 52%,${hex(m.water[1])} 53%,${hex(m.water[0])} 100%)`; }
function diffDots(n){ return '<span class="diff" aria-label="Difficulty '+n+' of 6">'+[1,2,3,4,5,6].map(i=>`<i class="${i<=n?'f':''}"></i>`).join('')+'</span>'; }
function refreshMenu(){
  $('mCoins').textContent=fmt(SAVE.coins); $('mBest').textContent=fmt(SAVE.best);
  const m=MAP[SAVE.map]||MAPS[0];
  $('modeSingle').setAttribute('aria-pressed',String(!SAVE.adventure)); $('modeAdv').setAttribute('aria-pressed',String(SAVE.adventure));
  if(SAVE.adventure){ $('chipThumb').style.background=`linear-gradient(90deg,${ADVENTURE.map((id,i)=>hex(MAP[id].water[1])+' '+(i*20)+'% '+(i*20+20)+'%').join(',')})`; $('chipName').textContent='Adventure Mode'; $('chipSub').textContent='5 oceans · '+fmt(STAGE_LEN)+' m each'; }
  else { $('chipThumb').style.background=thumbBg(m); $('chipName').textContent=m.name; $('chipSub').textContent=DIFF_NAMES[m.diff]+' · Change map'; }
  $('ctrlHint').textContent=isFine?(SAVE.settings.cursor?'Move the cursor to steer · Click to jump · Right-click to duck · Arrows/WASD also work':'Drag the mouse to swipe · Arrows/WASD · Space to jump'):'Swipe to steer, jump and duck';
  ensureDaily(); const open=SAVE.daily.list.filter(x=>!x.done).length; $('misBadge').hidden=!open; $('misBadge').textContent=open;
  $('dayBadge').hidden=SAVE.reward.last===today();
}
$('playBtn').onclick=()=>{ Snd.init(); Snd.click(); startRun(); };
$('modeSingle').onclick=()=>{ Snd.init(); Snd.click(); SAVE.adventure=false; persist(); setMap(MAP[SAVE.map],false); refreshMenu(); };
$('modeAdv').onclick=()=>{ Snd.init(); Snd.click(); SAVE.adventure=true; persist(); setMap(MAP.tropical,false); refreshMenu(); toast('Adventure: ride through <em>'+ADVENTURE.map(id=>MAP[id].name).join(' → ')+'</em>'); };
$('mapChip').onclick=()=>{ Snd.init(); Snd.click(); openPanel('maps'); };
$('setBtn').onclick=()=>{ Snd.init(); Snd.click(); openPanel('settings'); };
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{ Snd.init(); Snd.click(); openPanel(b.dataset.panel); });
$('pClose').onclick=()=>{ Snd.click(); closePanel(); };

let panelKind=null, panelFromPause=false, sel=null, missionTab='daily', confirmReset=false;
function openPanel(kind,fromPause){
  panelKind=kind; panelFromPause=!!fromPause; confirmReset=false;
  $('panel').hidden=false; if(!fromPause) $('menu').hidden=true; else $('pause').hidden=true;
  G.menuView=kind==='surfers'||kind==='boards'?'locker':kind==='maps'?'maps':'menu';
  if(kind==='maps') sel=SAVE.adventure?'tropical':SAVE.map; if(kind==='surfers') sel=SAVE.surfer; if(kind==='boards') sel=SAVE.board;
  P.userYaw=0; renderPanel(); setViewOffset();
}
function setViewOffset(){ if($('panel').hidden||panelFromPause){ viewOff.tx=0; viewOff.ty=0; return; } const wide=VW>760; const pr=$('panel').getBoundingClientRect(); viewOff.tx=wide?pr.width/2:0; viewOff.ty=wide?0:pr.height/2; }
function closePanel(){
  $('panel').hidden=true; viewOff.tx=0; viewOff.ty=0;
  if(panelFromPause){ $('pause').hidden=false; panelFromPause=false; return; }
  G.menuView='menu'; equip(SAVE.surfer,SAVE.board); setMap(SAVE.adventure?MAP.tropical:MAP[SAVE.map],false); clearWorld(); fillScenery();
  $('menu').hidden=false; refreshMenu();
}
function renderPanel(){
  const b=$('pBody'), k=panelKind;
  const titles={maps:'Maps',surfers:'Surfers',boards:'Surfboards',shop:'Shop',missions:'Missions',daily:'Daily Rewards',settings:'Settings'};
  $('pTitle').textContent=titles[k];
  if(k==='maps') b.innerHTML=mapsHTML(); else if(k==='surfers'||k==='boards') b.innerHTML=lockerHTML(k); else if(k==='shop') b.innerHTML=shopHTML();
  else if(k==='missions') b.innerHTML=missionsHTML(); else if(k==='daily') b.innerHTML=dailyHTML(); else b.innerHTML=settingsHTML();
  b.querySelectorAll('[data-act]').forEach(el=>el.onclick=ev=>{ ev.stopPropagation(); Snd.click(); panelAct(el.dataset.act,el.dataset.id); });
}
function mapsHTML(){
  const m=MAP[sel], un=isUnlocked(m.id), rec=mapRec(m.id), u=UNLOCKS[m.id];
  let h=`<div class="detail"><h4>${m.name}</h4><p>${m.blurb}</p><p><b style="color:var(--foam)">Special:</b> ${SPECIAL[m.event]}</p>
  <div class="kv"><div><b>${DIFF_NAMES[m.diff]}</b><span>Difficulty ${diffDots(m.diff)}</span></div><div><b class="num">${un?fmt(rec.best):'—'}</b><span>Best score</span></div>
  <div><b class="num">${un?fmt(rec.dist)+' m':'—'}</b><span>Longest ride</span></div><div><b>${un?'Unlocked':'Locked'}</b><span>${u?unlockText(u):'Available from start'}</span></div></div>`;
  if(un) h+=`<div class="kv"><button class="btn" data-act="selmap" data-id="${m.id}">${SAVE.map===m.id&&!SAVE.adventure?'Selected':'Select'}</button><button class="btn hot" data-act="playmap" data-id="${m.id}">Play map</button></div>`;
  else { const p=unlockProg(u); h+=`<div><div class="cmp num">${fmt(Math.min(p,u.v))} / ${fmt(u.v)}</div><div class="bar"><i style="width:${Math.min(100,p/u.v*100)}%"></i></div></div><button class="btn" disabled>Locked</button>`; }
  h+=`</div>`;
  for(const mm of MAPS){ const un2=isUnlocked(mm.id), r=mapRec(mm.id);
    h+=`<button class="card" data-act="viewmap" data-id="${mm.id}" aria-pressed="${mm.id===sel}"><span class="thumb" style="background:${thumbBg(mm)}">${un2?'':'<span class="lockicon">LOCKED</span>'}</span>
    <span class="meta"><b>${mm.name}</b><small>${DIFF_NAMES[mm.diff]} ${diffDots(mm.diff)}</small>
    <small>${un2?`Best ${fmt(r.best)} · ${fmt(r.dist)} m`:unlockText(UNLOCKS[mm.id])}</small></span>
    ${un2?(SAVE.map===mm.id&&!SAVE.adventure?'<span class="tag eq">Selected</span>':'<span class="tag ok">Open</span>'):'<span class="tag lock">Locked</span>'}</button>`; }
  return h;
}
function lockerHTML(k){
  const list=k==='surfers'?SURFERS:BOARDS, owned=k==='surfers'?SAVE.surfers:SAVE.boards, eq=k==='surfers'?SAVE.surfer:SAVE.board;
  const it=list.find(x=>x.id===sel)||list[0], has=owned.includes(it.id);
  let action;
  if(has) action=eq===it.id?'<button class="btn" disabled>Equipped</button>':`<button class="btn hot" data-act="equip" data-id="${it.id}">Equip</button>`;
  else if(it.ach){ const a=ACHIEVEMENTS.find(x=>x.id===it.ach); action=`<button class="btn" disabled>Achievement: ${a.text}</button>`; }
  else action=`<button class="btn sun" data-act="buy" data-id="${it.id}" ${SAVE.coins<it.cost?'disabled':''}>Buy · ${fmt(it.cost)} coins</button>`;
  let h=`<div class="detail"><h4>${it.name}</h4><p>${k==='surfers'?it.desc:boardDesc(it)}</p><p class="num">You have ${fmt(SAVE.coins)} coins · Drag the ${isFine?'view':'scene'} to rotate</p>${action}</div><div class="strip">`;
  for(const x of list){ const own=owned.includes(x.id);
    const sw=k==='surfers'?`<span class="dots">${[x.suit,x.accent,x.skin].map(c=>`<i style="background:${hex(c)}"></i>`).join('')}</span>`:`<img class="boardimg" alt="" src="${boardCanvasFor(x).toDataURL()}">`;
    h+=`<button class="item" data-act="view" data-id="${x.id}" aria-pressed="${x.id===sel}"><span class="sw">${sw}${own?'':'<span class="lockicon">'+(x.ach?'REWARD':fmt(x.cost))+'</span>'}</span><b>${x.name}</b><small>${eq===x.id?'Equipped':own?'Owned':x.ach?'Achievement':fmt(x.cost)+' coins'}</small></button>`; }
  return h+'</div>';
}
function boardDesc(b){ const d={stripe:'Timeless cream deck with a red racing stripe.',gradient:'Warm sunset fade from gold to violet.',wave:'Deep blue with rolling white wave lines.',dots:'Reef-bright coral with confetti spots.',flame:'Black deck licked by flames, leaves an ember trail.',frost:'Icy white with snowflake etching and a frost trail.',neon:'Glowing neon edges and a cyan light trail.',shark:'Grey hide, toothy nose and a dorsal fin.',stars:'Deep-space deck with a planet and a starlight trail.',gold:'Polished gold with a sparkling trail.'}; return d[b.design]||''; }
function shopHTML(){ let h=`<p class="cmp" style="text-align:left;margin:0">Boosts apply automatically at the start of your next run. You have <b class="num" style="color:var(--sun)">${fmt(SAVE.coins)}</b> coins.</p>`;
  for(const s of SHOP){ const n=SAVE.boosts[s.id]||0; const icon=s.id==='score'?'mult':s.id;
    h+=`<div class="card" style="cursor:default"><span class="thumb" style="width:64px;height:64px;display:grid;place-items:center;background:rgba(3,15,21,.5)"><img alt="" src="${ICON[icon==='doubler'?'bonus':icon].url}" style="width:52px"></span>
    <span class="meta"><b>${s.name}</b><small>${s.desc}</small><small>Owned: <b class="num">${n}</b></small></span>
    <button class="btn sun" data-act="shop" data-id="${s.id}" ${SAVE.coins<s.cost?'disabled':''}>${fmt(s.cost)}</button></div>`; }
  h+=`<p class="cmp" style="text-align:left;margin:4px 0 0">Surfers and boards are in their own lockers.</p><div class="kv"><button class="btn" data-act="goto" data-id="surfers">Surfers</button><button class="btn" data-act="goto" data-id="boards">Boards</button></div>`;
  return h; }
function ensureDaily(){ const t=today(); if(SAVE.daily.date===t) return;
  const pool=MISSION_POOL.filter(m=>!m.need||m.need()); let seed=[...t].reduce((a,c)=>a*31+c.charCodeAt(0),7)>>>0; const rnd=()=>{ seed=(seed*1103515245+12345)>>>0; return seed/4294967296; };
  const chosen=[]; const copy=pool.slice(); while(chosen.length<3&&copy.length){ chosen.push(copy.splice(Math.floor(rnd()*copy.length),1)[0]); }
  SAVE.daily={date:t,list:chosen.map(m=>({id:m.id,prog:0,done:false})),pbMaps:[]}; persist(); }
function missionsHTML(){ ensureDaily();
  let h=`<div class="tabs"><div class="seg"><button data-act="mtab" data-id="daily" aria-pressed="${missionTab==='daily'}">Daily missions</button><button data-act="mtab" data-id="ach" aria-pressed="${missionTab==='ach'}">Achievements</button></div></div>`;
  if(missionTab==='daily'){ h+=`<p class="cmp" style="text-align:left;margin:0">New missions every day. Progress is tracked automatically.</p>`;
    for(const it of SAVE.daily.list){ const d=MISSION_POOL.find(x=>x.id===it.id); if(!d) continue; const p=Math.min(it.prog,d.goal);
      h+=`<div class="mission ${it.done?'ok':''}"><div class="top2"><span>${d.text}</span><span style="color:var(--sun)" class="num">+${d.reward}</span></div><small class="num">${it.done?'Completed':fmt(p)+' / '+fmt(d.goal)}</small><div class="bar"><i style="width:${p/d.goal*100}%;${it.done?'background:var(--good)':''}"></i></div></div>`; } }
  else for(const a of ACHIEVEMENTS){ const got=!!SAVE.ach[a.id]; h+=`<div class="mission ${got?'ok':''}"><div class="top2"><span>${a.name}</span><span style="color:var(--sun)">${a.item||'+'+a.reward}</span></div><small>${a.text}${got?' · Earned':''}</small></div>`; }
  return h; }
function dailyHTML(){ const t=today(); const claimed=SAVE.reward.last===t;
  const y=new Date(); y.setDate(y.getDate()-1); const yk=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
  let streak=SAVE.reward.streak; if(!claimed&&SAVE.reward.last!==yk) streak=0; const idx=claimed?(streak-1)%7:streak%7;
  let h=`<p class="cmp" style="text-align:left;margin:0">Come back every day. Missing a day resets the streak.</p><div class="days">`;
  DAILY.forEach((v,i)=>{ const got=claimed?i<=idx:i<idx; h+=`<div class="day ${i===6?'big':''} ${got?'got':''} ${i===idx?'now':''}"><span>DAY ${i+1}</span><b class="num">${v}</b><span>${got?'CLAIMED':'COINS'}</span></div>`; });
  h+=`</div><button class="btn ${claimed?'':'hot'}" data-act="claim" ${claimed?'disabled':''}>${claimed?'Come back tomorrow':'Claim '+DAILY[idx]+' coins'}</button>`;
  return h; }
function settingsHTML(){ const s=SAVE.settings;
  const tog=(id,on,label,sub)=>`<div class="set"><span><b>${label}</b><small>${sub}</small></span><button class="tog" data-act="tog" data-id="${id}" aria-pressed="${on}" aria-label="${label}"></button></div>`;
  let h=tog('music',s.music,'Music','Background soundtrack')+tog('sfx',s.sfx,'Sound effects','Waves, coins and ambience')+
   tog('cursor',s.cursor,'Cursor steering','Mouse: lane follows the cursor, click jumps, right-click ducks. Off: drag to swipe')+
   tog('skipIntro',s.skipIntro,'Skip intro animation','Available after your first ride');
  h+=`<div class="set" style="flex-wrap:wrap"><span><b>Graphics</b><small>Lower settings run smoother on older phones</small></span><div class="seg">${['auto','low','med','high'].map(q=>`<button data-act="qual" data-id="${q}" aria-pressed="${s.quality===q}">${q==='med'?'Medium':q[0].toUpperCase()+q.slice(1)}</button>`).join('')}</div></div>`;
  h+=`<div class="set"><span><b>Controls</b><small>Swipe or drag · Arrows / WASD · Space jumps · Esc pauses · Mouse wheel jumps and ducks</small></span></div>`;
  if(!panelFromPause){ h+= confirmReset?`<div class="detail"><p class="warn">Erase all coins, records, unlocks and purchases? This cannot be undone.</p><div class="kv"><button class="btn" data-act="resetno">Cancel</button><button class="btn hot" data-act="resetyes">Erase progress</button></div></div>`
    :`<button class="btn ghost" data-act="reset">Reset progress</button>`; }
  return h; }
function panelAct(a,id){
  if(a==='viewmap'){ sel=id; setMap(MAP[id],false); clearWorld(); fillScenery(); renderPanel(); }
  else if(a==='selmap'){ SAVE.map=id; SAVE.adventure=false; persist(); renderPanel(); refreshMenu(); toast('<em>'+MAP[id].name+'</em> selected'); }
  else if(a==='playmap'){ SAVE.map=id; SAVE.adventure=false; persist(); $('panel').hidden=true; viewOff.tx=viewOff.ty=0; startRun(); }
  else if(a==='view'){ sel=id; if(panelKind==='surfers') equip(id,SAVE.board); else equip(SAVE.surfer,id); renderPanel(); }
  else if(a==='equip'){ if(panelKind==='surfers') SAVE.surfer=id; else SAVE.board=id; persist(); renderPanel(); toast('Equipped <em>'+(panelKind==='surfers'?SURFERS:BOARDS).find(x=>x.id===id).name+'</em>'); }
  else if(a==='buy'){ const list=panelKind==='surfers'?SURFERS:BOARDS, it=list.find(x=>x.id===id); if(SAVE.coins>=it.cost){ SAVE.coins-=it.cost; (panelKind==='surfers'?SAVE.surfers:SAVE.boards).push(id); if(panelKind==='surfers') SAVE.surfer=id; else SAVE.board=id; persist(); Snd.power(); toast('Unlocked <em>'+it.name+'</em>'); renderPanel(); refreshMenu(); } }
  else if(a==='shop'){ const s=SHOP.find(x=>x.id===id); if(SAVE.coins>=s.cost){ SAVE.coins-=s.cost; SAVE.boosts[id]=(SAVE.boosts[id]||0)+1; persist(); Snd.power(); toast('Bought <em>'+s.name+'</em>'); renderPanel(); refreshMenu(); } }
  else if(a==='goto'){ openPanel(id); }
  else if(a==='mtab'){ missionTab=id; renderPanel(); }
  else if(a==='claim'){ const t=today(); if(SAVE.reward.last===t) return; const y=new Date(); y.setDate(y.getDate()-1); const yk=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    const streak=SAVE.reward.last===yk?SAVE.reward.streak:0; const v=DAILY[streak%7]; SAVE.coins+=v; SAVE.reward={last:t,streak:streak+1}; persist(); Snd.fanfare(); toast('Daily reward <em>+'+v+' coins</em>'); renderPanel(); refreshMenu(); }
  else if(a==='tog'){ SAVE.settings[id]=!SAVE.settings[id]; persist(); Snd.applySettings(); renderPanel(); refreshMenu(); }
  else if(a==='qual'){ SAVE.settings.quality=id; persist(); quality=id==='auto'?(isFine?'high':'med'):id; renderer.setPixelRatio(pr()); water.geometry.dispose(); water.geometry=buildWater(quality); resize(); renderPanel(); }
  else if(a==='reset'){ confirmReset=true; renderPanel(); }
  else if(a==='resetno'){ confirmReset=false; renderPanel(); }
  else if(a==='resetyes'){ const st=SAVE.settings; SAVE=defaults(); SAVE.settings=st; persist(); confirmReset=false; toast('Progress erased'); closePanel(); }
}

/* ================= BOOT ================= */
addEventListener('resize',()=>{ resize(); setViewOffset(); });
resize();
equip(SAVE.surfer,SAVE.board);
setMap(MAP[SAVE.map]&&isUnlocked(SAVE.map)?MAP[SAVE.map]:MAPS[0],true);
if(!isUnlocked(SAVE.map)) SAVE.map='tropical';
W.faceH=0; W.faceZ=42; fillScenery();
camera.position.set(4.8,2.5,-6.2); camera.lookAt(0,1.2,0);
$('loading').remove();
state='menu'; $('menu').hidden=false; refreshMenu();
requestAnimationFrame(t=>{ last=t; loop(t); });
})();
