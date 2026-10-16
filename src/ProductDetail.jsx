import React, {useEffect, useState} from 'react';
import {ArrowRight, ShoppingCart, ChevronLeft, ChevronRight} from 'lucide-react';
import {Footer} from './Home';
import LoadingScreen from './LoadingScreen';
import {label} from './localize';
import {formatWon, rateDescription} from './currency';
import {collectionFor} from './catalogData';
import {initialVariant, optionLabel, productCartConfig, productPrice, templateForProduct, variantForOptions} from './catalogProduct';
import {hasStandingDeskPreview} from './deskConfig';
import './product-detail.css';
import './desk-lineup.css';

const tableDescriptions = {
 'hoehenverstellbarer-schreibtisch-home':'65–130cm 범위에서 전동으로 높이를 조절하는 홈 오피스 책상입니다. 부드러운 시작·정지와 충돌 방지 기능을 갖추고 있습니다. 모터 보증 기간은 5년입니다.',
 'hoehenverstellbarer-schreibtisch-profi':'높이를 조절해 앉아서도 서서도 사용할 수 있는 프로페셔널 데스크입니다. 상판 소재와 프레임 색상, 공간에 맞는 크기를 선택하세요.',
 'besprechungstisch-flexcube-klassik':'간결한 크롬 프레임의 클래식 회의용 테이블입니다. 상판 네 가지와 세 가지 크기 중에서 선택할 수 있습니다.',
 'hoehenverstellbarer-schreibtisch-ecktisch':'작업 공간을 넓게 활용하는 전동 높이 조절 코너 데스크입니다. 왼쪽·오른쪽 배치에 맞춰 상판 방향을 선택하세요.',
 'hoehenverstellbarer-besprechungstisch':'정사각형 상판의 높이 조절 회의용 테이블입니다. 상판과 프레임 마감, 바퀴 유무를 선택할 수 있습니다.',
 'flexcube-hoehenverstellbarer-besprechungstisch':'원형 상판의 높이 조절 회의용 테이블입니다. 상판과 프레임 마감, 바퀴 유무를 선택할 수 있습니다.',
 'hoehenverstellbarer-wandtisch-65cm':'너비 65cm의 높이 조절 벽면 테이블입니다. 작은 작업 공간에 맞춰 상판과 프레임을 선택하세요.',
 'flexcube-hoehenverstellbarer-wandtisch':'너비 140cm의 높이 조절 벽면 테이블입니다. 벽면을 활용해 작업 공간을 구성할 수 있습니다.',
 'schreibtisch-klassik':'간결한 크롬 프레임의 클래식 책상입니다. 블랙·화이트와 천연 목재 무늬목 상판, 세 가지 크기를 선택할 수 있습니다.',
};

export default function ProductDetail({path, onConfigure, onBrowse, onAddToCart, onNavigate, onDeskConfigure}) {
 const handle = decodeURIComponent(path.split('/').filter(Boolean).at(-1));
 const [result, setResult] = useState(null), [error, setError] = useState(false);
 const [variantId, setVariantId] = useState(null), [photo, setPhoto] = useState(null), [quantity, setQuantity] = useState(1);
 useEffect(() => {
  const controller = new AbortController();
  Promise.all(['/assets/catalog.json', '/assets/catalog-details.json'].map(url => fetch(url, {signal:controller.signal}).then(response => {if (!response.ok) throw new Error('Product unavailable'); return response.json();})))
   .then(([catalog, details]) => {
    const product = catalog.products.find(item => item.handle === handle);
    if (!product) throw new Error('Product not found');
    const detail = details.products.find(item => item.id === product.id);
    if (!detail) throw new Error('Product options not found');
    const collection = catalog.collections.find(item => item.slug !== 'alle-bestseller' && item.productIds.includes(product.id));
    setResult({product, detail, collectionSlug:collection?.slug});
   }).catch(error => {if (error.name !== 'AbortError') setError(true);});
  return () => controller.abort();
 }, [handle]);
 if (error) return <main className="product-detail-error"><h1>상품을 불러오지 못했어요</h1><button className="outline-button" onClick={() => onBrowse('All')}>전체 상품 보기 <ArrowRight size={17}/></button></main>;
 if (!result) return <LoadingScreen/>;
 const {product, detail} = result;
 const variant = detail.variants.find(item => item.id === variantId) || initialVariant(detail);
 const values = variant?.options || [];
 const template = templateForProduct(product), price = productPrice(variant, product);
 const image = photo || variant?.image || detail.images[0]?.src || product.image;
 const imageIndex = detail.images.findIndex(item => item.src === image);
 const collection = collectionFor(result.collectionSlug || product.category);
 const options = detail.options.filter(option => !option.values.every(value => value === 'Default Title'));
 function selectOption(index, value) {
  const next = values.map((current, i) => i === index ? value : current);
  // Keep other choices where possible, but allow changing into a valid combination.
  const match = variantForOptions(detail.variants, next) || detail.variants.find(item => item.options[index] === value && item.available) || detail.variants.find(item => item.options[index] === value);
  if (match) {setVariantId(match.id); setPhoto(null);}
 }
 return <main className="product-page catalog-product-detail">
  <nav className="product-breadcrumb" aria-label="현재 위치"><button onClick={() => onBrowse('home')}>홈</button><span>/</span><button onClick={() => onBrowse(collection.key)}>{collection.title}</button><span>/</span><span>{label(product.title)}</span></nav>
  <div className="product-layout">
   <section className="pd-gallery" aria-label="상품 이미지">
    <div className="pd-main-photo"><img src={image} alt={label(product.title)} width="1200" height="1200"/>
     {detail.images.length > 1 ? <div className="pd-photo-arrows"><button aria-label="이전 상품 이미지" onClick={() => setPhoto(detail.images[(Math.max(0,imageIndex) - 1 + detail.images.length) % detail.images.length].src)}><ChevronLeft/></button><button aria-label="다음 상품 이미지" onClick={() => setPhoto(detail.images[(Math.max(0,imageIndex) + 1) % detail.images.length].src)}><ChevronRight/></button></div> : null}
    </div>
    <div className="pd-thumbnails">{detail.images.map((item,index) => <button key={item.id} aria-label={`상품 이미지 ${index + 1}`} aria-pressed={item.src === image} onClick={() => setPhoto(item.src)}><img src={item.src} alt="" width="96" height="96" loading="lazy"/></button>)}</div>
   </section>
   <section className="product-details">
    <p className="pd-category">{collection.title}</p><h1>{label(product.title)}</h1>
    {tableDescriptions[handle] ? <p className="product-description">{tableDescriptions[handle]}</p> : null}
    <div className="product-cost" aria-live="polite">{price.gross > price.net ? <s>{formatWon(price.gross)}</s> : null}<strong>{formatWon(price.net)}</strong></div>
    <p className="pd-price-note">부가세 포함 · {rateDescription}</p>
    <div className="pd-options">{options.map(option => {
     const index = option.position - 1;
     return <fieldset key={option.position}><legend>{optionLabel(option.name)} <span>{optionLabel(values[index])}</span></legend><div>{option.values.map(value => <button key={value} type="button" aria-pressed={values[index] === value} onClick={() => selectOption(index,value)}>{optionLabel(value)}</button>)}</div></fieldset>;
    })}</div>
    {variant?.sku ? <p className="pd-sku">품번 {variant.sku}</p> : null}
    <div className="pd-buy-row"><label>수량 <input type="number" min="1" max="99" step="1" value={quantity} onChange={event => setQuantity(Math.min(99, Math.max(1, Math.trunc(Number(event.target.value) || 1))))}/></label><button className="orange-button full-button" disabled={!variant?.available} onClick={() => onAddToCart(productCartConfig(product, variant, template), price, image, quantity)}>{variant?.available ? '장바구니 담기' : '품절'} <ShoppingCart size={18}/></button></div>
      {template ? <button className="outline-button full-button" onClick={() => onConfigure(template)}>커스터마이즈 <ArrowRight size={18}/></button> : null}
    {hasStandingDeskPreview(product) && onDeskConfigure ? <div className="desk-product-preview"><button className="outline-button full-button" onClick={onDeskConfigure}>스탠딩 데스크 3D 보기 <ArrowRight size={18}/></button><p>3D 화면은 소재·폭·높이를 살펴보는 공통 모델입니다.<br/>이 상품의 구매 옵션은 위에서 선택하세요.</p></div> : null}
    <details className="pd-description" open><summary>상품 정보</summary>{detail.description ? detail.description.split('\n').map((line,index) => <p key={index}>{line}</p>) : <p>{label(product.title)}</p>}</details>
   </section>
  </div>
  <Footer onConfigure={onConfigure} onBrowse={onBrowse} onNavigate={onNavigate}/>
 </main>;
}
