import React from 'react';
import {ArrowRight} from 'lucide-react';
import {DESK_CONFIGURATOR_PATH, DESK_POSTER} from './deskConfig';
import './desk-lineup.css';

export default function DeskLineupEntry({onOpen}) {
  return <section className="desk-lineup-entry" aria-labelledby="desk-lineup-title">
    <div className="desk-lineup-image"><img src={DESK_POSTER} alt="우드 상판과 화이트 전동 프레임의 스탠딩 데스크 3D 모델" width="380" height="285"/></div>
    <div className="desk-lineup-copy">
      <p className="desk-lineup-eyebrow">BEFUN DESK / 3D STUDIO</p>
      <h2 id="desk-lineup-title">내 작업의 높이를 찾아보세요.</h2>
      <p>상판 소재를 바꾸고, 폭과 높이의 움직임을 3D로 확인하세요.</p>
      <a className="desk-lineup-link" href={DESK_CONFIGURATOR_PATH} onClick={onOpen ? event => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {event.preventDefault();onOpen();}
      } : undefined}>데스크 3D 구성하기 <ArrowRight size={18}/></a>
    </div>
  </section>;
}
