import {label, matchesSearch} from './localize';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Pause, Play, X, Check, ChevronDown, Search, SlidersHorizontal, Ruler, SwatchBook, Box, MessagesSquare, Truck, Wrench, ShieldCheck, Building2, Heart, Instagram } from 'lucide-react';
import './home.css';

const asset = (name) => `/assets/${label(name)}`;

export const categories = [
  { name: 'Sideboards', key: 'sideboard', image: 'sideboard-desktop-v2.webp' },
  { name: 'Shelves', key: 'regal', image: 'regal-desktop-v2.webp' },
  { name: 'Chests of drawers', key: 'kommoden', image: 'kommoden-desktop-v2.webp' },
  { name: 'Lowboards', key: 'lowboard', image: 'lowboard-desktop-v2.webp' },
  { name: 'Wardrobes', key: 'garderoben', image: 'garderoben-desktop-v2.webp' },
  { name: 'Tables', key: 'table', image: 'table-desktop-v2.webp' },
  { name: 'Reception desks', key: 'reception', image: 'reception-desktop-v2.webp' },
  { name: 'Pedestals', key: 'container', image: 'container-desktop-v2.webp' },
];

const reasons = [
  { title: '생활에 맞춰 바꾸는 모듈', image: 'why-flexcube-1.webp', text: '지금 필요한 가구가 내일도 쓸모 있도록. 모듈을 더하고 구성을 바꾸며 내 생활에 맞춰 쓰세요.' },
  { title: '오래도록 변함없는 가치', image: 'why-flexcube-2_fbb58f41-59e8-4938-aa79-fa6802bc0f30.webp', text: '시간이 지나도 멋스러운 디자인과 탄탄한 품질. 스위스 품질 기준에 따라 만들고, 필요한 부품만 따로 교체할 수 있어요.' },
  { title: '취향을 담는 200여 가지 색상', image: 'why-flexcube-3.webp', text: '200여 가지 색상과 다양한 프레임 마감으로 나만의 조합을 완성하세요. 3D 화면에서 바로 확인할 수 있어요.' },
  { title: '오래 쓰도록, 더 튼튼하게', image: 'why-flexcube-4_2.webp', text: '정교한 제작과 좋은 소재, 교체 부품 공급까지. 다음 세대에도 물려줄 수 있는 가구를 만듭니다.' },
];

const reviewItems = [
  { name: 'Christian Jungk', source: 'Google', title: '가구도 만족스럽고 조립도 깔끔했어요.', text: '능숙하고 친절하게 응대해 주셨어요.', image: 'Kundenbild_Sideboard_dunkelgrau_a_la_USM.webp' },
  { name: 'Dirk G.', source: 'Google', title: '', text: '주문 전 상담부터 친절하고 도움이 됐어요. 먼 거리인데도 약속한 시간에 정확히 배송해 주셨습니다.', image: 'Buro20210417_060328_002.webp' },
  { name: 'Jörg Engel', source: 'Google', title: 'USM과 Flexcube 중 고민이라면', text: '기존에 USM을 쓰고 있었는데, 이번에는 Flexcube를 선택했어요.', image: 'Regal_mit_Pflanzen.webp' },
  { name: 'Monika F.', source: 'TrustedShop', title: '주변에도 추천하고 싶어요', text: '질리지 않는 디자인에 품질도 좋아요. 기꺼이 추천합니다.', image: 'Kundenbild_Wohnen_1.webp' },
  { name: 'Roman A.', source: 'TrustedShop', title: '딱 맞아요!', text: '공간에 딱 맞고 부품도 빠짐없이 왔어요. 조립에 시간이 좀 걸리지만 재미있었어요.', image: 'Glasregal_1_626KB.webp' },
  { name: 'Nico Krahforst', source: 'Trustpilot', title: '고객 서비스에 만점을 주고 싶어요', text: '제품 품질도 훌륭하지만, 특히 고객 서비스가 인상적이었어요!', image: 'Unser_Buro_1764_KB.webp' },
];

const services = [
  [Ruler, '내 공간에 맞는 구성', '온라인에서 직접 만드는 나만의 가구'],
  [SwatchBook, '다양한 RAL 색상', '200여 가지 색상'],
  [Box, '무료 3D 공간 설계', '전문가와 함께 완성하는 공간'],
  [MessagesSquare, '맞춤 상담', '프로젝트마다 전담 담당자 배정'],
  [Building2, '공간 전체를 한 번에', '사무실·병원·상업 공간까지'],
  [ShieldCheck, '스위스 제조사', '합리적인 가격에 만나는 품질'],
  [Wrench, '전문 조립 서비스', '숙련된 Flexcube 팀의 현장 조립'],
  [Truck, '빠른 배송', '원하는 장소까지 편리하게'],
];

function ArrowButton({ children, onClick, light = false, outline = false, className = '', ...props }) {
  return <button onClick={onClick} className={`fc-pill ${light ? 'fc-pill-light' : ''} ${outline ? 'fc-pill-outline' : ''} ${className}`} {...props}><span>{children}</span><ArrowRight size={20} strokeWidth={1.5} /></button>;
}

function Modal({ title, children, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('button, input, a, select')?.focus();
    const close = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll('button, input, a[href], select, [tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', close);
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = old; previousFocus?.focus?.(); };
  }, [onClose]);
  return <div className="fc-modal-backdrop" onClick={onClose}><section ref={dialogRef} className="fc-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}><button className="fc-modal-close" aria-label="닫기" onClick={onClose}><X size={24} /></button><h2>{title}</h2>{children}</section></div>;
}

export function Footer({ onConfigure = () => {}, onBrowse = () => {}, onNavigate }) {
  const [dialog, setDialog] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const infoContent = {
    '쇼룸': 'Experience Flexcube in person in Hünenberg, Switzerland. Contact our team to arrange a personal showroom visit.',
    '배송·조립 안내 및 영상': 'Furniture is delivered directly to your premises. Our experienced team can also take care of professional assembly. Contact us to discuss your project.',
    '기업 고객 혜택': 'Discover individual furniture solutions for your business. The 25% SME discount is automatically applied to eligible configurations.',
    '오피스 공간 설계': 'Our interior design team helps you plan your office, practice, or commercial space. Personal consultation and 3D planning are free and non-binding.',
    '브랜드 소개': 'Flexcube is a modular furniture system from Switzerland. Timeless design, precise craftsmanship, and personal service are at the heart of everything we do.',
    '자주 묻는 질문': 'Every Flexcube can be adapted, extended, and reconfigured. Choose your dimensions, colors, panels, and accessories in our 3D furniture configurator.',
  };
  const footerPaths = {
    '기업 고객 혜택': '/en/pages/kmu-sonderkonditionen',
    '배송·조립 안내 및 영상': '/en/pages/lieferung-montage',
    'Blog': '/en/blogs/artikel', '할부 안내': '/en/pages/leasing',
    '오피스 공간 설계': '/en/pages/bueroplanung', '쇼룸': '/en/pages/showrooms',
    '브랜드 소개': '/en/pages/ueberuns', '문의하기': '/en/pages/kontakt',
    '반품 및 주문 취소': '/en/pages/rueckgaberichtlinien-widerruf',
    '자주 묻는 질문': '/en/pages/faq', '개인정보 처리방침': '/en/pages/datenschutz',
    '사업자 정보': '/en/pages/impressum',
  };
  const info = (name) => { if (onNavigate && footerPaths[name]) onNavigate(footerPaths[name]); else setDialog(name); };
  return <>
    <footer className="flex-footer">
      <div className="fc-footer-grid">
        <div className="fc-footer-brand"><img src={asset('logo-white.svg')} alt="Flexcube" /><button className="fc-voucher" onClick={() => { setSubscribed(false); info('CHF 50 쿠폰 받기'); }}>CHF 50 쿠폰 받기</button><p>Flexcube 제조사 공식 사이트</p><div className="fc-socials"><a href="https://www.instagram.com/flexcube/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={21}/></a><a href="https://ch.pinterest.com/dadaserveflexcube/" target="_blank" rel="noreferrer" aria-label="Pinterest">Ⓟ</a></div></div>
        <div><h4>서비스</h4>{['기업 고객 혜택', '배송·조립 안내 및 영상', 'Blog', '할부 안내', '오피스 공간 설계'].map((x) => <button key={x} onClick={() => info(x)}>{x}</button>)}</div>
        <div><h4>제품</h4><button onClick={() => onBrowse('All')}>모듈 가구</button><button onClick={() => onBrowse('Tables')}>책상</button><button onClick={() => onConfigure()}>나만의 가구 만들기</button><h4 className="fc-footer-subheading">쇼룸</h4><p>스위스와 독일 쇼룸에서 Flexcube를 직접 만나보세요.</p><button className="fc-underlined" onClick={() => info('쇼룸')}>쇼룸 둘러보기 <ArrowRight size={15}/></button></div>
        <div><h4>브랜드</h4>{['브랜드 소개', '문의하기', '반품 및 주문 취소', '자주 묻는 질문', '개인정보 처리방침', '사업자 정보'].map((x) => <button key={x} onClick={() => info(x)}>{x}</button>)}</div>
        <div><h4>고객센터</h4><p>월–금 운영</p><p>Holzhäusernstrasse 3,<br/>6331 Hünenberg</p><a href="mailto:office@flexcube.ch">office@flexcube.ch</a><a href="tel:+41417844020">+41 41 784 40 20</a><button className="fc-underlined" onClick={() => info('문의하기')}>채팅 상담 <ArrowRight size={15}/></button></div>
      </div>
      <div className="fc-footer-bottom"><p>© 2026 Flexcube.</p><div className="fc-footer-locales"><label>언어<select aria-label="언어 선택" defaultValue="한국어"><option>한국어</option></select></label><label>국가/지역<select aria-label="국가 선택" defaultValue="스위스 (CHF)"><option>스위스 (CHF)</option></select></label></div><div className="fc-payments"><span>AMEX</span><span>Pay</span><span>G Pay</span><span>Klarna.</span><span className="fc-mastercard">●●</span><span>TWINT</span><strong>VISA</strong></div></div>
    </footer>
    {dialog && <Modal title={dialog} onClose={() => setDialog(null)}>{dialog === 'CHF 50 쿠폰 받기' ? subscribed ? <div className="fc-form-success"><Check size={36}/><h3>미리보기가 끝났어요</h3><p>체험용 화면으로, 이메일을 발송하거나 주소를 저장하지 않았습니다. 실제 쿠폰은 Flexcube에 문의해 주세요.</p></div> : <form className="fc-voucher-form" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}><p>쿠폰 신청 미리보기입니다. 이메일 발송이나 쿠폰 발급은 진행되지 않습니다.</p><label>이메일<input required type="email" placeholder="이메일 주소를 입력해 주세요" /></label><ArrowButton type="submit">쿠폰 신청 미리보기</ArrowButton></form> : <><p>{infoContent[dialog] || 'Flexcube 가구가 궁금하신가요? 공간과 용도에 맞는 가구를 함께 찾아드릴게요.'}</p><p><a href="mailto:office@flexcube.ch">office@flexcube.ch</a><br/><a href="tel:+41417844020">+41 41 784 40 20</a></p><ArrowButton onClick={() => { setDialog(null); onConfigure(); }}>나만의 가구 만들기</ArrowButton></>}</Modal>}
  </>;
}

export default function Home({ onConfigure = () => {}, onBrowse = () => {}, onNavigate }) {
  const [activeReason, setActiveReason] = useState(0);
  const [reviewSource, setReviewSource] = useState('전체 후기');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [playing, setPlaying] = useState(true);
  const video = useRef(null);
  const community = useRef(null);
  const [contact, setContact] = useState(false);
  const reviews = reviewItems.filter((x) => reviewSource === '전체 후기' || reviewSource === x.source).slice(0, showAllReviews ? 6 : 3);
  const toggleVideo = () => { if (video.current) { if (playing) video.current.pause(); else video.current.play().catch(() => {}); } setPlaying(!playing); };
  return <main className="flex-home">
    <section className="home-hero">
      <picture className="fc-hero-poster"><source media="(max-width: 767px)" srcSet={asset('hero-mobile.jpg')}/><img src={asset('hero-desktop.jpg')} alt="거실에 놓인 Flexcube 모듈 사이드보드" /></picture>
      <video ref={video} className="fc-hero-video" autoPlay muted playsInline loop preload="metadata" poster={asset('hero-desktop.jpg')}><source src={asset('hero-mobile.mp4')} type="video/mp4" media="(max-width: 767px)"/><source src={asset('hero-desktop.mp4')} type="video/mp4"/></video>
      <div className="fc-hero-shade" />
      <div className="fc-hero-content"><p className="fc-eyebrow">스위스 기업이 선택한 모듈 가구</p><h1>내 공간에 맞추는 가구, Flexcube</h1><p className="fc-hero-tagline">좋은 디자인을 합리적인 가격으로</p><div className="fc-hero-buttons"><ArrowButton outline light onClick={() => onBrowse('All')}>베스트셀러 둘러보기</ArrowButton><ArrowButton light onClick={() => onConfigure()}>나만의 가구 만들기</ArrowButton></div></div>
      <button className="fc-video-toggle" aria-label={playing ? '배경 영상 일시정지' : '배경 영상 재생'} onClick={toggleVideo}>{playing ? <Pause size={19} fill="currentColor"/> : <Play size={19} fill="currentColor"/>}</button>
    </section>

    <section className="fc-press"><div className="fc-press-name">Handelsblatt</div><blockquote>“정교한 설계와 세련된 디자인, 일상에서 빛나는 실용성.”</blockquote><p className="fc-eyebrow">Handelsblatt, 2026</p><div className="fc-press-logos"><span className="fc-eyebrow">미디어 속 Flexcube</span><img src={asset('logo-02.webp')} alt="RTL"/><img src={asset('focus-logo-no-bg.png')} alt="FOCUS"/><img src={asset('logo-04.webp')} alt="ntv"/></div></section>

    <section className="fc-why"><div className="fc-section-heading"><div><p>시간이 지나도 함께하는 가구</p><h2>Flexcube를 선택하는 이유 🩶</h2></div><ArrowButton outline onClick={() => onConfigure()}>내 취향대로 만들기</ArrowButton></div><div className="fc-reason-panels">{reasons.map((reason, index) => <button key={reason.title} className={`fc-reason-panel ${activeReason === index ? 'is-active' : ''}`} onMouseEnter={() => setActiveReason(index)} onFocus={() => setActiveReason(index)} onClick={() => setActiveReason(index)} aria-expanded={activeReason === index}><img src={asset(reason.image)} alt={reason.title} loading="lazy"/><span className="fc-reason-shade"/><span className="fc-reason-number" style={{top: `${[28, 45, 31, 56][index]}%`}}>{index + 1}</span><span className="fc-reason-content"><strong>{reason.title}</strong><span>{reason.text}</span></span><span className="fc-reason-label">{reason.title}</span></button>)}</div></section>

    <section className="fc-service-banner"><video autoPlay muted playsInline loop preload="none" poster={asset('service-video-poster.jpg')}><source src={asset('service-video.mp4')} type="video/mp4"/></video><div className="fc-banner-shade"/><div><h2>탄탄한 품질.<br/>세심한 서비스.</h2><p>사무실부터 병원, 법률 사무소까지. Flexcube는 스위스 품질 기준과 세심한 서비스로 일하기 좋은 공간을 만듭니다. 공간 전문가에게 부담 없이 무료로 상담받아 보세요.</p><ArrowButton outline light onClick={() => setContact(true)}>맞춤 상담받기</ArrowButton></div></section>

    <section className="fc-range"><div className="fc-section-heading"><div><p>어떤 가구를 찾으세요?</p><h2>자유롭게 조합하고, 오래 쓰는 <em>모듈 가구</em></h2></div></div><div className="fc-category-grid">{categories.map((category) => <button key={label(category.name)} className={`fc-category fc-category-${category.key}`} onClick={() => onBrowse(category.name)}><img src={asset(category.image)} alt={label(category.name)} loading="lazy"/><img className="fc-category-hover" src={asset(category.image.replace('-v2', '-hover-v2'))} alt="" loading="lazy"/><span>{label(category.name)}<ArrowRight size={22}/></span></button>)}</div></section>

    <section className="fc-reviews"><div className="fc-review-intro"><div><h2><span>50,000+</span><br/>스위스 기업의 선택, Flexcube</h2></div><div className="fc-review-score"><div><strong>4.9/5</strong><span className="fc-stars">★★★★★</span></div><p>독일과 스위스 고객의 실제 후기에서 평균 4.9점을 받았습니다.</p></div></div><div className="fc-review-filters" role="tablist" aria-label="후기 출처별 보기">{['전체 후기', 'Google', 'TrustedShop', 'Trustpilot'].map((source) => <button key={source} role="tab" aria-selected={source === reviewSource} onClick={() => { setReviewSource(source); setShowAllReviews(false); }}>{source === 'Google' && <b className="fc-google">G</b>}{source === 'TrustedShop' && <b className="fc-trusted">e</b>}{source === 'Trustpilot' && <b className="fc-trustpilot">★</b>}{source}</button>)}</div><div className="fc-review-grid">{reviews.map((review) => <article className="fc-review-card" key={review.name}><img className="fc-review-image" src={asset(review.image)} alt={`${review.name}님의 Flexcube 공간`} loading="lazy"/><div className="fc-review-body"><div className="fc-review-author"><span className="fc-review-avatar">{review.name[0]}</span><div><strong>{review.name} <Check size={14}/></strong><small>{review.source} · 구매 인증 후기</small></div></div><span className="fc-stars">★★★★★</span>{review.title && <h3>{review.title}</h3>}<p>{review.text}</p></div></article>)}</div><button className="fc-read-more" onClick={() => setShowAllReviews(!showAllReviews)}>{showAllReviews ? '접기' : '더 보기'}<ChevronDown size={19} style={{transform: showAllReviews ? 'rotate(180deg)' : 'none'}}/></button></section>

    <section className="fc-community"><div className="fc-section-heading"><div><p>실제 공간에서 만나는 Flexcube</p><h2>고객들의 공간을 둘러보세요</h2><p className="fc-section-description">저마다의 취향으로 꾸민 집과 업무 공간.<br/>다양한 공간에 어우러진 Flexcube를 만나보세요.</p></div><div className="fc-carousel-controls"><button aria-label="이전 공간 보기" onClick={() => community.current?.scrollBy({left: -450, behavior: 'smooth'})}><ArrowLeft/></button><button aria-label="다음 공간 보기" onClick={() => community.current?.scrollBy({left: 450, behavior: 'smooth'})}><ArrowRight/></button></div></div><div className="fc-community-track" ref={community}>{['community-video-poster.jpg','flexcube_x_michaelepiney_cover.webp','flexcube_x_interieurlittoz.webp','flexcube_x__neufoctobre.webp','flexcube_x_rbc_nimes.webp','flexcube_instagram_2.webp'].map((image, index) => <button className="fc-community-card" key={image} onClick={() => onConfigure({type: index % 2 ? 'shelf' : 'sideboard'})}><img src={asset(image)} alt={`고객 공간 사례 ${index + 1}`} loading="lazy"/><span>이렇게 꾸며보기 <ArrowRight size={19}/></span></button>)}</div></section>

    <section className="fc-services"><div className="fc-section-heading"><div><p>Flexcube의 약속</p><h2>공간 설계부터 조립까지 한 번에</h2><p className="fc-section-description">처음부터 마무리까지 함께합니다</p></div></div><div className="fc-services-grid">{services.map(([Icon, title, text]) => <div key={title}><Icon size={34} strokeWidth={1.25}/><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></section>
    <section className="fc-contact"><h2>궁금한 점은 편하게 물어보세요</h2><p>공간과 취향에 맞춰 부담 없이 상담해 드립니다.</p><ArrowButton onClick={() => setContact(true)}>문의하기</ArrowButton></section>
    <Footer onConfigure={onConfigure} onBrowse={onBrowse} onNavigate={onNavigate}/>
    {contact && <Modal title="무엇이든 물어보세요" onClose={() => setContact(false)}><p>계획 중인 공간을 알려주세요. 부담 없이 상담해 드릴게요.</p><div className="fc-contact-details"><a href="mailto:office@flexcube.ch">office@flexcube.ch <ArrowRight size={18}/></a><a href="tel:+41417844020">+41 41 784 40 20 <ArrowRight size={18}/></a></div><p>월–금 운영<br/>Holzhäusernstrasse 3, 6331 Hünenberg</p></Modal>}
  </main>;
}

const fallbackProducts = [
  { title: 'Sideboard in classic white', category: 'Sideboards', image: 'sideboard-desktop-v2.webp', type: 'sideboard', columns: 3, rows: 2 },
  { title: 'Open shelving in black', category: 'Shelves', image: 'regal-desktop-v2.webp', type: 'shelf', columns: 3, rows: 4 },
  { title: 'Chest of drawers in petrol', category: 'Chests of drawers', image: 'KommodeinPetrolmit4Schubladen2Klappen-5_b1d282bd-866a-427d-b452-e0f0ed949b69.webp', type: 'sideboard', columns: 2, rows: 3 },
  { title: 'Lowboard in classic white', category: 'Lowboards', image: 'lowboard-desktop-v2.webp', type: 'lowboard', columns: 4, rows: 1 },
  { title: 'Wardrobe in classic black', category: 'Wardrobes', image: 'GarderobeinklassischemSchwarz-4.webp', type: 'shelf', columns: 2, rows: 4 },
  { title: 'Your workspace, your design', category: 'Tables', image: 'table-desktop-v2.webp', type: 'table', columns: 3, rows: 2 },
  { title: 'A welcoming reception', category: 'Reception desks', image: 'reception-desktop-v2.webp', type: 'sideboard', columns: 4, rows: 3 },
  { title: 'Mobile pedestal in white', category: 'Pedestals', image: 'container-desktop-v2.webp', type: 'sideboard', columns: 1, rows: 2 },
  { title: 'Sideboard in olive green', category: 'Sideboards', image: 'SideboardinOlivgrunmit3Schubladen-Klappen-3.webp', type: 'sideboard', columns: 3, rows: 2 },
  { title: 'Glass display cabinet', category: 'Shelves', image: 'Vitrine_Glas_Black_Chrome_8971KB.webp', type: 'shelf', columns: 2, rows: 3 },
  { title: 'Modular shelf with plants', category: 'Shelves', image: 'Regal_mit_Pflanzen.webp', type: 'shelf', columns: 3, rows: 3 },
  { title: 'Mobile home office', category: 'Tables', image: 'Mobiles_Home_Office.webp', type: 'table', columns: 3, rows: 2 },
];

export function Catalog({ onConfigure = () => {}, onBrowse = () => {}, initialCategory = 'All', onProduct, onNavigate }) {
  const [category, setCategory] = useState(categories.some((x) => x.name === initialCategory) ? initialCategory : 'All');
  const [sort, setSort] = useState('추천순');
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState(fallbackProducts);
  const [favourites, setFavourites] = useState([]);
  const [selected, setSelected] = useState(null);
  useEffect(() => { if (categories.some((x) => x.name === initialCategory) || initialCategory === 'All') setCategory(initialCategory); }, [initialCategory]);
  useEffect(() => { fetch('/assets/catalog.json').then((r) => r.ok ? r.json() : null).then((data) => { const list = Array.isArray(data) ? data : data?.products; if (list?.length) setAllProducts(list.map((p) => ({...p, category: p.category || (/chest/i.test(p.title) ? 'Chests of drawers' : /lowboard/i.test(p.title) ? 'Lowboards' : /sideboard/i.test(p.title) ? 'Sideboards' : /shelf|shelving/i.test(p.title) ? 'Shelves' : 'Modular furniture')}))); }).catch(() => {}); }, []);
  const products = useMemo(() => {
    const source = category !== 'All' && !allProducts.some((item) => item.category === category) ? fallbackProducts : allProducts;
    const list = source.filter((item) => (category === 'All' || item.category === category) && matchesSearch(item.title,query));
    if (sort === '이름순') list.sort((a,b) => label(a.title).localeCompare(label(b.title),'ko-KR'));
    if (sort === '낮은 가격순') list.sort((a,b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === '높은 가격순') list.sort((a,b) => Number(b.price || 0) - Number(a.price || 0));
    return list;
  }, [allProducts, category, query, sort]);
  const productImage = (product) => product.image?.startsWith('http') || product.image?.startsWith('/') ? product.image : asset(product.image);
  return <main className="flex-catalog"><div className="fc-catalog-top"><p className="fc-breadcrumb"><button onClick={() => onBrowse('home')}>홈</button><span>/</span> {category === 'All' ? '베스트셀러 전체 보기' : label(category)}</p><h1>{category === 'All' ? '베스트셀러 전체 보기' : label(category)}</h1><div className="fc-catalog-rating"><span>★★★★★</span><strong>4.9</strong><span>고객들이 인정한 품질</span></div><div className="fc-catalog-categories">{['All', ...categories.map((x) => x.name)].map((name) => <button key={label(name)} className={name === category ? 'active' : ''} onClick={() => setCategory(name)}><img src={asset(categories.find((x) => x.name === name)?.image || 'sideboard-desktop-v2.webp')} alt=""/><span>{name === 'All' ? '베스트셀러 전체 보기' : label(name)}</span></button>)}</div></div><div className="fc-catalog-tools"><div><SlidersHorizontal size={19}/><span>필터</span><span className="fc-product-count">상품 {products.length}개</span></div><label className="fc-catalog-search"><Search size={18}/><input aria-label="가구 검색" placeholder="가구 검색" value={query} onChange={(e) => setQuery(e.target.value)}/></label><label className="fc-catalog-sort">정렬<select value={sort} onChange={(e) => setSort(e.target.value)}>{['추천순', '이름순', '낮은 가격순', '높은 가격순'].map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="fc-catalog-products">{products.map((product, index) => <article className="fc-product-card" key={product.id || product.title}><div className="fc-product-image"><button className="fc-product-main" onClick={() => onProduct ? onProduct(product) : setSelected(product)}><img src={productImage(product)} alt={label(product.title)} loading="lazy"/></button>{index < 3 && <span className="fc-bestseller-label">BEST</span>}<button className={`fc-favourite ${favourites.includes(product.title) ? 'saved' : ''}`} aria-label={`${favourites.includes(product.title) ? '관심 해제' : '관심 등록'} ${label(product.title)}`} aria-pressed={favourites.includes(product.title)} onClick={() => setFavourites((old) => old.includes(product.title) ? old.filter((x) => x !== product.title) : [...old, product.title])}><Heart size={21} fill={favourites.includes(product.title) ? 'currentColor' : 'none'}/></button><button className="fc-product-quick" onClick={() => onConfigure(product)}>내 취향대로 만들기 <ArrowRight size={17}/></button></div><div className="fc-product-info"><button onClick={() => onProduct ? onProduct(product) : setSelected(product)}>{label(product.title)}</button><p>{label(product.category || 'Modular furniture')}</p>{product.price ? <p className="fc-product-price">{product.salePrice && <del>CHF {Number(product.price).toLocaleString('en-CH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</del>}<span>CHF {Number(product.salePrice || product.price).toLocaleString('en-CH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p> : <p className="fc-product-price">직접 구성해 보세요</p>}<div className="fc-product-colors"><span style={{background:'#f7f5ed'}}/><span style={{background:'#252525'}}/><span style={{background:'#657064'}}/><span style={{background:'#9f4837'}}/><small>+200여 가지 색상</small></div></div></article>)}</div>{!products.length && <div className="fc-empty-products"><h2>검색 결과가 없어요</h2><p>다른 검색어를 입력하거나 베스트셀러를 둘러보세요.</p><ArrowButton onClick={() => {setQuery(''); setCategory('All');}}>전체 가구 보기</ArrowButton></div>}<section className="fc-catalog-cta"><h2>찾으시는 가구가 없나요?</h2><p>크기부터 색상까지, 원하는 모습으로 직접 만들어 보세요.</p><ArrowButton onClick={() => onConfigure()}>3D로 가구 만들기</ArrowButton></section><Footer onConfigure={onConfigure} onNavigate={onNavigate} onBrowse={(name) => { setCategory(name === 'All' ? 'All' : name); window.scrollTo({top:0, behavior:'smooth'}); }}/>{selected && <Modal title={label(selected.title)} onClose={() => setSelected(null)}><img className="fc-product-modal-image" src={productImage(selected)} alt={label(selected.title)}/><p>{label(selected.category || 'Modular furniture')} · Available in over 200 RAL colors</p>{selected.price && <h3>CHF {Number(selected.price).toLocaleString('en-CH',{minimumFractionDigits:2})}</h3>}<p>3D 화면에서 크기와 색상, 모듈 구성을 원하는 대로 바꿔 보세요.</p><ArrowButton onClick={() => {setSelected(null); onConfigure(selected);}}>이 가구로 시작하기</ArrowButton></Modal>}</main>;
}
