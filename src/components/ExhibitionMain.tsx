import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Footprints,
  MapPin,
  RotateCcw,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import {
  ARCHIVE_PLATES,
  CULTURAL_LINKS,
  CURATORIAL_CREDITS,
  ExhibitionTabId,
  NAV_ITEMS,
} from '../data/exhibitionData';
import { InteractiveMap } from './InteractiveMap';
import { ResilientImage } from './ResilientImage';

interface ExhibitionMainProps {
  activeTab: ExhibitionTabId;
  onSelectTab: (tab: ExhibitionTabId) => void;
  onReplayPrologue: () => void;
  onOpenTicketMachine: () => void;
}

export function ExhibitionMain({
  activeTab,
  onSelectTab,
  onReplayPrologue,
  onOpenTicketMachine,
}: ExhibitionMainProps) {
  const [, setSelectedStopId] = useState<string>('shengxing');
  const [expandedPlateId, setExpandedPlateId] = useState<string>(
    ARCHIVE_PLATES[0]?.id ?? ''
  );
  const [archiveQuery, setArchiveQuery] = useState<string>('');
  const [expandedLinkId, setExpandedLinkId] = useState<string>('link-01');

  const filteredPlates = useMemo(() => {
    const trimmed = archiveQuery.trim().toLowerCase();
    const indexed = ARCHIVE_PLATES.map((plate, index) => ({ plate, index }));
    if (!trimmed) return indexed;
    const keywords = trimmed.split(/\s+/).filter(Boolean);
    return indexed.filter(({ plate }) => {
      const searchableText = [
        plate.title,
        plate.story,
        plate.walkingTip,
        plate.source,
      ]
        .join(' ')
        .toLowerCase();
      return keywords.every((kw) => searchableText.includes(kw));
    });
  }, [archiveQuery]);

  const navigateTab = (tab: ExhibitionTabId) => {
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`bg-[#FCFAF2] text-[#0C0C0C] pt-16 flex flex-col animate-stage-fade-in ${
        activeTab === 'explore' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Main Content Area */}
      <main
        className={`flex-1 ${
          activeTab === 'explore' ? 'h-[calc(100dvh-64px)] overflow-hidden' : ''
        }`}
      >
        {/* ================= TAB 1: 探索舊山線（全螢幕極簡沉浸式地圖） ================= */}
        {activeTab === 'explore' && (
          <div
            key="tab-explore"
            className="w-full h-full overflow-hidden animate-page-enter"
          >
            <InteractiveMap onSelectStation={(stationId) => setSelectedStopId(stationId)} />
          </div>
        )}

        {/* ================= TAB 2: 沿線圖鑑（11 項地圖同源手風琴折疊列表＋關鍵字搜尋） ================= */}
        {activeTab === 'archive' && (
          <div
            key="tab-archive"
            className="animate-page-enter max-w-[1040px] mx-auto px-5 sm:px-8 py-12 lg:py-16"
          >
            <header className="pb-8 border-b border-[#0C0C0C]/15">
              <p className="text-xs tracking-[0.2em] text-[#F05E1C]">02. 沿線圖鑑</p>
              <h1 className="mt-2 text-3xl sm:text-4xl tracking-[0.14em] font-normal text-[#0C0C0C]">
                舊山線沿線物件檔案
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-[1.8] text-[#0C0C0C]/70 max-w-2xl">
                收錄「探索舊山線」地圖中的 11 個核心景點與鐵道設施。點擊任一項目即可向下展開大圖、小故事、散步提示與參考資料來源。
              </p>

              {/* 全文關鍵字搜尋欄 */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-xl">
                  <Search
                    className="w-4 h-4 text-[#0C0C0C]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={archiveQuery}
                    onChange={(e) => setArchiveQuery(e.target.value)}
                    placeholder="搜尋標題或任何關鍵字（如：勝興、402、路牌、隧道、樟腦…）"
                    aria-label="搜尋沿線圖鑑內容"
                    className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-[#FCFAF2] border border-[#0C0C0C]/20 focus:border-[#F05E1C] focus:outline-none text-sm text-[#0C0C0C] placeholder:text-[#0C0C0C]/40 transition-colors"
                  />
                  {archiveQuery && (
                    <button
                      type="button"
                      onClick={() => setArchiveQuery('')}
                      aria-label="清除搜尋關鍵字"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-[#0C0C0C]/50 hover:text-[#F05E1C] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <p className="text-xs font-mono tabular-nums tracking-[0.08em] text-[#0C0C0C]/55">
                  {archiveQuery.trim()
                    ? `找到 ${filteredPlates.length} / ${ARCHIVE_PLATES.length} 筆符合項目`
                    : `共 ${ARCHIVE_PLATES.length} 筆沿線圖鑑`}
                </p>
              </div>
            </header>

            {/* Accordion List（左小圖＋中編號標題＋流暢下拉展開動畫） */}
            <div className="mt-6 border-t border-[#0C0C0C]/15">
              {filteredPlates.length === 0 ? (
                <div className="py-16 text-center border-b border-[#0C0C0C]/15">
                  <p className="text-base tracking-[0.1em] text-[#0C0C0C]/75">
                    找不到與「{archiveQuery.trim()}」相符的圖鑑內容
                  </p>
                  <p className="mt-2 text-xs text-[#0C0C0C]/50">
                    試試看其他車站名稱、鐵道設施或關鍵字
                  </p>
                  <button
                    type="button"
                    onClick={() => setArchiveQuery('')}
                    className="mt-5 min-h-[40px] px-5 py-2 border border-[#0C0C0C]/25 text-xs tracking-[0.14em] text-[#0C0C0C] hover:border-[#F05E1C] hover:text-[#F05E1C] transition-colors cursor-pointer"
                  >
                    顯示全部 11 個項目
                  </button>
                </div>
              ) : (
                filteredPlates.map(({ plate, index }) => {
                  const isExpanded = expandedPlateId === plate.id;
                  const orderLabel = String(index + 1).padStart(2, '0');
                  return (
                    <article
                      key={plate.id}
                      className="border-b border-[#0C0C0C]/15 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedPlateId(isExpanded ? '' : plate.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`archive-panel-${plate.id}`}
                        className={`w-full text-left py-4 px-3 -mx-3 flex items-center justify-between gap-4 transition-colors duration-300 cursor-pointer ${
                          isExpanded ? 'bg-[#FFBA84]/20' : 'hover:bg-[#FFBA84]/10'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* 最左側：小圖預留框（日後更新小圖直接替換圖片路徑即可） */}
                          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-md overflow-hidden border border-[#0C0C0C]/15 bg-[#0C0C0C]/5 shrink-0">
                            <ResilientImage
                              src={plate.thumbnail || plate.image}
                              alt={plate.title}
                              className="w-full h-full object-cover"
                              fallbackTitle={orderLabel}
                              fallbackSubtitle=""
                            />
                          </div>

                          {/* 中間：編號與名稱 */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#F05E1C]">
                              <span>{orderLabel}</span>
                            </div>
                            <h2 className="mt-0.5 text-lg sm:text-xl tracking-[0.1em] font-normal text-[#0C0C0C] truncate">
                              {plate.title}
                            </h2>
                          </div>
                        </div>

                        {/* 最右側：下拉展開箭頭 */}
                        <div className="inline-flex items-center gap-2 text-xs tracking-[0.14em] text-[#0C0C0C]/65 shrink-0">
                          <span className="hidden sm:inline">
                            {isExpanded ? '收合內容' : '展開檔案'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              isExpanded ? 'rotate-180 text-[#F05E1C]' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                      </button>

                      {/* 展開／收合動畫容器（CSS Grid 高度平順展開 + 淡入微移） */}
                      <div
                        id={`archive-panel-${plate.id}`}
                        aria-hidden={!isExpanded}
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isExpanded
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={`pt-5 pb-8 px-1 sm:px-3 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              isExpanded ? 'translate-y-0' : '-translate-y-3'
                            }`}
                          >
                            {/* 1. 大圖 */}
                            <div className="md:col-span-5">
                              <div className="aspect-[4/3] w-full overflow-hidden border border-[#0C0C0C]/15 bg-[#1C1A18]">
                                <ResilientImage
                                  src={plate.image}
                                  alt={plate.imageAlt || plate.title}
                                  className="w-full h-full object-cover"
                                  fallbackTitle={plate.title}
                                  fallbackSubtitle={`圖鑑 ${orderLabel}`}
                                />
                              </div>
                            </div>

                            {/* 2. 小故事、3. 散步提示、4. 參考資料來源 */}
                            <div className="md:col-span-7 flex flex-col justify-between gap-5">
                              {/* 小故事 */}
                              <div>
                                <p className="text-xs font-semibold tracking-[0.16em] text-[#F05E1C]">
                                  小故事
                                </p>
                                <p className="mt-2 text-[15px] leading-[1.9] text-[#0C0C0C]/85 whitespace-pre-line">
                                  {plate.story}
                                </p>
                              </div>

                              {/* 散步提示 */}
                              {plate.walkingTip && (
                                <div className="p-4 bg-[#FFBA84]/15 border-l-3 border-[#F05E1C]">
                                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#F05E1C]">
                                    <Footprints className="w-4 h-4" aria-hidden="true" />
                                    <span>散步提示</span>
                                  </div>
                                  <p className="mt-2 text-xs sm:text-sm leading-[1.8] text-[#0C0C0C]/85 whitespace-pre-line">
                                    {plate.walkingTip}
                                  </p>
                                </div>
                              )}

                              {/* 參考資料來源 */}
                              {plate.source && (
                                <div className="pt-4 border-t border-[#0C0C0C]/15 flex items-start gap-2 text-xs text-[#0C0C0C]/65">
                                  <BookOpen
                                    className="w-3.5 h-3.5 text-[#F05E1C] shrink-0 mt-0.5"
                                    aria-hidden="true"
                                  />
                                  <p className="leading-relaxed">
                                    <span className="text-[#0C0C0C]/85 font-medium">
                                      參考資料來源：
                                    </span>
                                    {plate.source}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: 關於本展 ================= */}
        {activeTab === 'about' && (
          <div key="tab-about" className="animate-page-enter max-w-[1240px] mx-auto px-5 sm:px-8 py-12 lg:py-16">
            <header className="pb-8 border-b border-[#0C0C0C]/15">
              <p className="text-xs tracking-[0.2em] text-[#F05E1C]">03. 關於本展</p>
              <h1 className="mt-2 text-3xl sm:text-4xl tracking-[0.14em] font-normal text-[#0C0C0C] max-w-2xl [text-wrap:balance]">
                當末班列車駛離勝興，記憶仍停留在 21:10
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs tracking-[0.14em] text-[#0C0C0C]/60">
                <span>舊山線地方主題線上策展</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">2026.12.15</span>
              </div>
            </header>

            {/* Asymmetric 70/30 Editorial Essay Layout */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Curatorial Essay */}
              <div className="lg:col-span-7 space-y-6 text-base leading-[1.9] text-[#0C0C0C]/85 max-w-2xl">
                <p>
                  1998 年 9 月 23 日晚間 21:10，隨著山線雙軌新線完工通車，臺鐵莒光號 167 次南下列車成為最後一班停靠勝興車站的定期列車。自 1908 年縱貫線全線貫通以來，舊山線穿越苗栗與台中交界的崇山峻嶺，承載了九十年間無數旅人、林業物產與地方聚落的悲歡離合。
                </p>

                {/* Editorial Pull Quote — Top/Bottom hairline dividers */}
                <blockquote className="my-8 py-6 border-t border-b border-[#0C0C0C]/20 text-xl sm:text-2xl leading-[1.65] tracking-[0.1em] text-[#0C0C0C]">
                  「鐵道停駛之後，月台並未真正沉寂；每一張車票、每一道磚拱與夜風，都在替這座山城保存時間的刻度。」
                </blockquote>

                <p>
                  《167次-勝興》以線上互動策展為載體，試圖將歷史文獻轉化為具身化的時間旅程：觀展者從漆黑夜色中的直式序幕啟程，走近記憶裡的台鐵舊式自動售票機，親手點選那張僅通往 1998 年秋夜的「台北 → 勝興」莒光號全票，隨著車票緩緩吐出，正式踏入舊山線的沿線地景與文化檔案。
                </p>
              </div>

              {/* Right Margin Metadata & Credits Rail */}
              <aside className="lg:col-span-5 space-y-8">
                {/* Curatorial Team Credits */}
                <div className="border-t border-[#0C0C0C] pt-5">
                  <h2 className="text-sm tracking-[0.2em] text-[#F05E1C]">策展製作團隊</h2>
                  <dl className="mt-5 divide-y divide-[#0C0C0C]/12">
                    {CURATORIAL_CREDITS.map((credit) => (
                      <div key={credit.role} className="py-4 first:pt-0">
                        <dt className="text-xs tracking-[0.16em] text-[#0C0C0C]/55">
                          {credit.role}
                        </dt>
                        <dd className="mt-1.5 text-xl tracking-[0.14em] text-[#0C0C0C]">
                          {credit.members.join('、')}
                        </dd>
                        <dd className="mt-1 text-xs leading-relaxed text-[#0C0C0C]/65">
                          {credit.note}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ================= TAB 4: 勝興連結 ================= */}
        {activeTab === 'links' && (
          <div key="tab-links" className="animate-page-enter max-w-[1240px] mx-auto px-5 sm:px-8 py-12 lg:py-16">
            <header className="pb-8 border-b border-[#0C0C0C]/15">
              <p className="text-xs tracking-[0.2em] text-[#F05E1C]">04. 勝興連結</p>
              <h1 className="mt-2 text-3xl sm:text-4xl tracking-[0.14em] font-normal text-[#0C0C0C]">
                地方聚落、古蹟走讀與鐵道延伸資源
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-[1.8] text-[#0C0C0C]/70 max-w-2xl">
                從線上策展走回苗栗山城現場。以下整理勝興車站周邊聚落、舊山線重要鐵道遺構與鐵道文史保存資訊，作為實地踏查與延伸閱讀的起點。
              </p>
            </header>

            <div className="mt-8 border-t border-[#0C0C0C]/15">
              {CULTURAL_LINKS.map((item, idx) => {
                const isExpanded = expandedLinkId === item.id;
                return (
                  <div key={item.id} className="border-b border-[#0C0C0C]/15">
                    <button
                      type="button"
                      onClick={() => setExpandedLinkId(isExpanded ? '' : item.id)}
                      aria-expanded={isExpanded}
                      className="w-full text-left py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFBA84]/12 px-3 -mx-3 transition-colors cursor-pointer"
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="text-xs font-mono tabular-nums text-[#F05E1C]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#0C0C0C]/55">
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.coordinates}</span>
                          </div>
                          <h2 className="mt-1 text-xl tracking-[0.1em] font-normal text-[#0C0C0C]">
                            {item.title}
                          </h2>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 text-xs tracking-[0.14em] text-[#0C0C0C]/65 shrink-0 pl-8 sm:pl-0">
                        <span>{isExpanded ? '收合註記' : '展開導覽'}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180 text-[#F05E1C]' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="animate-notice-enter pb-7 pl-0 sm:pl-10 pr-2 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 space-y-3">
                          <p className="text-[15px] leading-[1.85] text-[#0C0C0C]/80">
                            {item.description}
                          </p>
                          <p className="text-sm leading-[1.75] text-[#0B346E]">
                            策展走讀筆記：{item.fieldNote}
                          </p>
                        </div>
                        <div className="lg:col-span-5 lg:border-l lg:border-[#0C0C0C]/12 lg:pl-6 flex flex-col justify-center gap-2 text-sm text-[#0C0C0C]/70">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[#F05E1C] mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{item.location}</span>
                          </div>
                          <p className="text-xs font-mono tabular-nums text-[#0C0C0C]/55 pl-6">
                            {item.coordinates}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ================= EXHIBITION FOOTER (With Full Credits & Copyright) ================= */}
      {activeTab !== 'explore' && (
        <footer className="bg-[#0C0C0C] text-[#FCFAF2] border-t border-[#FCFAF2]/10 mt-16">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#FCFAF2]/15">
              {/* Brand & Exhibition Statement */}
              <div className="md:col-span-3">
                <p className="text-xl tracking-[0.22em] text-[#FCFAF2]">
                  167次<span className="text-[#F05E1C]">-</span>勝興
                </p>
                <p className="mt-2 text-xs tracking-[0.16em] text-[#FFBA84]">
                  舊山線地方主題線上策展
                </p>
              </div>

              {/* Required Curatorial Team Credits */}
              <div className="md:col-span-5 space-y-2.5 text-sm">
                <p className="text-xs tracking-[0.2em] text-[#FFBA84]">製作與策展團隊</p>
                <p className="text-[#FCFAF2]/90 tracking-[0.08em]">
                  <span className="text-[#FCFAF2]/55 mr-2">指導老師</span>
                  涂卉 副教授
                </p>
                <p className="text-[#FCFAF2]/90 tracking-[0.08em] leading-relaxed">
                  <span className="text-[#FCFAF2]/55 mr-2">成員</span>
                  徐立威、陳主卉、陳宏倫、謝妮霓
                </p>
              </div>

              {/* Quick Navigation & Stage Replay */}
              <div className="md:col-span-4 flex flex-col items-start md:items-end justify-between gap-4">
                <div className="flex flex-wrap md:justify-end gap-x-5 gap-y-2 text-xs tracking-[0.14em] text-[#FCFAF2]/75">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTab(item.id)}
                      className={`hover:text-[#FFBA84] transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === item.id ? 'text-[#FFBA84]' : ''
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs tracking-[0.12em] text-[#FCFAF2]/60">
                  <button
                    type="button"
                    onClick={onReplayPrologue}
                    className="inline-flex items-center gap-1 hover:text-[#FFBA84] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>重溫序幕</span>
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={onOpenTicketMachine}
                    className="inline-flex items-center gap-1 hover:text-[#FFBA84] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>返回售票機</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Copyright Bottom Line */}
            <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs tracking-[0.1em] text-[#FCFAF2]/50">
              <p>© 《167次-勝興》舊山線地方主題線上策展團隊</p>
              <p className="font-mono tabular-nums whitespace-nowrap">1998.09.23 21:10 · 402.326M</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}