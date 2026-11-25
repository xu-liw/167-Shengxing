// 《167次-勝興》舊山線線上策展資料集
// 嚴格對應 13 個核心物件（地圖互動物件與「02. 沿線圖鑑」完全同源、僅收錄此 13 項）
// 圖片檔案上傳至 /public/images/ 後會自動套用，且同時支援 .png 與 .jpg 格式
// 【展覽調整中模式總開關】true = 顯示「路線養護與展覽調整中」＋「關於本展」；false = 正常開放全站。（你的網址/?preview=1），就能繞過維護畫面
export const MAINTENANCE_MODE = true;

import shengxingNightImg from '../assets/images/shengxing_night_station_1795101028819.jpg';
import longtengBridgeImg from '../assets/images/longteng_bridge_mist_1795101010969.jpg';
import juguangTrainImg from '../assets/images/juguang_train_167_1795101008541.jpg';
import mountainTunnelImg from '../assets/images/old_mountain_tunnel_1795101010490.jpg';

export const EXHIBITION_IMAGES = {
  shengxingNight: shengxingNightImg,
  longtengBridge: longtengBridgeImg,
  juguangTrain: juguangTrainImg,
  mountainTunnel: mountainTunnelImg,
};

export const NAV_ITEMS = [
  {
    id: 'explore',
    index: '01',
    label: '探索舊山線',
    subtitle: '1998.09.23末班莒光167與山線軌跡',
  },
  {
    id: 'archive',
    index: '02',
    label: '沿線圖鑑',
    subtitle: '舊山線13個景點與鐵道設施介紹',
  },
  {
    id: 'about',
    index: '03',
    label: '關於本展',
    subtitle: '策展論述與製作團隊',
  },
  {
    id: 'links',
    index: '04',
    label: '勝興連結',
    subtitle: '地方聚落與走讀資源',
  },
];

/**
 * 舊山線 11 個定位於地圖軌跡上的可點擊物件（加上第 12 項畫面中心移動列車、第 13 項右下角電氣閉塞器，共計 13 項）
 * 座標基準：0% = 北端三義站，100% = 南端豐原站（勝興核心位於 36%）
 * 五座車站站牌標示距離舊山線三義起點里程（0K+000 ~ 23K+600），全站已移除海拔高度欄位。
 */
export const MAP_OBJECTS = [
  // --- ① 三義車站 ---
  {
    id: 'sign-sanyi',
    name: '三義車站',
    shortName: '三義',
    subtitle: '木出名堂，藝鳴驚人',
    type: 'signpost',
    kmMark: '0K+000',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '銅鑼',
    nextStation: '勝興',
    portraitPos: { x: 26, y: 0 },
    landscapePos: { x: 0, y: 37.2 },
    mapIcon: 'sign_sanyi.png',
    image: 'scene_st_sanyi.jpg',
    fallbackImage: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '三義站牌與舊山線北端攀坡起點景致',
    summary: '木出名堂，藝鳴驚人',
    detail: '自三義站南下後，單線軌道隨山勢蜿蜒攀升，為進入關刀山隘口的序幕。',
    story:
      '三義以前叫三叉河，是火車準備爬上舊山線陡坡的起點。早期山裡砍樟樹留下的樹頭，被當地師傅巧手雕刻成一件件藝術品，讓三義成了聞名全台的木雕之鄉。以前旅客在三義站下車，還沒走出月台就能聞到濃濃的木頭香，而載滿木雕與山產的貨車，也從這裡出發，把山城的工藝與物產運往全台各地。',
    walkingTip:
      '現在可以在三義車站看看木雕導覽圖，認識當地的木雕文化。',
    source: '文化部國家文化記憶庫《三義站》',
  },

  // --- ⑦ 折返式軌道與加掛補機 ---
  {
    id: 'switchback-track',
    name: '折返式軌道與加掛補機',
    shortName: '折返軌道',
    subtitle: '退一步，海闊鐵道',
    type: 'track',
    kmMark: '',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 68, y: 51 },
    landscapePos: { x: 55.8, y: 42.1 },
    mapIcon: 'icon_sx_switchback.png',
    image: 'scene_sx_switchback.jpg',
    fallbackImage: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '勝興車站北側折返式安全側線與加掛補機推拉情境',
    summary: '退一步，海闊鐵道',
    detail: '在勝興站北端分岔出長約 400 公尺的爬坡逆向引道，為極罕見的工程遺跡。',
    story:
      '從三義往勝興的路並不好走，舊山線有些路段坡度很陡，以前蒸汽火車馬力不夠，爬到一半常常喘不過氣。遇到陡坡時，鐵路人員會安排另一台火車頭在後方推動，幫助列車前進；下雨時鐵軌容易打滑，甚至可能發生火車倒退的情況。鐵路局在這裡蓋了全台少見的折返式軌道，火車會先倒車退進平緩的側線喘口氣，甚至在車尾加掛一顆火車頭推一把，一拉一推、前後合力衝上山頂，這也是老一輩乘客最難忘的搭車體驗。',
    walkingTip:
      '走訪勝興站北端鐵道，可看到當年讓火車倒車助跑的分岔路軌。',
    source: '文化部文化資產局國家文化資產網《折返線》',
  },

  // --- ⑨ 海拔 402.326m 紀念碑 ---
  {
    id: 'elevation-monument',
    name: '海拔 402.326m 紀念碑',
    shortName: '海拔紀念碑',
    subtitle: '臺鐵之巔',
    type: 'monument',
    kmMark: '',
    isFocal: true,
    hasStory: true,
    portraitPos: { x: 60.8, y: 33.3 },
    landscapePos: { x: 32.5, y: 45.7 },
    mapIcon: 'icon_sx_monument.png',
    image: 'scene_sx_monument.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '勝興車站月台北端之縱貫鐵路最高點石砌紀念碑',
    summary: '臺鐵之巔',
    detail: '全線四百多公里縱貫軌道的極高點，列車至此越過山陵，開始奔向台中盆地。',
    story:
      '勝興車站是台灣西部縱貫鐵路的最高點，當年火車沿著山勢一路爬升，乘客只要看到月台上這座石碑，就知道終於登上最高峰，準備要一路下坡了。對山城居民來說，是家鄉最值得驕傲的紀念碑。',
    walkingTip:
      '走到勝興車站第二月台中央，就能跟這座最高點石碑合照留念。',
    source: '文化部國家文化記憶庫《勝興車站海拔 402.326 公尺紀念碑》',
  },

  // --- ⑥ 勝興木造車站 ---
  {
    id: 'shengxing',
    name: '勝興木造車站',
    shortName: '勝興',
    subtitle: '榫手拈來，木可取代',
    type: 'station',
    kmMark: '',
    isFocal: true,
    isCenter: true,
    hasStory: true,
    portraitPos: { x: 74, y: 36 },
    landscapePos: { x: 35.9, y: 35.4 },
    mapIcon: 'icon_sx_station.png',
    image: 'scene_sx_station.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '1998 年秋夜薄霧中的勝興木造車站與月台暖燈',
    summary: '榫手拈來，木可取代',
    detail: '1998 年 9 月 23 日晚間 21:10，莒光 167 次南下列車最後一次在此交會停靠。',
    story:
      '你有沒有想過，一座車站可以不用釘子蓋起來？勝興車站以福州杉作為主要建材，樑柱之間使用傳統榫接技術組合而成。周邊山勢像隻猛虎，老一輩特地在屋簷雕出鋸齒虎牙、掛上八卦陣，替山城擋掉煞氣。早年旅客在這裡等車、買票，居民也靠火車運送山產，讓這座山中的小站熱鬧起來。如今火車雖然不再進站，木頭站房仍靜靜留著，彷彿還在等待下一班旅客。',
    walkingTip:
      '抬頭看看鋸齒狀屋簷，仔細觀察木造樑柱的榫接工藝。',
    source: '文化部文化資產局國家文化資產網《勝興火車站》',
  },

  // --- ② 勝興車站 ---
  {
    id: 'sign-shengxing',
    name: '勝興車站',
    shortName: '勝興',
    subtitle: '車站退休後的日子',
    type: 'signpost',
    kmMark: '5K+000',
    isFocal: true,
    hasStory: true,
    isSignpost: true,
    prevStation: '三義',
    nextStation: '泰安',
    portraitPos: { x: 22.4, y: 35.9 },
    landscapePos: { x: 36.2, y: 71.9 },
    mapIcon: 'sign_shengxing.png',
    image: 'scene_shengxing.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '台鐵傳統白底藍字勝興月台站名牌（三義 ⇐ 勝興 ⇒ 泰安）',
    summary: '車站退休後的日子',
    detail: '記錄著舊山線單軌時期的站序與距離，成為無數旅人駐足合影的經典地標。',
    story:
      '勝興車站於 1907 年設站時，設站之初僅是個小小的「十六份信號所」。1930 年以「十六份停車場」扮演轉運站角色，為周邊山區樟腦、木炭與水果的重要轉運站。1958 年隨地名改稱勝興車站，1998 年因新山線通車而停駛廢站，隔年獲指定為苗栗縣定古蹟，2019 年透過鐵道自行車 Rail Bike 讓舊山線苗栗段再度響起熱鬧的聲響，以勝興老車站為起點，舊鐵道展開了新旅程。',
    walkingTip:
      '現在去能看見保存完整的百年車站與月台，並能搭乘鐵道自行車。',
    source: '文化部國家文化記憶庫《勝興車站》',
  },

  // --- ⑪ 軋日機 ---
  {
    id: 'dater-machine',
    name: '軋日機',
    shortName: '軋日機',
    subtitle: '軋出時光，印下回憶',
    type: 'dater',
    kmMark: '',
    isFocal: true,
    hasStory: true,
    portraitPos: { x: 80, y: 39.5 },
    landscapePos: { x: 38.5, y: 36 },
    mapIcon: 'icon_sx_dater.png',
    image: 'scene_sx_dater.png',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '台鐵名片式硬票與售票口軋日機壓印情境',
    summary: '軋出時光，印下回憶',
    detail: '點擊開啟軋日儀式，親手重壓油墨鋼印，一鍵合成並下載專屬 167 次車票 PNG。',
    story:
      '在沒有電腦刷卡的年代，買火車票不像現在只要刷卡或掃碼，站務人員會使用軋日機，在名片式車票上壓印乘車日期，轉動機器裡的數字，再用力壓下去，車票上就會印出當天的年月日。',
    walkingTip:
      '現在來到勝興車站售票窗口旁還能看到這台古董軋日機。',
    source: '自由時報《硬票續賣 台鐵軋日機進階百年》',
  },

  // --- ⑩ 樟腦寮 ---
  {
    id: 'camphor-lodge',
    name: '樟腦寮',
    shortName: '樟腦寮',
    subtitle: '一擔樟腦走天下',
    type: 'heritage',
    kmMark: '',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 87.3, y: 26.4 },
    landscapePos: { x: 26.3, y: 19.7 },
    mapIcon: 'icon_sx_camphor.png',
    image: 'scene_sx_camphor.jpg',
    fallbackImage: EXHIBITION_IMAGES.longtengBridge,
    imageAlt: '三義山區客家樟腦林與山林煉製樟腦情境',
    summary: '一擔樟腦走天下',
    detail: '樟腦與林業物產的繁榮促使舊山線在此設站，奠定百年客家山城的鐵道命脈。',
    story:
      '勝興舊稱為十六份，因當地曾設有十六座提煉樟腦的蒸餾爐而得名。清代客家先民入山開採樟木、設灶製腦，帶動聚落發展。日治時期縱貫鐵路通車後，分散山區的樟腦仍須靠山民翻山越嶺、人力肩挑至勝興集散，再搭火車運往港口銷往全球，這些汗水走出的山徑見證了山城的繁榮。',
    walkingTip:
      '現在去勝興老街漫步能聞到樟木香氣，並探訪周邊的挑夫古道。',
    source: '天下雜誌《站上縱貫線最高點》',
  },

  // --- ⑧ 開天隧道口與警總哨亭 ---
  {
    id: 'tunnel-2',
    name: '開天隧道口與警總哨亭',
    shortName: '開天隧道',
    subtitle: '晴雨兩重天',
    type: 'tunnel',
    kmMark: '',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 51.1, y: 43.6 },
    landscapePos: { x: 41.1, y: 51.6 },
    mapIcon: 'icon_sx_tunnel.png',
    image: 'scene_sx_tunnel.jpg',
    fallbackImage: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '舊山線二號開天隧道百年磚拱洞口與警總哨亭',
    summary: '晴雨兩重天',
    detail: '列車由勝興出站後隨即鑽入隧道，洞口旁並留存戒嚴時期守衛隧道的哨亭遺跡。',
    story:
      '苗栗三義的關刀山脈正好穿過氣候分界線，常常北邊還在起霧下雨，火車一鑽出隧道南口就變成大晴天。有如客家話中，天下雨過後天氣放晴時所說的「天開咧」，因此這個隧道就以「開天」題字。戒嚴時期，為了怕有人破壞這條南北交通命脈，隧道上方還駐守著警備總部的阿兵哥，日夜盯著每一班進出的火車。',
    walkingTip:
      '現在去仍可看見隧道口的紅磚結構，抬頭還能尋找開天題字與營房。',
    source: '客家委員會客家文化發展中心《三義舊山線隧道口上題字意涵》',
  },

  // --- ③ 泰安車站 ---
  {
    id: 'sign-taian',
    name: '泰安車站',
    shortName: '泰安',
    subtitle: '爬樓順便搭火車',
    type: 'signpost',
    kmMark: '13K+600',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '勝興',
    nextStation: '后里',
    portraitPos: { x: 26, y: 70 },
    landscapePos: { x: 70, y: 34 },
    mapIcon: 'sign_taian.png',
    image: 'scene_taian.jpg',
    fallbackImage: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '泰安舊站月台站牌與大安溪畔鐵道景致',
    summary: '爬樓順便搭火車',
    detail: '167 次末班車於 21:24 通過泰安站，山線平原段由此延伸向后里。',
    story:
      '泰安舊站蓋在山谷低窪處，為了配合兩端山壁的鐵軌高度，設計師乾脆把鐵軌架高，讓售票口在一樓地面，月台卻在二樓半空中。以前居民要搭車，得先買票走進地下道，再爬樓梯上去才能看到火車，成了台灣極罕見的「一樓售票、二樓搭車」高架月台車站。',
    walkingTip:
      '現在已轉型為鐵道文化園區，可以沿著舊月台散步或欣賞落羽松。',
    source: '臺中市文化資產處《縱貫鐵路舊山線－泰安車站》',
  },

  // --- ④ 后里車站 ---
  {
    id: 'sign-houli',
    name: '后里車站',
    shortName: '后里',
    subtitle: '百年好橋',
    type: 'signpost',
    kmMark: '15K+900',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '泰安',
    nextStation: '豐原',
    portraitPos: { x: 74, y: 86 },
    landscapePos: { x: 86.1, y: 66.8 },
    mapIcon: 'sign_houli.png',
    image: 'scene_houli.jpg',
    fallbackImage: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '后里站牌與山線台地接軌景致',
    summary: '百年好橋',
    detail: '列車由此重回雙軌電氣化幹線，告別陡峭山道，往台中方向飛馳。',
    story:
      '火車離開勝興後，沿著舊山線穿過隧道與山谷，最後來到后里一帶。這段路最令人印象深刻的，就是跨越大安溪的花樑鋼橋，它在 1908 年完工，過去負責運送物產，也讓南北交通更加便利。1998 年舊山線停駛後，這座橋不再有火車通行，但保留著當年工程的身影。',
    walkingTip:
      '橋面目前封閉禁止進入，現在去可在溪畔或周邊遠眺壯觀的花樑結構。',
    source: '臺中市文化資產處《臺鐵舊山線－大安溪鐵橋》',
  },

  // --- ⑤ 豐原車站 ---
  {
    id: 'sign-fengyuan',
    name: '豐原車站',
    shortName: '豐原',
    subtitle: '豐富山城，一路豐收',
    type: 'signpost',
    kmMark: '23K+600',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '后里',
    nextStation: '潭子',
    portraitPos: { x: 23.4, y: 99 },
    landscapePos: { x: 99, y: 37.6 },
    mapIcon: 'sign_fengyuan.png',
    image: 'scene_fengyuan.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '豐原站牌與台中平原門戶車站夜色',
    summary: '豐富山城，一路豐收',
    detail: '穿越百里山嶺與九十年歲月，167 次列車完成舊山線最後一次歷史巡禮。',
    story:
      '豐原站舊稱「葫蘆墩驛」，設於 1905 年，豐原是舊山線最南端的大站。當年興建縱貫鐵路最艱難的三義山區路段時，工程隊便是從豐原向北推進。通車後，三義山區的樟腦與木炭從勝興裝車，一路下坡跨越大安溪與大甲溪，抵達豐原才算走出山區、匯入西部幹線轉運至基隆港出口。1998 年舊山線停駛、勝興站走入歷史後，豐原站依然穩穩留在主線上營運至今。',
    walkingTip:
      '走出現在的豐原車站，步行幾分鐘就能逛遍百年老餅店商圈。',
    source: '文化部文化資產局文史脈流網站《豐原車站》',
  },
];

/**
 * ⑫ 莒光167次（保持於畫面中心、隨滑動沿鐵路移動，點擊鳴笛並開啟介紹彈窗）
 */
export const TRAIN_167_OBJECT = {
  id: 'train-167',
  name: '莒光167次',
  shortName: '167 次莒光號',
  subtitle: '1998.09.23 21:10 末班列車',
  type: 'train',
  kmMark: '',
  isFocal: true,
  hasStory: true,
  portraitPos: { x: 50.0, y: 36.0 },
  landscapePos: { x: 36.0, y: 50.0 },
  mapIcon: 'ui_train_167.png',
  image: 'scene_train_167.jpg',
  fallbackImage: EXHIBITION_IMAGES.juguangTrain,
  imageAlt: 'E300 型電力機車牽引之 167 次莒光號橘白塗裝列車',
  summary: '1998.09.23 21:10 末班列車',
  detail: '末班車於 21:10 準點駛出勝興車站二股道，自此劃下舊山線定期營運句點。',
  story:
    '1998 年 9 月 23 日晚間，由台北開往高雄的南下 167 次莒光號，成為台灣鐵道史上最後一列定期停靠勝興車站的客運班次。車身經典的「莒光橘」（#F05E1C）搭配米白腰帶，在深綠山林與秋夜霧氣中格外醒目。當晚 21:10 列車長吹響哨音、機車頭拉響長鳴汽笛緩緩駛離月台，載著九十年的山線通勤與返鄉記憶，正式駛入歷史。',
  walkingTip:
    '滑動「探索舊山線」地圖即可駕駛 167 次莒光號由三義一路南下至豐原；點擊畫面中央的列車車頭，還可重溫經典的雙音氣笛聲。',
  source: '交通部臺灣鐵路管理局 1998 年時刻表檔案、《鐵道情報》舊山線停駛特輯',
};

/**
 * ⑬ 電氣路牌閉塞器（右下角常駐裝置，點擊開啟與其他展品相同規格的彈出視窗，並同步顯示於「02. 沿線圖鑑」）
 */
export const BLOCK_INSTRUMENT_DATA = {
  id: 'block-instrument',
  name: '電氣路牌閉塞器',
  shortName: '電氣閉塞器',
  subtitle: '有牌有保庇，沒牌免走',
  type: 'equipment',
  kmMark: '',
  isFocal: false,
  hasStory: true,
  portraitPos: { x: 85.0, y: 85.0 },
  landscapePos: { x: 85.0, y: 85.0 },
  mapIcon: 'ui_block_instrument.png',
  image: 'scene_block_instrument.jpg',
  fallbackImage: EXHIBITION_IMAGES.shengxingNight,
  imageAlt: '舊山線單軌車站電氣路牌閉塞器歷史意象',
  summary: '有牌有保庇，沒牌免走',
  detail: '相鄰兩站各設一台電氣路牌閉塞器並以專線互鎖，直到列車平安抵達下一站歸還路牌才解除鎖定。',
  story:
    '舊山線早期是單線鐵道，為防止兩列火車對撞，全靠站內的「電氣路牌閉塞器」。它就像一組互相牽制的鎖和鑰匙，站長操作機器取出銅質路牌交給司機，司機憑牌通行到下一站交還解鎖，上一站才能放行下一班車。即便 1970 年代改為中央行車控制後，因勝興到泰安單軌距離最長，這套設備仍保留作為備用，守護行車安全。',
  walkingTip:
    '走進勝興車站站房內部，還能看見保存完好的閉塞器展示。',
  source: '文化部國家文化記憶庫《舊山線的路牌閉塞器》',
};

export const MAP_STATIONS = MAP_OBJECTS.filter(
  (item) => item.type === 'station' || item.type === 'signpost'
);

/**
 * 右下角單軌電氣路牌閉塞器區間定義（對應 0% 三義 → 36% 勝興 → 70% 泰安 → 86% 后里 → 100% 豐原）
 */
export const BLOCK_SECTIONS = [
  {
    id: 'sec-1',
    name: '三義 ⟷ 勝興',
    rangeLandscape: [0, 34],
    rangePortrait: [0, 34],
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '40 km/h（千分之 25 連續上坡）',
    mileage: '0K+000 — 5K+000',
    description: '三義與勝興兩站各設一台電氣路牌閉塞機，兩端副站長以電鈴信號確認無車後，始能聯鎖扭出一枚銅質路牌。',
  },
  {
    id: 'sec-2',
    name: '勝興 ⟷ 泰安',
    rangeLandscape: [34, 68],
    rangePortrait: [34, 68],
    status: 'occupied',
    statusText: '列車佔用中（167 次）',
    speedLimit: '35 km/h（翻越分水嶺・連續隧道群）',
    mileage: '5K+000 — 13K+600',
    description: '1998 年 9 月 23 日 21:10，莒光 167 次正停靠勝興並將駛入此區間，閉塞機鎖定紅燈，絕不容許另一班列車進入。',
  },
  {
    id: 'sec-3',
    name: '泰安 ⟷ 后里',
    rangeLandscape: [68, 85],
    rangePortrait: [68, 85],
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '50 km/h（大安溪花樑鋼橋區間）',
    mileage: '13K+600 — 15K+900',
    description: '跨越大安溪花樑鋼橋至后里平原，確保單線區間列車通行安全無虞。',
  },
  {
    id: 'sec-4',
    name: '后里 ⟷ 豐原',
    rangeLandscape: [85, 101],
    rangePortrait: [85, 101],
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '60 km/h（銜接雙軌平原段）',
    mileage: '15K+900 — 23K+600',
    description: '舊山線南端最後一個閉塞區間，列車交還路牌後，即駛入台中都會區現代化號誌自動閉塞（ABS）雙軌區間。',
  },
];

export const OLD_MOUNTAIN_STOPS = [];

/**
 * 「02. 沿線圖鑑」13 個核心項目（與「探索舊山線」地圖彈窗 100% 同步，嚴格僅此 13 項）
 */
const ARCHIVE_ITEM_ORDER = [
  'sign-sanyi',         // 01. 三義車站
  'sign-shengxing',     // 02. 勝興車站
  'sign-taian',         // 03. 泰安車站
  'sign-houli',         // 04. 后里車站
  'sign-fengyuan',      // 05. 豐原車站
  'shengxing',          // 06. 勝興木造車站
  'switchback-track',   // 07. 折返式軌道與加掛補機
  'tunnel-2',           // 08. 開天隧道口與警總哨亭
  'elevation-monument', // 09. 海拔 402.326m 紀念碑
  'camphor-lodge',      // 10. 樟腦寮
  'dater-machine',      // 11. 軋日機
  'train-167',          // 12. 莒光號列車正面
  'block-instrument',   // 13. 電氣路牌閉塞器
];

const ARCHIVE_SOURCE_MAP = new Map([
  ...MAP_OBJECTS.map((item) => [item.id, item]),
  [TRAIN_167_OBJECT.id, TRAIN_167_OBJECT],
  [BLOCK_INSTRUMENT_DATA.id, BLOCK_INSTRUMENT_DATA],
]);

export const ARCHIVE_PLATES = ARCHIVE_ITEM_ORDER.map((id) => {
  const item = ARCHIVE_SOURCE_MAP.get(id);
  return {
    id: item.id,
    title: item.name,
    subtitle: item.subtitle || '',
    kmMark: item.kmMark || '',
    thumbnail: item.thumbnail || item.mapIcon || item.image || '',
    image: item.image || '',
    fallbackImage: item.fallbackImage || '',
    imageAlt: item.imageAlt || item.name,
    story: item.story || item.detail || '',
    walkingTip: item.walkingTip || '',
    source: item.source || '',
  };
});

export const CURATORIAL_CREDITS = [
  {
    role: '指導老師',
    members: ['涂卉 副教授'],
    note: '國立臺灣師範大學 圖文傳播學系',
  },
  {
    role: '策展與製作名單（依照姓氏筆畫排列）',
    members: ['徐立威', '陳主卉', '陳宏倫', '謝妮霓'],
    note: '',
    memberDetails: [
      { name: '徐立威', task: '網站架設與策展規劃' },
      { name: '陳主卉', task: '文案撰寫與編排' },
      { name: '陳宏倫', task: '音效製作' },
      { name: '謝妮霓', task: '插圖繪製與攝影' },
    ],
  },
];

export const CULTURAL_LINKS = [
  {
    id: 'link-01',
    title: '勝興車站歷史聚落與十六份老街（待替換）',
    description: '保留完整的縣定古蹟木造站體與周邊山城聚落文化，相關網站介紹與連結待補。',
    url: '',
  },
  {
    id: 'link-02',
    title: '舊山線鐵道自行車與龍騰斷橋園區（待替換）',
    description: '沿昔日舊山線軌跡串聯勝興站、開天隧道與龍騰斷橋，相關網站介紹與連結待補。',
    url: '',
  },
  {
    id: 'link-03',
    title: '國家鐵道博物館籌備處（待替換）',
    description: '收錄臺灣鐵道文史檔案、硬票與舊山線相關典藏資料，相關網站介紹與連結待補。',
    url: '',
  },
];