import React, {useEffect, useRef, useState} from 'react';
import {ArrowRight, ChevronLeft, ChevronRight, Home as HomeIcon, X} from 'lucide-react';
import {Footer} from './Home';
import {label} from './localize';
import {formatWon} from './currency';
import {catalogCollections, collectionFor, collectionProducts} from './catalogData';
import {initialVariant, productPrice} from './catalogProduct';
import DeskLineupEntry from './DeskLineupEntry';
import './catalog.css';

export default function Catalog({initialCategory = 'All', onConfigure, onBrowse, onProduct, onNavigate, onDeskConfigure}) {
 const collection = collectionFor(location.pathname.includes('/collections/') ? location.pathname : initialCategory);
 const [data, setData] = useState(null);
 const [error, setError] = useState(false);
 const [selected, setSelected] = useState(null);
 const [details, setDetails] = useState(new Map());
 const categoryRail = useRef(null);
 const [railEdges, setRailEdges] = useState({left:false, right:false});
 useEffect(() => {
  const controller = new AbortController();
  Promise.all(['/assets/catalog.json', '/assets/catalog-details.json'].map(url => fetch(url, {signal:controller.signal})
   .then(response => {if(!response.ok) throw new Error('Catalog unavailable'); return response.json();})))
   .then(([catalog, info]) => {setDetails(new Map(info.products.map(item => [item.id,item])));setData(catalog);})
   .catch(error => {if(error.name !== 'AbortError') setError(true);});
  return () => controller.abort();
 }, []);
 useEffect(() => {
  const rail = categoryRail.current;
  if (!rail) return;
  const current = rail.querySelector('[aria-current="page"]');
  if (current && current.offsetLeft + current.clientWidth > rail.clientWidth) rail.scrollLeft = current.offsetLeft - rail.offsetLeft;
  const measure = () => setRailEdges({left:rail.scrollLeft > 2, right:rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2});
  const observer = new ResizeObserver(measure); observer.observe(rail);
  rail.addEventListener('scroll', measure, {passive:true}); measure();
  return () => {observer.disconnect();rail.removeEventListener('scroll', measure);};
 }, [collection.slug]);
 useEffect(() => {
  if(!selected) return;
  const close = event => {if(event.key === 'Escape') setSelected(null);};
  window.addEventListener('keydown', close);
  return () => window.removeEventListener('keydown', close);
 }, [selected]);
 const products = data ? collectionProducts(data, collection.key) : [];
 const openProduct = product => onProduct ? onProduct(product) : setSelected(product);
 return <main className="flex-catalog" aria-busy={!data && !error}>
  <div className="fc-catalog-top">
   <nav className="fc-breadcrumb" aria-label="현재 위치">
    <button onClick={() => onBrowse('home')} aria-label="홈"><HomeIcon size={12}/></button>
    <span aria-hidden="true">/</span><span>{collection.title}</span>
   </nav>
   <div className="fc-catalog-heading">
    <h1>{collection.title}</h1>
    <div className="fc-catalog-rating"><span>5점 만점에 4.9</span><img src="/assets/collections/stars-4.9.svg" alt="평점 4.9점" width="106" height="20"/></div>
   </div>
   <div className="fc-category-strip"><nav className="fc-catalog-categories" aria-label="가구 종류" ref={categoryRail}>
    {catalogCollections.map(item => <a key={item.slug} href={`/en/collections/${item.slug}`} aria-current={item.slug === collection.slug ? 'page' : undefined} onClick={event => {if(event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey){event.preventDefault();onBrowse(item.key);}}}>
     <img src={item.image} alt="" width="180" height="180"/>
     <span>{item.title}</span>
    </a>)}
   </nav><div className="fc-category-arrows">
    {railEdges.left ? <button aria-label="이전 가구 카테고리" onClick={() => categoryRail.current.scrollBy({left:-categoryRail.current.clientWidth * .7, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}><ChevronLeft size={20}/></button> : <span/>}
    {railEdges.right ? <button aria-label="다음 가구 카테고리" onClick={() => categoryRail.current.scrollBy({left:categoryRail.current.clientWidth * .7, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}><ChevronRight size={20}/></button> : null}
   </div></div>
  </div>
  {collection.key === 'Tables' ? <DeskLineupEntry onOpen={onDeskConfigure}/> : null}
  {error ? <div className="fc-empty-products" role="alert"><p>상품을 불러오지 못했어요. 새로고침해 주세요.</p></div> :
   <div className="fc-catalog-products">
    {!data ? <p role="status">상품을 불러오는 중입니다.</p> : null}
    {products.map(product => {const price = productPrice(initialVariant(details.get(product.id)), product); return <article className="fc-product-card" key={product.id}>
     <div className="fc-product-image">
      <button className="fc-product-main" onClick={() => openProduct(product)}><img src={product.image} alt={label(product.title)} loading="lazy" width="900" height="900"/></button>
      <button className="fc-product-quick" onClick={() => openProduct(product)}>옵션 선택하기 <ArrowRight size={17}/></button>
     </div>
     <div className="fc-product-info">
      <button onClick={() => openProduct(product)}>{label(product.title)}</button>
      <p className="fc-product-price">{price.gross > price.net ? <del>{formatWon(price.gross)}</del> : null}<span>{formatWon(price.net)}</span></p>
     </div>
    </article>;})}
   </div>}
  <Footer onConfigure={onConfigure} onNavigate={onNavigate} onBrowse={onBrowse}/>
  {selected && <div className="fc-modal-backdrop" onClick={() => setSelected(null)}><section className="fc-modal" role="dialog" aria-modal="true" aria-label={label(selected.title)} onClick={event => event.stopPropagation()}>
   <button className="fc-modal-close" onClick={() => setSelected(null)} aria-label="상품 미리보기 닫기"><X/></button>
   <h2>{label(selected.title)}</h2><img className="fc-product-modal-image" src={selected.image} alt={label(selected.title)}/>
   <p>{formatWon(selected.salePrice || selected.price)}</p>
   <button className="fc-pill" onClick={() => onConfigure(selected)}>이 가구로 시작하기 <ArrowRight size={17}/></button>
  </section></div>}
 </main>;
}
