import React, {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ExternalLink, LoaderCircle, Maximize2, Minimize2, RotateCcw} from 'lucide-react';
import {DESK_POSTER, DESK_VIEWER_URL} from './deskConfig';
import './desk-configurator.css';

export default function DeskConfigurator({onBrowse}) {
 const page = useRef(null);
 const [session, setSession] = useState(0);
 const [loading, setLoading] = useState(true);
 const [failed, setFailed] = useState(false);
 const [fullscreenSupported, setFullscreenSupported] = useState(false);
 const [fullscreen, setFullscreen] = useState(false);
 const [notice, setNotice] = useState('');

 useEffect(() => {
  const element = page.current;
  setFullscreenSupported(typeof element?.requestFullscreen === 'function' && document.fullscreenEnabled !== false);
  const sync = () => setFullscreen(document.fullscreenElement === element);
  document.addEventListener('fullscreenchange', sync);
  return () => document.removeEventListener('fullscreenchange', sync);
 }, []);

 function reset() {
  setLoading(true);
  setFailed(false);
  setNotice('');
  setSession(value => value + 1);
 }

 async function toggleFullscreen() {
  setNotice('');
  try {
   if (document.fullscreenElement === page.current) await document.exitFullscreen();
   else await page.current?.requestFullscreen();
  } catch {
   setNotice('전체 화면을 열지 못했어요. 브라우저에서 다시 시도해 주세요.');
  }
 }

 return <section className="desk-configurator-page" ref={page} aria-labelledby="desk-studio-title">
  <header className="desk-studio-toolbar">
   <button className="desk-studio-back" type="button" onClick={() => onBrowse('Tables')} aria-label="데스크 라인업으로 돌아가기">
    <ArrowLeft size={18} aria-hidden="true"/><span>데스크 라인업</span>
   </button>
   <div className="desk-studio-heading"><p>BEFUN DESK <span aria-hidden="true">/</span> 3D STUDIO</p><h1 id="desk-studio-title">스탠딩 데스크</h1></div>
   <div className="desk-studio-actions" aria-label="3D 화면 도구">
    <button type="button" onClick={reset} aria-label="데스크 구성을 처음 상태로 초기화" title="처음 상태로 초기화"><RotateCcw size={18} aria-hidden="true"/></button>
    {fullscreenSupported && <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? '전체 화면 닫기' : '전체 화면으로 보기'} title={fullscreen ? '전체 화면 닫기' : '전체 화면으로 보기'} aria-pressed={fullscreen}>
     {fullscreen ? <Minimize2 size={18} aria-hidden="true"/> : <Maximize2 size={18} aria-hidden="true"/>}
    </button>}
    <a href={DESK_VIEWER_URL} target="_blank" rel="noopener noreferrer" aria-label="원본 데스크 컨피규레이터를 새 창에서 열기" title="원본 새 창에서 열기"><ExternalLink size={18} aria-hidden="true"/></a>
   </div>
  </header>
  <div className="desk-studio-viewer" aria-busy={loading}>
   {!failed && <iframe
    key={session}
    className="desk-studio-frame"
    title="Befun Desk 3D configurator"
    src={DESK_VIEWER_URL}
    allow="fullscreen; xr-spatial-tracking"
    allowFullScreen
    onLoad={() => setLoading(false)}
    onError={() => {setLoading(false); setFailed(true);}}
   />}
   {(loading || failed) && <div className={`desk-studio-cover${failed ? ' desk-studio-cover-error' : ''}`}>
    <img src={DESK_POSTER} alt="" className="desk-studio-poster"/>
    {failed ? <div className="desk-studio-message" role="alert">
     <h2>데스크 스튜디오를 열지 못했어요</h2><p>다시 시도하거나 원본 화면을 열어 주세요.</p>
     <div><button type="button" onClick={reset}>다시 열기 <RotateCcw size={15} aria-hidden="true"/></button><a href={DESK_VIEWER_URL} target="_blank" rel="noopener noreferrer">원본 새 창 <ExternalLink size={15} aria-hidden="true"/></a></div>
    </div> : <p className="desk-studio-loading" role="status"><LoaderCircle size={17} aria-hidden="true"/>데스크 스튜디오를 여는 중</p>}
   </div>}
  </div>
  <footer className="desk-studio-guide">
   <p>소재 선택 <span aria-hidden="true">·</span> 상판 폭 <span aria-hidden="true">·</span> 높이 조절</p>
   <p>화면 속 원형 버튼을 눌러 조절하세요.</p>
  </footer>
  <p className="desk-studio-notice" role="status">{notice}</p>
 </section>;
}
