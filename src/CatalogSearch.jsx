import React, {useEffect, useState} from 'react';
import {ArrowRight, Search, X} from 'lucide-react';
import {label, matchesSearch} from './localize';
import {formatWon} from './currency';
import {collectionFor} from './catalogData';
import {initialVariant, productPrice} from './catalogProduct';

export default function CatalogSearch({query, onChange, onProduct}) {
 const [data, setData] = useState(null), [error, setError] = useState(false);
 useEffect(() => {
  const controller = new AbortController();
  Promise.all(['/assets/catalog.json','/assets/catalog-details.json'].map(url => fetch(url,{signal:controller.signal}).then(response => {if(!response.ok) throw new Error('Search unavailable');return response.json();})))
   .then(([catalog, details]) => setData({products:catalog.products, details:new Map(details.products.map(item => [item.id,item]))}))
   .catch(error => {if(error.name !== 'AbortError') setError(true);});
  return () => controller.abort();
 }, []);
 const products = (data?.products || []).filter(product => matchesSearch(`${product.title} ${label(product.title)} ${collectionFor(product.category).title} ${product.category === 'Tables' ? '테이블 책상 데스크' : ''}`,query));
 return <>
  <div className="search-input"><Search/><input autoFocus placeholder="어떤 가구를 찾으세요?" aria-label="가구 검색" value={query} onChange={event => onChange(event.target.value)}/>{query ? <button aria-label="검색어 지우기" onClick={() => onChange('')}><X size={16}/></button> : null}</div>
  <p className="drawer-subtitle" role="status">{error ? '상품 검색을 불러오지 못했어요. 다시 열어 주세요.' : !data ? '상품을 불러오는 중입니다.' : `상품 ${products.length}개`}</p>
  <div className="search-results">{products.map(product => <button key={product.id} onClick={() => onProduct(product)}><img src={product.image} alt="" loading="lazy"/><div><strong>{label(product.title)}</strong><small>{collectionFor(product.category).title}</small><span>{formatWon(productPrice(initialVariant(data.details.get(product.id)),product).net)}</span></div><ArrowRight size={17}/></button>)}</div>
  {data && !products.length ? <p className="drawer-empty-text">검색 결과가 없어요. ‘테이블’, ‘수납장’, ‘선반’으로 찾아보세요.</p> : null}
 </>;
}
