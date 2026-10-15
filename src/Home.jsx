import {label} from './localize';
import { lifestyleImages, communityScenes } from './homeLifestyle';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Pause, Play, X, Ruler, SwatchBook, Box, Heart } from 'lucide-react';
import './home.css';
import './home-lifestyle.css';
import './home-identity.css';

const asset = (name) => `/assets/${name}`;

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
  { title: '공간에 맞는 크기', image: 'why-flexcube-1.webp', text: '소파 옆의 낮은 수납장부터 벽을 채우는 선반까지. 너비·높이·깊이를 고르고 공간에 어울리는 비례를 확인하세요.' },
  { title: '물건에 맞는 수납', ...lifestyleImages.couple, text: '보여주고 싶은 책과 오브제는 오픈 선반에. 정리해 두고 싶은 물건은 도어와 서랍 안에. 한 가구 안에서 조합하세요.' },
  { title: '취향을 만드는 컬러', image: 'why-flexcube-3.webp', text: '패널 색상과 프레임 마감을 골라보세요. 한 가지 색으로 정돈하거나, 칸마다 다른 색을 더할 수 있습니다.' },
  { title: '만들면서 확인하는 3D', ...lifestyleImages.studio, text: '돌려 보고, 가까이 보고, 다시 바꿔보세요. 선택한 구성과 원화 환산 금액을 같은 화면에서 확인합니다.' },
];

const homeCategories = [
  ['Sideboards', '거실의 책과 일상 소품을 한곳에'],
  ['Shelves', '책과 오브제를 펼쳐 놓는 선반'],
  ['Chests of drawers', '작은 물건까지 나누어 담는 서랍'],
  ['Lowboards', '시야를 가리지 않는 낮은 수납'],
  ['Tables', '일과 취미가 만나는 나만의 책상'],
  ['Wardrobes', '옷과 가방을 정리하는 자리'],
].map(([name, description]) => ({ ...categories.find((category) => category.name === name), description }));

const configurationSteps = [
  [Ruler, '크기를 정하세요.', '놓을 자리를 떠올리며 너비·높이·깊이를 선택하세요.'],
  [Box, '칸의 쓰임을 고르세요.', '오픈 선반, 도어, 서랍. 담을 물건에 맞춰 모듈을 조합하세요.'],
  [SwatchBook, '색과 프레임을 더하세요.', '패널 색상과 프레임 마감을 바꾸며 내 취향을 찾아보세요.'],
  [Heart, '3D로 보고, 저장하세요.', '회전·확대하며 구성을 확인하고, 마음에 드는 디자인을 보관하세요.'],
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

export function Footer() {
  return <footer className="flex-footer fc-company-footer">
    <div className="fc-company-heading">
      <img className="fc-company-logo" src={asset('befun-footer-logo.svg?v=supplied-1')} alt="befun" width="112" height="34" />
      <p className="fc-company-locale">대한민국 · 한국어 · KRW</p>
    </div>
    <div className="fc-company-details">
      <p><span className="fc-company-label">상호</span><span>(주)유에이블 코퍼레이션</span></p>
      <p><span className="fc-company-label">대표자</span><span>이진수</span></p>
      <p><span className="fc-company-label">주소</span><span>서울시 강남구 언주로 97길 7, 5F</span></p>
      <p><span className="fc-company-label">이메일</span><a href="mailto:contact@befun.co.kr">contact@befun.co.kr</a></p>
    </div>
  </footer>;
}

export default function Home({ onConfigure = () => {}, onBrowse = () => {}, onNavigate }) {
  const [activeReason, setActiveReason] = useState(0);
  const [playing, setPlaying] = useState(true);
  const video = useRef(null);
  const community = useRef(null);
  const [contact, setContact] = useState(false);
  const toggleVideo = () => { if (video.current) { if (playing) video.current.pause(); else video.current.play().catch(() => {}); } setPlaying(!playing); };
  return <main className="flex-home befun-home">
    <section className="home-hero">
      <picture className="fc-hero-poster"><source media="(max-width: 767px)" srcSet={asset('hero-mobile.jpg')}/><img src={asset('hero-desktop.jpg')} alt="거실에 놓인 Befun 모듈 사이드보드" /></picture>
      <video ref={video} className="fc-hero-video" autoPlay muted playsInline loop preload="metadata" poster={asset('hero-desktop.jpg')}><source src={asset('hero-mobile.mp4')} type="video/mp4" media="(max-width: 767px)"/><source src={asset('hero-desktop.mp4')} type="video/mp4"/></video>
      <div className="fc-hero-shade" />
      <div className="fc-hero-content"><p className="fc-eyebrow">BEFUN · MODULAR FURNITURE</p><h1>공간에 맞게.<br/>취향대로.</h1><p className="fc-hero-tagline">크기와 색을 조합하는 나만의 모듈 가구.</p><div className="fc-hero-buttons"><ArrowButton light onClick={() => onConfigure()}>3D로 만들기</ArrowButton><ArrowButton outline light onClick={() => onBrowse('All')}>컬렉션 보기</ArrowButton></div></div>
      <button className="fc-video-toggle" aria-label={playing ? '배경 영상 일시정지' : '배경 영상 재생'} onClick={toggleVideo}>{playing ? <Pause size={19} fill="currentColor"/> : <Play size={19} fill="currentColor"/>}</button>
    </section>
    <section className="befun-system" id="befun-system" tabIndex={-1} aria-labelledby="befun-system-title">
      <div className="befun-system-copy"><p className="befun-kicker">01 / THE BEFUN SYSTEM</p><h2 id="befun-system-title">금속 프레임,<br/>컬러 패널.<br/><span>조합은 내 방식대로.</span></h2><p className="befun-system-description">Befun은 금속 프레임과 패널을 조합하는 모듈 가구입니다. 거실의 낮은 수납장부터 작업실의 높은 선반까지, 공간에 맞는 크기와 수납 방식, 색상을 직접 골라보세요.</p><div className="befun-system-specs"><div><small>SIZE</small><strong>너비 · 높이 · 깊이</strong></div><div><small>STORAGE</small><strong>오픈 · 도어 · 서랍</strong></div><div><small>FINISH</small><strong>패널 색상 · 프레임</strong></div></div></div>
      <figure className="befun-system-figure"><img src={asset('sideboard-desktop-v2.webp')} alt="금속 프레임과 올리브 패널로 구성한 Befun 사이드보드" loading="lazy"/><figcaption><span>BEFUN SIDEBOARD / 구성 예시</span><button onClick={() => onBrowse('Sideboards')} aria-label="사이드보드 구성 둘러보기"><ArrowRight size={22}/></button></figcaption></figure>
    </section>

    <section className="fc-why"><div className="fc-section-heading"><div><p className="befun-kicker">02 / YOUR CHOICES</p><h2>내 가구를 정하는 기준.</h2><p className="fc-section-description">크기, 수납, 컬러를 고르면<br/>내 공간에 필요한 가구가 보입니다.</p></div><ArrowButton outline onClick={() => onConfigure()}>직접 조합해 보기</ArrowButton></div><div className="fc-reason-panels">{reasons.map((reason, index) => <button key={reason.title} className={`fc-reason-panel ${activeReason === index ? 'is-active' : ''}`} onMouseEnter={() => setActiveReason(index)} onFocus={() => setActiveReason(index)} onClick={() => setActiveReason(index)} aria-expanded={activeReason === index}><img src={asset(reason.image)} alt={reason.alt || reason.title} style={{objectPosition: reason.position}} loading="lazy"/><span className="fc-reason-shade"/><span className="fc-reason-number" style={{top: `${[28, 45, 31, 56][index]}%`}}>0{index + 1}</span><span className="fc-reason-content"><strong>{reason.title}</strong><span>{reason.text}</span></span><span className="fc-reason-label">{reason.title}</span></button>)}</div></section>

    <section className="fc-service-banner"><video autoPlay muted playsInline loop preload="none" poster={asset('service-video-poster.jpg')}><source src={asset('service-video.mp4')} type="video/mp4"/></video><div className="fc-banner-shade"/><div><p className="befun-kicker">OPEN. CLOSE. MAKE IT YOURS.</p><h2>보여주고 싶은 건 꺼내고.<br/>감추고 싶은 건 넣고.</h2><p>책과 오브제는 오픈 선반에, 생활용품은 도어 뒤에.<br/>같은 프레임 안에서 수납 방식을 조합해 보세요.</p><ArrowButton outline light onClick={() => onConfigure()}>수납 모듈 조합하기</ArrowButton></div></section>

    <section className="fc-range"><div className="fc-section-heading"><div><p className="befun-kicker">03 / FIND YOUR FURNITURE</p><h2>어디에 놓을 가구인가요?</h2><p className="fc-section-description">거실, 방, 나만의 작업실.<br/>필요한 가구의 형태부터 골라보세요.</p></div><ArrowButton outline onClick={() => onBrowse('All')}>구성 전체 보기</ArrowButton></div><div className="befun-category-grid">{homeCategories.map((category) => <button key={category.name} className="befun-category" onClick={() => onBrowse(category.name)}><div className="befun-category-image"><img src={asset(category.image)} alt={label(category.name)} loading="lazy"/><img className="befun-category-hover" src={asset(category.image.replace('-v2', '-hover-v2'))} alt="" loading="lazy"/></div><span className="befun-category-name">{label(category.name)}<ArrowRight size={21}/></span><small>{category.description}</small></button>)}</div></section>

    <section className="befun-howto" id="befun-howto" tabIndex={-1} aria-labelledby="befun-howto-title"><div className="fc-section-heading"><div><p className="befun-kicker">04 / MAKE YOUR BEFUN</p><h2 id="befun-howto-title">생각한 수납을,<br/>화면 속 가구로.</h2></div><p className="befun-howto-description">크기·수납·컬러를 바꿔가며<br/>3D와 원화 환산 금액을 함께 확인하세요.</p></div><ol className="befun-step-grid">{configurationSteps.map(([Icon, title, text], index) => <li key={title}><div className="befun-step-top"><span>0{index + 1}</span><Icon size={25} strokeWidth={1.35}/></div><h3>{title}</h3><p>{text}</p></li>)}</ol><div className="befun-howto-bottom"><p>저장한 디자인은 이 브라우저에서 다시 열어 편집할 수 있습니다.</p><ArrowButton light onClick={() => onConfigure()}>내 구성 시작하기</ArrowButton></div></section>

    <section className="fc-community" id="befun-spaces" tabIndex={-1}><div className="fc-section-heading"><div><p className="befun-kicker">05 / AT HOME, AT WORK</p><h2>집과 작업실, 각자의 쓰임.</h2><p className="fc-section-description">음악을 듣는 거실, 책을 쌓는 방, 작업하는 책상 옆.<br/>Befun을 놓고 싶은 장면을 찾아보세요.</p></div><div className="fc-carousel-controls"><button aria-label="이전 공간 보기" onClick={() => community.current?.scrollBy({left: -450, behavior: 'smooth'})}><ArrowLeft/></button><button aria-label="다음 공간 보기" onClick={() => community.current?.scrollBy({left: 450, behavior: 'smooth'})}><ArrowRight/></button></div></div><div className="fc-community-track" ref={community}>{communityScenes.map(({image, alt, editorial}) => <button className="fc-community-card" key={image} onClick={() => onConfigure()}><img src={asset(image)} alt={alt} loading="lazy"/>{editorial && <small className="fc-campaign-label">라이프스타일 화보</small>}<span>내 공간의 가구 만들기 <ArrowRight size={19}/></span></button>)}</div></section>

    <section className="befun-start" aria-label="가구 구성 시작하기"><p className="befun-kicker">YOUR SPACE. YOUR BEFUN.</p><h2>이제, 내 공간의 가구를<br/>만들어 볼까요?</h2><div className="befun-start-options"><button onClick={() => onConfigure()}><span><small>처음부터 내 방식대로</small><strong>3D로 직접 구성하기</strong></span><ArrowRight size={26}/></button><button onClick={() => onBrowse('All')}><span><small>마음에 드는 형태부터</small><strong>가구 구성 둘러보기</strong></span><ArrowRight size={26}/></button></div></section>
    <section className="fc-contact" id="befun-contact" tabIndex={-1}><h2>어떤 수납이 필요한가요?</h2><p>놓을 공간과 담을 물건을 알려주세요.<br/>구성에 대해 궁금한 점은 이메일로 문의하실 수 있습니다.</p><ArrowButton onClick={() => setContact(true)}>구성 문의하기</ArrowButton></section>
    <Footer onConfigure={onConfigure} onBrowse={onBrowse} onNavigate={onNavigate}/>
    {contact && <Modal title="Befun 구성 문의" onClose={() => setContact(false)}><p>공간 사진이나 대략적인 치수, 원하는 수납 방식을 함께 보내주세요.</p><div className="fc-contact-details"><a href="mailto:contact@befun.co.kr">contact@befun.co.kr <ArrowRight size={18}/></a></div></Modal>}
  </main>;
}
